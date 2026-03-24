# React

## When to use this variant

Use React when you need to consume form state from components and effects while keeping the real DOM form as the interaction source.

## Import

```ts
import { useForm } from '@samline/forms/react'
```

## Minimal Example

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

## Notes

- initialization happens on the client
- the hook exposes `controller`, `state`, and `ready`
- it shares the same validation and serialization core as vanilla