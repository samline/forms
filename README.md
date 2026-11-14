# @samline/forms

Validation, reactive state, serialization and auto-submit for native HTML forms, with a typed, framework-free API for JavaScript and TypeScript.

[Demo](https://samline.github.io/forms/) · [Examples](https://samline.github.io/forms/examples/) · [Documentation](https://samline.github.io/forms/docs/) · [Changelog](CHANGELOG.md)

## Table of contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [HTML / CDN](#html--cdn)
- [Capabilities](#capabilities)
- [API at a glance](#api-at-a-glance)
- [Documentation](#documentation)
- [Changelog](#changelog)
- [AI agent skill](#ai-agent-skill)
- [License](#license)

## Installation

```sh
npm install @samline/forms
```

```sh
pnpm add @samline/forms
```

```sh
bun add @samline/forms
```

Requires Node 20+ when bundling; the runtime targets ES2020 browsers. Formatting needs the optional peer `@samline/formatter` (`npm install @samline/formatter`); validation, state and serialization do not. No runtime stylesheet is required; the application owns form styling.

## Quick start

Keep a native form with named fields. `novalidate` lets the controller's rules replace the browser's bubbles.

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
  autoValidate: false,
  validators: {
    email: {
      required: { value: true, message: 'Enter your email.' },
      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Use a valid email.' },
    },
  },
})

signup.subscribe(state => {
  document.querySelector('#email-error').textContent = state.errors.email?.[0] ?? ''
})

signup.onSubmit(async (_element, _data, formData) => {
  await fetch('/api/signup', { method: 'POST', body: formData })
  signup.reset()
})

// When the form goes away (route change, component unmount):
// signup.destroy()
```

Invalid submits are always prevented and focus moves to the first invalid field. Valid submits reach every `onSubmit()` handler with a plain object, a fresh `FormData` and a state snapshot.

## HTML / CDN

The standalone build defines `window.Forms` and already includes `@samline/formatter`. Pin the version.

```html
<script src="https://unpkg.com/@samline/forms@2.11.1/dist/browser/global.global.js"></script>
<script>
  const signup = window.Forms.form('signup', {
    validators: { email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ } },
  })
</script>
```

`window.Forms` has `form`, `newForm({ id, options })`, `destroyForm(id)` and the `available` registry. See [Browser global and CDN](https://samline.github.io/forms/docs/reference/browser/).

## Capabilities

- **Validation rules:** `required`, `minLength`, `maxLength`, `pattern`, `numeric`, `min`, `max`, `sameAs`, `dependsOn`, per-row `each` and custom validators that read every value.
- **Accessible state:** invalid controls get `aria-invalid` and `css-error`, filled ones `css-filled`; a failed submit focuses the first invalid control in document order.
- **Reactive state:** `subscribe()` for the whole form, `observe()`/`watch()` for one field.
- **Submission:** promise-aware `onSubmit()`, `autoSubmit()` with debounce, `setErrors()` for server responses, `prefill()` from the URL and `reset()`.
- **Native controls:** checkbox groups, radios, multiple selects, files, repeated `name[]` inputs and controls linked with `form="id"`, including fields added later.
- **Formatting:** `format()`, `formatAll()` and the `formats` option format phones, cards, dates, times and amounts while a hidden field submits the raw value.
- **DOM-free helpers:** `validateValues()` and `validateFieldValue()` run the same rules on the server; `parseFormData()` serializes any form.

### Lifecycle

One controller owns one form's listeners, `MutationObserver` and auto-submit timer. Create it once the form exists and call `destroy()` when it goes away. `addCleanup()` ties your own teardown to the same lifetime. After `destroy()`, writes and new registrations are no-ops.

## API at a glance

| API                                               | Purpose                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `form(target, options?)`                          | Create a controller for an id, `HTMLFormElement` or `{ current }`. |
| `createFormController(target, options?)`          | The same factory under its descriptive name.                       |
| `browser`                                         | `{ form, newForm, destroyForm, available }` registry singleton.    |
| `parseFormData(form, submitter?)`                 | Serialize a form into `{ data, formData }`.                        |
| `validateValues(values, schema)`                  | Validate a plain values object against a `ValidationSchema`.       |
| `validateFieldValue(field, value, rules, values)` | Validate one value.                                                |
| `@samline/forms/browser`                          | The registry as a module namespace; also sets `globalThis.Forms`.  |
| `@samline/forms/browser/global`                   | The standalone IIFE that defines `window.Forms`.                   |

### Entrypoints

| Entrypoint                      | When to use                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `@samline/forms`                | Controller factory, pure validation/serialization helpers and types for ESM or CommonJS. |
| `@samline/forms/browser`        | Module registry that also installs `globalThis.Forms`.                                   |
| `@samline/forms/browser/global` | Standalone script with `window.Forms` and the bundled formatter.                         |

### Controller methods

| Group      | Methods                                                                         |
| ---------- | ------------------------------------------------------------------------------- |
| Submission | `onSubmit`, `autoSubmit`, `disableAutoSubmit`                                   |
| Validation | `validate`, `revalidate`, `setErrors`, `clearErrors`                            |
| State      | `subscribe`, `observe`, `watch`, `unwatch`, `getState`                          |
| Values     | `setValue`, `setOptions`, `getValue`, `getField`, `getData`, `prefill`, `reset` |
| Formatting | `format`, `formatAll`                                                           |
| Lifecycle  | `element`, `f`, `options`, `append`, `addCleanup`, `destroy`                    |

### Options

`validators`, `autoValidate` (default `true`), `autoSubmit`, `clearErrorsOnSubmit` (default `true`), `clearManualErrorsOnChange` (default `true`), `attributes` (default `{ filled: 'css-filled', error: 'css-error' }`) and `formats`. Every option is described in [Configuration options](https://samline.github.io/forms/docs/reference/configuration/); every type is exported, see the [TypeScript reference](https://samline.github.io/forms/docs/reference/typescript/).

## Documentation

Read the [documentation](https://samline.github.io/forms/docs/) for the full guides and API contracts, and explore [working examples](https://samline.github.io/forms/examples/) with complete and separate source files for both loading modes.

| Guide                                                                                     | What it covers                                              |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [Get started](https://samline.github.io/forms/docs/getting-started/)                      | Installation, the first form, CDN use and cleanup.          |
| [Examples](https://samline.github.io/forms/docs/guides/examples/)                         | Twelve live forms with their code.                          |
| [Validation and errors](https://samline.github.io/forms/docs/guides/validation/)          | Every rule, cross-field checks and accessible messages.     |
| [State and submission](https://samline.github.io/forms/docs/guides/state-and-submission/) | Subscribers, async submits, auto-submit, prefill and reset. |
| [Formatting fields](https://samline.github.io/forms/docs/guides/formatting/)              | The optional formatter and the hidden raw mirror.           |
| [Framework integrations](https://samline.github.io/forms/docs/guides/frameworks/)         | React, Vue, Svelte, Astro, Shopify and WordPress.           |
| [API reference](https://samline.github.io/forms/docs/reference/api/)                      | Every method, grouped by task, with one page per method.    |

## Changelog

Read [CHANGELOG.md](CHANGELOG.md) or the [published changelog](https://samline.github.io/forms/docs/changelog/) for release history and explicitly marked breaking and behavior changes. Review the notes before upgrading.

### Upgrading to 2.8

2.8.0 removes no API. Review these behavior fixes before upgrading: `prefill()` writes repeated query keys as arrays and auto-submits once; native reset buttons now clear errors and attributes; `reset()` calls watchers; failed submits focus the first invalid control in document order and automatic submits never move focus; methods called after `destroy()` no longer change the form; rejected async submit handlers are logged. The Markdown `docs/` folder is no longer published to npm; the documentation lives on the website. The optional `@samline/formatter` peer now requires `^2.1.0`, which the standalone script bundles. Read the [2.8.0 notes](CHANGELOG.md).

## AI agent skill

<a id="agent-integration"></a>

The [Forms skill](https://samline.github.io/forms/skills/forms/SKILL.md) describes 2.8 integration: loading modes, validation rules and accessible messages, state and submission, formatting and host ownership. Pass it to an agent or install it using a skills-compatible tool. Verify the installed package version before applying its guidance.

The maintained [repository source](skills/forms/SKILL.md) and website download are the same file.

Download [SKILL.md](https://samline.github.io/forms/skills/forms/SKILL.md) into a `forms/` folder in your agent's supported skill directory. For agents that discover project skills from `.agents/skills/`:

```sh
mkdir -p .agents/skills/forms
curl --fail --location https://samline.github.io/forms/skills/forms/SKILL.md \
  --output .agents/skills/forms/SKILL.md
```

When working from this repository, copy `skills/forms/SKILL.md` instead. Keep the filename `SKILL.md`; discovery paths and invocation syntax depend on the agent.

## License

MIT — [LICENSE.md](LICENSE.md).
