---
title: Form-control behavior
description: Exact getValue, setValue, validation, and serialization behavior for every supported native form control.
template: doc
---

The controller manages named inputs, selects, and textareas. Use this page when choosing field names or interpreting `getValue()` and `setValue()` results.

## Reading values

| Control | `getValue(name)` |
| --- | --- |
| Text-like input or textarea | First matching value as `string`. |
| Single select | Selected value as `string`. |
| Multiple select | Selected option values as `string[]`. |
| Radio group | Checked value as `string`; `''` when none is checked. |
| One checkbox | Checked value as `string`; `''` when unchecked. |
| Checkbox group with a bare name | One checked value collapses to `string`; several become `string[]`; none becomes `''`. |
| File input | Selected files as `File[]`, including an empty array. |
| Missing name | `undefined`. |

## The `name="field[]"` convention

The `[]` suffix explicitly requests collection behavior when more than one matching field exists.

| Group | Result |
| --- | --- |
| Repeated text, select, or textarea | One string per control in DOM order. |
| Repeated checkboxes | Always `string[]` of checked values, including `[]`. |
| Radio group | Remains scalar because a radio group represents one choice. |
| Repeated file inputs | Concatenated `File[]` from every input. |
| A single field ending in `[]` | Uses its normal scalar/control-specific behavior. |

Bare repeated text fields keep legacy behavior: `getValue()` reads the first and `setValue()` broadcasts one value to every match.

## Writing values

| Control | `setValue(name, value)` |
| --- | --- |
| Text-like input or textarea | Writes `String(value)`; `null`/`undefined` become `''`. |
| Multiple select | Selects options matching a scalar or any item in an array. |
| Checkbox group | An array checks matching values; a scalar checks only its matching value. |
| Radio group | Checks the option matching the scalar string. Arrays are stringified and should not be used. |
| File input | Browsers forbid assigning files. Pass `[]` only to clear the field. |
| Repeated `name="field[]"` text/select/textarea | Distributes array items by index; clears surplus controls and drops surplus values. |
| Missing name | No-op; returns the controller. |

After writing, `setValue()` dispatches one bubbling `input` event from the first matching field. That single event enters error clearing, validation, watchers, subscribers, visual sync, and auto-submit once.

## DOM lookup and external controls

`getField(name)` returns one element, an array for repeated names, or `null`. It uses `form.elements`, so controls associated through `form="id"` are included even when they sit outside the form subtree. Delegated input handling also listens for those controls.

The form's `MutationObserver` watches only the form subtree. Adding an external `form="id"` control does not itself create a mutation notification, but its later `input` events are handled normally.

## Serialization differs from field reads

`getData()` and `parseFormData()` use native `FormData` semantics:

- Disabled controls and unnamed controls are omitted.
- Repeated names become arrays in the plain `data` object.
- Empty file placeholders are removed from both outputs.
- A successful named submit button is included only when supplied as the submitter.
- `File` values remain files and are not directly JSON-serializable.
- Reserved keys such as `constructor` and `__proto__` are safe own properties.

`getState().values` is controller-oriented rather than a submission payload: it includes tracked validator names and normalized field reads. Use `getData()` for network submission.

## Validation notes

- Arrays use item count for `minLength` and `maxLength`.
- Required checkbox groups pass when at least one value is selected.
- A multiple select returns an array and follows the same array rules.
- File arrays pass `required` when at least one file exists.
- Pattern validation converts arrays to a comma-joined string; file entries use filenames.

## Related

- [`setValue()` and `getValue()`](/forms/reference/api/#field-values)
- [Validation and accessible errors](/forms/guides/validation-and-errors/)
- [Serialization helpers](/forms/reference/api/#state-and-data)
