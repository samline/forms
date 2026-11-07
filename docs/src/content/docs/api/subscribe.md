---
locale: en
sidebar:
  group: api
  order: 8
title: 'Follow form state with subscribe()'
titleAccent: 'subscribe()'
description: 'Registers a listener that fires immediately with the current state and at controller notification points. Returns an unsubscribe function.'
---

Registers a listener that fires immediately with the current state and at controller notification points. Returns an unsubscribe function.

## Signature

```ts
subscribe(listener: FormStateListener): () => void
```

## Parameters

| Name       | Type                                                                 | Required | Description                                    |
| ---------- | -------------------------------------------------------------------- | -------- | ---------------------------------------------- |
| `listener` | [`FormStateListener`](../../reference/typescript/#formstatelistener) | yes      | Callback invoked with the full state snapshot. |

## Returns

A function. Calling it removes the listener.

## Behaviour

- The listener fires **once synchronously** on registration with the current [`FormStateSnapshot`](../../reference/typescript/#formstatesnapshot).
- It then fires at explicit controller notification points. This is not a proxy around every internal assignment.
- Multiple subscribers are supported. They run in registration order.

State mutations that fire subscribers include:

- Any `input` event on a tracked field.
- [`setValue`](../set-value/).
- [`setErrors`](../set-errors/) and [`clearErrors`](../clear-errors/).
- [`autoSubmit`](../auto-submit/) and [`disableAutoSubmit`](../disable-auto-submit/).
- [`reset`](../reset/).
- Submit attempts, after their validation pass and `submitCount` update.
- Async submit state transitions: once when promise-returning handlers make `isSubmitting` true, and again after their submission batch settles. Overlapping batches keep it true until all settle.
- `MutationObserver`-detected DOM changes.

Direct [`validate`](../validate/) and [`revalidate`](../revalidate/) calls update validation state and visual attributes but do not independently notify subscribers. Use their returned result when synchronous rendering is required.

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

### Track asynchronous submission

```ts
const profile = form('profile-form')

profile.subscribe(state => {
  submitButton.disabled = state.isSubmitting
  submitButton.textContent = state.isSubmitting ? 'Saving...' : 'Save'
})

profile.onSubmit(async (_form, _data, formData) => {
  await fetch('/profile', { method: 'POST', body: formData })
})
```

## Edge cases

- **The listener is invoked with a fresh snapshot** on every fire — it is safe to store the reference for the duration of one call.
- **Subscribers do not receive partial / incremental updates.** Each fire carries the whole snapshot.
- **Subscribers and watchers are independent.** A field-level change fires both the watchers for that field and every subscriber.
- **Unsubscribing does not detach the listener immediately if it is currently iterating.** JavaScript’s `Set` semantics guarantee no skips — once the unsubscribe returns, future mutations will not invoke that listener.

## Related

- [`watch`](../watch/) and [`observe`](../observe/) — per-field reactions.
- [`getState`](../get-state/) — read the current snapshot synchronously.
