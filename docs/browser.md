# Browser

## When to use this variant

Use the browser build when you do not have a bundler and need to integrate the package directly into HTML, Shopify, WordPress, or any traditional template that does not run through a build step.

For every other case (modern apps, bundlers, TypeScript projects), use the main vanilla entrypoint — see [docs/getting-started.md](getting-started.md).

---

## Script tag

```html
<script src="https://unpkg.com/@samline/forms@2.0.0/dist/browser/global.global.js"></script>
```

> Pin the version in production. Replace `2.0.0` with the version you ship.

The bundle is a single IIFE that registers a global object.

---

## Global object

The browser build exposes `window.forms` (also reachable via `globalThis.forms`).

```ts
window.forms = {
  form,
  createFormController,
  parseFormData,
  validateFieldValue,
  validateValues
}
```

The same signatures, semantics, and behaviours as the main vanilla entrypoint — every per-method page under [docs/api/](api/index.md) applies.

---

## Minimal example

```html
<form id="contact-form">
  <input name="email" type="email" />
  <input name="message" />
  <button type="submit">Send</button>
</form>

<script src="https://unpkg.com/@samline/forms@2.0.0/dist/browser/global.global.js"></script>
<script>
  const contactForm = window.forms.form('contact-form', {
    validators: {
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      },
      message: { required: true, minLength: 10 }
    }
  })

  contactForm.onSubmit(async (_element, _data, formData) => {
    await fetch('/api/contact', { method: 'POST', body: formData })
    contactForm.reset()
  })
</script>
```

---

## Surface reference

The browser bundle mirrors the main vanilla entrypoint. Use the deep links below for the full reference of each function.

### Controller factories

| Global | Purpose |
| --- | --- |
| [`window.forms.form`](api/form.md) | Bind a controller to a form (recommended). |
| [`window.forms.createFormController`](api/form.md) | Lower-level factory; identical behaviour. |

### Controller methods

The `form()` factory returns a controller whose methods are documented under [docs/api/](api/index.md):

- Lifecycle: [`element`](api/element.md), [`reset`](api/reset.md), [`destroy`](api/destroy.md).
- Submission: [`onSubmit`](api/on-submit.md), [`autoSubmit`](api/auto-submit.md), [`disableAutoSubmit`](api/disable-auto-submit.md).
- Field observation: [`watch`](api/watch.md), [`observe`](api/observe.md), [`unwatch`](api/unwatch.md), [`subscribe`](api/subscribe.md).
- Field values: [`setValue`](api/set-value.md), [`getValue`](api/get-value.md), [`getField`](api/get-field.md), [`prefill`](api/prefill.md).
- Validation: [`validate`](api/validate.md), [`revalidate`](api/revalidate.md), [`setErrors`](api/set-errors.md), [`clearErrors`](api/clear-errors.md).
- State and data: [`getData`](api/get-data.md), [`getState`](api/get-state.md), [`append`](api/append.md).

### Pure helpers

| Global | Purpose |
| --- | --- |
| [`window.forms.parseFormData`](api/parse-form-data.md) | Serialize a form into `{ data, formData }`. |
| [`window.forms.validateFieldValue`](api/validate-field-value.md) | Run a rule set against a single value. |
| [`window.forms.validateValues`](api/validate-values.md) | Run a schema against a values map. |

---

## TypeScript users

The browser build does not ship its own types. If you need types for `window.forms`, declare them once in your project:

```ts
import type {
  FormController,
  FormControllerOptions,
  SerializedFormResult,
  ValidationResult
} from '@samline/forms'

declare global {
  interface Window {
    forms: {
      form: (target: FormTarget, options?: FormControllerOptions) => FormController
      createFormController: (target: FormTarget, options?: FormControllerOptions) => FormController
      parseFormData: (formElement: HTMLFormElement) => SerializedFormResult
      validateFieldValue: (
        field: string,
        value: unknown,
        rules: Record<string, unknown>,
        values: Record<string, unknown>
      ) => string[]
      validateValues: (
        values: Record<string, unknown>,
        schema: Record<string, unknown>
      ) => ValidationResult
    }
  }
}
```

---

## Common pitfalls

- **Pin the version.** The CDN URL above is `2.0.0`. Replace it whenever you upgrade.
- **The script must be loaded before any code that uses `window.forms`.** Place the `<script>` tag in `<head>` with `defer`, or before the user script in `<body>`.
- **No bundler means no tree-shaking.** The browser bundle includes the full controller (~5 KB gzipped). That is by design — the alternative would defeat the purpose of a no-bundler setup.
- **CSP:** if your site uses a strict Content Security Policy, allow `unpkg.com` in `script-src` (or self-host the file).

---

## Next steps

- Concepts and lifecycle: [docs/getting-started.md](getting-started.md).
- Full options reference: [docs/options.md](options.md).
- End-to-end patterns: [docs/recipes.md](recipes.md).