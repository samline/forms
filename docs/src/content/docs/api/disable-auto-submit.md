---
locale: en
sidebar:
  group: api
  order: 21
title: 'Stop auto-submit with disableAutoSubmit()'
titleAccent: 'disableAutoSubmit()'
description: 'Turns auto-submit off and cancels any pending debounce timer. Use it to pause automatic submission during a multi-step flow.'
---

Turns auto-submit off and cancels any pending debounce timer.

## Signature

```ts
disableAutoSubmit(): FormController
```

## Returns

The same [`FormController`](../../reference/typescript/#formcontroller) — chainable.

## Behaviour

- Sets `state.autoSubmitEnabled` to `false`.
- Cancels `state.autoSubmitTimer` if one is pending.
- Notifies subscribers (because the state’s `autoSubmit` field changes).

Equivalent to calling [`autoSubmit(false)`](../auto-submit/).

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

- **Re-enabling later requires calling [`autoSubmit()`](../auto-submit/) again.** The previous debounce configuration is not preserved.
- **A pending debounce timer is removed**, but the timer was already scheduled; nothing fires for it.

## Related

- [`autoSubmit`](../auto-submit/) — enable / configure.
- [`destroy`](../destroy/) — also cancels any pending debounce.
