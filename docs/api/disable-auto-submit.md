# `disableAutoSubmit()`

Turns auto-submit off and cancels any pending debounce timer.

## Signature

```ts
disableAutoSubmit(): FormController
```

## Returns

The same [`FormController`](../typescript.md#formcontroller) — chainable.

## Behaviour

- Sets `state.autoSubmitEnabled` to `false`.
- Cancels `state.autoSubmitTimer` if one is pending.
- Notifies subscribers (because the state’s `autoSubmit` field changes).

Equivalent to calling [`autoSubmit(false)`](auto-submit.md).

## Examples

### Pause autosave while typing resumes

```ts
import { form } from '@samline/forms'

const draft = form('draft-form', { autoSubmit: { debounce: 800 } })

document.querySelector('#pause')?.addEventListener('click', () => {
  draft.disableAutoSubmit()
})

document.querySelector('#resume')?.addEventListener('click', () => {
  draft.autoSubmit({ debounce: 800 })
})
```

### Disable on blur

```ts
import { form } from '@samline/forms'

const search = form('search-form', { autoSubmit: { debounce: 250 } })

search.element?.addEventListener('focusin', () => {
  search.autoSubmit({ debounce: 250 })
})

search.element?.addEventListener('focusout', () => {
  search.disableAutoSubmit()
})
```

## Edge cases

- **Re-enabling later requires calling [`autoSubmit()`](auto-submit.md) again.** The previous debounce configuration is not preserved.
- **A pending debounce timer is removed**, but the timer was already scheduled; nothing fires for it.

## Related

- [`autoSubmit`](auto-submit.md) — enable / configure.
- [`destroy`](destroy.md) — also cancels any pending debounce.