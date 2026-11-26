---
locale: en
sidebar:
  group: guides
  order: 7
title: 'Accessible forms and errors'
titleAccent: 'errors'
description: 'What @samline/forms does for accessibility — aria-invalid, focus after a failed submit — and what labels, messages and live regions you supply.'
---

The controller works on your native form, so most accessibility comes from the markup you already write: real `<label>` elements, fieldsets for groups and native buttons. The package adds state; it never renders text.

## What the controller does

- **Marks invalid controls.** Every control with an error receives `css-error` immediately. `aria-invalid="true"` appears once the error has reached the user: the field was edited by the user or holds a value, the user started a submit (auto-submit does not count), you called `validate()` or `revalidate()`, or you called `setErrors()`. `setValue()` and `prefill()` alone do not expose an empty field, and a server-rendered `aria-invalid="true"` is kept while the field is invalid. Until then screen readers do not announce empty required fields as invalid on page load. Controls with a native `required` attribute and no shown error get `aria-invalid="false"`. Auto-submit never exposes fields the user has not touched. When the error clears both attributes are removed, except that a control with native `required` keeps `aria-invalid="false"`; `reset()` returns fields to the unexposed state (`aria-invalid="false"` on `required` controls, removed elsewhere) and `destroy()` removes `css-filled`, `css-error` and `aria-invalid`.
- **Moves focus after a failed submit.** When validation fails on submit, focus goes to the first invalid control in document order that is connected, enabled, not hidden and rendered, so controls inside `hidden`, `display: none` or `visibility: hidden` containers are skipped. With `each` rules it is the first failing row, not the first row. A submit started by auto-submit never moves focus, so typing is not interrupted.
- **Leaves focus alone when nothing is rendered.** If every invalid control is hidden, for example an error on a collapsed wizard step, focus does not move. Show the step from a [`subscribe()`](../../api/subscribe/) callback: when `state.submitCount` changes and `state.errors` has a key that belongs to a hidden step, reveal that step and focus its first invalid control yourself.
- **Keeps formatted fields visible to assistive technology.** Attributes land on the visible formatted input, not on the hidden mirror that carries the raw value. The mirror created by `format()` is `type="hidden"`, `aria-hidden="true"` and `tabindex="-1"`.
- **Keeps errors serializable.** `state.errors` is a plain `Record<string, string[]>`, ready to render in any UI layer.

## What you supply

- **Messages.** Render `state.errors[name][0]` (or all messages) next to each field from a [`subscribe()`](../../api/subscribe/) callback, and connect the element with `aria-describedby` so screen readers read it with the field.
- **Announcements.** Put messages in a container with `aria-live="polite"`, or render an error summary at the top of the form after a failed submit and move focus there instead.
- **Rule messages in your language.** Default messages are short English sentences such as “This field is required.”. Pass `{ value, message }` for every rule a visitor can see.
- **`novalidate`.** Without it, the browser validates `type="email"`, `required` and similar attributes first and shows its own bubbles, which do not follow your messages.
- **Disabled states.** When you disable a submit button from `state.isValid` or `state.isSubmitting`, explain why nearby; a disabled button is skipped by keyboard focus.

```html
<label for="email">Email</label>
<input id="email" name="email" type="email" aria-describedby="email-error" />
<p id="email-error" data-error-for="email" aria-live="polite"></p>
```

```js
controller.subscribe(state => {
  for (const slot of document.querySelectorAll('[data-error-for]')) {
    slot.textContent = state.errors[slot.dataset.errorFor]?.[0] ?? ''
  }
})
```

## Styling states without hiding meaning

Use the attributes for color and borders, but never rely on color alone: keep the text message. When rules run on load (`autoValidate: true`), empty fields are already invalid; highlight them only once filled with `[css-error][css-filled]`, or start with `autoValidate: false`. See [Styling with CSS](../css-styling/).

## Related

- [Validation and errors](../validation/) — every rule and a complete accessible example.
- [Live state example](../examples/#guide-feedback) — filled-only messages and a button enabled by state.
