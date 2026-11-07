---
locale: en
sidebar:
  group: api
  order: 18
title: 'Restore defaults with reset()'
titleAccent: 'reset()'
description: 'Restores the native form, clears manual and validation errors, resynchronizes visual state, re-emits field watchers and notifies subscribers.'
---

Restores the form to its initial state: native field values reset, manual and validation errors cleared, visual attributes synchronized, subscribers notified.

## Signature

```ts
reset(): FormController
```

## Returns

The same [`FormController`](../../reference/typescript/#formcontroller) — chainable.

## Behaviour

When invoked, the controller:

1. Calls `state.element.reset()` (the native form reset).
2. Clears `state.manualErrors` and `state.validationErrors`.
3. Restores matching visible/raw defaults for formatted fields.
4. Removes every `css-filled`, `css-error`, and `aria-invalid` attribute from associated fields.
5. Re-syncs visual state. Controls whose native default value is non-empty regain `css-filled`, even when `autoValidate` is `false`; errors and `aria-invalid` stay cleared.
6. Calls every [`watch`](../watch/) and [`observe`](../observe/) callback with the restored value, so counters and previews follow the reset (since 2.8.0).
7. Notifies subscribers.

A native `<button type="reset">` or a direct `form.reset()` call runs the same state pass after the browser restores the defaults, unless a `reset` listener cancels the event (since 2.8.0).

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

- **Native `reset()` does not dispatch `input` events** for fields whose value changes because of the reset. The controller restores formatted mirrors, visual/ARIA state and watchers explicitly; it does not run validation or auto-submit.
- **A destroyed controller ignores `reset()`.**
- **Submit handlers are not invoked.** `reset()` is purely a UI / state operation.
- **The `submitCount` from [`getState()`](../get-state/) is not reset.** It tracks the lifetime of the controller, not the lifetime of a single form session.
- **Pending async submit work is not cancelled.** `isSubmitting` remains true until the outstanding `onSubmit` promises settle.

## Related

- [`destroy`](../destroy/) — full teardown.
- [`clearErrors`](../clear-errors/) — clear errors without resetting field values.
