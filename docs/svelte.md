# Svelte

## Cuándo usar esta variante

Usa Svelte cuando quieras consumir el estado del formulario como store o aplicar el controlador mediante una action.

## Import

```ts
import { createFormStore, formAction } from '@samline/forms/svelte'
```

## Ejemplo mínimo

```svelte
<script lang="ts">
  import { createFormStore, formAction } from '@samline/forms/svelte'

  const formStore = createFormStore('contact-form')
</script>

<form id="contact-form" use:formAction>
  <input name="email" type="email" />
</form>
```

## Notas

- `createFormStore` expone `state`, `ready`, `mount` y `destroy`
- `formAction` permite vincular el controlador a un formulario concreto