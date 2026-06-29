# `setErrors(fields)`

Pushes manual errors into the form. The typical use case is surfacing server-side validation feedback after a failed `fetch`.

## Signature

```ts
setErrors(fields: string[]): FormController
setErrors(fields: FormErrors): FormController
```

## Parameters

| Overload | Type | Description |
| --- | --- | --- |
| Array form | `string[]` | Each entry is treated as a field name. The error message defaults to `'Invalid value.'`. |
| Map form | [`FormErrors`](../typescript.md#formerrors) | Map from field name to one or more error messages. |

## Returns

The same [`FormController`](../typescript.md#formcontroller) — chainable.

## Behaviour

- Manual errors are merged with existing manual errors — existing entries for other fields are preserved.
- Validation errors from rules are not affected: validation errors and manual errors live in separate maps and are merged only when reading state.
- Visual attributes are re-synced for the affected fields, so `css-error` is added to each.
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
  password: ['Too weak. Use at least 8 characters.']
})
```

### Map form with multiple errors per field

```ts
profile.setErrors({
  password: [
    'Too weak.',
    'Must contain a number.',
    'Must contain a symbol.'
  ]
})
```

### Surface server errors after a failed submit

```ts
import { form } from '@samline/forms'

const signup = form('signup-form', {
  clearManualErrorsOnChange: false
})

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

- **Manual errors are cleared by default on the next change** of the affected field. Pass `clearManualErrorsOnChange: false` to keep them until you call [`clearErrors`](clear-errors.md).
- **The array form uses the literal string `'Invalid value.'`.** Use the map form when you need custom messages.
- **`setErrors` does not run validation.** Validation errors are computed independently by [`validate`](validate.md).
- **Setting an empty object `setErrors({})` clears nothing** — it just doesn’t add new errors. Use [`clearErrors`](clear-errors.md) to remove existing manual errors.

## Related

- [`clearErrors`](clear-errors.md) — remove manual errors.
- [`validate`](validate.md) — run validation and read the result.
- [`options.clearManualErrorsOnChange`](../options.md#clearmanualerrorsonchange).