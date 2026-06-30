---
title: Browser global
description: Use @samline/forms without a bundler via the window.Forms IIFE.
template: doc
sidebar:
  order: 5
---

Use the browser build when you do not have a bundler and need to integrate the package directly into HTML, Shopify, WordPress, or any traditional template that does not run through a build step.

For every other case (modern apps, bundlers, TypeScript projects), use the main vanilla entrypoint — see [Getting started](/forms/getting-started/).

## Script tag

```html
<script src="https://unpkg.com/@samline/forms@2.2.1/dist/browser/global.global.js"></script>
```

:::caution[Pin the version in production]
The CDN URL above uses `@2.2.1`. Replace the version with the one you ship.
:::

The bundle is a single IIFE that registers a global object. Place the `<script>` tag in `<head>` with `defer`, or before the user script in `<body>`.

## Global object

The browser build exposes `window.Forms` (also reachable via `globalThis.Forms`).

```ts
window.Forms = {
  form,
  newForm,
  destroyForm,
  available
}
```

- `form` is the same factory exported by `@samline/forms` — see [`form()`](/forms/reference/api/#formtarget-options).
- `newForm` and `destroyForm` are ergonomic wrappers that keep a registry under `Forms.available`, keyed by the form id.

The factory returns a `FormController` with the same signatures, semantics, and behaviours as the main vanilla entrypoint — every per-method page in [API reference](/forms/reference/api/) applies.

## Minimal example

```html
<form id="contact-form">
  <input name="email" type="email" />
  <input name="message" />
  <button type="submit">Send</button>
</form>

<script src="https://unpkg.com/@samline/forms@2.2.1/dist/browser/global.global.js"></script>
<script>
  const contactForm = window.Forms.newForm({
    id: 'contact-form',
    options: {
      validators: {
        email: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        message: { required: true, minLength: 10 }
      }
    }
  })

  contactForm.onSubmit(async (_element, _data, formData) => {
    await fetch('/api/contact', { method: 'POST', body: formData })
    contactForm.reset()
  })
</script>
```

The controller returned by `newForm` is the same instance stored under `Forms.available.contact-form`. Use `window.Forms.destroyForm('contact-form')` later to call `destroy()` and remove it from the registry.

## Registry helpers

| Helper | Purpose |
| --- | --- |
| `Forms.newForm({ id, options })` | Build a controller via `Forms.form(id, options)` and store it in `Forms.available[id]`. Logs `Form ID is required` and returns early if `id` is missing. |
| `Forms.destroyForm(id)` | Look up `Forms.available[id]`, call `destroy()`, and delete the entry. Logs `Form ID is required` if `id` is missing, or `Form with ID <id> not found` if the entry is absent. |
| `Forms.available` | Read-only view of the active registry: `{ [id: string]: FormController }`. Iterate it to inspect or invoke methods on every live controller. |

Use `Forms.form` directly when you do not want the registry side-effect (for example, transient controllers in tests).

## Surface reference

The browser bundle ships only the registry helpers plus the `form` factory. Every controller method is documented under [API reference](/forms/reference/api/).

| Global | Purpose |
| --- | --- |
| `Forms.form(target, options?)` | Bind a controller to a form (recommended). See [`form()`](/forms/reference/api/#formtarget-options). |
| `Forms.newForm({ id, options? })` | Build + register a controller in `Forms.available[id]`. |
| `Forms.destroyForm(id)` | Destroy + unregister a controller by id. |
| `Forms.available` | Registry of active controllers keyed by id. |

### Controller methods

The controller returned by `form` / `newForm` exposes the methods documented in [API reference](/forms/reference/api/):

- Lifecycle: [`element`](/forms/reference/api/#element), [`reset`](/forms/reference/api/#reset), [`destroy`](/forms/reference/api/#destroy).
- Submission: [`onSubmit`](/forms/reference/api/#onsubmitcallback-preventdefault), [`autoSubmit`](/forms/reference/api/#autosubmitoptions), [`disableAutoSubmit`](/forms/reference/api/#disableautosubmit).
- Field observation: [`watch`](/forms/reference/api/#watchfield-callback), [`observe`](/forms/reference/api/#observefield-callback), [`unwatch`](/forms/reference/api/#unwatchfield-callback), [`subscribe`](/forms/reference/api/#subscribelistener).
- Field values: [`setValue`](/forms/reference/api/#setvaluename-value), [`getValue`](/forms/reference/api/#getvaluename), [`getField`](/forms/reference/api/#getfieldname), [`prefill`](/forms/reference/api/#prefillfieldname), [`format`](/forms/reference/api/#formatconfig), [`formatAll`](/forms/reference/api/#formatallconfig).
- Validation: [`validate`](/forms/reference/api/#validatefields), [`revalidate`](/forms/reference/api/#revalidatefields), [`setErrors`](/forms/reference/api/#seterrorsfields), [`clearErrors`](/forms/reference/api/#clearerrorsfields).
- State and data: [`getData`](/forms/reference/api/#getdata), [`getState`](/forms/reference/api/#getstate), [`append`](/forms/reference/api/#appendoptions).

## TypeScript users

The browser build does not ship its own types. Reuse the types exported by `@samline/forms` instead of redeclaring the surface — declare `window.Forms` against the package's `FormsApi`:

```ts
import type { FormsApi } from '@samline/forms'

declare global {
  interface Window {
    Forms: FormsApi
  }
}
```

See [`FormsApi`](/forms/reference/typescript/#formsapi) for the full shape.

## Using the same shape from a bundler

If you have a bundler but still want the `newForm` / `destroyForm` / `available` ergonomics — without the IIFE and without `window.Forms` auto-installed — import the `browser` singleton from the vanilla entrypoint:

```ts
import { browser } from '@samline/forms'

browser.newForm({ id: 'contact-form' })
browser.destroyForm('contact-form')
browser.available // { 'contact-form': FormController }
```

`browser` is a module-level singleton with a shared `available` registry. Spread it into your own global to compose with extra helpers like `regex` from `@samline/formatter`:

```ts
import { browser } from '@samline/forms'
import { regex } from '@samline/formatter'

window.Form = { ...browser, regex }

window.Form.newForm({ id: 'contact-form' })
window.Form.destroyForm('contact-form')
```

Because the registry is shared across spreads, `window.Form.available` and `browser.available` point to the same object. For independent registries, call [`form()`](/forms/reference/api/#formtarget-options) directly and manage your own map — `browser` is designed for the one-registry-per-page case. See the [Browser registry helpers section](/forms/getting-started/#browser-registry-helpers-bundler) in the getting-started guide for the full pattern.

## Common pitfalls

- **Pin the version.** The CDN URL above uses `@2.2.1`. Replace it whenever you upgrade.
- **The script must be loaded before any code that uses `window.Forms`.** Place the `<script>` tag in `<head>` with `defer`, or before the user script in `<body>`.
- **No bundler means no tree-shaking.** The browser bundle includes the full controller (~5 KB gzipped). That is by design — the alternative would defeat the purpose of a no-bundler setup.
- **CSP:** if your site uses a strict Content Security Policy, allow `unpkg.com` in `script-src` (or self-host the file).