# Forms

Form controller for vanilla JS and direct browser usage.

## Table of Contents

- [Installation](#installation)
- [CDN / Browser](#cdn--browser)
- [Entrypoints](#entrypoints)
- [Quick Start](#quick-start)
- [What You Can Do](#what-you-can-do)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Documentation](#documentation)
- [License](#license)

## Installation

```bash
npm install @samline/forms
```

```bash
pnpm add @samline/forms
```

```bash
yarn add @samline/forms
```

```bash
bun add @samline/forms
```

## CDN / Browser

Use the browser build when you do not have a bundler and need to run the package directly in HTML.

```html
<script src="https://unpkg.com/@samline/forms@2.0.0/dist/browser/global.global.js"></script>
```

Pin the version in production.

The browser build exposes `window.forms`.

```html
<form id="contact-form">
  <input name="email" type="email" />
</form>

<script src="https://unpkg.com/@samline/forms@2.0.0/dist/browser/global.global.js"></script>
<script>
  const contactForm = window.forms.form('contact-form')
  contactForm.validate()
</script>
```

## Entrypoints

| Entrypoint | Use |
| --- | --- |
| `@samline/forms` | Main vanilla API (form controller + types + helpers) |
| `@samline/forms/browser` | Browser global bundle |

## Quick Start

```ts
import { form } from '@samline/forms'

const contactForm = form('contact-form', {
  validators: {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  }
})

contactForm.onSubmit((element, data, formData, state) => {
  console.log(element, data, formData, state)
})
```

## What You Can Do

- bind to a form by id, element, or ref-like target
- read and write field values
- serialize form values to both a plain object and `FormData`
- watch individual fields and subscribe to global form state
- prefill values from the current URL query string
- mark filled and error states through DOM attributes for styling
- run built-in validation rules and custom validators
- trigger submit handlers with optional auto-submit behavior
- reset, inspect, and destroy the controller cleanly

## API Reference

### form(target, options)

Creates a controller from:

- a form id string
- a real `HTMLFormElement`
- a ref-like object with `current`

### Properties

- `element`: the bound `HTMLFormElement | null`
- `f`: alias of `element`
- `options`: normalized controller options

### Submission

- `onSubmit(callback, preventDefault?)`
- `autoSubmit(options?)`
- `disableAutoSubmit()`

`onSubmit` accepts an optional second argument named `preventDefault`.

- `onSubmit(callback)` is equivalent to `onSubmit(callback, true)`
- with `true`, valid submissions are intercepted, which is the right choice for `fetch` or AJAX flows
- with `false`, valid submissions continue with the browser's native form submit behavior
- invalid submissions are still prevented, even when you pass `false`

### Field observation

- `watch(field, callback)`
- `observe(field, callback)`
- `subscribe(listener)`
- `unwatch(field?, callback?)`

### Field values

- `setValue(name, value)`
- `getValue(name)`
- `getField(name)`
- `prefill(fieldName?)`

### Validation and errors

- `validate(fields?)`
- `revalidate(fields?)`
- `setErrors(fields)`
- `clearErrors(fields?)`

Manual errors created with `setErrors()` are cleared per field by default as soon as that field changes, including updates triggered through `setValue()`. Pass `clearManualErrorsOnChange: false` to keep manual errors until you clear them explicitly.

### Form lifecycle and state

- `getData()`
- `getState()`
- `append(options)`
- `reset()`
- `destroy()`

### Validation options

Built-in rules supported through `validators`:

- `required`
- `minLength`
- `maxLength`
- `pattern`
- `validate` for custom callbacks

Controller options also include:

- `autoValidate` to validate on initialization and subsequent field changes
- `clearErrorsOnSubmit` to reset manual errors before submit validation runs
- `clearManualErrorsOnChange` to clear only the changed field's manual error before the normal validation flow continues

```ts
const profileForm = form('profile-form', {
  clearManualErrorsOnChange: false
})
```

## Examples

### Bind by id

```ts
import { form } from '@samline/forms'

const profileForm = form('profile-form')
```

### Bind by element

```ts
const element = document.querySelector('#profile-form') as HTMLFormElement
const profileForm = form(element)
```

### Bind by ref-like target

```ts
const ref = { current: document.querySelector<HTMLFormElement>('#profile-form') }
const profileForm = form(ref)
```

### Submit with fetch

```ts
const profileForm = form('profile-form')

profileForm.onSubmit(async (_element, _data, formData) => {
  await fetch('/profile', { method: 'POST', body: formData })
})
```

### Watch a field

```ts
const profileForm = form('profile-form')

profileForm.watch('email', value => {
  console.log('email changed to:', value)
})
```

### Subscribe to global state

```ts
const unsubscribe = profileForm.subscribe(state => {
  console.log(state.values, state.errors)
})

unsubscribe()
```

### Prefill from query string

```ts
profileForm.prefill()
// or
profileForm.prefill('email')
```

### Manual errors

```ts
profileForm.setErrors({
  email: ['This email is already in use.'],
  password: ['Too weak.']
})

profileForm.clearErrors(['email'])
profileForm.clearErrors()
```

### Auto submit with debounce

```ts
profileForm.autoSubmit({ debounce: 500 })
profileForm.disableAutoSubmit()
```

## Documentation

See [`docs/vanilla.md`](docs/vanilla.md) and [`docs/browser.md`](docs/browser.md) for deeper examples and the full controller reference.

## License

MIT
