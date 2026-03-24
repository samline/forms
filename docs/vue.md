# Vue

## Cuándo usar esta variante

Usa Vue cuando necesites un composable con lifecycle y estado reactivo derivado del mismo controlador compartido.

## Import

```ts
import { useForm } from '@samline/forms/vue'
```

## Ejemplo mínimo

```ts
import { useForm } from '@samline/forms/vue'

export default {
  setup() {
    const formApi = useForm('contact-form', {
      validators: {
        email: { required: true }
      }
    })

    return { formApi }
  }
}
```

## Notas

- devuelve `controller`, `state`, `ready`, `mount` y `destroy`
- la suscripción al estado se gestiona desde lifecycle hooks de Vue