# Vanilla

## When to use this variant

Use the vanilla variant when you work with native HTML forms, embedded scripts, static sites, or applications where you do not need a framework wrapper.

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

## Recommended Usage Patterns

- use `watch` or `observe` when you need field-level reactions
- use `getData()` when you want both a plain object and `FormData`
- use `setErrors()` and `clearErrors()` to drive visual feedback from server or client validation
- use `subscribe()` when a higher-level controller needs to react to the whole form state
- use `destroy()` when forms are mounted and unmounted dynamically