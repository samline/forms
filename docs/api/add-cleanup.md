# `addCleanup(cleanup)`

Registers teardown work owned by the controller. The callback runs when [`destroy()`](destroy.md) tears the controller down, unless that registration is removed first.

## Signature

```ts
addCleanup(cleanup: FormCleanup): () => void

type FormCleanup = () => void
```

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `cleanup` | [`FormCleanup`](../typescript.md#formcleanup) | yes | Synchronous callback to run during controller destruction. |

## Returns

An unregister function. Calling it removes only that registration without running the cleanup. It is idempotent.

## Behaviour

- Active cleanups run once, in reverse registration order, when `destroy()` is first called.
- Registering the same callback more than once creates independent registrations. Each active registration runs once.
- A cleanup added after the controller is already destroyed runs immediately. Its returned unregister function is a no-op.
- If a cleanup throws, `destroy()` logs `[forms] cleanup failed`, continues with the remaining callbacks, and completes teardown.
- Calling `destroy()` again does not rerun cleanups.

## Example

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')
const abortController = new AbortController()

const unregister = profile.addCleanup(() => abortController.abort())

// Optional: keep the resource alive beyond this controller.
unregister()

profile.destroy()
```

This hook is useful for integration-owned event listeners, observers, subscriptions, abort controllers, and other resources that should share the form controller's lifetime.

## Related

- [`destroy`](destroy.md) — runs all active cleanup registrations.
- [`observe`](observe.md) and [`subscribe`](subscribe.md) — return their own unsubscribe functions.
