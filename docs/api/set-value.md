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
| `<input type="checkbox">` (single) | `field.checked = String(value) === field.value`. |
| `<input type="checkbox">` (group with the same `name`) | Each checkbox is checked if `Array.isArray(value)` includes its `value`, otherwise all unchecked. |
| `<input type="radio">` (group with the same `name`) | The radio whose `value` matches `String(value)` is checked. |
| `<input type="file">` | File inputs are read-only — `setValue` cannot assign a file. Passing `[]` clears the input. |
| `<select>` (single) | `String(value)` must match an option value. |
| `<select multiple>` | Treated like a checkbox group: every option whose value is in `Array.from(value)` is selected. |
| `<textarea>` | `String(value)` is assigned to `field.value`. |

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

## Edge cases

- **The synthetic event is dispatched only on the first matching field.** For radio/checkbox groups, this is intentional — the event bubbles, and the controller only needs to react once.
- **Passing `null` or `undefined` writes an empty string.** This is treated as a value, not as “skip”, so the field becomes empty and watchers fire.
- **`setValue` is a no-op for unknown field names** — the chain still works, but no event fires and no watchers run.
- **`setValue` cannot assign to `<input type="file">`.** Browsers do not allow programmatic file assignment for security reasons. Use a DataTransfer or a real file picker.
- **Manual errors for the field are cleared by default** (because the synthetic event triggers the delegated handler). Pass `clearManualErrorsOnChange: false` to keep them.

## Related

- [`getValue`](get-value.md) — read the current value.
- [`getField`](get-field.md) — read the underlying DOM element.
- [`reset`](reset.md) — restore the form’s initial values.