# Vanilla

## Cuándo usar esta variante

Usa la variante vanilla cuando trabajas con formularios HTML nativos, scripts embebidos, sitios estáticos o aplicaciones donde no necesitas un wrapper de framework.

## Import

```ts
import { form } from '@samline/forms'
```

## Ejemplo mínimo

```ts
const contactForm = form('contact-form', {
  validators: {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  }
})

contactForm.watch('email', value => {
  console.log(value)
})
```

## Contrato observable

- añade `css-filled` a los campos con valor
- añade `css-error` a los campos con error
- serializa el formulario a objeto plano y `FormData`
- permite `autoSubmit` con debounce opcional

## Métodos principales

- `onSubmit`
- `watch`
- `observe`
- `prefill`
- `setValue`
- `validate`
- `getState`
- `destroy`