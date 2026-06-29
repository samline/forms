# `parseFormData(formElement)`

Pure serializer. Returns a plain object mirror of the form plus a fresh `FormData` instance. Does not require a controller — useful for one-off serialization (e.g. server-side hydration, scripts that read forms outside of a binding).

## Signature

```ts
function parseFormData(formElement: HTMLFormElement): SerializedFormResult
```

```ts
interface SerializedFormResult {
  data: Record<string, SerializedFormValue>
  formData: FormData
}

type SerializedFormValue = FormDataPrimitive | FormDataPrimitive[]
type FormDataPrimitive = FormDataEntryValue // string | File
```

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `formElement` | `HTMLFormElement` | yes | The form to serialize. |

## Returns

A [`SerializedFormResult`](../typescript.md#serializedformresult) with two fresh values:

- `data` — plain object mirror. Repeated names become arrays.
- `formData` — a fresh `FormData` instance.

## Behaviour

- Reads directly from the live DOM via `new FormData(formElement)`.
- Drops entries where the value is an empty `File` (`size === 0` and `name === ''`).
- Builds the `data` mirror while iterating, grouping repeated names into arrays.
- Does not mutate the form or any global state.

## Examples

### One-off serialization

```ts
import { parseFormData } from '@samline/forms'

const formElement = document.querySelector<HTMLFormElement>('#contact-form')
if (formElement) {
  const { data, formData } = parseFormData(formElement)
  console.log(data, formData)
}
```

### Hydrate from a snapshot

```ts
import { parseFormData } from '@samline/forms'

const element = document.querySelector<HTMLFormElement>('#profile-form')

// Snapshot on every input:
element?.addEventListener('input', () => {
  if (!element) return
  const { data } = parseFormData(element)
  localStorage.setItem('draft', JSON.stringify(data))
})

// Restore on load:
const saved = localStorage.getItem('draft')
if (saved && element) {
  const data = JSON.parse(saved) as Record<string, string>
  for (const [key, value] of Object.entries(data)) {
    const field = element.querySelector<HTMLInputElement>(`[name="${key}"]`)
    if (field) field.value = value
  }
}
```

## Edge cases

- **Empty file inputs are filtered out.** This matches what [`getData()`](get-data.md) does inside a controller.
- **`parseFormData` does not validate** — pass the result through [`validateValues`](validate-values.md) if you need validation.
- **No type coercion.** All values come from `FormData` directly.

## Related

- [`getData`](get-data.md) — controller-bound equivalent.
- [`validateValues`](validate-values.md) — run validation against a `FormValues` map.