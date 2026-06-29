# `form(target, options?)`

Creates a new controller bound to a form. This is the main entry point of `@samline/forms`.

## Signature

```ts
function form(
  target: FormTarget,
  options?: FormControllerOptions
): FormController
```

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `target` | [`FormTarget`](../typescript.md#formtarget) | yes | What to bind to: a string id, an `HTMLFormElement`, a ref-like `{ current }` object, or `null` / `undefined`. |
| `options` | [`FormControllerOptions`](../typescript.md#formcontrolleroptions) | no | Controller configuration. See [docs/options.md](../options.md). |

## Returns

A [`FormController`](../typescript.md#formcontroller) — chainable for every method that does not return data or an unsubscribe function.

## Binding modes

### By id string

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')
```

The string is passed to `document.getElementById`. If no element is found, or the found element is not an `HTMLFormElement`, the controller is created but `controller.element` is `null` and most methods become no-ops.

### By `HTMLFormElement`

```ts
const element = document.querySelector<HTMLFormElement>('#profile-form')
const profile = form(element)
```

Useful when you already have the element from a `querySelector` call.

### By ref-like object

```ts
const ref = { current: document.querySelector<HTMLFormElement>('#profile-form') }
const profile = form(ref)
```

The controller reads `target.current` only at construction time. If you mount the form later, recreate the controller or call `destroy()` and re-bind.

### By `null` / `undefined`

```ts
const profile = form()
```

Allowed for type-system ergonomics. The resulting controller has `element === null` and is effectively inert.

## Behaviour

On creation the controller:

1. Resolves the form element.
2. Merges the provided options with defaults (`autoValidate: true`, `clearErrorsOnSubmit: true`, `clearManualErrorsOnChange: true`, `attributes: { filled: 'css-filled', error: 'css-error' }`).
3. Wires `input`, `change`, and `submit` listeners at the form level.
4. Starts a `MutationObserver` on the form subtree to track dynamic fields.
5. Optionally enables [`autoSubmit`](../api/auto-submit.md) when `options.autoSubmit` is truthy.
6. Runs an initial validation pass if `autoValidate` is enabled.
7. Notifies subscribers with the initial state.

## Examples

### Minimal setup

```ts
import { form } from '@samline/forms'

const contact = form('contact-form')

contact.onSubmit(async (_element, _data, formData) => {
  await fetch('/api/contact', { method: 'POST', body: formData })
})
```

### With validators and options

```ts
import { form } from '@samline/forms'

const signup = form('signup-form', {
  attributes: { filled: 'is-filled', error: 'is-invalid' },
  autoValidate: true,
  autoSubmit: { debounce: 600 },
  clearManualErrorsOnChange: false,
  validators: {
    email: {
      required: { value: true, message: 'Email is required.' },
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Enter a valid email address.'
      }
    },
    password: { required: true, minLength: 8 }
  }
})
```

### Bind later via ref

```ts
import { form } from '@samline/forms'

const profileRef = { current: null as HTMLFormElement | null }

const profile = form(profileRef)

document.querySelector('#mount')?.appendChild(document.createElement('form'))
profileRef.current = document.querySelector<HTMLFormElement>('#mount form')

// Re-bind because the controller captured `current` at construction time.
profile.destroy()
form(profileRef)
```

## Edge cases

- **The id is resolved once.** If the DOM element with that id is replaced, the controller keeps listening to the original element. Recreate the controller if you re-render the form.
- **`null` / `undefined` targets** are accepted and produce an inert controller. The chainable methods still return the controller, so they are safe to call as no-ops.
- **Reusing a target across multiple controllers** is supported but they each install their own listeners — call [`destroy()`](destroy.md) on the previous one to avoid duplicate work.
- **`createFormController` is also exported** as the lower-level factory; prefer `form` for ergonomic imports.

## Related

- [`createFormController`](element.md) — the lower-level factory.
- [`destroy`](destroy.md) — tear the controller down.
- [docs/options.md](../options.md) — every option in detail.