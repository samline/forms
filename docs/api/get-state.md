# `getState()`

Returns a fresh snapshot of the controller state. Pure read — does not mutate anything and does not notify subscribers.

## Signature

```ts
getState(): FormStateSnapshot
```

```ts
interface FormStateSnapshot {
  values: FormValues
  errors: FormErrors
  filledFields: string[]
  isValid: boolean
  isValidated: boolean
  autoSubmit: boolean
  isSubmitting: boolean
  submitCount: number
}
```

## Parameters

None.

## Returns

A [`FormStateSnapshot`](../typescript.md#formstatesnapshot). Every call returns a fresh object — safe to mutate.

## Snapshot fields

| Field | Meaning |
| --- | --- |
| `values` | Current values for every tracked field (validators + named fields in the form). |
| `errors` | Merged validation errors (from rules) and manual errors (from [`setErrors`](set-errors.md)). |
| `filledFields` | Names of fields that have a non-empty value. |
| `isValid` | `true` when `errors` has no entries. |
| `isValidated` | `true` after the initial auto-validation pass or once [`validate`](validate.md) has run. |
| `autoSubmit` | `true` while auto-submit is enabled. |
| `isSubmitting` | `true` while at least one valid submission has asynchronous `onSubmit` work that has not settled. |
| `submitCount` | Number of submit attempts (valid or invalid). |

## Examples

### Read the current state

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')

const state = profile.getState()

console.log(state.values.email)
console.log(state.errors)
console.log(state.isValid)
console.log(state.isSubmitting)
```

### Drive an accessible error message

```ts
const profile = form('profile-form')

profile.element?.addEventListener('input', () => {
  const state = profile.getState()
  emailError.hidden = !state.errors.email
  emailError.textContent = state.errors.email?.[0] ?? ''
})
```

The controller manages `aria-invalid`; use state to manage the message referenced by `aria-describedby`.

### Snapshot on submit

```ts
const profile = form('profile-form')

profile.onSubmit((_form, _data, _formData, state) => {
  console.log('submit #', state.submitCount)
  console.log('values at submit:', state.values)
  console.log('errors at submit:', state.errors)
})
```

### Disable a button during async submissions

```ts
profile.subscribe(state => {
  submitButton.disabled = state.isSubmitting
})

profile.onSubmit(async (_form, _data, formData) => {
  await fetch('/profile', { method: 'POST', body: formData })
})
```

## Edge cases

- **`getState()` does not notify subscribers.** If you need a notification-driven view, use [`subscribe`](subscribe.md).
- **`errors` is the merged map** (validation + manual). Use [`validate`](validate.md) if you need just the validation errors.
- **`filledFields` reflects the value snapshot at the time of the call** — it is not stored between calls.
- **`submitCount` increments on every submit**, valid or invalid. It does not reset on [`reset`](reset.md); it tracks the lifetime of the controller.
- **`isSubmitting` tracks overlapping work.** It remains `true` until every currently pending async submission batch settles, including rejected promises. Synchronous handlers do not toggle it.

## Related

- [`subscribe`](subscribe.md) — receive state updates reactively.
- [`getData`](get-data.md) — serialize the form payload.
