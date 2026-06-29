# `autoSubmit(options?)`

Enables native auto-submit. Every change to a tracked field triggers `form.requestSubmit()`. Optionally debounced.

## Signature

```ts
autoSubmit(options?: boolean | AutoSubmitOptions): FormController
```

## Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `options` | `boolean \| AutoSubmitOptions` | no | `true` | Pass `true` to enable, `false` to disable, or an `{ debounce }` object to delay. |

```ts
interface AutoSubmitOptions {
  debounce?: number
}
```

## Returns

The same [`FormController`](../typescript.md#formcontroller) — chainable.

## Behaviour

- `autoSubmit()` or `autoSubmit(true)` — enables auto-submit immediately on every change.
- `autoSubmit({ debounce: ms })` — schedules `form.requestSubmit()` `ms` milliseconds after the most recent change. Subsequent changes within the debounce window reset the timer.
- `autoSubmit(false)` — disables auto-submit (equivalent to [`disableAutoSubmit()`](disable-auto-submit.md)).

When auto-submit fires, the native submit is invoked. If the form is invalid, the controller’s `submit` listener prevents the browser from navigating. If the form is valid, the registered [`onSubmit`](on-submit.md) handlers run as usual.

Subscribers are notified when autoSubmit is enabled, disabled, or its debounce changes (because the state’s `autoSubmit` field changes).

## Examples

### Autosave on every change

```ts
import { form } from '@samline/forms'

const draft = form('draft-form', {
  validators: { title: { required: true } }
})

draft.autoSubmit()
```

### Debounced search

```ts
import { form } from '@samline/forms'

const search = form('search-form', {
  autoSubmit: { debounce: 300 }
})

search.onSubmit(async (_form, data) => {
  await fetch('/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
})
```

### Toggle at runtime

```ts
const formEl = form('search-form')

document.querySelector('#realtime')?.addEventListener('change', event => {
  const enabled = (event.target as HTMLInputElement).checked
  formEl.autoSubmit(enabled ? { debounce: 250 } : false)
})
```

## Edge cases

- **The submit is invoked via `form.requestSubmit()`** when available, falling back to clicking a submit button or `form.submit()` otherwise.
- **`autoSubmit` does not validate.** Validation runs as part of the submit pipeline, so an invalid form will not navigate and your [`onSubmit`](on-submit.md) handler will not run.
- **The debounce timer is cancelled by [`disableAutoSubmit()`](disable-auto-submit.md) and [`destroy()`](destroy.md).**
- **Setting `autoSubmit` from `options` and from the method can both run at mount time** — the method is called last, so it wins.

## Related

- [`disableAutoSubmit`](disable-auto-submit.md) — turn auto-submit off.
- [`onSubmit`](on-submit.md) — submit handlers.
- [`options.autoSubmit`](../options.md#autosubmit) — mount-time configuration.