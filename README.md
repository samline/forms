# @samline/forms

Form controller for native HTML forms, React, Vue, Svelte, and direct browser usage.

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
<script src="https://unpkg.com/@samline/forms@1.0.2/dist/browser/global.global.js"></script>
```

Pin the version in production.

The browser build exposes `window.forms`.

```html
<form id="contact-form">
  <input name="email" type="email" />
</form>

<script src="https://unpkg.com/@samline/forms@1.0.2/dist/browser/global.global.js"></script>
<script>
  const contactForm = window.forms.form('contact-form')
  contactForm.validate()
</script>
```

## Entrypoints

| Entrypoint | Use |
| --- | --- |
| `@samline/forms` | Main vanilla API |
| `@samline/forms/core` | Types, serialization, and validation |
| `@samline/forms/vanilla` | Explicit DOM API entrypoint |
| `@samline/forms/react` | React hook |
| `@samline/forms/vue` | Vue composable |
| `@samline/forms/svelte` | Svelte store and action |
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

### Watch a field

```ts
const profileForm = form('profile-form')

profileForm.watch('email', value => {
  console.log('email changed:', value)
})
```

### Validate with built-in rules

```ts
const profileForm = form('profile-form', {
  validators: {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
      minLength: 8
    }
  }
})

const result = profileForm.validate()
console.log(result.isValid, result.errors)
```

### Submit with fetch

```ts
const profileForm = form('profile-form')

profileForm.onSubmit(async (_element, _data, formData) => {
  await fetch('/api/profile', {
    method: 'POST',
    body: formData
  })
})
```

This uses the default `preventDefault = true`, so the package intercepts the valid submit and lets you handle the request yourself.

### Submit with native form behavior

```ts
const profileForm = form('profile-form')

profileForm.onSubmit(() => {
  console.log('validation passed')
}, false)
```

Use `false` when the form should continue with its normal HTML submission after validation succeeds, for example in server-rendered applications such as Laravel with Blade.

If validation fails, the package still prevents the submit.

### Prefill from the URL

```ts
const profileForm = form('profile-form')
profileForm.prefill()
```

### Work with form state

```ts
const profileForm = form('profile-form')

const unsubscribe = profileForm.subscribe(state => {
  console.log(state.values)
  console.log(state.errors)
})

unsubscribe()
```

## Documentation

- [docs/vanilla.md](docs/vanilla.md)
- [docs/react.md](docs/react.md)
- [docs/vue.md](docs/vue.md)
- [docs/svelte.md](docs/svelte.md)
- [docs/browser.md](docs/browser.md)

## License

MIT