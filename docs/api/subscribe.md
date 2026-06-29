# `subscribe(listener)`

Registers a listener that fires immediately with the current state and on every subsequent state mutation. Returns an unsubscribe function.

## Signature

```ts
subscribe(listener: FormStateListener): () => void
```

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `listener` | [`FormStateListener`](../typescript.md#formstatelistener) | yes | Callback invoked with the full state snapshot. |

## Returns

A function. Calling it removes the listener.

## Behaviour

- The listener fires **once synchronously** on registration with the current [`FormStateSnapshot`](../typescript.md#formstatesnapshot).
- It then fires on every state mutation: changes to values, errors, `autoSubmit` flag, `submitCount`, or any other tracked field.
- Multiple subscribers are supported. They run in registration order.

State mutations that fire subscribers include:

- Any `input` / `change` event on a tracked field.
- [`setValue`](set-value.md).
- [`setErrors`](set-errors.md) and [`clearErrors`](clear-errors.md).
- [`autoSubmit`](auto-submit.md) and [`disableAutoSubmit`](disable-auto-submit.md).
- [`reset`](reset.md).
- [`validate`](validate.md) and [`revalidate`](revalidate.md).
- `MutationObserver`-detected DOM changes.

## Examples

### Mirror state into a view layer

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')

const unsubscribe = profile.subscribe(state => {
  document.querySelector('#status')!.textContent = state.isValid ? 'Ready' : 'Errors'
  document.querySelector('#counter')!.textContent = String(state.submitCount)
})

window.addEventListener('beforeunload', unsubscribe)
```

### React to a specific field

```ts
const signup = form('signup-form')

signup.subscribe(state => {
  const password = state.values.password
  const passwordError = state.errors.password?.[0]
  document.querySelector('#password-hint')!.textContent =
    passwordError ?? (typeof password === 'string' && password.length > 0 ? 'OK' : 'Empty')
})
```

### Track submit attempts

```ts
const profile = form('profile-form')

profile.subscribe(state => {
  if (state.submitCount > 0 && !state.isValid) {
    console.warn('submit attempt failed:', state.submitCount)
  }
})
```

## Edge cases

- **The listener is invoked with a fresh snapshot** on every fire — it is safe to store the reference for the duration of one call.
- **Subscribers do not receive partial / incremental updates.** Each fire carries the whole snapshot.
- **Subscribers and watchers are independent.** A field-level change fires both the watchers for that field and every subscriber.
- **Unsubscribing does not detach the listener immediately if it is currently iterating.** JavaScript’s `Set` semantics guarantee no skips — once the unsubscribe returns, future mutations will not invoke that listener.

## Related

- [`watch`](watch.md) and [`observe`](observe.md) — per-field reactions.
- [`getState`](get-state.md) — read the current snapshot synchronously.