# Svelte

## When to use this variant

Use Svelte when you want to consume form state as a store or apply the controller through an action.

## Import

```ts
import { createFormStore, formAction } from '@samline/forms/svelte'
```

## Minimal Example

```svelte
<script lang="ts">
  import { createFormStore, formAction } from '@samline/forms/svelte'

  const formStore = createFormStore('contact-form')
</script>

<form id="contact-form" use:formAction>
  <input name="email" type="email" />
</form>
```

## Notes

- `createFormStore` exposes `state`, `ready`, `mount`, and `destroy`
- `formAction` binds the controller to a specific form element