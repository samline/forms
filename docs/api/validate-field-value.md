# `validateFieldValue(field, value, rules, values)`

Pure validator. Runs the rule set against a single value. Does not require a controller — useful in tests, custom submission pipelines, or anywhere you need to evaluate validation rules outside of a bound form.

## Signature

```ts
function validateFieldValue(
  field: string,
  value: FormFieldValue,
  rules: FieldValidationRules,
  values: FormValues
): string[]
```

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `field` | `string` | yes | The field name (used for error messages and to seed `FieldValidationContext`). |
| `value` | [`FormFieldValue`](../typescript.md#formfieldvalue) | yes | The value to validate. |
| `rules` | [`FieldValidationRules`](../typescript.md#fieldvalidationrules) | yes | The rule set to apply. |
| `values` | [`FormValues`](../typescript.md#formvalues) | yes | All current values, exposed to custom validators via `context.values`. |

## Returns

A `string[]` of error messages. Empty when the field is valid.

## Behaviour

Runs each rule in order:

1. `required` — value must be non-empty (non-empty string, non-empty array, non-undefined).
2. `minLength` — string length (or array length) must be ≥ the threshold.
3. `maxLength` — string length (or array length) must be ≤ the threshold.
4. `pattern` — the string form of the value must match the regex (skipped when the value is empty).
5. `validate` — each custom validator runs in registration order. Returning a string pushes an error; returning `false` pushes `"Validation failed."`; returning `null`, `undefined`, or `true` is treated as a pass.

Default error messages are produced when the rule was configured without an explicit `message`. Custom messages come from the `{ value, message }` form of `RuleConfig`.

## Examples

### Validate a single value

```ts
import { validateFieldValue } from '@samline/forms'

const errors = validateFieldValue(
  'email',
  'invalid',
  {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  { email: 'invalid' }
)

console.log(errors) // ['Value does not match the required pattern.']
```

### Cross-field validation

```ts
import { validateFieldValue } from '@samline/forms'

const errors = validateFieldValue(
  'confirm',
  'foo',
  {
    validate: ({ value, values }) =>
      value === values.password ? null : 'Passwords do not match.'
  },
  { password: 'bar', confirm: 'foo' }
)

console.log(errors) // ['Passwords do not match.']
```

### Custom error messages

```ts
import { validateFieldValue } from '@samline/forms'

const errors = validateFieldValue(
  'password',
  'short',
  {
    minLength: { value: 8, message: 'Use at least 8 characters.' }
  },
  { password: 'short' }
)

console.log(errors) // ['Use at least 8 characters.']
```

## Edge cases

- **The pattern rule is skipped for empty values.** This is the standard “required + pattern” pattern: required runs first, then pattern runs only when there is a value.
- **`validateFieldValue` does not read from any DOM.** Pass everything in as arguments.
- **`validate` runs after the built-in rules.** It receives the full context, including the current value and the other field values.
- **Multiple custom validators** can be passed as an array — they all run, and any error from any of them is collected.

## Related

- [`validateValues`](validate-values.md) — run a schema against a whole values map.
- [`validate`](validate.md) — controller-bound equivalent.