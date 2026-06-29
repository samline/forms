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

    api.setValue('email', 'sam@example.com')
    formElement.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    )

    expect(onSubmit).toHaveBeenCalledTimes(1)
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
      expect.anything(),
      expect.anything()
    )

    api.setValue('name', 'Sam')
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith(
      'Sam',
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
