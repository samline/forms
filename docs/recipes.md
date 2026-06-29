# Recipes

End-to-end patterns that combine multiple methods. Each recipe is a self-contained example you can drop into a real project.

---

## 1. Login form with `fetch`

```html
<form id="login-form">
  <input name="email" type="email" autocomplete="email" required />
  <input name="password" type="password" autocomplete="current-password" required />
  <button type="submit">Sign in</button>
</form>
```

```ts
import { form } from '@samline/forms'

const login = form('login-form', {
  validators: {
    email: {
      required: { value: true, message: 'Email is required.' },
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Enter a valid email.'
      }
    },
    password: { required: true, minLength: 8 }
  }
})

login.onSubmit(async (_element, _data, formData) => {
  const response = await fetch('/api/login', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    login.setErrors({ password: ['Wrong email or password.'] })
    return
  }

  window.location.assign('/dashboard')
})
```

What this does:

- Validates with custom messages.
- Intercepts the submit (default `preventDefault: true`) so the browser does not navigate.
- Surfaces a single error on the password field when the API rejects the credentials.

---

## 2. Surface server-side validation errors

```ts
import { form } from '@samline/forms'

const profile = form('profile-form', {
  autoValidate: false,
  clearManualErrorsOnChange: false,
  validators: {
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
  }
})

profile.onSubmit(async (_element, _data, formData) => {
  const response = await fetch('/api/profile', {
    method: 'POST',
    body: formData
  })

  if (response.status === 422) {
    const { fieldErrors } = (await response.json()) as {
      fieldErrors: Record<string, string[]>
    }
    profile.setErrors(fieldErrors)
    return
  }

  if (response.ok) {
    profile.clearErrors()
    profile.reset()
  }
})
```

Why `clearManualErrorsOnChange: false`: the server’s errors should stay visible while the user fixes them.

---

## 3. Multi-step / wizard

```html
<form id="wizard">
  <fieldset data-step="1">
    <input name="name" />
    <input name="email" type="email" />
  </fieldset>
  <fieldset data-step="2" hidden>
    <input name="address" />
    <input name="city" />
  </fieldset>
  <button type="button" id="next">Next</button>
  <button type="submit" id="submit" hidden>Submit</button>
</form>
```

```ts
import { form } from '@samline/forms'

const wizard = form('wizard', {
  validators: {
    name: { required: true },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    address: { required: true },
    city: { required: true }
  }
})

const stepFields: Record<1 | 2, string[]> = {
  1: ['name', 'email'],
  2: ['address', 'city']
}

let currentStep: 1 | 2 = 1

document.querySelector('#next')?.addEventListener('click', () => {
  const ok = wizard.validate(stepFields[currentStep]).isValid
  if (!ok) return

  currentStep = 2
  wizard.element?.querySelector('[data-step="1"]')?.setAttribute('hidden', '')
  wizard.element?.querySelector('[data-step="2"]')?.removeAttribute('hidden')
  document.querySelector('#next')!.setAttribute('hidden', '')
  document.querySelector('#submit')!.removeAttribute('hidden')
})

wizard.onSubmit(async (_element, _data, formData) => {
  await fetch('/api/wizard', { method: 'POST', body: formData })
})
```

Each step validates only its own fields, so the user can progress without being blocked by later fields.

---

## 4. Autosave drafts

```html
<form id="draft">
  <input name="title" />
  <textarea name="body"></textarea>
</form>
```

```ts
import { form } from '@samline/forms'

const draft = form('draft', {
  autoSubmit: { debounce: 800 }
})

draft.onSubmit(async (_element, _data, formData) => {
  await fetch('/api/draft', { method: 'POST', body: formData })
})
```

For a JSON endpoint, switch the body to `JSON.stringify(data)` and set the right `Content-Type` header.

To pause autosave while the user is typing into a “bulk edit” textarea, toggle it explicitly:

```ts
const bodyField = draft.getField('body') as HTMLTextAreaElement | null

bodyField?.addEventListener('focus', () => draft.disableAutoSubmit())
bodyField?.addEventListener('blur', () => draft.autoSubmit({ debounce: 800 }))
```

---

## 5. Dynamic fields added at runtime

```html
<form id="builder">
  <div id="rows"></div>
  <button type="button" id="add">Add row</button>
  <button type="submit">Save</button>
</form>
```

```ts
import { form } from '@samline/forms'

const builder = form('builder', {
  validators: {
    'rows[*].name': { required: true }
  }
})

document.querySelector('#add')?.addEventListener('click', () => {
  const rows = document.querySelector('#rows')!
  const index = rows.childElementCount
  const row = document.createElement('div')
  row.innerHTML = `
    <input name="rows[${index}].name" />
    <input name="rows[${index}].value" />
  `
  rows.appendChild(row)
})
```

