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
- `File[]` for `<input type="file">` (may be empty).
- `undefined` when no field with that `name` exists.

## Behaviour by field type

| Field type | Returned value |
| --- | --- |
| `<input>` (text-like) | `field.value`. |
| `<input type="radio">` (group) | The `value` of the checked radio, or `''` when none is checked. |
| `<input type="checkbox">` (single) | `field.value` when checked, `''` when unchecked. |
| `<input type="checkbox">` (group) | `value` when exactly one is checked, `[value1, value2, ...]` when multiple are checked, `''` when none is checked. |
| `<input type="file">` | `Array.from(field.files)`. |
| `<select>` | `field.value`. |
| `<textarea>` | `field.value`. |

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

## Edge cases

- **`getValue` is a pure read.** It does not mutate the DOM, does not notify subscribers, and does not trigger validation.
- **`undefined` vs `''`** — `undefined` means “no field with that name”. `''` means “the field exists but is empty”.
- **`getValue('radio-name')` returns `''` when no radio in the group is checked.** Treat empty string as “no selection”.
- **Whitespace is not trimmed.** If you need trimming, do it in your own code or in a custom validator.

## Related

- [`setValue`](set-value.md) — write a value.
- [`getField`](get-field.md) — read the underlying DOM element(s).
- [`getData`](get-data.md) — serialize the whole form.