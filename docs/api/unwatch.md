# `unwatch(field?, callback?)`

Removes watched callbacks. Three overloads, distinguished by the arguments you pass.

## Signature

```ts
unwatch(): FormController
unwatch(field: string): FormController
unwatch(field: string, callback: FormFieldWatcher): FormController
```

## Parameters

| Overload | Description |
| --- | --- |
| `unwatch()` | Removes every watcher from every field. |
| `unwatch(field)` | Removes every watcher for the given field. |
| `unwatch(field, callback)` | Removes only the matching callback for the given field. |

## Returns

The same [`FormController`](../typescript.md#formcontroller) — chainable.

## Behaviour

- Watchers added via [`watch`](watch.md) and [`observe`](observe.md) share the same internal registry.
- For exact-match removal (`field` + `callback`), the same function reference must be passed.
- For bulk removal (`field` only or no args), all matching watchers are removed.

## Examples

### Remove a specific watcher

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')

const callback = (value: unknown) => console.log(value)
profile.watch('email', callback)

profile.unwatch('email', callback)
```

### Remove all watchers for a field

```ts
profile.unwatch('email')
```

### Remove every watcher

```ts
profile.unwatch()
```

### Use `observe`’s unsubscribe

```ts
const stop = profile.observe('email', value => console.log(value))
stop() // Equivalent to profile.unwatch('email', theCallback)
```

## Edge cases

- **`unwatch` does not affect subscribers** added via [`subscribe`](subscribe.md). Use the unsubscribe returned by `subscribe`.
- **Watchers added with the same callback twice are deduplicated** — calling `unwatch` with that callback removes only one entry.
- **Bulk removal is safe to call at any time** — it does not throw if there are no watchers.

## Related

- [`watch`](watch.md) — add a watcher.
- [`observe`](observe.md) — add a watcher with an unsubscribe function.