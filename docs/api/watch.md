# `watch(field, callback)`

Registers a callback that fires every time a field changes. Chainable alias of [`observe`](observe.md); use it when you want fluent setup without holding the unsubscribe function.

## Signature

```ts
watch(
  field: string,
  callback: FormFieldWatcher
): FormController
```

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `field` | `string` | yes | The `name` attribute of the field to watch. |
| `callback` | [`FormFieldWatcher`](../typescript.md#formfieldwatcher) | yes | Invoked with `(value, field, form, state)` on every change. `field` is the observed DOM element(s) (same shape as [`getField`](../typescript.md#formfieldelement--formfieldelement--null) returns), handy for manipulating the actual `<input>` / `<select>` / `<textarea>` without re-querying it. |

## Returns

The same [`FormController`](../typescript.md#formcontroller) — chainable.

## Behaviour

- The callback fires only on changes (not on registration).
- A field can have multiple watchers.
- Watchers persist for the lifetime of the controller. Use [`unwatch`](unwatch.md) to remove them, or [`observe`](observe.md) if you need explicit unsubscribe semantics.
- The callback fires after the controller has processed the change — manual errors are cleared (when applicable), validation has run for fields with rules, visual state has been re-synced, and subscribers have been notified.

## Examples

### Show a live preview

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')

profile.watch('bio', value => {
  const preview = document.querySelector('#bio-preview')
  if (preview && typeof value === 'string') preview.textContent = value
})
```

### Reactive password strength

```ts
import { form } from '@samline/forms'

const signup = form('signup-form')

signup.watch('password', value => {
  const meter = document.querySelector('#password-strength')
  if (meter && typeof value === 'string') {
    meter.textContent = scorePassword(value)
  }
})
```

### Share a single handler across fields

```ts
import { form } from '@samline/forms'

const search = form('search-form')

const logField = (
  value: unknown,
  field: HTMLInputElement | HTMLInputElement[] | null
) => {
  if (field && 'name' in field) {
    console.log(`${field.name} =`, value)
  }
}

search.watch('q', logField).watch('category', logField)
```

### Interact with the field element directly

```ts
import { form } from '@samline/forms'

const checkout = form('checkout-form')

checkout.watch('country', (_value, field, _form, _state) => {
  if (field instanceof HTMLSelectElement) {
    // Toggle a CSS class on the actual <select> without re-querying it.
    field.classList.toggle('has-zip', field.value !== 'US')
  }
})
```

### Chain with other setup

```ts
form('search-form')
  .watch('q', value => console.log('q =', value))
  .watch('category', value => console.log('category =', value))
  .onSubmit((_form, data) => console.log('submit', data))
```

## Edge cases

- **The callback receives the value, not the event object.** Use [`getField`](get-field.md) if you need the underlying DOM element.
- **`watch` does not fire on mount.** If you need an initial call, use [`observe`](observe.md) instead.
- **A field name that does not match any DOM field** is still tracked — the callback fires on every form-level change with the (empty) value, but you should fix the selector.
- **Watchers are not invoked from [`setValue`](set-value.md) directly.** `setValue` writes the value and dispatches a `change` / `input` event, which goes through the same delegated listener path as user input, so the watcher fires normally.

## Related

- [`observe`](observe.md) — same callback, returns an unsubscribe function and fires immediately.
- [`unwatch`](unwatch.md) — remove watched callbacks.
- [`subscribe`](subscribe.md) — react to the whole form state.