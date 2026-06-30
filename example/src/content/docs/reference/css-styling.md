---
title: CSS styling
description: Style forms with the css-filled and css-error attributes that @samline/forms toggles on fields.
template: doc
sidebar:
  order: 6
---

The controller does not ship styles. It only toggles boolean attributes on fields so your CSS can react. By default those attributes are `css-filled` and `css-error`. You can rename them with [`options.attributes`](/forms/reference/configuration/#attributes).

This page shows how the attributes behave, which elements they apply to, and how to write CSS that pairs cleanly with them.

## How attributes are applied

| Attribute | Added when | Removed when |
| --- | --- | --- |
| `css-filled` | The field has a non-empty value (for checkboxes/radios, when checked; for files, when one or more files are selected). | The field becomes empty. |
| `css-error` | The field has at least one error — either from built-in validation rules or from [`setErrors`](/forms/reference/api/#seterrorsfields). | All errors for that field are cleared (via [`clearErrors`](/forms/reference/api/#clearerrorsfields), [`reset`](/forms/reference/api/#reset), or a successful re-validation). |

The attributes are added and removed on:

- Mount (initial sync).
- Every `input` / `change` event delegated at the form level.
- Every explicit call to [`validate`](/forms/reference/api/#validatefields), [`revalidate`](/forms/reference/api/#revalidatefields), [`setErrors`](/forms/reference/api/#seterrorsfields), or [`clearErrors`](/forms/reference/api/#clearerrorsfields).
- DOM mutations detected by the controller's `MutationObserver` (new fields, changed `name` / `type` attributes).

The attributes are also removed everywhere when you call [`reset`](/forms/reference/api/#reset).

## Default selectors

```css
/* any field that has a value */
[css-filled] { /* ... */ }

/* any field with at least one error */
[css-error] { /* ... */ }
```

These attributes are boolean: present or absent. They never have a value. The selector `[css-filled]` matches both `[css-filled]` and `[css-filled=""]`.

## Recipes

### Text inputs

```css
input[css-filled] {
  border-color: var(--color-border-emphasis);
}

input[css-error] {
  border-color: var(--color-danger);
  background-color: var(--color-danger-soft);
}

input[css-error]:focus-visible {
  outline-color: var(--color-danger);
}
```

### Textarea

```css
textarea[css-filled] {
  background-color: var(--color-surface-soft);
}

textarea[css-error] {
  border-color: var(--color-danger);
}
```

### Selects

```css
select[css-filled] {
  background-color: var(--color-surface-soft);
}

select[css-error] {
  border-color: var(--color-danger);
}
```

### Checkboxes and radios

The attribute is set on the input itself when it's checked.

```css
input[type="checkbox"][css-filled],
input[type="radio"][css-filled] {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

input[type="checkbox"][css-error],
input[type="radio"][css-error] {
  outline: 2px solid var(--color-danger);
  outline-offset: 2px;
}
```

### File inputs

```css
input[type="file"][css-filled] {
  border-color: var(--color-success);
}

input[type="file"][css-error] {
  border-color: var(--color-danger);
}
```

### Styling the wrapper

A common pattern is to style a parent label that contains the input:

```html
<label class="field">
  <span>Email</span>
  <input name="email" type="email" />
</label>
```

```css
.field {
  display: grid;
  gap: 0.25rem;
}

.field:has([css-filled]) > span {
  color: var(--color-text-emphasis);
}

.field:has([css-error]) > span {
  color: var(--color-danger);
}
```

:::tip[`:has()` support]
`:has()` is supported in evergreen browsers. If you need older browser support, attach the attributes to the wrapper from your own code or use class-based selectors instead.
:::

### Custom attribute names

```ts
form('signup-form', {
  attributes: { filled: 'is-filled', error: 'is-invalid' }
})
```

```css
.is-filled { /* ... */ }
.is-invalid { /* ... */ }
```

## Accessibility

The controller does not set ARIA attributes. If you want screen-reader friendly error feedback, pair the visual attributes with `aria-invalid` and `aria-describedby` from your own template:

```html
<label class="field">
  <span>Email</span>
  <input name="email" type="email" aria-invalid="false" aria-describedby="email-error" />
  <small id="email-error" hidden></small>
</label>
```

When you surface validation messages, toggle `aria-invalid` and reveal the error element. The controller's [`getState()`](/forms/reference/api/#getstate) returns the current errors per field so you can drive this from a single source of truth:

```ts
const state = profileForm.getState()

emailInput.setAttribute('aria-invalid', state.errors.email ? 'true' : 'false')
emailErrorEl.hidden = !state.errors.email
emailErrorEl.textContent = state.errors.email?.[0] ?? ''
```

## Common pitfalls

- **The attributes have no value.** A selector like `[css-filled="true"]` will not match. Use `[css-filled]` instead.
- **`css-error` is set whenever there is any error**, including manual errors from [`setErrors`](/forms/reference/api/#seterrorsfields). Combine your selector with the actual message you render.
- **Field labels do not automatically receive the attributes.** Apply styles to the input itself, or use `:has()` / a wrapper class.
- **CSS is not the only place the attributes appear.** Treat them as a styling hook, not as state. Read [`getState()`](/forms/reference/api/#getstate) if you need the authoritative state.