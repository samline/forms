# `reset()`

Restores the form to its initial state: native field values reset, manual and validation errors cleared, visual attributes stripped, subscribers notified.

## Signature

```ts
reset(): FormController
```

## Returns

The same [`FormController`](../typescript.md#formcontroller) — chainable.

## Behaviour

When invoked, the controller:

1. Calls `state.element.reset()` (the native form reset).
2. Clears `state.manualErrors` and `state.validationErrors`.
3. Restores matching visible/raw defaults for formatted fields.
4. Removes every `css-filled`, `css-error`, and `aria-invalid` attribute from associated fields.
5. Re-syncs visual state if the form has been validated (`isValidated` is `true`).
6. Notifies subscribers.

## Examples

### Reset after a successful submit

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')

profile.onSubmit(async (_element, _data, formData) => {
  await fetch('/profile', { method: 'POST', body: formData })
  profile.reset()
})
```

### Reset on cancel

```ts
const signup = form('signup-form')

document.querySelector('#cancel')?.addEventListener('click', () => {
  signup.reset()
})
```

## Edge cases

- **Native `reset()` does not dispatch `input` events** for fields whose value changes because of the reset. The controller restores formatted mirrors and visual/ARIA state explicitly.
- **Submit handlers are not invoked.** `reset()` is purely a UI / state operation.
- **The `submitCount` from [`getState()`](get-state.md) is not reset.** It tracks the lifetime of the controller, not the lifetime of a single form session.

## Related

- [`destroy`](destroy.md) — full teardown.
- [`clearErrors`](clear-errors.md) — clear errors without resetting field values.
