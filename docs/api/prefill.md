# `prefill(fieldName?)`

Populates the form (or a single field) from the current URL query string. Useful for sharing prefilled links, marketing tracking params, or restoring form state from `location.search`.

## Signature

```ts
prefill(): FormController
prefill(fieldName: string): FormController
```

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `fieldName` | `string` | no | When provided, only this field is prefilled. When omitted, every query parameter is matched. |

## Returns

The same [`FormController`](../typescript.md#formcontroller) — chainable.

## Behaviour

- Reads `window.location.search` once with `URLSearchParams`.
- For each entry, calls [`setValue`](set-value.md) with the key/value pair.
- When `fieldName` is provided, only the matching key is written.
- Values are always strings. If a field expects a different shape (e.g. `number`), the consumer must convert.

Because the method delegates to [`setValue`](set-value.md), each prefilled field:

- Receives a synthetic `change` / `input` event, so watchers and subscribers fire.
- Triggers validation if it has rules and `autoValidate` is enabled.
- Triggers autoSubmit if it is enabled.
- Updates the `css-filled` / `css-error` attributes.

## Examples

### Prefill the whole form

```ts
import { form } from '@samline/forms'

// URL: https://example.com/contact?utm_source=newsletter&email=hi@example.com
const contact = form('contact-form')
contact.prefill()

contact.getValue('email')             // 'hi@example.com'
contact.getValue('utm_source')        // 'newsletter'
```

### Prefill a single field

```ts
const contact = form('contact-form')
contact.prefill('email')
```

### Round-trip a draft through the URL

```ts
import { form } from '@samline/forms'

const draft = form('draft-form')

// User types into fields, watchers debounce-serialize and push to the URL:
draft.subscribe(state => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(state.values)) {
    if (typeof value === 'string') params.set(key, value)
  }
  history.replaceState(null, '', `?${params.toString()}`)
})

// On next mount:
draft.prefill()
```

## Edge cases

- **`window` must exist.** The browser bundle uses `window.location`; in non-DOM environments `prefill` is a no-op.
- **Values are always strings.** Prefilling a `<select>` requires the query value to match one of the option values exactly.
- **Repeated query keys** (`?tag=a&tag=b`) are processed in iteration order. Only the last value wins because `URLSearchParams.forEach` visits both entries; the second `setValue` call overwrites the first.
- **Prefill runs synchronously.** Call it after the form is in the DOM.

## Related

- [`setValue`](set-value.md) — underlying primitive.
- [`getValue`](get-value.md) — read the prefilled values.
- [`format`](format.md) — when a field is formatted, prefilling the canonical name writes the raw and reformats the visible; prefilling the display name writes the formatted and recomputes the raw. See [the mirror convention](format.md#the-mirror-convention).