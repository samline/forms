# `format(config)` · `formatAll(config)`

Apply an `@samline/formatter` pipeline to one or more fields inside the bound form. Chainable.

`format()` and `formatAll()` behave identically — the alias exists so the call site reads naturally when the caller wants to apply the same configuration to several inputs.

## The mirror convention

A formatted field is exposed as a pair of inputs:

| Role | `name` | `type` | Value |
| --- | --- | --- | --- |
| **Canonical** (the one the backend reads) | `<field>` | `hidden` | The raw value |
| **Display** (what the user types) | `<field>_displayed` | `text` / `tel` / `…` | The formatted value |

You write the HTML with the canonical name only — `<input name="phone" />`. The first time `format()` runs for that field it renames the visible from `phone` to `phone_displayed` and creates a hidden sibling with `name="phone"` that carries the raw value. The rename is idempotent and the hidden is reused (not duplicated) on re-binding.

After the rename both names are first-class in the controller's API:

| API call | Effect |
| --- | --- |
| `getValue('phone')` | Returns the **raw** value. |
| `getValue('phone_displayed')` | Returns the **formatted** value. |
| `getField('phone')` | Returns the **hidden** raw mirror element. |
| `getField('phone_displayed')` | Returns the **visible** input element. |
| `setValue('phone', x)` | Writes the raw; the visible is reformatted automatically. |
| `setValue('phone_displayed', x)` | Writes the formatted; the raw is recomputed automatically. |
| `watch('phone', cb)` | `cb` receives the raw value on every keystroke. |
| `watch('phone_displayed', cb)` | `cb` receives the formatted value on every keystroke. |
| `getData()` | The `FormData` carries both `phone` and `phone_displayed`. |
| `validators.phone` | Validates the **raw** value (the one the backend gets). |