The controller’s `MutationObserver` watches the form subtree for new fields and `name` / `type` attribute changes. It clears the field cache, re-syncs visual state, and re-runs validation — so dynamic rows are validated automatically without any extra wiring.

> Validator keys with `[index]` syntax are treated as literal field names. To validate dynamic rows, prefer a `validate` callback that knows how to read the rows from `values`.

---

## 6. Bind to a ref-like target after async mount

```ts
import { form } from '@samline/forms'

const target = { current: null as HTMLFormElement | null }

const controller = form(target)

async function mount() {
  const formElement = document.createElement('form')
  formElement.innerHTML = `<input name="email" type="email" />`
  document.querySelector('#app')!.appendChild(formElement)

  target.current = formElement
  controller.destroy() // The controller captured `current` at construction time.
  form(target)
}

mount()
```

`form()` reads `target.current` once. If the form is mounted later, recreate the controller (or call `destroy()` and re-bind).

---

## 7. Manual-only validation

When you want validation to run only when you ask (not on every change), disable `autoValidate` and call `validate()` yourself.

```ts
import { form } from '@samline/forms'

const checkout = form('checkout-form', {
  autoValidate: false,
  validators: {
    card: { required: true, minLength: 12 },
    expiry: { required: true }
  }
})

document.querySelector('#pay')?.addEventListener('click', () => {
  const result = checkout.validate()
  if (!result.isValid) {
    checkout.setErrors({ card: ['Please review your details.'] })
    return
  }

  checkout.element?.requestSubmit()
})
```

Useful when you want to defer validation until a specific event (e.g. a “Review order” button).

---

## 8. Keep manual errors until the user explicitly clears them

```ts
import { form } from '@samline/forms'

const profile = form('profile-form', {
  clearManualErrorsOnChange: false,
  validators: {
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
  }
})

profile.setErrors({ email: ['This email is already in use.'] })

// The error stays visible even after the user edits the field.
profile.clearErrors(['email']) // Or clearErrors() to clear everything.
```

---

## 9. Native server-rendered submit (Blade, ERB, classic Rails)

```html
<form id="profile" action="/profile" method="post">
  @csrf
  <input name="email" type="email" />
  <input name="name" />
  <button type="submit">Save</button>
</form>
```

```ts
import { form } from '@samline/forms'

const profile = form('profile', {
  validators: {
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
  }
})

profile.onSubmit(() => {
  console.log('client-side hooks ran')
}, false)
```

When validation passes, the browser performs the native form submit to the `action` URL. When validation fails, the submit is prevented and the user sees the inline errors.

---

## 10. SPA cleanup on route change

```ts
import { form } from '@samline/forms'

const controllers = new Map<string, ReturnType<typeof form>>()

router.on('/profile', element => {
  controllers.set('profile', form(element, { validators: { email: { required: true } } }))
})

router.off('/profile', () => {
  controllers.get('profile')?.destroy()
  controllers.delete('profile')
})
```

`destroy()` is idempotent — calling it more than once is safe.

---

## 11. Sync state into a view layer

```ts
import { form } from '@samline/forms'

const signup = form('signup-form', {
  validators: {
    email: { required: true },
    password: { required: true, minLength: 8 }
  }
})

signup.subscribe(state => {
  const submit = signup.element?.querySelector<HTMLButtonElement>('button[type="submit"]')
  if (submit) submit.disabled = !state.isValid
})
```

Use `subscribe` when a single source of truth should drive your UI (button enabled state, live previews, dependent field visibility, etc.).

---

## 12. Combine `setValue` with custom validation

```ts
import { form } from '@samline/forms'

const shipping = form('shipping-form', {
  validators: {
    method: { required: true },
    country: {
      validate: ({ value, values }) => {
        if (values.method === 'international' && value !== 'US') return null
        if (values.method === 'domestic' && value === 'US') return null
        return 'Country and shipping method must be consistent.'
      }
    }
  }
})

// Programmatic update still triggers the delegated event pipeline.
shipping.setValue('method', 'international')
shipping.validate(['method', 'country'])
```

Custom validators receive the full values map, so cross-field rules read like plain JavaScript.

---

## Next steps

- Need a full options reference? See [docs/options.md](options.md).
- Looking up an exact method signature? See [docs/api/index.md](api/index.md).
- Working with TypeScript types? See [docs/typescript.md](typescript.md).
- Setting up styling for `css-filled` / `css-error`? See [docs/css-styling.md](css-styling.md).