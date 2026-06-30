---
title: API reference
description: Method-by-method reference for @samline/forms.
template: doc
sidebar:
  order: 3
---

Every public method is listed here, grouped by lifecycle. Most methods are chainable and return the same `FormController`. Click into the per-method pages of the project repository for the full signature, parameter table and runnable example.

:::tip[Reading the signatures]
Methods that return data (rather than the controller) end in a different return type — for example `getValue()` returns `FormFieldValue`, `subscribe()` returns an unsubscribe function. Chainable methods all return `FormController`.
:::

## Lifecycle

- [`form(target, options?)`](#formtarget-options) — bind a controller to an `HTMLFormElement`. The main entry point.
- [`element`](#element) — the bound form (`f` is an alias).
- [`reset()`](#reset) — restore native form values and clear errors.
- [`destroy()`](#destroy) — tear down listeners, observer, and caches.

## Registry helpers (vanilla)

- [`browser`](#browser) — module-level singleton that wraps `form()` with `newForm` / `destroyForm` / `available`. Mirrors the IIFE surface without auto-installing a global.
- [`browser.newForm`](#browsernewform) — build + register a controller under `browser.available[id]`.
- [`browser.destroyForm`](#browserdestroyform) — destroy + unregister a controller by id.
- [`browser.available`](#browseravailable) — registry of active controllers keyed by id.

## Submission

- [`onSubmit(callback, preventDefault?)`](#onsubmit) — register a submit handler.
- [`autoSubmit(options?)`](#autosubmit) — enable submit-on-change with optional debounce.
- [`disableAutoSubmit()`](#disableautosubmit) — turn auto-submit off and cancel pending debounce.

## Field observation

- [`watch(field, callback)`](#watch) — chainable fire-and-forget reaction to a field.
- [`observe(field, callback)`](#observe) — like `watch`, but returns an unsubscribe function and fires immediately.
- [`unwatch(field?, callback?)`](#unwatch) — remove watched callbacks.
- [`subscribe(listener)`](#subscribe) — react to the entire form state.

## Field values

- [`setValue(name, value)`](#setvalue) — write a value into a field.
- [`getValue(name)`](#getvalue) — read the current value of a field.
- [`getField(name)`](#getfield) — read the underlying DOM element(s).
- [`prefill(fieldName?)`](#prefill) — populate the form from `window.location.search`.
- [`format(config)`](#format) — apply `@samline/formatter` to a field, with auto-managed raw mirror and cursor tracking.
- [`formatAll(config)`](#formatall) — alias of `format()` for `field: string[]` use cases.

## Validation

- [`validate(fields?)`](#validate) — run validation, return the result.
- [`revalidate(fields?)`](#revalidate) — alias of `validate` with explicit intent.
- [`setErrors(fields)`](#seterrors) — push manual errors.
- [`clearErrors(fields?)`](#clearerrors) — clear manual errors.

## State and data

- [`getData()`](#getdata) — return plain object + `FormData` for the form.
- [`getState()`](#getstate) — return a snapshot of values, errors, and metadata.
- [`append(options)`](#append) — inject a DOM node into the form.

## Pure helpers

These do not require a controller. They accept plain values or a raw `HTMLFormElement` and return results — safe to tree-shake into any bundle.

- [`parseFormData(formElement)`](#parseformdata) — same serializer used internally, no controller needed.
- [`validateValues(values, schema)`](#validatevalues) — run a schema against a values map.
- [`validateFieldValue(field, value, rules, values)`](#validatefieldvalue) — run a rule set against a single value.

---

## Per-method summaries

Each method below links to the dedicated page in the project repository for the full signature, parameters, return shape, behaviour tables, and runnable examples.

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

On creation the controller wires `input`, `change`, and `submit` listeners at the form level, starts a `MutationObserver` on the form subtree, optionally enables `autoSubmit`, and runs an initial validation pass when `autoValidate` is enabled.

#### `element`

Read-only getter for the bound `HTMLFormElement`, or `null` if the binding target was unresolved at construction time. `f` is an alias kept short for fluent setup.

```ts
readonly element: HTMLFormElement | null
readonly f: HTMLFormElement | null
```

#### `reset()`

Restores the form to its initial state: native field values reset, manual and validation errors cleared, visual attributes stripped, subscribers notified.

#### `destroy()`

Tears the controller down. Removes all DOM listeners, disconnects the `MutationObserver`, clears caches, drops subscribers and submit handlers, and resets internal state. Idempotent — calling it more than once is safe.

### Submission

#### `onSubmit(callback, preventDefault?)`

Registers a handler that runs when the form is submitted and validation passes. Multiple handlers can be registered; each runs in registration order.

```ts
onSubmit(
  callback: FormSubmitHandler,
  preventDefault?: boolean  // default: true
): FormController
```

The submit pipeline: manual errors cleared (if `clearErrorsOnSubmit`), validation runs, `submitCount` increments, handlers invoked in order. Invalid submissions are always intercepted.

#### `autoSubmit(options?)`

Enables native auto-submit. Every change to a tracked field triggers `form.requestSubmit()`. Pass `{ debounce: ms }` to delay.

```ts
autoSubmit(options?: boolean | AutoSubmitOptions): FormController
```

#### `disableAutoSubmit()`

Turns auto-submit off and cancels any pending debounce timer. Equivalent to `autoSubmit(false)`.

### Field observation

#### `watch(field, callback)`

Chainable fire-and-forget reaction to a field. The callback fires only on changes (not on registration).

#### `observe(field, callback)`

Like `watch`, but fires immediately with the current value and returns an unsubscribe function.

#### `unwatch(field?, callback?)`

Removes watched callbacks. Three overloads: no args (clear all), `field` only (clear all for that field), or `field` + `callback` (clear one specific watcher).

#### `subscribe(listener)`

Registers a listener that fires immediately with the current state and on every subsequent state mutation. Returns an unsubscribe function. Useful for driving a view layer from a single source of truth.

### Field values

#### `setValue(name, value)`

Writes a value into a field and dispatches the correct DOM event so watchers, validators, and visual state run as if a user typed. Returns the controller unchanged when the field does not exist.

#### `getValue(name)`

Returns the normalized value of a field: `string`, `string[]`, `File[]`, or `undefined`.

#### `getField(name)`

Returns the underlying DOM field(s) for a given name: a single `FormFieldElement`, an array (for repeated names like radio/checkbox groups), or `null`.

#### `prefill(fieldName?)`

Populates the form (or a single field) from the current URL query string. Delegates to `setValue`, so each prefilled field triggers the normal event pipeline.

#### `format(config)`

Apply an `@samline/formatter` pipeline to one or more fields inside the bound form. Creates and owns a hidden `<input name="<field>Raw">` mirror so `FormData`/`serialize()` automatically exposes the raw value.

:::caution[Optional peer dependency]
`@samline/formatter` is optional. When it is not installed, `format()` and `formatAll()` log a single `console.error` describing the missing dependency and return the controller unchanged.
:::

#### `formatAll(config)`

Alias of `format()` for readability when `field` is `string[]`.

### Validation

#### `validate(fields?)`

Runs validation against the configured `validators`. Returns `{ isValid, errors }` and marks the form as validated.

#### `revalidate(fields?)`

Alias of `validate` kept separate for readability at call sites that want to express "re-run validation now".

#### `setErrors(fields)`

Pushes manual errors into the form. Two overloads: array form (`string[]`, default message "Invalid value.") and map form (`FormErrors`, custom messages per field).

#### `clearErrors(fields?)`

Removes manual errors. Validation errors from rules are not touched. Visual attributes are re-synced for the affected fields.

### State and data

#### `getData()`

Returns `{ data, formData }` for the form. `data` is a plain object mirror (repeated names become arrays), `formData` is a fresh `FormData` instance. Empty file inputs are filtered out.

#### `getState()`

Returns a fresh snapshot of the controller state: `{ values, errors, filledFields, isValid, isValidated, autoSubmit, submitCount }`. Pure read — does not notify subscribers.

#### `append(options)`

Inserts a DOM node into the bound form. Useful for rendering banners, hints, or summary blocks that should live inside the `<form>` element. Returns the created `HTMLElement`, or `null` when the controller has no bound form.

### Pure helpers

#### `parseFormData(formElement)`

```ts
function parseFormData(formElement: HTMLFormElement): SerializedFormResult
```

Same serializer the controller uses internally. Returns `{ data, formData }`. Does not require a controller.

#### `validateValues(values, schema)`

```ts
function validateValues(
  values: FormValues,
  schema: ValidationSchema
): ValidationResult
```

Runs every field in the schema against a values map. Returns `{ isValid, errors }`.

#### `validateFieldValue(field, value, rules, values)`

```ts
function validateFieldValue(
  field: string,
  value: FormFieldValue,
  rules: FieldValidationRules,
  values: FormValues
): string[]
```

Runs the rule set against a single value. Returns an array of error messages (empty when the field is valid).

### Registry helpers (vanilla)

The vanilla entrypoint exports a `browser` singleton with the same shape as the IIFE bundle's `window.Forms` — but as a plain ESM value with no `globalThis` side-effect. Use it from a bundler when you want the registry ergonomics without the IIFE.

#### `browser`

```ts
const browser: FormsApi
```

Module-level singleton. Exposes `form`, `newForm`, `destroyForm`, and `available`. Spread it into your own globals (`{ ...browser, regex }`) or call its methods directly. The registry is shared across spreads, so `window.Form.available` and `browser.available` always point to the same object. See the [Browser registry helpers](/forms/getting-started/#browser-registry-helpers-bundler) section in the getting-started guide and [`FormsApi`](/forms/reference/typescript/#formsapi) for the exact shape.

#### `browser.newForm`

Build a controller via `browser.form(id, options)` and store it in `browser.available[id]`. Accepts `{ id, options }`. Logs `Form ID is required` to `console.error` and returns `undefined` if `id` is missing. Returns the same `FormController` stored under `available[id]`.

```ts
const contact = browser.newForm({
  id: 'contact-form',
  options: {
    validators: { email: { required: true } }
  }
})
```

#### `browser.destroyForm`

Look up `browser.available[id]`, call `destroy()`, and delete the entry. Logs `Form ID is required` if `id` is missing, or `Form with ID <id> not found` if the entry is absent.

```ts
browser.destroyForm('contact-form')
```

#### `browser.available`

Read-only view of the active registry: `{ [id: string]: FormController }`. Iterate it to inspect or invoke methods on every live controller.

```ts
for (const controller of Object.values(browser.available)) {
  controller.validate()
}
```

For an equivalent surface in a no-bundler setup, see the [Browser global reference](/forms/reference/browser/).