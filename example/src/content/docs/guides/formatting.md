---
title: Formatting inputs
description: Understand canonical and display fields, formatter lifecycle, server-prefilled values, and cleanup.
template: doc
---

Formatting pairs a visible value with a canonical value suitable for submission. It requires the optional `@samline/formatter` peer in ESM, CJS, and browser-module consumers; the global IIFE bundles the formatter.

## Install the optional peer

```bash
npm install @samline/forms @samline/formatter
```

## Basic setup

Author the HTML with the canonical name:

```html
<form id="checkout">
  <label for="phone">Phone</label>
  <input id="phone" name="phone" autocomplete="tel" />
  <button type="submit">Pay</button>
</form>
```

```ts
import { form } from '@samline/forms'

const checkout = form('checkout', {
  formats: {
    phone: {
      type: 'phone',
      field: 'phone',
      options: { country: 'MX' }
    }
  }
})
```

## The mirror convention

`format()` synchronously transforms the field pair before loading the peer asynchronously:

| Role | Name | Element | Example value |
| --- | --- | --- | --- |
| Visible display | `phone_displayed` | Original input, renamed | `55 1234 5678` |
| Canonical raw | `phone` | Hidden input appended to the form | `5512345678` |

Both names are first-class controller fields:

| Operation | Canonical name | Display name |
| --- | --- | --- |
| `getValue()` | Reads raw hidden value. | Reads formatted visible value. |
| `setValue()` | Writes raw value; formatter synchronizes display. | Writes display value; formatter synchronizes raw. |
| `watch()` / `observe()` | Receives raw changes. | Receives display changes. |
| `getData()` / submit | Includes canonical raw key. | Includes display key. |
| Validation errors | Key rules by canonical name. | Visual attributes land on the visible input. |

The hidden mirror is appended to the form, not inserted beside the visible input. This keeps wrapper selectors such as `.field:has([css-error])` focused on the visible control.

## Timing and readiness

`format()` and `formatAll()` are chainable and return immediately; they do not return a readiness promise.

1. Synchronous phase: find the first supported visible field, rename it, create or reuse its hidden mirror, and register both names.
2. Asynchronous phase: load `@samline/formatter`, attach the capture-phase input listener, and format an initial value.
3. Missing peer: log one cached `console.error` for the module instance and roll back fields created by that call.

Avoid submitting in the same synchronous turn in which formatting is first configured. Construction-time `formats` and normal user interaction give the peer time to resolve.

## Supported fields

- Visible `HTMLInputElement` controls except `type="hidden"`.
- `HTMLTextAreaElement` controls.
- Selects are not formatter targets.
- When several visible controls share the same canonical name, the first matching control is formatted.
- `displayField` is valid only when `field` is one string. Arrays derive one `${field}_displayed` name per canonical field.

## Server-prefilled values

An existing visible value is formatted once after the peer loads. The initial pass defaults `interpretInputAs` to `auto`, which lets a canonical date such as `19901212` become its configured display form. Later events from the visible field and re-bind operations default to `display`, so a full-length paste such as `12121990` remains in display order. Writes to the canonical hidden mirror use `auto`. An explicit `interpretInputAs` in `options` always wins:

```ts
checkout.format({
  type: 'date',
  field: 'birthday',
  options: {
    datePattern: ['d', 'm', 'Y'],
    dateRawPattern: ['Y', 'm', 'd'],
    interpretInputAs: 'raw'
  }
})
```

## Existing mirrors and cleanup

- A pre-authored `<input type="hidden" name="phone">` or element marked `data-formatter-raw-for="phone"` is reused.
- `reset()` restores native defaults for both visible and raw fields.
- `destroy()` restores the visible canonical name and removes only mirrors created by this controller.
- Pre-authored mirrors survive `destroy()`.
- Repeated `format()` calls do not duplicate listeners or mirrors. They reformat the current value, but the installed input handler retains its original options. Destroy and recreate the controller when options must change reliably at runtime.

## Distribution behavior

| Surface | Formatter availability |
| --- | --- |
| `@samline/forms` ESM/CJS | Install `@samline/formatter` in the consuming project. |
| `@samline/forms/browser` | Same optional-peer requirement; importing also installs `globalThis.Forms`. |
| Global IIFE | Formatter is bundled; no separate peer installation is needed. |

The IIFE does not expose the formatter's `regex` object on `window.Forms`; import `regex` from the peer in module builds or provide your own global.

## Related

- [`formats` configuration](/forms/reference/configuration/#formats)
- [`FieldFormatConfig`](/forms/reference/typescript/#fieldformatconfig-and-fieldformatconfigmap)
- [Entrypoints and module formats](/forms/reference/entrypoints/)
- [`regex` integration](/forms/reference/regex/)
