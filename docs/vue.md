# Vue

## When to use this variant

Use Vue when you need a composable with lifecycle hooks and reactive state driven by the same shared controller.

## Import

```ts
import { useForm } from '@samline/forms/vue'
```

## Minimal Example

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

## Notes

- it returns `controller`, `state`, `ready`, `mount`, and `destroy`
- state subscription is managed through Vue lifecycle hooks