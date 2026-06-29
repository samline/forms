# Vanilla

## When to use this variant

Use the vanilla variant when you work with native HTML forms, embedded scripts, static sites, or applications where you do not need a framework wrapper.

This is the primary — and only — runtime entrypoint of `@samline/forms` since version 2.0.0.

## Import

```ts
import { form } from '@samline/forms'
```

## Minimal Example

```ts
const contactForm = form('contact-form', {
  validators: {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  }
})

contactForm.watch('email', value => {
  console.log(value)
})
```

## What You Can Build With It

- contact, newsletter, login, checkout, and profile forms
- forms that submit with `fetch` using native `FormData`
- flows that need field watchers without a framework
- forms styled through attributes such as `css-filled` and `css-error`
- progressive enhancement on top of existing HTML forms

## Observable Contract

- adds `css-filled` to filled fields
- adds `css-error` to fields with errors
- serializes the form into a plain object and `FormData`
- supports `autoSubmit` with optional debounce
- clears manual `setErrors()` feedback for the changed field by default, then lets normal validation decide the final state

## Full Controller API

- `element`
- `f`
- `onSubmit`
- `watch`
- `observe`
- `unwatch`
- `subscribe`
- `prefill`
- `append`
- `setErrors`
- `clearErrors`
- `setValue`
- `getValue`
- `getField`
- `validate`
- `revalidate`
- `reset`
- `autoSubmit`
- `disableAutoSubmit`
- `getData`
- `getState`
- `destroy`

## Submission Behavior

`onSubmit` accepts an optional second argument named `preventDefault`.

- `onSubmit(callback)` is equivalent to `onSubmit(callback, true)`
- `true` intercepts valid form submissions, which is useful when you want to send the request with `fetch`
- `false` allows valid submissions to continue with the browser's native form submit behavior
- invalid submissions are still prevented, even when you pass `false`

Use `false` for traditional server-rendered forms, such as Laravel with Blade, where the form should still submit to its `action` after passing validation.

## Recommended Usage Patterns

- use `watch` or `observe` when you need field-level reactions
- use `getData()` when you want both a plain object and `FormData`
- use `setErrors()` and `clearErrors()` to drive visual feedback from server or client validation
- pass `clearManualErrorsOnChange: false` only when manual errors should persist after the user edits a field
- use `subscribe()` when a higher-level controller needs to react to the whole form state
- use `destroy()` when forms are mounted and unmounted dynamically

## Submission Examples

### Intercept and send with fetch

```ts
const profileForm = form('profile-form')

profileForm.onSubmit(async (_element, _data, formData) => {
  await fetch('/profile', {
    method: 'POST',
    body: formData
  })
})
```

### Let the browser submit natively

```ts
const bladeForm = form('blade-form')
bladeForm.onSubmit(() => {
  console.log('client-side hooks ran')
}, false)
```

## Direct Utilities

The package also exposes a couple of pure helpers for consumers who want to run validation or serialization without instantiating a controller:

```ts
import {
  parseFormData,
  validateFieldValue,
  validateValues
} from '@samline/forms'
```

These are the same routines the controller uses internally.
