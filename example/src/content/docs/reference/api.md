---
title: API reference
description: Method-by-method reference for @samline/forms.
template: doc
sidebar:
  order: 3
---

Every public method is listed here, grouped by lifecycle. Most methods are chainable and return the same `FormController`. Focused pages cover [native control behavior](/forms/reference/controls/), [accessible validation](/forms/guides/validation-and-errors/), and [formatting lifecycle](/forms/guides/formatting/) without hiding those contracts outside the site.

:::tip[Reading the signatures]
Methods that return data (rather than the controller) end in a different return type — for example `getValue()` returns `FormFieldValue`, `subscribe()` returns an unsubscribe function. Chainable methods all return `FormController`.
:::

## Lifecycle

- [`form(target, options?)`](#formtarget-options) — bind a controller to an `HTMLFormElement`. The main entry point.
- [`createFormController(target, options?)`](#createformcontrollertarget-options) — underlying controller factory.
- [`element`](#element) — the bound form (`f` is an alias).
- [`options`](#options) — normalized controller options, including defaults and merged attributes.
- [`reset()`](#reset) — restore native form values and clear errors.
- [`destroy()`](#destroy) — tear down listeners, observer, and caches.

## Registry helpers (vanilla)

- [`browser`](#browser) — module-level singleton that wraps `form()` with `newForm` / `destroyForm` / `available`. Mirrors the IIFE surface without auto-installing a global.
- [`browser.newForm`](#browsernewform) — build + register a controller under `browser.available[id]`.
- [`browser.destroyForm`](#browserdestroyform) — destroy + unregister a controller by id.
- [`browser.available`](#browseravailable) — registry of active controllers keyed by id.

## Submission

- [`onSubmit(callback, preventDefault?)`](#onsubmitcallback-preventdefault) — register a submit handler.
- [`autoSubmit(options?)`](#autosubmitoptions) — enable submit-on-change with optional debounce.
- [`disableAutoSubmit()`](#disableautosubmit) — turn auto-submit off and cancel pending debounce.

## Field observation

- [`watch(field, callback)`](#watchfield-callback) — chainable field observation.
- [`observe(field, callback)`](#observefield-callback) — like `watch`, but returns an unsubscribe function.
- [`unwatch(field?, callback?)`](#unwatchfield-callback) — remove watched callbacks.
- [`subscribe(listener)`](#subscribelistener) — react to controller notification points.

## Field values

- [`setValue(name, value)`](#setvaluename-value) — write a value into a field.
- [`getValue(name)`](#getvaluename) — read the current value of a field.
- [`getField(name)`](#getfieldname) — read the underlying DOM element(s).
- [`prefill(fieldName?)`](#prefillfieldname) — populate the form from `window.location.search`.
- [`format(config)`](#formatconfig) — apply `@samline/formatter` to a field.
- [`formatAll(config)`](#formatallconfig) — alias of `format()` for `field: string[]` use cases.

## Validation

- [`validate(fields?)`](#validatefields) — run validation, return the result.
- [`revalidate(fields?)`](#revalidatefields) — alias of `validate` with explicit intent.
- [`setErrors(fields)`](#seterrorsfields) — push manual errors.
- [`clearErrors(fields?)`](#clearerrorsfields) — clear manual errors.

## State and data

- [`getData()`](#getdata) — return plain object + `FormData` for the form.
- [`getState()`](#getstate) — return a snapshot of values, errors, and metadata.
- [`append(options)`](#appendoptions) — inject a DOM node into the form.

## Pure helpers

These do not require a controller. They accept plain values or a raw `HTMLFormElement` and return results — safe to tree-shake into any bundle.

- [`parseFormData(formElement, submitter?)`](#parseformdataformelement-submitter) — same serializer used internally, no controller needed.
- [`validateValues(values, schema)`](#validatevaluesvalues-schema) — run a schema against a values map.
- [`validateFieldValue(field, value, rules, values)`](#validatefieldvaluefield-value-rules-values) — run a rule set against a single value.

---

## Per-method reference

### Lifecycle

#### `form(target, options?)`

Creates a new controller bound to a form. This is the main entry point of `@samline/forms`.

```ts
function form(
  target: FormTarget,
  options?: FormControllerOptions
): FormController
```

- `target` — string id, `HTMLFormElement`, ref-like `{ current }` object, or `null`/`undefined`.
- `options` — controller configuration. See [Configuration](/forms/reference/configuration/).

On creation the controller wires delegated `input` and `submit` listeners, including support for controls associated through `form="id"`, starts a `MutationObserver` on the form subtree, optionally enables `autoSubmit`, and runs an initial validation pass when `autoValidate` is enabled.

An unresolved id, non-form element, `null`, or empty ref still returns an inert controller. Its `element` is `null`, reads return empty/missing values, and chainable writes are no-ops. String ids and ref-like values are resolved only once; create a new controller after the element mounts. Avoid binding multiple controllers to one form because each installs its own listeners.

#### `createFormController(target, options?)`

The underlying factory used by `form()`. It accepts the same arguments and returns the same `FormController`; use it when the explicit factory name reads better in framework integrations.

#### `element`

Read-only getter for the bound `HTMLFormElement`, or `null` if the binding target was unresolved at construction time. `f` is an alias kept short for fluent setup.

```ts
readonly element: HTMLFormElement | null
readonly f: HTMLFormElement | null
```

#### `options`

Read-only normalized `FormControllerOptions`. The controller creates a merged options object, and `attributes` always contains both resolved attribute names.

```ts
readonly options: FormControllerOptions
```

#### `reset()`

Restores native and formatted default values, clears manual and validation errors plus `aria-invalid`, then notifies subscribers. It dispatches no `input` events, does not invoke field watchers, does not disable auto-submit, and does not reset `submitCount`. When the controller is already validated, filled attributes are recalculated immediately from default values.

#### `destroy()`

Removes all controller listeners, disconnects the observer, cancels pending auto-submit, drops callbacks, clears stored errors, and cleans up formatter ownership. Formatted visible names are restored and only controller-created raw mirrors are removed. Existing visual attributes are not stripped. Public methods remain callable, including direct reads and writes, but controller listeners no longer react to resulting events. Calling `destroy()` more than once is safe.

### Submission

#### `onSubmit(callback, preventDefault?)`

Registers a handler that runs when the form is submitted and validation passes. Multiple handlers can be registered; each runs in registration order.

```ts
onSubmit(
  callback: FormSubmitHandler,
  preventDefault?: boolean  // default: true
): FormController
```

The submit pipeline clears manual errors when configured, validates, synchronizes `aria-invalid`, increments `submitCount`, and invokes every handler in registration order when valid. Invalid submissions are always intercepted and focus moves to the first focusable invalid field. If any valid-submit handler uses the default `preventDefault: true`, the event is prevented for all handlers. Handler return values and promises are ignored; async work does not delay native navigation when every handler opts out of prevention. There is no per-handler unsubscribe method; `destroy()` clears all handlers. A successful named submit button contributes its name/value to fresh `data` and `formData` values.

#### `autoSubmit(options?)`

Enables native auto-submit. Every handled input schedules `form.requestSubmit()` (or the package's submit fallback). Pass `{ debounce: ms }` to delay. Auto-submit itself does not validate; validation occurs when the resulting submit event enters the normal pipeline. Disabling or destroying cancels pending timers, and re-enabling uses only the newly supplied debounce.

```ts
autoSubmit(options?: boolean | AutoSubmitOptions): FormController
```

#### `disableAutoSubmit()`

Turns auto-submit off and cancels any pending debounce timer. Equivalent to `autoSubmit(false)`.

### Field observation

#### `watch(field, callback)`

Chainable field observer. When a form is bound, the callback fires immediately and after matching handled input events; an inert controller stores the callback without an initial call. DOM mutations alone do not invoke field watchers. `watch()` returns the controller instead of an unsubscribe function.

#### `observe(field, callback)`

Like `watch`, but returns an idempotent unsubscribe function. The callback receives `(value, field, form, state)` after error clearing, validation, and visual synchronization for the input event, but before whole-form subscribers are notified.

#### `unwatch(field?, callback?)`

Removes watched callbacks. Three overloads: no args (clear all), `field` only (clear all for that field), or `field` + `callback` (clear one specific watcher).

#### `subscribe(listener)`

Registers a listener that always fires immediately and returns an unsubscribe function. Notifications occur for handled input, `setValue`, manual-error changes, reset, auto-submit toggles, submit attempts, and observed DOM mutations. Direct `validate()` / `revalidate()` calls update validation state but do not independently notify subscribers.

### Field values

#### `setValue(name, value)`

Writes a value and dispatches one bubbling `input` event from the first matching field, so the controller pipeline runs once. Returns the controller unchanged when the field does not exist.

Control-specific checkbox, radio, file, multi-select, repeated-name, and `[]` behavior is specified in the [form-control matrix](/forms/reference/controls/#writing-values).

#### `getValue(name)`

Returns the normalized value of a field: `string`, `string[]`, `File[]`, or `undefined`.

The exact scalar/array behavior differs for radio groups, checkbox groups, multiple selects, files, repeated bare names, and `[]` names. See the [reading values matrix](/forms/reference/controls/#reading-values).

#### `getField(name)`

Returns the underlying DOM field(s) for a given name: a single `FormFieldElement`, an array (for repeated names like radio/checkbox groups), or `null`.

#### `prefill(fieldName?)`

Populates the form (or one field) from `window.location.search`. Values are strings and each query entry delegates to `setValue`, so normal event effects apply. Repeated query keys are not aggregated; they are written in URL order and later scalar writes can replace earlier state. In non-DOM environments it is a no-op.

#### `format(config)`

Apply an `@samline/formatter` pipeline to one or more input/textarea fields. The method synchronously creates the canonical/display pair, returns the controller immediately, then asynchronously loads and binds the peer. A custom `displayField` works only for one field; arrays derive `<field>_displayed` separately. Selects and hidden visible targets are unsupported. Read the complete [formatting lifecycle and mirror contract](/forms/guides/formatting/).

:::caution[Optional peer dependency]
Module builds treat `@samline/formatter` as optional. A missing peer logs one cached `console.error` and asynchronously rolls back fields from that call. The global IIFE bundles the formatter and does not require a separate install.
:::

Initial server-rendered values are normalized after the peer loads with automatic raw/display interpretation unless `interpretInputAs` is explicitly configured. See [server-prefilled values](/forms/guides/formatting/#server-prefilled-values).

#### `formatAll(config)`

Alias of `format()` for readability when `field` is `string[]`.

### Validation

#### `validate(fields?)`

Runs configured rules and returns merged validation plus manual errors. With a field list, existing validation errors for other fields remain. Names without rules have their prior validation errors removed. The method marks the form as validated and synchronizes visual attributes, but does not independently notify subscribers. See [validation semantics](/forms/guides/validation-and-errors/#built-in-rule-behavior).

#### `revalidate(fields?)`

Alias of `validate` kept separate for readability at call sites that want to express "re-run validation now".

#### `setErrors(fields)`

Pushes manual errors into the form. Two overloads: array form (`string[]`, default message "Invalid value.") and map form (`FormErrors`, custom messages per field).

#### `clearErrors(fields?)`

Removes manual errors. Validation errors from rules are not touched. Visual attributes are re-synced for the affected fields.

### State and data

#### `getData()`

Returns fresh `{ data, formData }` values. Native successful-control rules apply, repeated names become arrays in `data`, and empty file placeholders are removed. Files remain `File` objects. See [serialization differences](/forms/reference/controls/#serialization-differs-from-field-reads).

#### `getState()`

Returns a fresh snapshot: `{ values, errors, filledFields, isValid, isValidated, autoSubmit, submitCount }`. It is a pure read and does not validate or notify. `isValid` only means the currently stored merged error map is empty, so an unvalidated form may appear valid.

#### `append(options)`

Creates a node and assigns `content` to `innerHTML`; sanitize untrusted content. When `class` is present, the first existing descendant matching its first class token is removed. The method clears the field cache but does not validate, notify subscribers, or schedule auto-submit. Appended nodes survive `reset()` and `destroy()`. Returns the node or `null` for an inert controller.

```ts
const banner = controller.append({ tag: 'p', content: '', class: 'status' })
if (banner) banner.textContent = untrustedMessage // safe text-only alternative
```

### Pure helpers

#### `parseFormData(formElement, submitter?)`

```ts
function parseFormData(
  formElement: HTMLFormElement,
  submitter?: HTMLElement | null
): SerializedFormResult
```

Same serializer the controller uses internally. Pass the successful submit button to include its name/value. Repeated names become arrays, empty file placeholders are filtered, and reserved names such as `constructor` and `__proto__` remain ordinary own properties. This helper has no validation or controller side effects.

#### `validateValues(values, schema)`

```ts
function validateValues(
  values: FormValues,
  schema: ValidationSchema
): ValidationResult
```

Runs every exact schema key against a values map. Returns `{ isValid, errors }` without DOM or controller side effects. Wildcard schema keys are not expanded.

#### `validateFieldValue(field, value, rules, values)`

```ts
function validateFieldValue(
  field: string,
  value: FormFieldValue,
  rules: FieldValidationRules,
  values: FormValues
): string[]
```

Runs every built-in and custom rule against one value and returns all messages. Pattern checks skip empty values; `sameAs` compares two non-empty values; custom validators still run. This pure helper does not track dependencies. See the [rule behavior table](/forms/guides/validation-and-errors/#built-in-rule-behavior).

### Registry helpers (vanilla)

The vanilla entrypoint exports a `browser` singleton with the same shape as the IIFE bundle's `window.Forms` — but as a plain ESM value with no `globalThis` side-effect. Use it from a bundler when you want the registry ergonomics without the IIFE.

#### `browser`

```ts
const browser: FormsApi
```

Module-level singleton. Exposes `form`, `newForm`, `destroyForm`, and `available`. Spread it into your own globals (`{ ...browser, regex }`) or call its methods directly. The registry is shared across spreads, so `window.Form.available` and `browser.available` always point to the same object. See the [Browser registry helpers](/forms/getting-started/#browser-registry-helpers-bundler) section in the getting-started guide and [`FormsApi`](/forms/reference/typescript/#formsapi) for the exact shape.

#### `browser.newForm`

Build a controller via `browser.form(id, options)` and store it in `browser.available[id]`. An existing controller under the id is destroyed before replacement. A missing id logs `Form ID is required` and returns `undefined`.

```ts
const contact = browser.newForm({
  id: 'contact-form',
  options: {
    validators: { email: { required: true } }
  }
})
```

#### `browser.destroyForm`

Look up `browser.available[id]`, call `destroy()`, and delete the entry. A missing id logs an error; an absent entry logs a warning.

```ts
browser.destroyForm('contact-form')
```

#### `browser.available`

Shared mutable registry: `{ [id: string]: FormController }`. Prefer `newForm()` and `destroyForm()` to manage it.

```ts
for (const controller of Object.values(browser.available)) {
  controller.validate()
}
```

For an equivalent surface in a no-bundler setup, see the [Browser global reference](/forms/reference/browser/).

### External integration

#### `regex` from `@samline/formatter`

:::caution[Optional peer dependency]
Exported by [`@samline/formatter`](https://github.com/samline/formatter), not by `@samline/forms`. Install the peer before importing.
:::

A named dictionary of common regular expressions and their default error messages, intended to feed the `pattern` rule of any field validator. Full reference, examples, and edge cases live in the dedicated [`regex`](/forms/reference/regex/) page — do not redeclare hand-rolled patterns when the peer is on disk.
