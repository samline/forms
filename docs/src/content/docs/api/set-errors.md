---
locale: en
sidebar:
  group: api
  order: 6
title: 'Attach errors with setErrors()'
titleAccent: 'setErrors()'
description: 'Pushes manual errors into the form. The typical use case is surfacing server-side validation feedback after a failed fetch.'
---

Pushes manual errors into the form. The typical use case is surfacing server-side validation feedback after a failed `fetch`.

## Signature

```ts
setErrors(fields: string[]): FormController
setErrors(fields: FormErrors): FormController
```

## Parameters

| Overload   | Type                                                   | Description                                                                              |
| ---------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Array form | `string[]`                                             | Each entry is treated as a field name. The error message defaults to `'Invalid value.'`. |
| Map form   | [`FormErrors`](../../reference/typescript/#formerrors) | Map from field name to one or more error messages.                                       |

## Returns

The same [`FormController`](../../reference/typescript/#formcontroller) — chainable.

## Behaviour

- Manual errors are merged with existing manual errors — existing entries for other fields are preserved.
- Validation errors from rules are not affected: validation errors and manual errors live in separate maps and are merged only when reading state.
- Affected fields receive `css-error` and `aria-invalid="true"`.
- By default, manual errors on an editable field block submission and stay on the field and in `getState().errors` after the attempt. Set [`clearErrorsOnSubmit: true`](../../reference/configuration/#clearerrorsonsubmit) to clear them before submit validation.
- A manual error whose name matches no editable control (a form-level key such as `non_field_errors`, an unknown name, or a field that is removed, disabled, hidden or read-only) is reported in `getState().errors` until the next submit attempt, which drops it before validation. It never blocks submission, since the user has nothing to edit.
- Subscribers are notified.

## Examples

### Array form (generic message)

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')

profile.setErrors(['email', 'password'])
// state.errors.email    -> ['Invalid value.']
// state.errors.password -> ['Invalid value.']
```

### Map form (per-field messages)

```ts
profile.setErrors({
  email: ['This email is already in use.'],
  password: ['Too weak. Use at least 8 characters.'],
})
```

### Map form with multiple errors per field

```ts
profile.setErrors({
  password: ['Too weak.', 'Must contain a number.', 'Must contain a symbol.'],
})
```

### Surface server errors after a failed submit

```ts
import { form } from '@samline/forms'

const signup = form('signup-form')

signup.onSubmit(async (_element, _data, formData) => {
  const response = await fetch('/signup', { method: 'POST', body: formData })

  if (!response.ok) {
    const { fieldErrors } = await response.json()
    signup.setErrors(fieldErrors)
  } else {
    signup.clearErrors()
  }
})
```

## Edge cases

- **Manual errors are cleared by default on the next change** of the affected field. Pass `clearManualErrorsOnChange: false` to keep them until you call [`clearErrors`](../clear-errors/).
- **The array form uses the literal string `'Invalid value.'`.** Use the map form when you need custom messages.
- **`setErrors` does not run validation.** Validation errors are computed independently by [`validate`](../validate/).
- **Server keys must match input names to stay on a field.** A dotted `items.0.name` does not match an `items[0][name]` input; it is treated as a form-level error. Rename the keys before calling `setErrors` when you want them on the field.
- **`validate()` called outside a submit counts every manual error**, including form-level ones, until the next submit attempt or [`clearErrors`](../clear-errors/).
- **Setting an empty object `setErrors({})` clears nothing** — it just doesn’t add new errors. Use [`clearErrors`](../clear-errors/) to remove existing manual errors.

## Related

- [`clearErrors`](../clear-errors/) — remove manual errors.
- [`validate`](../validate/) — run validation and read the result.
- [`options.clearManualErrorsOnChange`](../../reference/configuration/#clearmanualerrorsonchange).