This is the orthogonal model: every name is a real, queryable slot. You never need to know which is the "real" one — each method returns the value of the name you asked for.

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
| `field` | `string \| string[]` | yes | The **canonical** name of the field — the one the backend reads. The visible you authored in the HTML should already have this name (or the display name, see [Pre-authoring the visible](#pre-authoring-the-visible) below). |
| `displayField` | `string` | no | Name of the visible input that displays the formatted value. Defaults to `${fieldName}_displayed`. |
| `options` | `Record<string, unknown>` | no | Format-specific options forwarded to `@samline/formatter`. See the [formatter options reference](https://github.com/samline/formatter/blob/main/docs/options.md). |

## Returns

The same [`FormController`](../typescript.md#formcontroller) — chainable. The method returns the controller unchanged when:

- the form has already been destroyed,
- there is no bound `HTMLFormElement`,
- `@samline/formatter` is not installed (a single `console.error` is logged in this case, and the visible's name is restored to its canonical form so the form goes back to its original state),
- no field matches `field` (or the display name) in the form.

## Behaviour

1. The sync part of `format()` renames the visible from the canonical name to the display name and creates / reuses the hidden raw mirror. The controller's API (`getValue`, `getField`, `setValue`, `watch`, `getData`) is fully functional for the field by the time `format()` returns.
2. The async part loads the formatter peer through a lazy dynamic import. Subsequent calls reuse the cached module so the lookup cost is paid once. If the peer loads, the input listener is bound and the formatter is applied to the current value of the visible (pre-filled data, server-rendered values, etc.) so the hidden mirror is populated without waiting for a user keystroke. If the peer fails to load, the rename is rolled back.
3. On every keystroke the capture-phase listener runs the formatter and rewrites the visible input **and** the hidden raw mirror. The capture-phase registration guarantees the mirror is up to date before the controller's delegated handler fires, so `watch('phone', cb)` callbacks receive the new raw value on the same tick.
4. Cursor position is preserved using a cleave-style algorithm (see [Cursor tracking](#cursor-tracking)).
5. If a hidden input already exists in the form for the same canonical name — either with the `data-formatter-raw-for="<field>"` attribute or as a plain `<input type="hidden" name="<field>">` — `format()` reuses it instead of duplicating it. The previously authored value is preserved across `destroy()` (see [Cleanup](#cleanup)).
6. Calling `format()` twice for the same canonical name is idempotent: the listener is bound once and the configuration is refreshed in the internal registry.

## Pre-authoring the visible

The default flow is: write `<input name="phone" />` and let `format()` rename it to `phone_displayed`. If you'd rather keep the visible's name stable in your HTML, pre-author it with the display name:

```html
<input name="phone_displayed" />
<form id="checkout">…</form>
```

```ts
form('checkout', { formats: { phone: { type: 'phone', field: 'phone' } } })
```

`format()` will pick up `<input name="phone_displayed">` as the visible, leave its name alone, and create the hidden with `name="phone"`. Both authoring styles end up with the same DOM.

## Hidden mirror semantics

Every formatted field gets a sibling hidden input that:

- has `type="hidden"`,
- is named with the canonical `<field>` (the one the backend reads),
- carries `data-formatter-raw-for="<field>"` so the controller can identify it as owned and clean it up on `destroy()`,
- receives the latest `FormatterResult.raw` value on every input event.

Because the mirror is a real `<input>` inside the form, it shows up automatically in `FormData`, `serialize()`, and `api.getData()`. You can also read or write it via the canonical name in every controller API method.

## Cursor tracking

The helper in [`src/core/format-helpers.ts`](../../src/core/format-helpers.ts) implements a cursor-restore algorithm modelled on cleave.js' `getNextCursorPosition` and `postDelimiterBackspace`:

- The caret position is captured **before** the value is rewritten.
- After `FormatterResult.formatted` is written, the helper counts the number of non-format characters (digits, ASCII letters) to the left of the original caret and re-positions the caret at the same logical index in the new value, skipping delimiters.
- When the user deletes one character that sits right before a delimiter, the helper pulls the caret back one extra position to mirror cleave's `postDelimiterBackspace` behaviour so the cursor never ends up "jumping" past a delimiter that disappeared.
- On Android, the caret restoration is deferred one animation frame via `requestAnimationFrame` to work around the IME quirk that causes the caret to land at the end on the first frame after a value rewrite.

## Cleanup

`destroy()` calls a dedicated cleanup routine that:

- removes the `input` listener registered by `format()` (capture-phase, matched on registration),
- restores the visible's name to the canonical form so the DOM goes back to the developer's authored state,
- removes hidden raw mirrors that **this** controller created (mirrors authored before `format()` was called carry no `data-formatter-raw-for` attribute and survive `destroy()`),
- clears the `formattedFields` registry so the controller can be garbage-collected.

## Reading both values in one place

If a watcher needs the raw and the formatted at the same time, the orthogonal model makes that cheap:

```ts
checkout.watch('phone', (raw, _field, _form, state) => {
  const formatted = state.values.phone_displayed
  // raw is the canonical value, formatted is what the user sees.
  console.log({ raw, formatted })
})
```

Both `state.values.phone` and `state.values.phone_displayed` are populated on every keystroke — pick whichever you need.

## Examples

### Format a phone field declaratively

```ts
import { form } from '@samline/forms'

const checkout = form('checkout-form', {
  formats: {
    phone: { type: 'phone', field: 'phone', options: { country: 'MX' } }
  }
})

// After `format()` runs (sync part):
//   - the visible is now <input name="phone_displayed">
//   - the hidden is <input type="hidden" name="phone">
checkout.getValue('phone')           // '' (no user input yet)
checkout.getValue('phone_displayed') // ''
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

// Three different fields, one configuration, one pair per field.
pricing.getField('price_displayed')     // visible
pricing.getField('price')               // hidden raw mirror
pricing.getField('subtotal_displayed')  // visible
pricing.getField('subtotal')            // hidden raw mirror
pricing.getField('total_displayed')     // visible
pricing.getField('total')               // hidden raw mirror
```

### Wire it imperatively after mount

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')
profile.format({ type: 'date', field: 'birthday' })
profile.format({ type: 'creditCard', field: 'card' })
```

### Custom display name

```ts
profile.format({ type: 'phone', field: 'phone', displayField: 'phoneVisible' })

// After `format()` runs:
//   - visible: <input name="phoneVisible">
//   - hidden:  <input type="hidden" name="phone">
```

### React to keystrokes on either name

```ts
const checkout = form('checkout-form', {
  formats: { phone: { type: 'phone', field: 'phone' } }
})

// Both watchers fire on the same keystroke. Each receives the
// value of the name it was registered against.
checkout.watch('phone', raw => console.log('backend value:', raw))
checkout.watch('phone_displayed', formatted => console.log('user sees:', formatted))
```

### Read both values at submit time

```ts
checkout.onSubmit((_form, data, formData) => {
  // data and formData carry both names:
  //   phone           = '5512345678'           (raw)
  //   phone_displayed = '55 1234 5678'         (formatted)
  // The backend only needs `phone`.
  fetch('/api/checkout', { method: 'POST', body: formData })
})
```

### Fallback when the peer is missing

```ts
// @samline/formatter is NOT installed
const profile = form('profile-form')
profile.format({ type: 'phone', field: 'phone' })
// console.error:
//   [samline/forms] The `format()` and `formatAll()` methods require the
//   @samline/formatter package. Install it with: npm i @samline/formatter ...
// The visible is left with its original name (`phone`), no hidden
// mirror is created, no listener is bound — the form is exactly
// as the developer authored it. `profile.format(...)` still
// returned the controller, so chaining works.
profile.setValue('phone', '...').validate()
```

## Edge cases

- **Non-text inputs are skipped.** `format()` ignores checkboxes, radios, files, submit buttons, and buttons. Calling it for one of those field names is a no-op (no listener, no mirror).
- **Same field across multiple controllers.** Each `FormController` instance owns its own mirrors, so two controllers bound to different forms can format a `phone` field without the raw inputs colliding.
- **Field pre-filled from the server.** If the visible field already carries a value when `format()` runs, the formatter is applied immediately (after the peer resolves) and the mirror is populated without waiting for a user keystroke.
- **`setValue('phone', x)` and `setValue('phone_displayed', x)` both reformat the other side.** Each `setValue` writes its target, dispatches a synthetic `input` event, and the capture-phase listener reformats the partner.
- **`validators.phone` runs against the raw value.** The raw is the value the backend ultimately receives, so the validator is the gatekeeper for backend acceptance.
- **`destroy()` is idempotent.** Calling `destroy()` after `format()` was never wired leaves the form untouched; calling it after `format()` was wired removes only the mirrors owned by the current controller and restores the visible's name.

## Related

- [`getValue`](get-value.md) — read either the formatted or the raw value (orthogonal).
- [`getField`](get-field.md) — grab the underlying DOM elements (visible or hidden).
- [`setValue`](set-value.md) — write either the raw or the formatted value (the other side is reformatted automatically).
- [`watch`](watch.md) / [`observe`](observe.md) — react to changes on either name; each callback receives the value of the name it was registered against.
- [`getData`](get-data.md) — the serialized payload carries both names.
- [`destroy`](destroy.md) — releases listeners, the mutation observer, owned raw mirrors, and restores the visible's name.
- [Optional peer dependency `@samline/formatter`](https://github.com/samline/formatter)
