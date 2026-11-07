---
locale: en
sidebar:
  group: api
  order: 4
title: 'Run rules with validate()'
titleAccent: 'validate()'
description: 'Runs validation against the configured validators. Returns the result and marks the form as validated.'
---

Runs validation against the configured [`validators`](../../reference/configuration/#validators). Returns the result and marks the form as validated.

## Signature

```ts
validate(): ValidationResult
validate(fields: string[]): ValidationResult
```

```ts
interface ValidationResult {
  isValid: boolean
  errors: FormErrors
}
```

## Parameters

| Name     | Type       | Required | Description                                                                                             |
| -------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `fields` | `string[]` | no       | When provided, only the listed fields are validated. When omitted, every field with rules is validated. |

## Returns

A [`ValidationResult`](../../reference/typescript/#validationresult):

- `isValid` — `true` when the merged error map (validation + manual) is empty.
- `errors` — the merged error map (validation + manual). The map is a fresh object — safe to mutate.

## Behaviour

- Marks the form as validated (`state.isValidated = true`). This means future field changes will run validation again, even when the controller was created with `autoValidate: false`.
- Re-syncs visual attributes (`css-filled` / `css-error`) for the affected fields.
- After the form is validated, an input event also revalidates fields whose `sameAs` or `dependsOn` metadata references the changed field. Transitive chains and cycles are deduplicated and each affected field runs once.
- `each` validates every collection member independently. Item-only failures apply `css-error` and `aria-invalid="true"` only to the failing DOM controls, while the public `errors[field]` remains a flat `string[]`.
- Subscribers are not notified. The method updates stored errors and the `css-error` / `aria-invalid` attributes, then returns the result: render messages from the returned `errors`, or call it from a submit flow whose subscriber runs anyway. Calling it inside a `subscribe()` listener is safe for the same reason.

## Examples

### Validate the whole form

```ts
import { form } from '@samline/forms'

const signup = form('signup-form', {
  validators: {
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { required: true, minLength: 8 },
  },
})

const result = signup.validate()

if (!result.isValid) {
  console.warn('errors:', result.errors)
}
```

### Validate a single field

```ts
signup.validate(['email'])
```

### Validate a sub-group of fields (e.g. a wizard step)

```ts
const wizard = form('wizard-form', {
  validators: {
    'step-1.name': { required: true },
    'step-1.email': { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    'step-2.address': { required: true },
    'step-2.city': { required: true },
  },
})

function nextStep(step: 1 | 2) {
  const fields = step === 1 ? ['step-1.name', 'step-1.email'] : ['step-2.address', 'step-2.city']

  return wizard.validate(fields).isValid
}
```

## Edge cases

- **`validate` ignores manual errors** during computation, but the returned `errors` includes them (merged with validation errors). The `isValid` flag reflects the merged map.
- **Validation rules must be configured** via `options.validators`. Fields without rules are always considered valid.
- **An explicit partial call validates exactly the requested fields.** `validate(['password'])` does not expand `sameAs` / `dependsOn` relationships; dependency expansion happens for input events, including those dispatched by `setValue()`.
- **Custom validators receive `{ field, value, values }`.** During `each`, the context also includes the concrete `element` and zero-based `index` — see [`FieldValidationContext`](../../reference/typescript/#fieldvalidationcontext).
- **Numeric rules are strict and bounds are inclusive.** Empty values skip `numeric`, `min`, and `max`; add `required` when needed.
- **A custom validator that returns `false` pushes the generic message `"Validation failed."`.**
- **`validate()` is the same as calling [`revalidate()`](../revalidate/)`** — they are aliases for readability.

## Related

- [`revalidate`](../revalidate/) — alias of `validate`.
- [`setErrors`](../set-errors/) and [`clearErrors`](../clear-errors/) — manual errors.
- [`validateValues`](../validate-values/) — pure helper for use without a controller.
