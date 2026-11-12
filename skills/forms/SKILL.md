---
name: forms
description: Add validation, reactive state, serialization, auto-submit and optional input formatting to native HTML forms with @samline/forms, in plain pages, CMS templates or framework components. Use for Forms installation, rules, error messages, submission, lifecycle and formatting; not for other form libraries or repository maintenance.
metadata:
  package: '@samline/forms'
  package-version: '2.8.0'
---

# Forms

Build against the installed `@samline/forms` version. This skill describes v2.8.0. Check the dependency version and exports before applying it to another release, and read `CHANGELOG.md` when upgrading. Keep the host's markup, components and styling: the package adds a controller to a native `<form>`; it never renders inputs or messages.

## Choose loading, then keep the controller

- **Package / ESM:** `npm install @samline/forms` (or pnpm, yarn, bun). Import `{ form }` from `@samline/forms`. CommonJS is also exported. The root entry does not set a global.
- **HTML / CDN:** load `https://unpkg.com/@samline/forms@2.8.0/dist/browser/global.global.js` with a classic `<script>` and use `window.Forms.form(...)`. The global has exactly `form`, `newForm`, `destroyForm` and `available`. This file already bundles `@samline/formatter`. Self-hosting the same file uses the same API.
- **Registry helpers:** `browser` from the root entry (or the `@samline/forms/browser` subpath, which also sets `globalThis.Forms`) provides `newForm({ id, options })`, `destroyForm(id)` and the `available` map, one controller per form id.

Verify the release exists on npm before using a CDN URL; a repository version does not prove publication. Load one copy of the runtime per page.

## Minimal owned integration

```html
<form id="signup" novalidate>
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="email" aria-describedby="email-error" />
  <p id="email-error" data-error-for="email" aria-live="polite"></p>
  <button type="submit">Sign up</button>
</form>
```

```js
import { form } from '@samline/forms'

const signup = form('signup', {
  autoValidate: false, // quiet until the first submit, then live
  validators: {
    email: {
      required: { value: true, message: 'Enter your email.' },
      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Use a valid email.' },
    },
  },
})

signup.subscribe(state => {
  for (const slot of document.querySelectorAll('[data-error-for]')) {
    slot.textContent = state.errors[slot.dataset.errorFor]?.[0] ?? ''
  }
})

signup.onSubmit(async (_element, data, formData) => {
  const response = await fetch('/api/signup', { method: 'POST', body: formData })
  if (response.status === 422) signup.setErrors(await response.json())
  else signup.reset()
})

// When the form leaves the page or component:
// signup.destroy()
```

Always add `novalidate`: otherwise the browser's constraint validation blocks the submit with its own bubbles before the controller runs. `form()` accepts an element id, an `HTMLFormElement` or a `{ current }` ref; it returns a controller with `element === null` when the target is missing.

## Rules

`validators` maps field names to rules. Each rule accepts a value or `{ value, message }`; always pass messages for visible text (defaults are short English sentences).

- `required`, `minLength`, `maxLength` (string length, or the number of selected items for checkbox groups), `pattern` (skipped when empty), `numeric`, `min`, `max` (strict decimal strings, skipped when empty).
- `validate: (context) => string | false | true | null | undefined` or an array; `context` has `field`, `value`, `values` and, inside `each`, `element` and `index`.
- `sameAs: 'otherField'` compares non-empty values and revalidates when the source changes. `dependsOn: 'a' | ['a', 'b']` revalidates custom rules when those fields change.
- `each: { ...rules }` checks every control sharing a name such as `guests[]` and marks only the failing rows.

Rules run on load and on input with the default `autoValidate: true`; with `false` they start at the first `validate()`, `revalidate()` or submit. Use `[css-error][css-filled]` in CSS to highlight only filled fields when rules run on load. `setErrors({ field: ['…'] })` adds manual errors (for server responses); they clear when the field changes unless `clearManualErrorsOnChange: false`, and on submit unless `clearErrorsOnSubmit: false`.

## What the controller does and what you do

