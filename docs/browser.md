# Browser

## When to use this variant

Use the browser build when you do not have a bundler and need to integrate the package directly into HTML, Shopify, WordPress, or any traditional template that does not run through a build step.

For every other case (modern apps, bundlers, TypeScript projects), use the main vanilla entrypoint — see [docs/getting-started.md](getting-started.md).

---

## Script tag

```html
<script src="https://unpkg.com/@samline/forms@2.1.0/dist/browser/global.global.js"></script>
```

> Pin the version in production. Replace `2.1.0` with the version you ship.

The bundle is a single IIFE that registers a global object.

---

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

- `form` is the same factory exported by `@samline/forms` — see [`docs/api/form.md`](api/form.md) for the signature.
- `newForm` and `destroyForm` are ergonomic wrappers that keep a registry under `Forms.available`, keyed by the form id.

The factory returns a `FormController` with the same signatures, semantics, and behaviours as the main vanilla entrypoint — every per-method page under [docs/api/](api/index.md) applies.

---

## Minimal example

```html
<form id="contact-form">
  <input name="email" type="email" />
  <input name="message" />
  <button type="submit">Send</button>
</form>

<script src="https://unpkg.com/@samline/forms@2.1.0/dist/browser/global.global.js"></script>
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

---

## Registry helpers

| Helper | Purpose |
| --- | --- |
| `Forms.newForm({ id, options })` | Build a controller via `Forms.form(id, options)` and store it in `Forms.available[id]`. Logs `Form ID is required` and returns early if `id` is missing. |
| `Forms.destroyForm(id)` | Look up `Forms.available[id]`, call `destroy()`, and delete the entry. Logs `Form ID is required` if `id` is missing, or `Form with ID <id> not found` if the entry is absent. |
| `Forms.available` | Read-only view of the active registry: `{ [id: string]: FormController }`. Iterate it to inspect or invoke methods on every live controller. |

Use `Forms.form` directly when you do not want the registry side-effect (for example, transient controllers in tests).

---

## Surface reference

The browser bundle ships only the registry helpers plus the `form` factory. Every controller method is documented under [docs/api/](api/index.md).

| Global | Purpose |
| --- | --- |
| `Forms.form(target, options?)` | Bind a controller to a form (recommended). See [`docs/api/form.md`](api/form.md). |
| `Forms.newForm({ id, options? })` | Build + register a controller in `Forms.available[id]`. |
| `Forms.destroyForm(id)` | Destroy + unregister a controller by id. |
| `Forms.available` | Registry of active controllers keyed by id. |

### Controller methods

The controller returned by `form` / `newForm` exposes the methods documented under [docs/api/](api/index.md):

- Lifecycle: [`element`](api/element.md), [`reset`](api/reset.md), [`destroy`](api/destroy.md).
- Submission: [`onSubmit`](api/on-submit.md), [`autoSubmit`](api/auto-submit.md), [`disableAutoSubmit`](api/disable-auto-submit.md).
- Field observation: [`watch`](api/watch.md), [`observe`](api/observe.md), [`unwatch`](api/unwatch.md), [`subscribe`](api/subscribe.md).
- Field values: [`setValue`](api/set-value.md), [`getValue`](api/get-value.md), [`getField`](api/get-field.md), [`prefill`](api/prefill.md).
- Validation: [`validate`](api/validate.md), [`revalidate`](api/revalidate.md), [`setErrors`](api/set-errors.md), [`clearErrors`](api/clear-errors.md).
- State and data: [`getData`](api/get-data.md), [`getState`](api/get-state.md), [`append`](api/append.md).

---

## TypeScript users

The browser build does not ship its own types. If you need types for `window.Forms`, declare them once in your project:

```ts
import type {
  FormController,
  FormControllerOptions,
  FormTarget
} from '@samline/forms'

declare global {
  interface Window {
    Forms: {
      form: (target: FormTarget, options?: FormControllerOptions) => FormController
      newForm: (input: {
        id: string
        options?: FormControllerOptions
      }) => FormController | undefined
      destroyForm: (id: string) => void
      available: { [id: string]: FormController }
    }
  }
}
```

---

## Common pitfalls

- **Pin the version.** The CDN URL above is `2.1.0`. Replace it whenever you upgrade.
- **The script must be loaded before any code that uses `window.Forms`.** Place the `<script>` tag in `<head>` with `defer`, or before the user script in `<body>`.
- **No bundler means no tree-shaking.** The browser bundle includes the full controller (~5 KB gzipped). That is by design — the alternative would defeat the purpose of a no-bundler setup.
- **CSP:** if your site uses a strict Content Security Policy, allow `unpkg.com` in `script-src` (or self-host the file).

---

## Using the same shape from a bundler

If you have a bundler but still want the `newForm` / `destroyForm` / `available` ergonomics (without the IIFE and without `window.Forms` auto-installed), use the vanilla `browser` singleton instead:

```ts
import { browser } from '@samline/forms'

browser.newForm({ id: 'contact-form' })
browser.destroyForm('contact-form')
browser.available // { 'contact-form': FormController }
```

`browser` is a module-level singleton with a shared `available` registry. To run multiple registries in parallel, spread it into separate objects with fresh `available` maps — see [Browser registry helpers](getting-started.md#browser-registry-helpers) in the getting-started guide for the full pattern (including how to attach `regex` from `@samline/formatter`).

---

## Next steps

- Concepts and lifecycle: [docs/getting-started.md](getting-started.md).
- Full options reference: [docs/options.md](options.md).
- End-to-end patterns: [docs/recipes.md](recipes.md).