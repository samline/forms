# `validateValues(values, schema)`

Pure schema validator. Runs every field in the schema against a values map and returns the aggregated result. Does not require a controller.

## Signature

```ts
function validateValues(
  values: FormValues,
  schema: ValidationSchema
): ValidationResult
```

```ts
interface ValidationResult {
  isValid: boolean
  errors: FormErrors
}

type FormValues = Record<string, FormFieldValue>
type FormErrors = Record<string, string[]>
type ValidationSchema = Record<string, FieldValidationRules>
```

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `values` | [`FormValues`](../typescript.md#formvalues) | yes | The values to validate. |
| `schema` | [`ValidationSchema`](../typescript.md#validationschema) | yes | Field → rules map. |

## Returns

A [`ValidationResult`](../typescript.md#validationresult):

- `isValid` — `true` when `errors` is empty.
- `errors` — a fresh error map.

## Behaviour

For each `[field, rules]` entry in the schema, runs [`validateFieldValue`](validate-field-value.md) against `values[field]`. The other values are available to `sameAs` and custom validators. Aggregate rules and `each` member rules are collected into the same `string[]` for that field.

## Examples

### Validate a snapshot

```ts
import { validateValues } from '@samline/forms'

const result = validateValues(
  {
    email: 'invalid',
    terms: ''
  },
  {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    terms: {
      required: { value: true, message: 'Accept the terms.' }
    }
  }
)

console.log(result.isValid)    // false
console.log(result.errors)     // { email: [...], terms: ['Accept the terms.'] }
```

### Use with `parseFormData`

```ts
import { parseFormData, validateValues } from '@samline/forms'

const formElement = document.querySelector<HTMLFormElement>('#contact-form')
if (!formElement) throw new Error('form not found')

const { data } = parseFormData(formElement)

const result = validateValues(data as Record<string, string | string[] | File[] | undefined>, {
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  message: { required: true, minLength: 10 }
})

if (!result.isValid) {
  console.warn(result.errors)
}
```

## Edge cases

- **`validateValues` does not know which fields are “tracked”.** It validates every entry in the schema, even fields that are not present in `values`. An undefined value fails `required` but passes the rest.
- **Errors are always a fresh object.** Safe to mutate.
- **`sameAs` compares the provided snapshot only.** Dependency tracking and automatic revalidation belong to a form controller, not this pure helper.
- **`dependsOn` has no effect in this helper.** It describes controller revalidation triggers, not a validation rule.
- **`each` errors stay flat.** Member messages are appended under the field's existing `FormErrors` key in member order; no nested error shape is introduced.
- **Numeric rules use strict decimal syntax and inclusive bounds.** Empty values skip `numeric`, `min`, and `max`; use `required` to reject emptiness.
- **Custom validators receive the full values map**, so cross-field rules work the same as inside a controller.

## Related

- [`validateFieldValue`](validate-field-value.md) — single-field validator.
- [`parseFormData`](parse-form-data.md) — produce a `FormValues` map from a form.
