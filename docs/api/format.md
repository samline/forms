# `format(config)` · `formatAll(config)`

Apply an `@samline/formatter` pipeline to one or more fields inside the bound form. Chainable.

`format()` and `formatAll()` behave identically — the alias exists so the call site reads naturally when you want to apply the same configuration to several inputs. Both methods create (and own) a hidden `<input>` next to each formatted field that carries the backend-ready `raw` value, so the visible field always shows the formatted value while `FormData`/`serialize()` automatically exposes the raw value under `<fieldName>Raw`.

> **Optional peer dependency.** `@samline/formatter` is listed as an optional peer. If it is not installed in the consumer project, the methods log a single `console.error` describing the missing dependency and return the controller unchanged. The rest of the form keeps working.

---

## Signature

```ts
format(config: FieldFormatConfig): FormController
formatAll(config: FieldFormatConfig): FormController
```

## Parameters

`config` is a [`FieldFormatConfig`](../typescript.md#fieldformatconfig):

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `'general' \| 'phone' \| 'numeral' \| 'date' \| 'time' \| 'creditCard' \| 'creditCardType'` | yes | One of the supported `FormatType` values exported by `@samline/formatter`. |
| `field` | `string \| string[]` | yes | The `name` attribute of the visible input(s). `formatAll()` is just an alias for readability when `field` is an array. |
| `rawField` | `string` | no | Name of the hidden raw mirror. Defaults to `${fieldName}Raw`. |
| `options` | `Record<string, unknown>` | no | Format-specific options forwarded to `@samline/formatter`. See the [formatter options reference](https://github.com/samline/formatter/blob/main/docs/options.md). |

## Returns

The same [`FormController`](../typescript.md#formcontroller) — chainable. The method returns the controller unchanged when:

- the form has already been destroyed,
- there is no bound `HTMLFormElement`,
- `@samline/formatter` is not installed (a single `console.error` is logged in this case).

## Behaviour

1. The first `format()` call resolves the formatter peer through a lazy dynamic import. Subsequent calls reuse the cached module so the lookup cost is paid once.
2. The method looks up each `field` via the controller’s `getFieldsByName`, filters out non-text inputs (checkboxes, radios, files, submits, buttons), and attaches a delegated `input` listener on the form for every eligible field.
3. On every keystroke the listener runs the formatter and rewrites the visible input **and** the hidden raw mirror. Cursor position is preserved using a cleave-style algorithm (see [Cursor tracking](#cursor-tracking)).
4. If a hidden input already exists in the form for the same field — either with the `<fieldName>Raw` name or the `data-formatter-raw-for="<fieldName>"` attribute — `format()` reuses it instead of duplicating it. The previously authored value is preserved across `destroy()` (see [Cleanup](#cleanup)).
5. Calling `format()` twice for the same field is idempotent: the listener is bound once and the configuration is refreshed in the internal registry.

## Raw mirror semantics

Every formatted field gets a sibling hidden input that:

- has `type="hidden"`,
- is named `${fieldName}Raw` (or whatever you pass in `rawField`),
- carries `data-formatter-raw-for="<fieldName>"` so the controller can find it later,
- receives the latest `FormatterResult.raw` value on every input event.

Because the mirror is a real `<input>` inside the form, it shows up automatically in `FormData`, `serialize()`, and `api.getData()`. You can also read it via `api.getValue('<fieldName>Raw')` or `api.getField('<fieldName>Raw')`.

## Cursor tracking

The helper in [`src/core/format-helpers.ts`](../../src/core/format-helpers.ts) implements a cursor-restore algorithm modelled on cleave.js’ `getNextCursorPosition` and `postDelimiterBackspace`:

- The caret position is captured **before** the value is rewritten.
- After `FormatterResult.formatted` is written, the helper counts the number of non-format characters (digits, ASCII letters) to the left of the original caret and re-positions the caret at the same logical index in the new value, skipping delimiters.
- When the user deletes one character that sits right before a delimiter, the helper pulls the caret back one extra position to mirror cleave’s `postDelimiterBackspace` behaviour so the cursor never ends up "jumping" past a delimiter that disappeared.
- On Android, the caret restoration is deferred one animation frame via `requestAnimationFrame` to work around the IME quirk that causes the caret to land at the end on the first frame after a value rewrite.

## Cleanup

`destroy()` calls a dedicated cleanup routine that:

- removes every `input` listener registered by `format()`,
- removes hidden raw mirrors that **this** controller created (mirrors authored before `format()` was called carry no `data-formatter-raw-for` attribute and survive `destroy()`),
- clears the `formattedFields` registry so the controller can be garbage-collected.

## Examples

### Format a phone field declaratively

```ts
import { form } from '@samline/forms'

const checkout = form('checkout-form', {
  formats: {
    phone: { type: 'phone', field: 'phone', options: { country: 'MX' } }
  }
})

// The hidden mirror `<input name="phoneRaw">` is created on mount.
checkout.getValue('phoneRaw') // ''
```

### Apply a single configuration to multiple fields with `formatAll`

```ts
import { form } from '@samline/forms'

const pricing = form('pricing-form', {
  formats: {
    money: {
      type: 'numeral',
      field: ['price', 'subtotal', 'total'],
      options: { prefix: '$', delimiter: ',' }
    }
  }
})

// Three different fields, one configuration, one hidden mirror per field.
pricing.getField('priceRaw')    // <input type="hidden" name="priceRaw">
pricing.getField('subtotalRaw') // <input type="hidden" name="subtotalRaw">
pricing.getField('totalRaw')    // <input type="hidden" name="totalRaw">
```

### Wire it imperatively after mount

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')
profile.format({ type: 'date', field: 'birthday' })
profile.format({ type: 'creditCard', field: 'card' })
```

### Custom raw field name

```ts
profile.format({ type: 'phone', field: 'phone', rawField: 'phoneBackend' })
// Hidden mirror: <input type="hidden" name="phoneBackend">
```

### Fallback when the peer is missing

```ts
// @samline/formatter is NOT installed
const profile = form('profile-form')
profile.format({ type: 'phone', field: 'phone' })
// console.error:
//   [samline/forms] The `format()` and `formatAll()` methods require the
//   @samline/formatter package. Install it with: npm i @samline/formatter ...
// profile.format(...) still returned the controller, so chaining works.
profile.setValue('phone', '...').validate()
```

## Edge cases

- **Non-text inputs are skipped.** `format()` ignores checkboxes, radios, files, submit buttons, and buttons. Calling it for one of those field names is a no-op (no listener, no mirror).
- **Same field across multiple controllers.** Each `FormController` instance owns its own mirrors, so two controllers bound to different forms can format a `phone` field without the raw inputs colliding.
- **Field pre-filled from the server.** If the visible field already carries a value when `format()` runs, the formatter is applied immediately and the mirror is populated without waiting for the next keystroke.
- **`setValue()` compatibility.** The controller’s delegated event listener treats hidden inputs as regular fields for change notifications; since `format()` mirrors are named `<field>Raw`, they appear naturally in `FormData`/`serialize()`.
- **`destroy()` is idempotent.** Calling `destroy()` after `format()` was never wired leaves the form untouched; calling it after `format()` was wired removes only the mirrors owned by the current controller.

## Related

- [`getValue`](get-value.md) — read either the formatted or the raw value.
- [`getField`](get-field.md) — grab the underlying DOM elements (visible field and hidden mirror).
- [`destroy`](destroy.md) — releases listeners, the mutation observer, and owned raw mirrors.
- [Optional peer dependency `@samline/formatter`](https://github.com/samline/formatter)