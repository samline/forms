# `setValue(name, value)`

Writes a value into a field and dispatches the correct DOM event so watchers, validators, and visual state run as if a user typed.

## Signature

```ts
setValue(name: string, value: unknown): FormController
```

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | yes | The `name` attribute of the target field. |
| `value` | `unknown` | yes | The value to write. Coerced per field type. |

## Returns

The same [`FormController`](../typescript.md#formcontroller) — chainable. Returns the controller unchanged when the field does not exist.

## Behaviour by field type

| Field type | How `value` is applied |
| --- | --- |
| `<input>` (text-like: `text`, `email`, `password`, …) | `String(value)` is assigned to `field.value`. |
| `<input>` (text-like) with `name="foo[]"` receiving an array | One array element per input, in order: `input[i].value = String(value[i])`. Inputs beyond the array length are cleared to `''`; extra array elements (more elements than inputs) are dropped. |
| `<input type="checkbox">` (single) | `field.checked = String(value) === field.value`. |
| `<input type="checkbox">` (group with the same `name`) | Each checkbox is checked if `Array.isArray(value)` includes its `value`, otherwise all unchecked. |
| `<input type="radio">` (group with the same `name`) | The radio whose `value` matches `String(value)` is checked. |
| `<input type="file">` | File inputs are read-only — `setValue` cannot assign a file. Passing `[]` clears the input. |
| `<select>` (single) | `String(value)` must match an option value. |
| `<select multiple>` | `String(value)` is assigned to `field.value` — i.e. the value is coerced to a single string, just like a regular text input. `setValue` does **not** iterate the array and select individual options; use the per-`option` `selected` attribute from your own code, or pass the values one at a time. |
| `<select>` (group with `name="foo[]"`) receiving an array | One array element per select, in order: `select[i].value = String(value[i])`. Inputs beyond the array length are cleared to `''`; extra array elements are dropped. |
| `<textarea>` | `String(value)` is assigned to `field.value`. |
| `<textarea>` (group with `name="foo[]"`) receiving an array | One array element per textarea, in order: `textarea[i].value = String(value[i])`. Inputs beyond the array length are cleared to `''`; extra array elements are dropped. |

After writing, the controller dispatches a synthetic event on the **first** matching field:

- `change` for `<select>` and for `<input type="checkbox">` / `<input type="radio">`.
- `input` for everything else.

The synthetic event flows through the form-level delegated listener, so the rest of the pipeline runs as if the user had typed: manual errors are cleared (default), validation runs (if `autoValidate`), watchers fire, subscribers are notified, and `autoSubmit` is scheduled.

## Examples

### Set a text value

```ts
import { form } from '@samline/forms'

const contact = form('contact-form')
contact.setValue('email', 'hello@example.com')
```

### Toggle checkboxes

```ts
const signup = form('signup-form')

// Multiple values — array form.
signup.setValue('interests', ['design', 'code'])

// Single value — string form.
signup.setValue('terms', 'yes')
```

### Select a radio

```ts
const shipping = form('shipping-form')
shipping.setValue('method', 'express')
```

### Reset a file input

```ts
const upload = form('upload-form')
upload.setValue('attachments', [])
```

### Chain with other setup

```ts
form('contact-form')
  .setValue('subject', 'Question about pricing')
  .setValue('message', 'Hello,')
```

### Distribute values across a `name="foo[]"` group

```ts
const signup = form('signup-form')

// Each input gets one array element, in order. With two inputs and
// `name="docusign_email[]"`, this writes the first email to the first
// input and the second email to the second input.
signup.setValue('docusign_email[]', ['a@example.com', 'b@example.com'])

// When the array is shorter than the input count, the surplus inputs
// are cleared to ''.
signup.setValue('docusign_email[]', ['a@example.com'])

// When the array is longer than the input count, the extra array
// elements are dropped — there's no input to write to.
signup.setValue('docusign_email[]', ['a@example.com', 'b@example.com', 'c@example.com'])
```

## Edge cases

- **The synthetic event is dispatched only on the first matching field.** For radio/checkbox groups, this is intentional — the event bubbles, and the controller only needs to react once.
- **Passing `null` or `undefined` writes an empty string.** This is treated as a value, not as “skip”, so the field becomes empty and watchers fire.
- **`setValue` is a no-op for unknown field names** — the chain still works, but no event fires and no watchers run.
- **`setValue` cannot assign to `<input type="file">`.** Browsers do not allow programmatic file assignment for security reasons. Use a DataTransfer or a real file picker.
- **The `name="foo[]"` suffix is the explicit opt-in for multi-value inputs.** A field with the suffix that receives an array distributes one element per input (surplus inputs are cleared, surplus array elements are dropped). Bare names — `name="foo"` with multiple inputs — keep the original broadcast semantics and receive the same value on every matching input.
- **Manual errors for the field are cleared by default** (because the synthetic event triggers the delegated handler). Pass `clearManualErrorsOnChange: false` to keep them.

## Related

- [`getValue`](get-value.md) — read the current value.
- [`getField`](get-field.md) — read the underlying DOM element.
- [`reset`](reset.md) — restore the form’s initial values.
- [`format`](format.md) — when a field is formatted, `setValue('<field>', x)` writes the raw to the hidden mirror and reformats the visible; `setValue('<field>_displayed', x)` writes the formatted to the visible and recomputes the raw. See [the mirror convention](format.md#the-mirror-convention).