# `getData()`

Returns the form serialized as both a plain object and a fresh `FormData` instance. Empty file inputs are filtered out.

## Signature

```ts
getData(): SerializedFormResult
```

```ts
interface SerializedFormResult {
  data: Record<string, SerializedFormValue>
  formData: FormData
}
```

## Parameters

None.

## Returns

A [`SerializedFormResult`](../typescript.md#serializedformresult):

- `data` — plain object mirror of the form. Repeated names become arrays. Strings and `File` instances are preserved as-is.
- `formData` — a fresh `FormData` instance, safe to send directly to `fetch`.

## Behaviour

- Reads directly from the live DOM via `new FormData(formElement)`.
- Drops entries where the value is an empty `File` (`size === 0` and `name === ''`) — these are produced by empty `<input type="file">` controls.
- Builds the `data` mirror while iterating the raw `FormData`, grouping repeated names into arrays.

## Examples

### Send to a JSON endpoint

```ts
import { form } from '@samline/forms'

const contact = form('contact-form')

contact.onSubmit(async (_element, data) => {
  await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
})
```

### Send a real `FormData` to a file-upload endpoint

```ts
import { form } from '@samline/forms'

const upload = form('upload-form')

upload.onSubmit(async (_element, _data, formData) => {
  await fetch('/api/upload', { method: 'POST', body: formData })
})
```

### Snapshot the form state without submitting

```ts
const profile = form('profile-form')

profile.subscribe(state => {
  if (state.submitCount > 0) {
    const { data } = profile.getData()
    console.log('last submit payload:', data)
  }
})
```

## Edge cases

- **Empty file inputs are filtered out of both `data` and `formData`.** This is intentional — HTML produces placeholder `File` entries when a file input is rendered but no file is selected.
- **The returned `data` mirror is fresh** on every call. Safe to mutate.
- **`getData()` does not trigger validation, watchers, or autoSubmit** — it is a pure read.
- **The plain object form is convenient for JSON endpoints; the `FormData` form is required for file uploads.** Browsers will not serialize `File` instances into JSON.

## Related

- [`parseFormData`](../api/parse-form-data.md) — same serializer, used directly without a controller.
- [`getValue`](get-value.md) — read a single field’s value.
- [`onSubmit`](../api/on-submit.md) — receives the same shape as arguments.
- [`format`](format.md) — when a field is formatted, the `FormData` carries both the canonical name (with the raw value) and the `<field>_displayed` name (with the formatted value). See [the mirror convention](format.md#the-mirror-convention).