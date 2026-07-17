# `regex`

> **Heads up — this is a peer dependency.** `regex` is exported by [`@samline/formatter`](https://github.com/samline/formatter), **not** by `@samline/forms`. It only exists when `@samline/formatter` is installed in your project. The forms package does not bundle it, ship it, or declare it as a hard dependency — it is an optional peer. Importing it without installing the peer will throw a module-not-found error at build / runtime, and the page below is only meaningful when the peer is on disk.

A named dictionary of common regular expressions and their default error messages. Use it to feed the [`pattern`](../options.md#validators) rule of any field validator without hand-rolling a `RegExp` and a string for every form.

## Import

```ts
import { regex } from '@samline/formatter'
```

`@samline/formatter` is listed as an optional peer in `package.json`. If you already have it installed for the `format()` / `formatAll()` masks, the import works out of the box. If you do not, install it with:

```bash
npm install @samline/formatter
```

```bash
pnpm add @samline/formatter
```

```bash
bun add @samline/formatter
```

## Signature

```ts
const regex: Record<string, { pattern: RegExp; errorMessage: string }>
```

Each entry is keyed by a short name (`'email'`, `'url'`, `'phone'`, …) and exposes:

| Field | Type | Description |
| --- | --- | --- |
| `pattern` | `RegExp` | The expression to test the value against. |
| `errorMessage` | `string` | A human-readable message describing the failure. Use it as the default `message` for the `pattern` rule. |

The exact key set lives in the `@samline/formatter` package and can grow over time — refer to its [options reference](https://github.com/samline/formatter/blob/main/docs/options.md) for the full list. Common entries include `email`, `url`, `phone`, and `slug`.

## Parameters

None — `regex` is a plain object, not a function.

## Returns

A plain `Record<string, { pattern: RegExp; errorMessage: string }>` that you can index by name.

## Behaviour

`regex` is purely declarative data. The forms package does not call it for you — you opt in by passing `regex.<key>.pattern` (and optionally `regex.<key>.errorMessage`) into a field's `validators` config. The controller's built-in `pattern` rule then runs the expression and pushes the message when the value does not match.

`regex` works the same whether you read it directly, destructure the entries you need, or merge it into a project-wide constant. The patterns are owned by `@samline/formatter`; treat the object as read-only.

## Examples

### Validate an email with the built-in pattern

```ts
import { form } from '@samline/forms'
import { regex } from '@samline/formatter'

const contact = form('contact-form', {
  validators: {
    email: {
      required: true,
      pattern: regex.email.pattern
    }
  }
})
```

This is the same `pattern` you'd write by hand (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`); the only difference is that it ships with the formatter peer.

### Pair the pattern with the default error message

```ts
import { form } from '@samline/forms'
import { regex } from '@samline/formatter'

const signup = form('signup-form', {
  validators: {
    email: {
      required: true,
      pattern: {
        value: regex.email.pattern,
        message: regex.email.errorMessage
      }
    }
  }
})
```

When the value fails the pattern, the controller pushes `regex.email.errorMessage` into `state.errors.email` and applies the `css-error` attribute to the field — see [Validation](../options.md#validators) and [CSS styling](../css-styling.md).

### Use it without a controller

The patterns and messages are plain values, so they work the same in any validation pipeline:

```ts
import { regex } from '@samline/formatter'
import { validateFieldValue } from '@samline/forms'

const errors = validateFieldValue(
  'email',
  'not-an-email',
  { pattern: regex.email.pattern },
  {}
)

// errors = ['<default pattern message, sourced from @samline/formatter>']
```

See [`validateFieldValue`](validate-field-value.md) for the pure helper signature.

### Spread `regex` into a browser global alongside `browser`

The vanilla entrypoint exposes a `browser` singleton with `form`, `newForm`, `destroyForm`, and `available`. The most common pattern is to spread it together with `regex` into a single project global — see [Browser registry helpers](../getting-started.md#browser-registry-helpers) in the getting-started guide:

```ts
import { browser } from '@samline/forms'
import { regex } from '@samline/formatter' // optional, from your project

window.Form = { ...browser, regex }

window.Form.newForm({
  id: 'contact-form',
  options: {
    validators: {
      email: {
        required: true,
        pattern: regex.email.pattern
      }
    }
  }
})
```

The same shape is available from the IIFE bundle under `window.Forms`; the spread pattern works the same way when the project loads `@samline/forms/browser` instead.

## Edge cases

- **Missing peer.** `import { regex } from '@samline/formatter'` throws a module-not-found error when the peer is not installed. `@samline/forms` does not catch this — install the peer before you import the symbol.
- **No types are shipped by `@samline/forms` for `regex`.** The shim in [`src/types/formatter.d.ts`](../../src/types/formatter.d.ts) declares the type as `Record<string, { pattern: RegExp; errorMessage: string }>` for projects that do not yet have the peer on disk, but the real types come from the installed peer at compile time.
- **`regex` is not enumerated at runtime.** The key set lives in `@samline/formatter`; iterate with `Object.keys(regex)` if you need a dynamic listing.
- **The controller never reads `regex` for you.** You opt in per field via the `pattern` rule. There is no global switch that turns on `regex.email` for every `email` field.
- **Browser global key collision.** Spreading `{ ...browser, regex }` into `window.Form` is the documented pattern; assigning `window.Forms.regex` directly is fine too — the registry is shared across spreads.

## Related

- [`validators`](../options.md#validators) — the option that consumes `regex.<key>.pattern`.
- [`validateFieldValue`](validate-field-value.md) — the pure helper that runs the `pattern` rule.
- [`format`](format.md) — also depends on `@samline/formatter` being installed.
- [`@samline/formatter` options reference](https://github.com/samline/formatter/blob/main/docs/options.md) — the canonical list of `regex` keys.
