# Browser

## Cuándo usar esta variante

Usa esta variante cuando no tengas bundler y necesites integrar el paquete directamente en HTML, Shopify, WordPress o plantillas tradicionales.

## Script global

```html
<script src="https://unpkg.com/@samline/forms@0.1.0/dist/browser/global.global.js"></script>
```

Fija la versión en producción.

## Objeto global

El bundle expone `window.SamlineForms`.

## Ejemplo mínimo

```html
<form id="contact-form">
  <input name="email" type="email" />
</form>

<script src="https://unpkg.com/@samline/forms@0.1.0/dist/browser/global.global.js"></script>
<script>
  const contactForm = window.SamlineForms.form('contact-form')
  contactForm.validate()
</script>
```