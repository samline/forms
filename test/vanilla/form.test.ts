import { beforeEach, describe, expect, it, vi } from 'vitest'

import { form } from '../../src/vanilla'

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

describe('form controller', () => {
  beforeEach(() => {
    buildFixture()
    window.history.replaceState({}, '', 'http://localhost/')
  })

  it('sets values, tracks watchers and validates fields', () => {
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
    expect((api.getField('email') as HTMLInputElement).hasAttribute('css-filled')).toBe(
      true
    )
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

  it('prevents submit callbacks when validation fails', () => {
    const onSubmit = vi.fn()
    const api = form('contact-form', {
      validators: {
        email: { required: true }
      }
    })

    api.onSubmit(onSubmit)

    const formElement = document.getElementById('contact-form') as HTMLFormElement
    formElement.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    expect(onSubmit).not.toHaveBeenCalled()

    api.setValue('email', 'sam@example.com')
    formElement.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('clears manual errors for the changed field by default', () => {
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
})