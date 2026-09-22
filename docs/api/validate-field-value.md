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
5. `numeric`, `min`, and `max` — non-empty values must be strict decimals and satisfy the inclusive bounds.
6. `validate` — each field-level custom validator runs in registration order. Returning a string pushes an error; returning `false` pushes `"Validation failed."`; returning `null`, `undefined`, or `true` is treated as a pass.
7. `sameAs` — the aggregate value must equal the named value (skipped until both values are non-empty).
8. `each` — the value-level rules run independently for every collection member, including any member-level custom validators.

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

### Match two fields

```ts
import { validateFieldValue } from '@samline/forms'

const errors = validateFieldValue(
  'confirm',
  'foo',
  {
    sameAs: { value: 'password', message: 'Passwords do not match.' }
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

### Validate strict decimal values and bounds

```ts
const errors = validateFieldValue(
  'amount',
  '100.25',
  { numeric: true, min: 0, max: 500 },
  { amount: '100.25' }
)

console.log(errors) // []
```

### Validate every collection member

```ts
const errors = validateFieldValue(
  'emails',
  ['valid@example.com', 'invalid'],
  {
    each: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  },
  { emails: ['valid@example.com', 'invalid'] }
)

console.log(errors) // ['Value does not match the required pattern.']
```

## Edge cases

- **The pattern rule is skipped for empty values.** This is the standard “required + pattern” pattern: required runs first, then pattern runs only when there is a value.
- **Numeric rules are skipped for empty values.** Use `required` as well when the field is mandatory.
- **Numeric parsing is strict.** Surrounding whitespace is trimmed, and ordinary signed decimals such as `-2`, `+3.5`, `.5`, and `10.` are accepted. Exponents, hexadecimal, `Infinity`, `NaN`, and formatted separators are rejected. `min` and `max` are inclusive and also enforce numeric input when `numeric` is omitted.
- **The `sameAs` rule is skipped until both values are non-empty.** Add `required` to each mandatory field; `sameAs` does not imply requiredness.
- **Pure validation does not track dependencies.** `dependsOn` is controller metadata and has no effect here; `validateFieldValue` evaluates the supplied values once.
- **`validateFieldValue` does not read from any DOM.** Pass everything in as arguments.
- **`validate` runs after the built-in rules.** It receives the full context, including the current value and the other field values.
- **Multiple custom validators** can be passed as an array — they all run, and any error from any of them is collected.
- **`each` keeps the public return type flat.** Member errors are appended to the returned `string[]` in member order. Member custom validators receive a zero-based `index`; `element` is unavailable in this DOM-free helper.

## Related

- [`validateValues`](validate-values.md) — run a schema against a whole values map.
- [`validate`](validate.md) — controller-bound equivalent.
