# `clearErrors(fields?)`

Removes manual errors. Validation errors from rules are not touched.

## Signature

```ts
clearErrors(): FormController
clearErrors(fields: string[]): FormController
```

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `fields` | `string[]` | no | When provided, only the listed fields are cleared. When omitted, every manual error is cleared. |

## Returns

The same [`FormController`](../typescript.md#formcontroller) — chainable.

## Behaviour

- Only manual errors (set via [`setErrors`](set-errors.md)) are removed. Validation errors from rules are recomputed the next time validation runs.
- Visual attributes are re-synced for the affected fields — `css-error` is removed when no errors remain for a field.
- Subscribers are notified.

## Examples

### Clear a single field

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')

profile.setErrors({ email: ['Already in use.'] })

profile.clearErrors(['email'])
```

### Clear everything

```ts
profile.setErrors({
  email: ['Already in use.'],
  password: ['Too weak.']
})

profile.clearErrors()
```

### Clear before re-running validation

```ts
profile.clearErrors()
profile.validate()
```

## Edge cases

- **Validation errors are not cleared by `clearErrors`.** They live in a separate map and are only cleared by [`reset`](reset.md) or by a successful re-validation of the field.
- **`clearErrors` on a field with no manual error is a no-op** — the chain still returns the controller.
- **Passing an empty array `clearErrors([])` does nothing.** Use `clearErrors()` to clear everything.

## Related

- [`setErrors`](set-errors.md) — push manual errors.
- [`reset`](reset.md) — clear every error and reset field values.