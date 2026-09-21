import { beforeEach, describe, expect, it, vi } from 'vitest'

import { form } from '../../src/api/form'

const buildFixture = () => {
  document.body.innerHTML = `
    <form id="contact-form">
      <input type="text" name="name" />
      <input type="email" name="email" />
      <label>
        <input type="checkbox" name="interests" value="design" />
      </label>
      <label>
        <input type="checkbox" name="interests" value="code" />
      </label>
      <button type="submit">Send</button>
    </form>
  `
}

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0))

describe('form controller (integration)', () => {
  beforeEach(() => {
    buildFixture()
    window.history.replaceState({}, '', 'http://localhost/')
  })

  it('sets values, fires watchers and validates fields', () => {
    const callback = vi.fn()
    const api = form('contact-form', {
      validators: {
        email: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        }
      }
    })

    api.watch('email', callback)
    api.setValue('email', 'hello')

    expect(callback).toHaveBeenCalled()
    expect(api.getState().errors.email).toEqual([
      'Value does not match the required pattern.'
    ])

    api.setValue('email', 'hello@example.com')

    expect(api.getValue('email')).toBe('hello@example.com')
    expect(api.getState().errors.email).toBeUndefined()
    expect(
      (api.getField('email') as HTMLInputElement).hasAttribute('css-filled')
    ).toBe(true)
  })

  it('revalidates a sameAs field when its source changes', () => {
    const formElement = document.getElementById('contact-form')!
    formElement.insertAdjacentHTML(
      'beforeend',
      '<input type="password" name="password"><input type="password" name="password_confirmation">'
    )
    const api = form('contact-form', {
      validators: {
        password_confirmation: {
          sameAs: { value: 'password', message: 'Passwords do not match.' }
        }
      }
    })

    api.setValue('password', 'first-secret')
    api.setValue('password_confirmation', 'first-secret')
    expect(api.getState().errors.password_confirmation).toBeUndefined()

    api.setValue('password', 'changed-secret')
    expect(api.getState().errors.password_confirmation).toEqual([
      'Passwords do not match.'
    ])

    api.setValue('password_confirmation', 'changed-secret')
    expect(api.getState().errors.password_confirmation).toBeUndefined()
  })

  it('validates circular sameAs dependencies once per field and input event', () => {
    const formElement = document.getElementById('contact-form')!
    formElement.insertAdjacentHTML(
      'beforeend',
      '<input type="password" name="password"><input type="password" name="password_confirmation">'
    )
    const validatePassword = vi.fn(() => undefined)
    const validateConfirmation = vi.fn(() => undefined)
    const api = form('contact-form', {
      validators: {
        password: {
          sameAs: 'password_confirmation',
          validate: validatePassword
        },
        password_confirmation: {
          sameAs: 'password',
          validate: validateConfirmation
        }
      }
    })
    validatePassword.mockClear()
    validateConfirmation.mockClear()

    api.setValue('password', 'secret123')

    expect(validatePassword).toHaveBeenCalledTimes(1)
    expect(validateConfirmation).toHaveBeenCalledTimes(1)

    validatePassword.mockClear()
    validateConfirmation.mockClear()
    api.setValue('password_confirmation', 'different')

    expect(validatePassword).toHaveBeenCalledTimes(1)
    expect(validateConfirmation).toHaveBeenCalledTimes(1)
    expect(api.getState().errors.password).toEqual([
      'Value must match password_confirmation.'
    ])
    expect(api.getState().errors.password_confirmation).toEqual([
      'Value must match password.'
    ])
  })

  it('activates transitive sameAs dependencies after manual validation', () => {
    const formElement = document.getElementById('contact-form')!
    formElement.insertAdjacentHTML(
      'beforeend',
      '<input name="first"><input name="second"><input name="third">'
    )
    const validateFirst = vi.fn(() => undefined)
    const validateSecond = vi.fn(() => undefined)
    const api = form('contact-form', {
      autoValidate: false,
      validators: {
        first: { sameAs: 'second', validate: validateFirst },
        second: { sameAs: 'third', validate: validateSecond }
      }
    })

    api.setValue('third', 'before-validation')
    expect(validateFirst).not.toHaveBeenCalled()
    expect(validateSecond).not.toHaveBeenCalled()

    api.validate()
    validateFirst.mockClear()
    validateSecond.mockClear()
    api.setValue('third', 'after-validation')

    expect(validateFirst).toHaveBeenCalledTimes(1)
    expect(validateSecond).toHaveBeenCalledTimes(1)
  })

  it('serializes repeated fields and supports prefill', () => {
    window.history.replaceState(
      {},
      '',
      'http://localhost/?name=Sam&email=sam@example.com'
    )

    const api = form('contact-form')
    api.prefill()
    api.setValue('interests', ['design', 'code'])

    const { data } = api.getData()

    expect(data.name).toBe('Sam')
    expect(data.email).toBe('sam@example.com')
    expect(data.interests).toEqual(['design', 'code'])
  })

  it('does not invoke submit handlers when validation fails', () => {
    const onSubmit = vi.fn()
    const api = form('contact-form', {
      validators: { email: { required: true } }
    })

    api.onSubmit(onSubmit)

    const formElement = document.getElementById('contact-form') as HTMLFormElement
    formElement.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    )

    expect(onSubmit).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(api.getField('email'))
    expect((api.getField('email') as HTMLInputElement).getAttribute('aria-invalid')).toBe(
      'true'
    )

    api.setValue('email', 'sam@example.com')
    formElement.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    )

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect((api.getField('email') as HTMLInputElement).hasAttribute('aria-invalid')).toBe(
      false
    )
  })

  it('skips hidden invalid fields when focusing after submit', () => {
    const formElement = document.getElementById('contact-form') as HTMLFormElement
    formElement.insertAdjacentHTML('afterbegin', '<input type="hidden" name="token">')
    const api = form('contact-form', {
      validators: {
        token: { required: true },
        email: { required: true }
      }
    })

    formElement.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    expect(document.activeElement).toBe(api.getField('email'))
  })

  it('includes the submitter name and value in submitted data', () => {
    const api = form('contact-form')
    const onSubmit = vi.fn()
    const formElement = api.element!
    const button = formElement.querySelector('button')!
    button.name = 'action'
    button.value = 'save'
    api.onSubmit(onSubmit)

    formElement.dispatchEvent(
      new SubmitEvent('submit', {
        bubbles: true,
        cancelable: true,
        submitter: button
      })
    )

    expect(onSubmit).toHaveBeenCalledWith(
      formElement,
      expect.objectContaining({ action: 'save' }),
      expect.any(FormData),
      expect.anything()
    )
  })

  it('handles a checkbox interaction only once', () => {
    const api = form('contact-form')
    const watcher = vi.fn()
    api.watch('interests', watcher)
    watcher.mockClear()

    ;(api.getField('interests') as HTMLInputElement[])[0]?.click()

    expect(watcher).toHaveBeenCalledTimes(1)
  })

  it('runs the delegated pipeline when setValue writes a checkbox', () => {
    const api = form('contact-form')
    const watcher = vi.fn()
    api.watch('interests', watcher)
    watcher.mockClear()

    api.setValue('interests', ['design'])

    expect(watcher).toHaveBeenCalledTimes(1)
    expect(api.getValue('interests')).toBe('design')
  })

  it('tracks controls associated through the form attribute', () => {
    const external = document.createElement('input')
    external.name = 'outside'
    external.setAttribute('form', 'contact-form')
    document.body.appendChild(external)
    const api = form('contact-form')
    const watcher = vi.fn()
    api.watch('outside', watcher)
    watcher.mockClear()

    external.value = 'external value'
    external.dispatchEvent(new Event('input', { bubbles: true }))

    expect(api.getValue('outside')).toBe('external value')
    expect(api.getData().data.outside).toBe('external value')
    expect(watcher).toHaveBeenCalledTimes(1)
  })

  it('does not cache stale external associated controls', () => {
    const api = form('contact-form')
    expect(api.getValue('dynamic')).toBeUndefined()

    const external = document.createElement('input')
    external.name = 'dynamic'
    external.value = 'added'
    external.setAttribute('form', 'contact-form')
    document.body.appendChild(external)
    expect(api.getValue('dynamic')).toBe('added')

    external.remove()
    expect(api.getValue('dynamic')).toBeUndefined()
  })

  it('reads and writes all selected values in a multiple select', () => {
    const select = document.createElement('select')
    select.name = 'topics'
    select.multiple = true
    select.innerHTML = '<option value="a">A</option><option value="b">B</option>'
    document.getElementById('contact-form')?.appendChild(select)
    const api = form('contact-form')

    api.setValue('topics', ['a', 'b'])

    expect(api.getValue('topics')).toEqual(['a', 'b'])
    expect(Array.from(select.selectedOptions, option => option.value)).toEqual(['a', 'b'])
  })

  it('serializes reserved field names as own data properties', () => {
    const formElement = document.getElementById('contact-form')!
    formElement.insertAdjacentHTML(
      'beforeend',
      '<input name="constructor" value="ctor"><input name="__proto__" value="proto">'
    )
    const data = form('contact-form').getData().data

    expect(Object.keys(data)).toContain('constructor')
    expect(Object.keys(data)).toContain('__proto__')
    expect(data.constructor).toBe('ctor')
    expect(data.__proto__).toBe('proto')
  })

  it('supports class names that require CSS escaping in append()', () => {
    const api = form('contact-form')

    api.append({ tag: 'div', class: 'alert:error', content: 'first' })
    api.append({ tag: 'div', class: 'alert:error', content: 'second' })

    expect(api.element?.getElementsByClassName('alert:error')).toHaveLength(1)
    expect(api.element?.getElementsByClassName('alert:error')[0]?.textContent).toBe('second')
  })

  it('clears manual errors on change by default and keeps them when configured otherwise', () => {
    const api = form('contact-form', {
      autoValidate: false,
      validators: {
        email: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        }
      }
    })

    api.setErrors(['email', 'name'])
    api.setValue('email', 'sam@example.com')

    expect(api.getState().errors.email).toBeUndefined()
    expect(api.getState().errors.name).toEqual(['Invalid value.'])
  })

  it('replaces a cleared manual error with a validation error when the field is still invalid', () => {
    const api = form('contact-form', {
      validators: {
        email: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        }
      }
    })

    api.setErrors(['email'])
    api.setValue('email', 'invalid')

    expect(api.getState().errors.email).toEqual([
      'Value does not match the required pattern.'
    ])
  })

  it('keeps manual errors on change when clearManualErrorsOnChange is false', () => {
    const api = form('contact-form', {
      autoValidate: false,
      clearManualErrorsOnChange: false,
      validators: {
        email: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        }
      }
    })

    api.setErrors(['email'])
    api.setValue('email', 'sam@example.com')

    expect(api.getState().errors.email).toEqual(['Invalid value.'])
  })

  it('onSubmit with preventDefault=false lets the browser submit natively when valid', () => {
    const onSubmit = vi.fn()
    const api = form('contact-form')
    api.onSubmit(onSubmit, false)
    api.setValue('name', 'Sam')

    const formElement = document.getElementById('contact-form') as HTMLFormElement
    const event = new Event('submit', {
      bubbles: true,
      cancelable: true
    })
    formElement.dispatchEvent(event)

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(false)
  })

  it('onSubmit with preventDefault=false still prevents when validation fails', () => {
    const onSubmit = vi.fn()
    const api = form('contact-form', {
      validators: { name: { required: true } }
    })
    api.onSubmit(onSubmit, false)

    const formElement = document.getElementById('contact-form') as HTMLFormElement
    const event = new Event('submit', {
      bubbles: true,
      cancelable: true
    })
    formElement.dispatchEvent(event)

    expect(onSubmit).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
  })

  it('observe fires immediately and returns an unsubscribe', () => {
    const callback = vi.fn()
    const api = form('contact-form')

    const unsubscribe = api.observe('name', callback)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenLastCalledWith(
      '',
      expect.any(HTMLInputElement),
      expect.anything(),
      expect.anything()
    )

    api.setValue('name', 'Sam')
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith(
      'Sam',
      expect.any(HTMLInputElement),
      expect.anything(),
      expect.anything()
    )

    unsubscribe()
    api.setValue('name', 'Other')
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('subscribe receives initial state and updates', () => {
    const listener = vi.fn()
    const api = form('contact-form')

    const unsubscribe = api.subscribe(listener)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ submitCount: 0 })
    )

    api.setValue('name', 'Sam')
    expect(listener.mock.calls.length).toBeGreaterThanOrEqual(2)

    unsubscribe()
    const callsBefore = listener.mock.calls.length
    api.setValue('name', 'Other')
    expect(listener.mock.calls.length).toBe(callsBefore)
  })

  it('reset clears errors, attributes and values', () => {
    const api = form('contact-form', {
      validators: {
        email: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        }
      }
    })

    api.setValue('email', 'sam@example.com')
    api.setErrors(['name'])
    api.reset()

    expect(api.getState().errors).toEqual({})
    expect(api.getValue('name')).toBe('')
  })

  it('autoSubmit debounce fires form.requestSubmit after the delay', async () => {
    const submitSpy = vi
      .spyOn(HTMLFormElement.prototype, 'requestSubmit')
      .mockImplementation(() => undefined)

    const api = form('contact-form', {
      autoValidate: false,
      autoSubmit: { debounce: 10 }
    })

    api.setValue('name', 'Sam')

    expect(submitSpy).not.toHaveBeenCalled()
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(submitSpy).toHaveBeenCalled()

    api.destroy()
    submitSpy.mockRestore()
  })

  it('disableAutoSubmit cancels a pending debounce', async () => {
    const submitSpy = vi
      .spyOn(HTMLFormElement.prototype, 'requestSubmit')
      .mockImplementation(() => undefined)

    const api = form('contact-form', {
      autoValidate: false,
      autoSubmit: { debounce: 30 }
    })

    api.setValue('name', 'Sam')
    api.disableAutoSubmit()
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(submitSpy).not.toHaveBeenCalled()
    submitSpy.mockRestore()
  })

  it('autoSubmit(false) cancels a pending debounce', async () => {
    const submitSpy = vi
      .spyOn(HTMLFormElement.prototype, 'requestSubmit')
      .mockImplementation(() => undefined)
    const api = form('contact-form', {
      autoValidate: false,
      autoSubmit: { debounce: 30 }
    })

    api.setValue('name', 'Sam')
    api.autoSubmit(false)
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(submitSpy).not.toHaveBeenCalled()
    submitSpy.mockRestore()
  })

  it('destroy removes listeners and stops further notifications', () => {
    const listener = vi.fn()
    const api = form('contact-form')

    api.subscribe(listener)
    api.destroy()

    const callsBefore = listener.mock.calls.length
    const formElement = document.getElementById('contact-form') as HTMLFormElement
    formElement.dispatchEvent(
      new Event('input', { bubbles: true })
    )
    expect(listener.mock.calls.length).toBe(callsBefore)
  })

  it('clearErrors supports partial clearing', () => {
    const api = form('contact-form', { autoValidate: false })
    api.setErrors({ email: ['bad'], name: ['bad'] })

    api.clearErrors(['email'])
    expect(api.getState().errors.email).toBeUndefined()
    expect(api.getState().errors.name).toEqual(['bad'])

    api.clearErrors()
    expect(api.getState().errors).toEqual({})
  })
})
