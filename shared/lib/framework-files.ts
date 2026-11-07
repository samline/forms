import { format, resolveConfig } from 'prettier'

/**
 * Framework components for the Docs integration guide. Each one owns one
 * controller: created after the form mounts, destroyed before it unmounts.
 * The form stays uncontrolled; the framework renders only the messages.
 */
const options = await resolveConfig(process.cwd())

const react = `import { useEffect, useId, useRef, useState } from 'react'
import { form } from '@samline/forms'

const validators = {
  email: {
    required: { value: true, message: 'Enter your email.' },
    pattern: { value: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, message: 'Use a valid email.' },
  },
}

export function Newsletter() {
  const id = useId()
  const ref = useRef(null)
  const [state, setState] = useState({ errors: {}, isSubmitting: false })

  useEffect(() => {
    const controller = form(ref, { autoValidate: false, validators })
    const stop = controller.subscribe(setState)
    controller.onSubmit(async (_element, _data, formData) => {
      await fetch('/api/newsletter', { method: 'POST', body: formData })
      controller.reset()
    })
    return () => {
      stop()
      controller.destroy()
    }
  }, [])

  const error = state.errors.email?.[0]
  return (
    <form ref={ref} noValidate>
      <label htmlFor={id}>Email</label>
      <input id={id} name="email" type="email" aria-describedby={\`\${id}-error\`} />
      <p id={\`\${id}-error\`} aria-live="polite">{error}</p>
      <button type="submit" disabled={state.isSubmitting}>Subscribe</button>
    </form>
  )
}
`

const vue = `<script setup>
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { form } from '@samline/forms'

const id = useId()
const element = ref(null)
const errors = ref({})
const isSubmitting = ref(false)
let controller

onMounted(() => {
  controller = form(element.value, {
    autoValidate: false,
    validators: {
      email: {
        required: { value: true, message: 'Enter your email.' },
        pattern: { value: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, message: 'Use a valid email.' },
      },
    },
  })
  controller.subscribe(state => {
    errors.value = state.errors
    isSubmitting.value = state.isSubmitting
  })
  controller.onSubmit(async (_element, _data, formData) => {
    await fetch('/api/newsletter', { method: 'POST', body: formData })
    controller.reset()
  })
})

onBeforeUnmount(() => controller?.destroy())
</script>

<template>
  <form ref="element" novalidate>
    <label :for="id">Email</label>
    <input :id="id" name="email" type="email" :aria-describedby="\`\${id}-error\`" />
    <p :id="\`\${id}-error\`" aria-live="polite">{{ errors.email?.[0] }}</p>
    <button type="submit" :disabled="isSubmitting">Subscribe</button>
  </form>
</template>
`

const svelte = `<script>
  import { onMount } from 'svelte'
  import { form } from '@samline/forms'

  const id = \`newsletter-\${Math.random().toString(36).slice(2)}\`
  let element
  let errors = $state({})
  let isSubmitting = $state(false)

  onMount(() => {
    const controller = form(element, {
      autoValidate: false,
      validators: {
        email: {
          required: { value: true, message: 'Enter your email.' },
          pattern: { value: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, message: 'Use a valid email.' },
        },
      },
    })
    controller.subscribe(state => {
      errors = state.errors
      isSubmitting = state.isSubmitting
    })
    controller.onSubmit(async (_element, _data, formData) => {
      await fetch('/api/newsletter', { method: 'POST', body: formData })
      controller.reset()
    })
    return () => controller.destroy()
  })
</script>

<form bind:this={element} novalidate>
  <label for={id}>Email</label>
  <input {id} name="email" type="email" aria-describedby="{id}-error" />
  <p id="{id}-error" aria-live="polite">{errors.email?.[0] ?? ''}</p>
  <button type="submit" disabled={isSubmitting}>Subscribe</button>
</form>
`

const file = async (
  filename: string,
  code: string,
  parser: string,
  language: 'jsx' | 'vue' | 'svelte'
) => ({
  id: filename,
  label: filename,
  filename,
  language,
  code: parser === 'none' ? code : await format(code, { ...options, parser }),
})

export const frameworkFiles = [
  { id: 'react', label: 'React', files: [await file('Newsletter.jsx', react, 'babel', 'jsx')] },
  { id: 'vue', label: 'Vue', files: [await file('Newsletter.vue', vue, 'vue', 'vue')] },
  {
    id: 'svelte',
    label: 'Svelte',
    files: [await file('Newsletter.svelte', svelte, 'none', 'svelte')],
  },
]
