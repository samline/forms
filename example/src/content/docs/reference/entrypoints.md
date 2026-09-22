---
title: Entrypoints and module formats
description: Choose between ESM, CommonJS, the browser registry module, and the standalone global IIFE.
template: doc
---

The package exposes separate surfaces for module consumers and script-tag consumers. Choose one primary surface per integration.

## Decision table

| Use case | Import | Global side effect | Formatter behavior |
| --- | --- | --- | --- |
| ESM or TypeScript app | `import { form } from '@samline/forms'` | None | Optional peer must be installed for formatting. |
| CommonJS app | `const { form } = require('@samline/forms')` | None | Optional peer must be installed for formatting. |
| Registry module | `import Forms from '@samline/forms/browser'` | Installs `globalThis.Forms`. | Optional peer must be installed for formatting. |
| Registry CommonJS | `const Forms = require('@samline/forms/browser')` | Installs `globalThis.Forms`. | Optional peer must be installed for formatting. |
| No bundler / CDN | Load `dist/browser/global.global.js` | Installs `window.Forms`. | Formatter is bundled. |

## Root entrypoint

```ts
import { form, browser, parseFormData, validateValues } from '@samline/forms'
```

The root has no global side effect. `browser` is the shared registry object, but importing it from the root does not assign `window.Forms`.

```js title="CommonJS"
const { form } = require('@samline/forms')

const contact = form('contact-form')
```

## Browser registry module

The `/browser` subpath exports a default registry and named values, and installs that registry on `globalThis.Forms`:

```ts
import Forms, {
  available,
  destroyForm,
  form,
  newForm
} from '@samline/forms/browser'

const contact = newForm({ id: 'contact-form' })
console.log(available['contact-form'] === contact) // true
destroyForm('contact-form')
```

Type exports from this subpath are `FormsApi`, `FormsAvailable`, and `NewFormInput`. They are also exported from the package root.

## Standalone IIFE

```html
<script src="https://unpkg.com/@samline/forms@2.7.0/dist/browser/global.global.js"></script>
<script>
  const contact = window.Forms.newForm({ id: 'contact-form' })
</script>
```

The IIFE is self-contained and cannot be tree-shaken. Pin its version, load it before consumer code, and self-host it when your Content Security Policy does not allow the CDN.

## Registry lifecycle

- `newForm({ id, options })` destroys an existing controller under the same id before replacing it.
- A missing id logs an error and returns `undefined`.
- `destroyForm(id)` destroys and removes an existing entry; missing entries produce a warning.
- Every spread of the root `browser` object shares the same closed-over `available` map.
- For independent registries, call `form()` and store controllers in your own `Map`.

## Related

- [Browser global reference](/forms/reference/browser/)
- [Getting started](/forms/getting-started/)
- [Formatting by distribution](/forms/guides/formatting/#distribution-behavior)
