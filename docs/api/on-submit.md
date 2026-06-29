# `onSubmit(callback, preventDefault?)`

Registers a handler that runs when the form is submitted and validation passes. Multiple handlers can be registered; each runs in registration order.

## Signature

```ts
onSubmit(
  callback: FormSubmitHandler,
  preventDefault?: boolean
): FormController
```

## Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `callback` | [`FormSubmitHandler`](../typescript.md#formsubmithandler) | yes | — | Handler invoked when the form is valid. Receives `(form, data, formData, state)`. |
| `preventDefault` | `boolean` | no | `true` | Whether to intercept valid submissions. Invalid submissions are always intercepted. |

## Returns

The same [`FormController`](../typescript.md#formcontroller) — chainable.

## Behaviour

The submit pipeline runs in this order:

1. If `clearErrorsOnSubmit` is `true` (default), manual errors are cleared.
2. Validation runs for every field with rules. `isValidated` becomes `true`.
3. If validation fails, the browser’s native submit is prevented, submit handlers are **not** invoked, `submitCount` is incremented, and subscribers are notified.
4. If validation passes:
   - `submitCount` is incremented.
   - Subscribers are notified.
   - If at least one handler was registered with `preventDefault: true`, the native submit is prevented. Otherwise (all handlers `preventDefault: false`), the native submit proceeds.
   - Every registered handler is invoked in registration order.

## Examples

### Default: intercept and send with `fetch`

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')

profile.onSubmit(async (_element, _data, formData) => {
  await fetch('/profile', { method: 'POST', body: formData })
})
```

### Pass `false` to allow native submit

```ts
import { form } from '@samline/forms'

const bladeForm = form('blade-form', {
  validators: { email: { required: true } }
})

bladeForm.onSubmit(() => {
  console.log('client-side hooks ran')
}, false)
```

Use this when you want the browser to perform the native submit (Blade, ERB, classic Rails, etc.) but still run a client-side hook first.

### Multiple handlers

```ts
profile
  .onSubmit((_form, data) => analytics.track('signup', data))
  .onSubmit(async (_form, _data, formData) => {
    await fetch('/signup', { method: 'POST', body: formData })
  })
```

## Edge cases

- **Handlers receive a fresh `FormData`** built from the live form on each invocation. Do not cache it.
- **`data` is a plain object mirror of `FormData`.** Repeated names become arrays (e.g. `interests: ['design', 'code']`).
- **Handlers do not receive errors as an argument.** If you need to inspect the validation result, read [`getState()`](get-state.md) or call [`validate()`](validate.md) from inside the handler.
- **`onSubmit` cannot be removed** — there is no `offSubmit` API. If you need conditional submission, guard inside the handler or recreate the controller.
- **The handler is invoked synchronously after the submit event.** If your handler returns a promise, the native submit is already prevented (when applicable) — the promise’s resolution does not gate the browser.

## Related

- [`autoSubmit`](auto-submit.md) — submit on every change.
- [`validate`](validate.md) — run validation without submitting.
- [`getData`](get-data.md) — what the handler receives.