- It sets `css-filled`, `css-error` (rename with `attributes: { filled, error }`) and `aria-invalid="true"` on controls, and focuses the first invalid control in document order after a failed submit (not after an automatic submit).
- You render messages from `state.errors`, link them with `aria-describedby`, choose live regions and style the attributes. Keep a text message; never rely on color alone.

## State and submission

- `subscribe(state => …)` runs immediately and after every change; returns an unsubscribe. `state` has `values`, `errors`, `filledFields`, `isValid`, `isValidated`, `autoSubmit`, `isSubmitting` and `submitCount`.
- `observe(name, (value, field, form, state) => …)` runs immediately and on changes, returns an unsubscribe; `watch()` is the chainable variant, `unwatch()` removes callbacks. Pass an array (`watch(['qty', 'price'], (values, changed, form, state) => …)`) for one callback over several fields; `changed` is `null` on registration and reset, and `unwatch(['qty', 'price'], cb?)` removes it.
- `onSubmit(handler, preventDefault = true)` runs only for valid submits with `(form, data, formData, state)`. Pass `false` to keep native navigation. Returned promises keep `isSubmitting` true; a rejection is logged, so catch it to show a message.
- `autoSubmit({ debounce })` (or the option) submits through the same pipeline after each change. `disableAutoSubmit()` stops it.
- `prefill(name?)` writes URL query values with `setValue()`; repeated keys become arrays; auto-submit runs once.
- `setValue(name, value)` writes and dispatches `input`, so rules, watchers and auto-submit run. Arrays check checkbox groups, select multiple options or fill `name[]` inputs in order.
- `setOptions(name, options, { keepValue = true }?)` replaces a select's options. Entries: `'x'`, `{ value, label?, disabled?, selected? }` or `{ label, options }` for an optgroup; labels are text. Keeps the value if still listed; dispatches `input` only when the value changes. Use it for dependent or loaded dropdowns instead of `append()` or `innerHTML`.
- `getValue`, `getField`, `getData` (`{ data, formData }`), `getState`, `validate(fields?)`, `revalidate(fields?)`, `clearErrors(fields?)`, `reset()`, `append({ tag, content, class?, atStart? })`.
- `reset()` and native reset buttons restore defaults, clear errors and attributes and call watchers.

## Formatting (optional peer)

With npm installs, add `@samline/formatter` to use `format({ type, field, displayField?, options? })`, `formatAll()` or the `formats` option. Types: `general`, `phone`, `numeral`, `date`, `time`, `creditCard`, `creditCardType`. The visible input is renamed to `<name>_displayed` and a hidden input named `<name>` carries the raw value that is submitted. Formatting binds after the peer loads (asynchronously). Without the peer, the call logs one error and the form keeps working. The CDN script includes the formatter.

## Lifecycle

One controller per form. Create it after the form exists; call `destroy()` when it goes away. `destroy()` removes listeners, the observer and timers, runs `addCleanup()` callbacks in reverse order and makes later writes no-ops.

- **React:** create in `useEffect` with a ref, destroy in its cleanup. Keep inputs uncontrolled or write through `setValue()`.
- **Vue:** `onMounted` / `onBeforeUnmount`. **Svelte:** `onMount` returning the cleanup.
- **Astro:** a processed client `<script>`; with view transitions create on `astro:page-load` and destroy on `astro:before-swap`.
- **Shopify / WordPress:** load the standalone script once (theme asset or `wp_register_script` dependency), bind each form from a small integration script, and destroy section controllers on `shopify:section:unload`.

For server checks reuse the same `ValidationSchema` with the DOM-free `validateValues(values, schema)` or `validateFieldValue(field, value, rules, values)`; `parseFormData(form, submitter?)` serializes without a controller. Always validate again on the server.

## Reference

- Website: https://samline.github.io/forms/
- Docs: https://samline.github.io/forms/docs/
- Examples: https://samline.github.io/forms/examples/
- Changelog: https://github.com/samline/forms/blob/main/CHANGELOG.md
