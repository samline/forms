# Getting Started

This page explains what `@samline/forms` is, how the controller is wired, and which side effects to expect from each method. Use it as a mental model before diving into the per-method reference under [`docs/api/`](api/index.md).

---

## When to use this variant

Use the vanilla variant when you work with native HTML forms, embedded scripts, static sites, or applications where you do not need a framework wrapper. This is the primary — and only — runtime entrypoint of `@samline/forms` since v2.1.0.

> Note: the latest published version is `2.2.1` — see [Releases](https://github.com/samline/forms/releases) for the changelog.

If you want a `<script>`-only setup without a bundler, see [docs/browser.md](browser.md).

---

## Anatomy of a controller

A controller is created with [`form()`](api/form.md) and is bound to exactly one `HTMLFormElement`. Once bound, it:

- Listens to `input` and `change` events delegated at the form level.
- Listens to the native `submit` event.
- Maintains a small internal state (values, errors, watched fields, subscribers, submit handlers).
- Applies DOM attributes (`css-filled`, `css-error`) to fields when needed.
- Watches the form subtree with a `MutationObserver` so dynamic fields work.

The controller is returned with a small, focused method surface. Most methods are chainable and return the same controller instance so you can compose setup fluently.

```ts
import { form } from '@samline/forms'

const contact = form('contact-form')
  .watch('email', value => console.log(value))
  .setErrors({ email: ['Already in use'] })
```

Methods that return data instead of the controller: [`getValue`](api/get-value.md), [`getField`](api/get-field.md), [`getData`](api/get-data.md), [`getState`](api/get-state.md), [`validate`](api/validate.md), [`revalidate`](api/revalidate.md). Methods that return an unsubscribe function: [`observe`](api/observe.md), [`subscribe`](api/subscribe.md).

---

## Observable contract

Once a controller is created, you can rely on the following behaviour:

- **`css-filled` attribute** is added to a field when it has a non-empty value, and removed when it becomes empty. Override the attribute name with `options.attributes.filled`.
- **`css-error` attribute** is added to a field when it has at least one error (validation or manual), and removed when it has none. Override with `options.attributes.error`.
- **Validation runs on every change** for any field that has rules configured under `options.validators` (gated by `autoValidate`, default `true`).
- **Manual errors from [`setErrors`](api/set-errors.md) are cleared by default when the affected field changes.** Set `clearManualErrorsOnChange: false` to keep them.
- **Submit handlers receive a real `FormData` instance** built from the live form, plus a plain-object mirror. Invalid submissions never reach your handler.
- **Dynamic fields are auto-discovered.** A `MutationObserver` watches the form subtree for `name` / `type` attribute changes or new fields, re-caches the field registry, and re-runs visual state and validation.

---

## Lifecycle

The recommended flow:

1. **Mount** — call [`form()`](api/form.md) with a binding target and options. The controller wires events, applies initial visual state, and (when `autoValidate`) runs an initial validation pass.
2. **React** — register [`watch`](api/watch.md) / [`observe`](api/observe.md) callbacks for field-level reactions, and [`subscribe`](api/subscribe.md) for whole-form reactions.
3. **Validate** — built-in validation runs automatically. Use [`validate`](api/validate.md) (or the alias [`revalidate`](api/revalidate.md)) to run it on demand.
4. **Submit** — register [`onSubmit`](api/on-submit.md) handlers. Valid submissions are intercepted (default) or allowed to continue natively (`preventDefault: false`).
5. **Reset** — call [`reset`](api/reset.md) to restore the native form, clear errors, and strip visual attributes.
6. **Destroy** — call [`destroy`](api/destroy.md) to remove listeners, disconnect the `MutationObserver`, clear caches, and drop all subscribers.

---

## Side effects per method

Use this as a quick lookup when you need to know what a method will touch.

| Method | DOM mutation | Events fired | Subscribers notified | AutoSubmit trigger | Visual state |
| --- | --- | --- | --- | --- | --- |
| [`setValue`](api/set-value.md) | yes (writes value, then `input` / `change`) | `input` or `change` | yes | yes | re-synced for that field |
| [`getValue`](api/get-value.md) | no | no | no | no | unchanged |
| [`getField`](api/get-field.md) | no | no | no | no | unchanged |
| [`prefill`](api/prefill.md) | yes (writes via [`setValue`](api/set-value.md)) | per-field | yes | yes | re-synced per touched field |
| [`append`](api/append.md) | yes (inserts a node; removes prior node with same class) | no | no | no | unchanged |
| [`validate`](api/validate.md) | re-syncs visual attributes for the targeted fields | no | no | no | re-synced |
| [`revalidate`](api/revalidate.md) | same as [`validate`](api/validate.md) | no | no | no | re-synced |
| [`setErrors`](api/set-errors.md) | re-syncs visual attributes for the targeted fields | no | yes | no | re-synced |
| [`clearErrors`](api/clear-errors.md) | re-syncs visual attributes (all or for the listed fields) | no | yes | no | re-synced |
| [`reset`](api/reset.md) | calls native `form.reset()`; strips attributes | no | yes | no | cleared |
| [`onSubmit`](api/on-submit.md) | none directly; submit handler is invoked on submit | n/a | n/a | n/a | n/a |
| [`autoSubmit`](api/auto-submit.md) | schedules `form.requestSubmit()` (with optional debounce) | native submit | yes (config change) | enables the behaviour | unchanged |
| [`disableAutoSubmit`](api/disable-auto-submit.md) | cancels any pending debounce timer | no | yes | disables | unchanged |
| [`watch`](api/watch.md) / [`observe`](api/observe.md) | none directly; callback fires on changes | n/a | n/a | n/a | unchanged |
| [`unwatch`](api/unwatch.md) | none | no | no | no | unchanged |
| [`subscribe`](api/subscribe.md) | none; fires immediately with the current snapshot | no | n/a | n/a | unchanged |
| [`getData`](api/get-data.md) | no | no | no | no | unchanged |
| [`getState`](api/get-state.md) | no | no | no | no | unchanged |
| [`destroy`](api/destroy.md) | removes `css-filled` / `css-error` indirectly via listener teardown | no | no longer fires | disabled | unchanged |

> Native field input events (`input` / `change`) are always delegated at the form level — the controller never attaches listeners to individual fields.

---

## Recommended usage patterns

- Use [`watch`](api/watch.md) when you want a chainable, fire-and-forget reaction to a field. Use [`observe`](api/observe.md) when you need to clean up later — it returns an unsubscribe function.
- Use [`subscribe`](api/subscribe.md) when a higher-level component (router, store, view layer) needs to react to the whole form state.
- Use [`getData()`](api/get-data.md) when you need both a plain object and a `FormData` instance.
- Use [`setErrors`](api/set-errors.md) and [`clearErrors`](api/clear-errors.md) to drive visual feedback from server responses.
- Pass `clearManualErrorsOnChange: false` only when manual errors should persist after the user edits a field.
- Use [`autoSubmit({ debounce })`](api/auto-submit.md) for autosave / autosubmit flows. Pair with [`disableAutoSubmit()`](api/disable-auto-submit.md) when you want to pause it.
- Call [`destroy()`](api/destroy.md) whenever a form is mounted and unmounted dynamically (SPA route changes, conditional rendering, modals).

---

## Direct utilities

The package also exposes a few pure helpers. They do not instantiate a controller — they accept plain values or a raw `HTMLFormElement` and return results.

```ts
import {
  parseFormData,
  validateFieldValue,
  validateValues
} from '@samline/forms'
```

- [`parseFormData(formElement)`](api/parse-form-data.md) — same serializer the controller uses internally. Returns `{ data, formData }`.
- [`validateFieldValue(field, value, rules, values)`](api/validate-field-value.md) — runs the rule set against a single value.
- [`validateValues(values, schema)`](api/validate-values.md) — runs the rule set against a full values map.

These are safe to tree-shake into any bundle and do not require a live form.

---

## Browser registry helpers

The browser IIFE bundle ships a small registry (`window.Forms`) that wraps `form()` with a `newForm` / `destroyForm` pair keyed by the form id. The same shape is available from the vanilla entrypoint as a module-level singleton called `browser`:

```ts
import { browser } from '@samline/forms'
import { regex } from '@samline/formatter' // optional, from your project

window.Form = { ...browser, regex }

window.Form.newForm({
  id: 'contact-form',
  options: {
    validators: {
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
    }
  }
})

window.Form.destroyForm('contact-form')
console.log(window.Form.available) // { 'contact-form': FormController }
```

`browser` is an object you can spread into your own globals or use directly. Because `newForm` and `destroyForm` close over the singleton's `available` map, every spread shares the same registry — `window.Form.available`, `browser.available`, and any other spread all point to the same object, and `destroyForm` on one updates the others.

If you need multiple independent registries, call the `form()` factory directly and keep your own map of controllers — `browser` is designed for the common case of one registry per page.

```ts
import { form } from '@samline/forms'

const checkout = form('cart-form')
const auth = form('login-form')

// Track them yourself when you have multiple registries.
const registries = {
  checkout,
  auth
}
```

Use `form()` directly when you do not need the registry (for example, transient controllers in tests). The vanilla entrypoint never touches `globalThis` — you decide whether to assign it to `window`. If you are loading the package via `<script>` without a bundler, prefer [`@samline/forms/browser`](browser.md) and consume `window.Forms` directly.

---

## Submission examples

### Intercept and send with `fetch` (default)

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')

profile.onSubmit(async (_element, _data, formData) => {
  const response = await fetch('/profile', {
    method: 'POST',
    body: formData
  })
  return response
})
```

When `preventDefault` is omitted, valid submissions are intercepted — the browser will not navigate. Invalid submissions are always intercepted, regardless of the flag.

### Let the browser submit natively

```ts
import { form } from '@samline/forms'

const bladeForm = form('blade-form', {
  validators: { email: { required: true } }
})

bladeForm.onSubmit(() => {
  // Runs only when validation passes.
  console.log('client-side hooks ran')
}, false)
```

Pass `false` as the second argument when you want the browser’s native submit behaviour to continue after validation (Blade, ERB, plain PHP, classic Rails forms).

---

## Next steps

- Need a full options reference? See [docs/options.md](options.md).
- Looking up the exact signature of a method? See [docs/api/index.md](api/index.md).
- Working with the type system? See [docs/typescript.md](typescript.md).
- Want end-to-end patterns? See [docs/recipes.md](recipes.md).