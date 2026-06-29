# `observe(field, callback)`

Registers a callback that fires immediately with the current value and on every subsequent change. Returns an unsubscribe function.

## Signature

```ts
observe(
  field: string,
  callback: FormFieldWatcher
): () => void
```

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `field` | `string` | yes | The `name` attribute of the field to observe. |
| `callback` | [`FormFieldWatcher`](../typescript.md#formfieldwatcher) | yes | Invoked with `(value, field, form, state)`. Fires immediately with the current value, then on every change. `field` is the observed DOM element(s) (same shape as [`getField`](../typescript.md#formfieldelement--formfieldelement--null) returns). |

## Returns

A function. Calling it removes the observer for this field.

## Behaviour

- On registration, the callback is invoked once synchronously with the current value, the bound form, and a state snapshot.
- Subsequent changes (user input, programmatic [`setValue`](set-value.md), or DOM mutations that change the value) invoke the callback again with the new value.
- A field can have multiple observers.
- The unsubscribe function is idempotent — calling it more than once is safe.

## Examples

### Observe and unsubscribe later

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')

const stop = profile.observe('email', value => {
  console.log('email is now:', value)
})

// Later, when the form is unmounted:
stop()
```

### Sync a derived model

```ts
import { form } from '@samline/forms'

const checkout = form('checkout-form')

const unsubscribe = checkout.observe('shippingMethod', (value, field, _form, state) => {
  const total = computeTotal(state.values)
  document.querySelector('#total')!.textContent = String(total)
  if (field && 'name' in field) {
    console.log(`updated ${field.name} ->`, value)
  }
})

window.addEventListener('beforeunload', unsubscribe)
```

### Share a handler across fields

```ts
import { form } from '@samline/forms'

const signup = form('signup-form')

const track = (value: unknown, field: HTMLInputElement | HTMLInputElement[] | null) => {
  const name = field && 'name' in field ? field.name : null
  analytics.track('signup_field_changed', { field: name, value })
}

const offEmail = signup.observe('email', track)
const offPassword = signup.observe('password', track)

// Later, on teardown:
offEmail()
offPassword()
```

### Manipulate the watched element directly

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')

const stop = profile.observe('avatar', (_value, field) => {
  if (field instanceof HTMLInputElement) {
    field.setAttribute('data-touched', 'true')
  }
})
```

### Multiple observers on the same field

```ts
import { form } from '@samline/forms'

const signup = form('signup-form')

const offA = signup.observe('password', value => updateStrength(value))
const offB = signup.observe('password', value => updateCapsLockWarning(value))

// Remove only the strength meter.
offA()
```

## Edge cases

- **The initial fire happens synchronously inside `observe`**. If you do not want this, use [`watch`](watch.md) instead.
- **Observers persist across calls to [`reset`](reset.md) and [`setValue`](set-value.md)** — they are not affected by state changes.
- **The unsubscribe function only removes this specific callback.** Other observers on the same field continue to fire.

## Related

- [`watch`](watch.md) — chainable, no unsubscribe.
- [`unwatch`](unwatch.md) — bulk removal of watchers.
- [`subscribe`](subscribe.md) — global state observer.