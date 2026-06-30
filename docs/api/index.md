# API Reference

Every public method and helper gets its own page. Use this index to navigate to the right one.

## Lifecycle

- [`form(target, options?)`](form.md) — bind a controller to an `HTMLFormElement`.
- [`element`](element.md) — the bound form (`f` is an alias).
- [`destroy()`](destroy.md) — tear down listeners, observer, and caches.
- [`reset()`](reset.md) — restore native form values and clear errors.

## Submission

- [`onSubmit(callback, preventDefault?)`](on-submit.md) — register a submit handler.
- [`autoSubmit(options?)`](auto-submit.md) — enable submit-on-change with optional debounce.
- [`disableAutoSubmit()`](disable-auto-submit.md) — turn auto-submit off and cancel pending debounce.

## Field observation

- [`watch(field, callback)`](watch.md) — chainable fire-and-forget reaction to a field.
- [`observe(field, callback)`](observe.md) — like `watch`, but returns an unsubscribe function and fires immediately.
- [`unwatch(field?, callback?)`](unwatch.md) — remove watched callbacks.
- [`subscribe(listener)`](subscribe.md) — react to the entire form state.

## Field values

- [`setValue(name, value)`](set-value.md) — write a value into a field.
- [`getValue(name)`](get-value.md) — read the current value of a field.
- [`getField(name)`](get-field.md) — read the underlying DOM element(s).
- [`prefill(fieldName?)`](prefill.md) — populate the form from `window.location.search`.
- [`format(config)`](format.md) — apply `@samline/formatter` to a field, with auto-managed raw mirror and cursor tracking.
- [`formatAll(config)`](format.md) — alias of `format()` for `field: string[]` use cases.

## Validation

- [`validate(fields?)`](validate.md) — run validation, return the result.
- [`revalidate(fields?)`](revalidate.md) — alias of `validate` with explicit intent.
- [`setErrors(fields)`](set-errors.md) — push manual errors.
- [`clearErrors(fields?)`](clear-errors.md) — clear manual errors.

## State and data

- [`getData()`](get-data.md) — return plain object + `FormData` for the form.
- [`getState()`](get-state.md) — return a snapshot of values, errors, and metadata.
- [`append(options)`](append.md) — inject a DOM node into the form.

## Pure helpers

- [`parseFormData(formElement)`](parse-form-data.md) — same serializer used internally, no controller needed.
- [`validateValues(values, schema)`](validate-values.md) — run a schema against a values map.
- [`validateFieldValue(field, value, rules, values)`](validate-field-value.md) — run a rule set against a single value.