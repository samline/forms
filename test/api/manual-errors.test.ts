import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { form } from '../../src/api/form'
import {
  __resetFormatterLoaderForTests,
  __setFormatterModuleForTests,
  type FormatterModule,
} from '../../src/core/formatter-loader'

const buildFixture = () => {
  document.body.innerHTML = `
    <form id="login" novalidate>
      <input type="email" name="email" value="sam@example.com" />
      <input type="password" name="password" value="secret" />
      <input type="text" name="locked" value="fixed" disabled />
      <input type="text" name="readonly" value="fixed" readonly />
      <input type="checkbox" name="terms" value="yes" readonly checked />
      <input type="hidden" name="token" value="abc" />
      <input type="text" name="ghost" value="x" hidden />
      <fieldset disabled><input type="text" name="nested" value="x" /></fieldset>
      <input type="text" name="phone" value="" />
      <button type="submit">Sign in</button>
    </form>
    <input type="text" name="outside" form="login" value="x" />
  `
}

const phoneFormatter: FormatterModule = {
  format: value => {
    const digits = String(value ?? '').replace(/\D/g, '')
    return { formatted: digits.replace(/(\d{2})(?=\d)/g, '$1 '), raw: digits, type: 'phone' }
  },
}

const submit = (element: HTMLFormElement) => {
  const event = new Event('submit', { bubbles: true, cancelable: true })
  element.dispatchEvent(event)
  return event
}

const type = (name: string, value: string) => {
  const field = document.querySelector<HTMLInputElement>(`[name="${name}"]`)!
  field.value = value
  field.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('manual errors and submission', () => {
  beforeEach(() => {
    buildFixture()
    __resetFormatterLoaderForTests()
  })

  afterEach(() => {
    __resetFormatterLoaderForTests()
    vi.useRealTimers()
  })

  it('reports a form-level error until the next attempt, which it never blocks', () => {
    const api = form('login')
    const handler = vi.fn(() => {
      api.setErrors({ non_field_errors: ['Wrong email or password.'] })
    })
    api.onSubmit(handler)

    submit(api.element!)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(api.getState()).toMatchObject({
      errors: { non_field_errors: ['Wrong email or password.'] },
      isValid: false,
    })

    type('email', 'other@example.com')
    expect(api.getState().errors.non_field_errors).toEqual(['Wrong email or password.'])

    const event = submit(api.element!)
    expect(handler).toHaveBeenCalledTimes(2)
    expect(event.defaultPrevented).toBe(true) // preventDefault handler, not a block
    expect(api.getState().errors).toEqual({ non_field_errors: ['Wrong email or password.'] })
  })

  it('submits after a server error on a key that names no control', () => {
    const api = form('login')
    const handler = vi.fn()
    api.onSubmit(handler)
    api.setErrors({ 'items.0.name': ['Required.'] })

    submit(api.element!)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(api.getState().errors).toEqual({})
    expect(api.getState().isValid).toBe(true)
  })

  it.each([
    ['locked', 'a disabled field'],
    ['nested', 'a field inside a disabled fieldset'],
    ['readonly', 'a read-only text field'],
    ['token', 'a hidden input'],
    ['ghost', 'a field with the hidden attribute'],
  ])('drops the manual error of %s (%s) on submit', name => {
    const api = form('login')
    const handler = vi.fn()
    api.onSubmit(handler)
    api.setErrors({ [name]: ['Server says no.'] })

    submit(api.element!)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(api.getState().errors).toEqual({})
    const field = document.querySelector(`[name="${name}"]`)!
    expect(field.hasAttribute('css-error')).toBe(false)
    expect(field.hasAttribute('aria-invalid')).toBe(false)
  })

  it('drops the manual error of a field removed from the form', async () => {
    const api = form('login')
    const handler = vi.fn()
    api.onSubmit(handler)
    api.setErrors({ email: ['Taken.'] })
    document.querySelector('[name="email"]')!.remove()
    await new Promise<void>(resolve => setTimeout(resolve, 0))

    submit(api.element!)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(api.getState().errors).toEqual({})
  })

  it('keeps blocking on an editable field next to a form-level error, and focuses it', () => {
    const api = form('login')
    const handler = vi.fn()
    api.onSubmit(handler)
    api.setErrors({ password: ['Too weak.'], non_field_errors: ['Try again.'] })

    const event = submit(api.element!)

    expect(event.defaultPrevented).toBe(true)
    expect(handler).not.toHaveBeenCalled()
    expect(api.getState().errors).toEqual({ password: ['Too weak.'] })
    const password = api.getField('password') as HTMLInputElement
    expect(password.getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(password)

    type('password', 'much-stronger')
    submit(api.element!)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('treats read-only checkboxes and form="id" controls as editable', () => {
    const api = form('login')
    const handler = vi.fn()
    api.onSubmit(handler)
    api.setErrors({ terms: ['Accept the new terms.'], outside: ['Check this.'] })

    submit(api.element!)

    expect(handler).not.toHaveBeenCalled()
    expect(api.getState().errors).toEqual({
      terms: ['Accept the new terms.'],
      outside: ['Check this.'],
    })
  })

  it('keeps an error on the canonical name of a formatted field', () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('login')
    api.format({ type: 'phone', field: 'phone' })
    const handler = vi.fn()
    api.onSubmit(handler)
    api.setErrors({ phone: ['Unknown number.'] })

    submit(api.element!)

    expect(handler).not.toHaveBeenCalled()
    const visible = document.querySelector<HTMLInputElement>('[name="phone_displayed"]')!
    expect(visible.getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(visible)

    type('phone_displayed', '5512345678')
    submit(api.element!)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('keeps editable manual errors with clearManualErrorsOnChange: false until clearErrors()', () => {
    const api = form('login', { clearManualErrorsOnChange: false })
    const handler = vi.fn()
    api.onSubmit(handler)
    api.setErrors({ email: ['Taken.'] })

    type('email', 'new@example.com')
    submit(api.element!)
    expect(handler).not.toHaveBeenCalled()

    api.clearErrors(['email'])
    submit(api.element!)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('clears every manual error first with clearErrorsOnSubmit: true', () => {
    const api = form('login', { clearErrorsOnSubmit: true })
    const handler = vi.fn()
    api.onSubmit(handler)
    api.setErrors({ email: ['Taken.'], non_field_errors: ['Nope.'] })

    submit(api.element!)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(api.getState().errors).toEqual({})
  })

  it('lets auto-submit go through after a form-level error', () => {
    vi.useFakeTimers()
    const api = form('login', { autoSubmit: { debounce: 100 } })
    const handler = vi.fn()
    api.onSubmit(handler)
    api.setErrors({ non_field_errors: ['Session expired.'] })

    type('email', 'again@example.com')
    vi.advanceTimersByTime(100)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(api.getState().errors).toEqual({})
  })

  it('still reports detached errors from validate() outside a submit', () => {
    const api = form('login')
    api.setErrors({ non_field_errors: ['Nope.'] })

    expect(api.validate()).toEqual({
      isValid: false,
      errors: { non_field_errors: ['Nope.'] },
    })
    expect(api.getState().errors).toEqual({ non_field_errors: ['Nope.'] })
  })
})
