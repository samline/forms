# React

## Cuándo usar esta variante

Usa React cuando necesites consumir el estado del formulario desde componentes y efectos, manteniendo el DOM real como fuente de interacción.

## Import

```ts
import { useForm } from '@samline/forms/react'
```

## Ejemplo mínimo

```tsx
import { useRef } from 'react'
import { useForm } from '@samline/forms/react'

export function ContactForm() {
  const formRef = useRef<HTMLFormElement | null>(null)
  const { controller, state, ready } = useForm(formRef, {
    validators: {
      email: { required: true }
    }
  })

  return (
    <form ref={formRef}>
      <input name="email" type="email" />
      <button type="button" disabled={!ready} onClick={() => controller?.validate()}>
        Validate
      </button>
      <pre>{JSON.stringify(state.errors, null, 2)}</pre>
    </form>
  )
}
```

## Notas

- la inicialización ocurre en cliente
- el hook expone `controller`, `state` y `ready`
- el core de validación y serialización es el mismo que usa vanilla