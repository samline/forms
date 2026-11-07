---
locale: en
sidebar:
  group: guides
  order: 3
title: 'State and submission'
titleAccent: 'submission'
description: 'Subscribe to form state, watch single fields, handle asynchronous submits, auto-submit with debounce, prefill from the URL and reset cleanly.'
---

A controller keeps no copy of your values: every read comes from the DOM. State snapshots, watchers and submit handlers are views of that DOM plus the errors and counters the controller owns.

## The state snapshot

[`getState()`](../../api/get-state/) and every [`subscribe()`](../../api/subscribe/) call return the same shape:

| Field          | Meaning                                                                            |
| -------------- | ---------------------------------------------------------------------------------- |
| `values`       | Current value of every named control and every field with rules.                   |
| `errors`       | Validation and manual errors by field name.                                        |
| `filledFields` | Names whose value is non-empty.                                                    |
| `isValid`      | `true` when `errors` is empty.                                                     |
| `isValidated`  | `true` once rules are active (`autoValidate: true`, or after `validate()`/submit). |
| `autoSubmit`   | Whether auto-submit is enabled.                                                    |
| `isSubmitting` | `true` while a promise returned by a submit handler is pending.                    |
| `submitCount`  | Submit attempts in the controller's lifetime, valid or not. `reset()` keeps it.    |

`subscribe()` calls the listener immediately and then after every handled input, submit, error change, reset, mutation of the form's controls and auto-submit change. It returns an unsubscribe function.

```js
const stop = controller.subscribe(state => {
  button.disabled = !state.isValid || state.isSubmitting
})
// later: stop()
```

## One field at a time

[`observe(field, callback)`](../../api/observe/) runs the callback immediately and whenever that field changes, and returns an unsubscribe function. [`watch()`](../../api/watch/) is the chainable form; [`unwatch()`](../../api/unwatch/) removes callbacks. The callback receives the value, the control or controls, the form and a state snapshot.

```js
controller.observe('message', value => {
  counter.textContent = `${String(value ?? '').length} / 140`
})
```

Since 2.8.0, `reset()` and native reset buttons call these callbacks with the restored value.

## Submitting

[`onSubmit(callback, preventDefault = true)`](../../api/on-submit/) registers a handler for valid submits. The default prevents the browser's navigation so you can use `fetch`; pass `false` to keep a classic server-rendered submit after your handler runs. An invalid submit is always prevented.

```js
controller.onSubmit(async (_element, data, formData, state) => {
  const response = await fetch('/api/orders', { method: 'POST', body: formData })
  if (response.status === 422) controller.setErrors(await response.json())
})
```

- `data` is a plain object; repeated names become arrays and empty file inputs are skipped.
- `formData` includes the button that submitted the form.
- `state.isSubmitting` is `true` until every returned promise settles. A rejected promise is reported in the console; catch it to show your own message.

## Auto-submit

[`autoSubmit()`](../../api/auto-submit/) — or the `autoSubmit` option — submits through the same pipeline after every handled change. Add `debounce` for text fields. Invalid automatic submits do not move focus.

```js
const filters = form('filters', { autoSubmit: { debounce: 250 } })
filters.onSubmit((_element, _data, formData) => renderResults(new URLSearchParams(formData)))
```

Turn it off with `disableAutoSubmit()` or `autoSubmit(false)`; both cancel a pending timer.

## Prefill from the URL

[`prefill()`](../../api/prefill/) writes matching query parameters with `setValue()`. Repeated keys fill checkbox groups and repeated inputs (`?tags[]=new&tags[]=sale`), and auto-submit runs once after the batch. Pass a name to prefill one field.

## Reset

[`reset()`](../../api/reset/) restores the native defaults, clears every error and attribute, restores formatted mirrors and notifies watchers and subscribers. A native `<button type="reset">` runs the same state pass. Pending submit promises are not cancelled.

## Related

- [Auto-submit example](../examples/#guide-filters) and [server errors example](../examples/#guide-username).
- [Recipes](../recipes/) — autosave drafts, wizards and SPA cleanup.
