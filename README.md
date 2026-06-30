# Forms

> A small, framework-free form controller for vanilla JS and direct browser usage.

> It binds to an `HTMLFormElement`, keeps field state in sync with the DOM, runs validation, lets you react to changes via watchers or subscribers, and ships a serialized payload for `fetch` flows.

---

## Table of Contents

- [Installation](#installation)
- [CDN / Browser](#cdn--browser)
- [Entrypoints](#entrypoints)
- [Quick Start](#quick-start)
- [What You Can Build](#what-you-can-build)
- [API at a Glance](#api-at-a-glance)
- [Documentation](#documentation)
- [License](#license)

---

## Installation

```bash
npm install @samline/forms
```

```bash
pnpm add @samline/forms
```

```bash
bun add @samline/forms
```

Requires Node 20+ when bundling. Runtime target is ES2020.

---

## CDN / Browser

Use the browser build when you do not have a bundler and need to run the package directly in HTML, Shopify, WordPress, or any traditional template.

```html
<script src="https://unpkg.com/@samline/forms@2.2.0/dist/browser/global.global.js"></script>
```

> Pin the version in production. Replace `2.2.0` with the version you ship.

The browser bundle exposes a single global: `window.Forms`.

```html
<form id="contact-form">
  <input name="email" type="email" />
  <button type="submit">Send</button>
</form>

<script src="https://unpkg.com/@samline/forms@2.2.0/dist/browser/global.global.js"></script>
<script>
  const contactForm = window.Forms.newForm({ id: 'contact-form' })

  contactForm.onSubmit(async (form, data, formData) => {
    await fetch('/api/contact', { method: 'POST', body: formData })
  })

  contactForm.validate()
</script>
```

The browser surface keeps a small registry under `Forms.available`, keyed by the `id` you pass to `Forms.newForm`. Each successful `newForm` call stores the returned controller there, and `Forms.destroyForm(id)` calls `destroy()` and removes the entry. Use `Forms.form` directly when you need the factory without the registry side-effect.

See [docs/browser.md](docs/browser.md) for the full browser surface.

---

## Entrypoints

| Entrypoint | When to use |
| --- | --- |
| `@samline/forms` | Main vanilla API for bundlers, ESM, or CJS consumers. |
| `@samline/forms/browser` | Pre-bundled IIFE that registers `window.Forms` for direct `<script>` usage. |

The vanilla entrypoint also exports `browser`, the same `{ form, newForm, destroyForm, available }` surface as the IIFE but as a module-level singleton (no `globalThis` side-effect). Use it from a bundler when you want the registry helpers without the IIFE — see [docs/browser.md → Using the same shape from a bundler](docs/browser.md#using-the-same-shape-from-a-bundler).

---

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

contactForm.watch('email', value => {
  console.log('email is now:', value)
})

contactForm.onSubmit(async (_element, _data, formData) => {
  await fetch('/api/contact', { method: 'POST', body: formData })
})
```

What this does:

- Binds to the form with id `contact-form`.
- Adds `css-filled` / `css-error` attributes on fields so you can style them with CSS.
- Validates `email` on every change and on submit.
- Intercepts valid submits (the default for `onSubmit`) and hands a real `FormData` instance to your handler.

---

## What You Can Build

- Contact, newsletter, login, signup, checkout, and profile forms.
- Forms that submit with `fetch` while keeping native `FormData` payloads.
- Autosave / autosubmit flows with optional debounce.
- Visual feedback driven by `css-filled` and `css-error` attributes.
- Progressive enhancement on top of any existing HTML form.
- Forms rendered server-side (Blade, Twig, ERB) that still want client-side validation.

---

## API at a Glance

The controller is built around one factory and a small set of focused methods. Most methods are chainable.

| Group | Methods |
| --- | --- |
| Lifecycle | [`form`](docs/api/form.md) · [`destroy`](docs/api/destroy.md) · [`reset`](docs/api/reset.md) |
| Registry (vanilla) | [`browser`](docs/getting-started.md#browser-registry-helpers) — bundler-friendly `{ form, newForm, destroyForm, available }` singleton. |
| Properties | [`element`](docs/api/element.md) · [`options`](docs/options.md) |
| Submission | [`onSubmit`](docs/api/on-submit.md) · [`autoSubmit`](docs/api/auto-submit.md) · [`disableAutoSubmit`](docs/api/disable-auto-submit.md) |
| Field observation | [`watch`](docs/api/watch.md) · [`observe`](docs/api/observe.md) · [`unwatch`](docs/api/unwatch.md) · [`subscribe`](docs/api/subscribe.md) |
| Field values | [`setValue`](docs/api/set-value.md) · [`getValue`](docs/api/get-value.md) · [`getField`](docs/api/get-field.md) · [`prefill`](docs/api/prefill.md) · [`format`](docs/api/format.md) · [`formatAll`](docs/api/format.md) |
| Validation | [`validate`](docs/api/validate.md) · [`revalidate`](docs/api/revalidate.md) · [`setErrors`](docs/api/set-errors.md) · [`clearErrors`](docs/api/clear-errors.md) |
| State and data | [`getData`](docs/api/get-data.md) · [`getState`](docs/api/get-state.md) · [`append`](docs/api/append.md) |
| Pure helpers | [`parseFormData`](docs/api/parse-form-data.md) · [`validateValues`](docs/api/validate-values.md) · [`validateFieldValue`](docs/api/validate-field-value.md) |

See the full per-method reference in [`docs/api/`](docs/api/index.md).

---

## Optional peer: `@samline/formatter`

[`format`](docs/api/format.md) and [`formatAll`](docs/api/format.md) rely on the optional peer dependency [`@samline/formatter`](https://github.com/samline/formatter). Install it when you need input masks (phone, credit-card, date, time, numeral, general):

```bash
npm install @samline/formatter
```

If the peer is not installed, the methods log a single `console.error` explaining how to install it and return the controller unchanged — the rest of the form keeps working. See [docs/recipes.md → 13. Format inputs with `@samline/formatter`](docs/recipes.md#13-format-inputs-with-samlineformatter) for end-to-end examples.

---

## Documentation

Full API reference, guides, and examples are available at **[samline.github.io/forms](https://samline.github.io/forms)**.

| Doc | Purpose |
| --- | --- |
| [docs/getting-started.md](docs/getting-started.md) | Concepts, observable contract, lifecycle, and side-effect overview. |
| [docs/options.md](docs/options.md) | Full `FormControllerOptions` reference. |
| [docs/css-styling.md](docs/css-styling.md) | `css-filled` and `css-error` styling recipes. |
| [docs/typescript.md](docs/typescript.md) | Every exported TypeScript type, with examples. |
| [docs/api/index.md](docs/api/index.md) | One page per public method. |
| [docs/recipes.md](docs/recipes.md) | End-to-end patterns: fetch submit, server errors, autosave, multi-step, etc. |
| [docs/browser.md](docs/browser.md) | Browser global (`window.Forms`) usage. |

---

## License

MIT