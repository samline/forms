# CSS Styling

The controller does not ship styles. It only toggles boolean attributes on fields so your CSS can react. By default those attributes are `css-filled` and `css-error`. You can rename them with [`options.attributes`](options.md#attributes).

This page shows how the attributes behave, which elements they apply to, and how to write CSS that pairs cleanly with them.

---

## How attributes are applied

| Attribute | Added when | Removed when |
| --- | --- | --- |
| `css-filled` | The field has a non-empty value (for checkboxes/radios, when checked; for files, when one or more files are selected). | The field becomes empty. |
| `css-error` | The field has at least one error — either from built-in validation rules or from [`setErrors`](api/set-errors.md). | All errors for that field are cleared (via [`clearErrors`](api/clear-errors.md), [`reset`](api/reset.md), or a successful re-validation). |

The attributes are added and removed on:

- Mount (initial sync).
- Every delegated `input` event, including controls associated through `form="id"`.
- Every explicit call to [`validate`](api/validate.md), [`revalidate`](api/revalidate.md), [`setErrors`](api/set-errors.md), or [`clearErrors`](api/clear-errors.md).
- DOM mutations detected by the controller’s `MutationObserver` (new fields, changed `name` / `type` attributes).

[`reset`](api/reset.md) clears both attributes, then re-synchronizes visual state from native default values. As a result, reset controls with non-empty defaults regain `css-filled`, while `css-error` and `aria-invalid` remain cleared.

Initial `css-filled` synchronization is independent of validation. With `autoValidate: false`, prefilled controls are styled on mount without running rules, setting `css-error`, or marking the form as validated.

---

## Default selectors

```css
/* any field that has a value */
[css-filled] { /* ... */ }

/* any field with at least one error */
[css-error] { /* ... */ }
```

These attributes are boolean: present or absent. They never have a value. The selector `[css-filled]` matches both `[css-filled]` and `[css-filled=""]`.

---

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

The attribute is set on the input itself when it’s checked.

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

> `:has()` is supported in evergreen browsers. If you need older browser support, attach the attributes to the wrapper from your own code or use class-based selectors instead.

> **Formatted fields.** The hidden raw mirror created by [`format()`](api/format.md) lives at the end of the form, outside any label. The controller always applies `css-filled` and `css-error` to the **visible** input (the one inside the label) for fields wired through `format()` — the hidden is intentionally excluded from the `:has()` selector. This is what makes the recipe above work without changes for formatted fields.

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

---

## Accessibility

The controller sets `aria-invalid="true"` while a field has validation or manual errors and removes it when the field becomes valid. Invalid submission focuses the first connected, enabled, non-hidden invalid field. Provide `aria-describedby` and an error message element in your template:

```html
<label class="field">
  <span>Email</span>
  <input name="email" type="email" aria-describedby="email-error" />
  <small id="email-error" hidden></small>
</label>
```

The controller’s [`getState()`](api/get-state.md) returns the current errors per field so you can reveal and populate the message from a single source of truth:

```ts
const state = profileForm.getState()

emailErrorEl.hidden = !state.errors.email
emailErrorEl.textContent = state.errors.email?.[0] ?? ''
```

For fields validated with `each`, item-only failures add `css-error` and `aria-invalid="true"` only to the failing controls. Aggregate field rules and manual errors still mark every control with that name. The public error map remains field-based (`errors[field]: string[]`), so use the optional `element` / `index` in an `each` custom validator when an integration needs item identity.

---

## Common pitfalls

- **The attributes have no value.** A selector like `[css-filled="true"]` will not match. Use `[css-filled]` instead.
- **`css-error` is set whenever there is any error**, including manual errors from [`setErrors`](api/set-errors.md). Combine your selector with the actual message you render.
- **Field labels do not automatically receive the attributes.** Apply styles to the input itself, or use `:has()` / a wrapper class.
- **CSS is not the only place the attributes appear.** Treat them as a styling hook, not as state. Read [`getState()`](api/get-state.md) if you need the authoritative state.
