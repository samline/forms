# `getField(name)`

Returns the underlying DOM field(s) for a given name. Useful when you need direct DOM access — for example, to focus a field, attach a third-party widget, or read custom attributes.

## Signature

```ts
getField(name: string): FormFieldElement | FormFieldElement[] | null
```

```ts
type FormFieldElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
```

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | yes | The `name` attribute of the target field. |

## Returns

- A single `FormFieldElement` when exactly one matching field exists.
- An array of `FormFieldElement` when multiple fields share the same `name` (radios, checkbox groups).
- `null` when no field with that `name` exists.

## Behaviour

- The lookup is performed against the live DOM, including dynamically added fields (the `MutationObserver` keeps the cache fresh).
- The returned element(s) are live references — mutations you make to them are reflected in the form, but they bypass the controller’s normal pipeline. If you want watchers and validation to run, prefer [`setValue`](set-value.md).

## Examples

### Focus a field after submit

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')

profile.onSubmit(async (_element, _data, formData) => {
  const response = await fetch('/profile', { method: 'POST', body: formData })

  if (response.status === 422) {
    const field = profile.getField('email') as HTMLInputElement | null
    field?.focus()
  }
})
```

### Iterate a radio group

```ts
const shipping = form('shipping-form')

const radios = shipping.getField('method')

if (Array.isArray(radios)) {
  for (const radio of radios) {
    radio.addEventListener('change', () => console.log(radio.value))
  }
}
```

### Read a custom data attribute

```ts
const profile = form('profile-form')

const field = profile.getField('avatar') as HTMLInputElement | null
const maxSize = Number(field?.dataset.maxSize ?? '0')
```

## Edge cases

- **`null` means “no field with that name”** — distinct from `[]` which means “no matching fields but the lookup ran”.
- **The array form is only used when more than one field matches.** A single checkbox that happens to be a group of one is still returned as a single element, not an array.
- **`getField` does not throw** when the controller has no bound form — it returns `null`.

## Related

- [`getValue`](get-value.md) — read the value.
- [`setValue`](set-value.md) — write a value through the controller.
- [`format`](format.md) — when a field is formatted, `getField('<field>')` returns the hidden raw mirror and `getField('<field>_displayed')` returns the visible input. See [the mirror convention](format.md#the-mirror-convention).