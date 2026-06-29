# Browser

## When to use this variant

Use this variant when you do not have a bundler and need to integrate the package directly into HTML, Shopify, WordPress, or traditional templates.

## Script global

```html
<script src="https://unpkg.com/@samline/forms@2.0.0/dist/browser/global.global.js"></script>
```

Pin the version in production.

## Global Object

The bundle exposes `window.forms`.

## Minimal Example

```html
<form id="contact-form">
  <input name="email" type="email" />
</form>

<script src="https://unpkg.com/@samline/forms@2.0.0/dist/browser/global.global.js"></script>
<script>
  const contactForm = window.forms.form('contact-form')
  contactForm.validate()
</script>
```

## Surface

The browser bundle mirrors the main vanilla entrypoint, so all of the same methods are available:

- `form`
- `createFormController`
- `parseFormData`
- `validateFieldValue`
- `validateValues`
