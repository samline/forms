# `getValue(name)`

Reads the current value of a field, normalized for the field type.

## Signature

```ts
getValue(name: string): FormFieldValue
```

```ts
type FormFieldValue = string | string[] | File[] | undefined
```

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | yes | The `name` attribute of the target field. |

## Returns

The normalized value:

- `string` for text inputs, textareas, single selects, the single checked radio, or a single checked checkbox.
- `string[]` for radio groups where none is checked (empty array) or for checkbox groups with multiple selections.
- `string[]` for any field whose `name` ends in `[]` and that matches more than one input — the values of every matching input, in DOM order.
- `File[]` for `<input type="file">` (may be empty), or the concatenation of every selected file across all inputs that share a `name` ending in `[]`.
- `undefined` when no field with that `name` exists.

## Behaviour by field type

| Field type | Returned value |
| --- | --- |
| `<input>` (text-like) | `field.value`. |
| `<input>` (text-like) with `name="foo[]"` and more than one input | `[input[0].value, input[1].value, ...]` — one entry per matching input, in DOM order. |
| `<input type="radio">` (group) | The `value` of the checked radio, or `''` when none is checked. The `[]` suffix is ignored for radio — radio groups are always single-valued. |
| `<input type="checkbox">` (single) | `field.value` when checked, `''` when unchecked. |
| `<input type="checkbox">` (group) | `value` when exactly one is checked, `[value1, value2, ...]` when multiple are checked, `''` when none is checked. |
| `<input type="checkbox">` (group with `name="foo[]"`) | `[value1, value2, ...]` of every checked input. Always an array — no single-value collapse — so `Array.isArray(value)` validators stay correct. |
| `<input type="file">` | `Array.from(field.files)`. |
| `<input type="file">` (group with `name="foo[]"`) | The concatenation of `Array.from(input.files)` across every matching input, in DOM order. |
| `<select>` | `field.value`. |
| `<select>` (group with `name="foo[]"`) | `[select[0].value, select[1].value, ...]`. |
| `<textarea>` | `field.value`. |
| `<textarea>` (group with `name="foo[]"`) | `[textarea[0].value, textarea[1].value, ...]`. |

## Examples

### Read a text value

```ts
import { form } from '@samline/forms'

const contact = form('contact-form')
contact.setValue('email', 'hello@example.com')

contact.getValue('email') // 'hello@example.com'
```

### Read a checkbox group

```ts
const signup = form('signup-form')

signup.setValue('interests', ['design', 'code'])

signup.getValue('interests') // ['design', 'code']

signup.setValue('interests', ['design'])

signup.getValue('interests') // 'design' (single string)
```

### Read a file input

```ts
const upload = form('upload-form')

const files = upload.getValue('attachments')
if (Array.isArray(files) && files.length > 0) {
  console.log('first file:', files[0]!.name)
}
```

### Read a `name="foo[]"` group

```ts
const signup = form('signup-form')

signup.getValue('docusign_email[]') // ['a@example.com', 'b@example.com']

// The `[]` suffix is the de facto multi-value input convention used by
// PHP, Rails, Express, Spring, etc. on the server. It tells the
// controller to collect every matching input as an array, so custom
// validators can rely on `Array.isArray(value)`.
```

## Edge cases

- **`getValue` is a pure read.** It does not mutate the DOM, does not notify subscribers, and does not trigger validation.
- **`undefined` vs `''`** — `undefined` means “no field with that name”. `''` means “the field exists but is empty”.
- **`getValue('radio-name')` returns `''` when no radio in the group is checked.** Treat empty string as “no selection”.
- **The `name="foo[]"` suffix is the explicit opt-in for multi-value inputs.** A field with the suffix but a single matching input still returns a plain string (not a one-element array). Bare names — `name="foo"` with multiple inputs — keep the original first-value semantics and are not collapsed into an array.
- **Whitespace is not trimmed.** If you need trimming, do it in your own code or in a custom validator.

## Related

- [`setValue`](set-value.md) — write a value.
- [`getField`](get-field.md) — read the underlying DOM element(s).
- [`getData`](get-data.md) — serialize the whole form.
- [`format`](format.md) — when a field is formatted, `getValue('<field>')` returns the raw value and `getValue('<field>_displayed')` returns the formatted value. See [the mirror convention](format.md#the-mirror-convention).