import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { form } from '../../src/api/form'
import { browser } from '../../src/browser/registry'

const buildFixture = () => {
  document.body.innerHTML = `
    <form id="contact-form">
      <input type="text" name="name" />
      <input type="email" name="email" />
      <button type="submit">Send</button>
    </form>
    <form id="login-form">
      <input type="email" name="email" />
      <input type="password" name="password" />
      <button type="submit">Sign in</button>
    </form>
  `
}

// `browser.available` is a module-level singleton, so tests reset it
// in `beforeEach` / `afterEach` to stay isolated.
const resetRegistry = () => {
  for (const id of Object.keys(browser.available)) {
    const controller = browser.available[id]
    if (controller) controller.destroy()
    delete browser.available[id]
  }
}

describe('browser singleton', () => {
  beforeEach(() => {
    buildFixture()
    resetRegistry()
  })

  afterEach(() => {
    resetRegistry()
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('exposes form, newForm, destroyForm and available', () => {
    expect(typeof browser.form).toBe('function')
    expect(typeof browser.newForm).toBe('function')
    expect(typeof browser.destroyForm).toBe('function')
    expect(browser.available).toEqual({})
  })

  it('exposes the same `form` reference as the api/form export', () => {
    expect(browser.form).toBe(form)
  })

  it('newForm stores the controller under available[id]', () => {
    const controller = browser.newForm({ id: 'contact-form' })

    expect(controller).toBeDefined()
    expect(browser.available['contact-form']).toBe(controller)
  })

  it('newForm logs an error and returns undefined when id is missing', () => {
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const result = browser.newForm({
      id: '',
      options: { validators: { name: { required: true } } }
    })

    expect(result).toBeUndefined()
    expect(errorSpy).toHaveBeenCalledWith('Form ID is required')
    expect(browser.available).toEqual({})
  })

  it('newForm forwards options to the underlying form factory', () => {
    const controller = browser.newForm({
      id: 'contact-form',
      options: {
        autoValidate: false,
        validators: { name: { required: true } }
      }
    })

    expect(controller).toBeDefined()
    if (!controller) throw new Error('expected controller')
    expect(controller.options.autoValidate).toBe(false)
    expect(controller.options.validators).toEqual({
      name: { required: true }
    })
  })

  it('destroyForm calls destroy() and removes the entry', () => {
    const controller = browser.newForm({ id: 'contact-form' })
    if (!controller) throw new Error('expected controller')
    const destroySpy = vi.spyOn(controller, 'destroy')

    browser.destroyForm('contact-form')

    expect(destroySpy).toHaveBeenCalledTimes(1)
    expect(browser.available).toEqual({})
  })

  it('destroyForm logs an error when id is missing', () => {
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    browser.destroyForm('')

    expect(errorSpy).toHaveBeenCalledWith('Form ID is required')
  })

  it('destroyForm warns when the id is not registered', () => {
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)

    browser.destroyForm('ghost-form')

    expect(warnSpy).toHaveBeenCalledWith(
      'Form with ID ghost-form not found'
    )
  })

  it('spread into a custom global keeps newForm / destroyForm / available', () => {
    const regex = { email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }

    const customGlobal = { ...browser, regex }

    const controller = customGlobal.newForm({ id: 'contact-form' })
    expect(controller).toBeDefined()
    expect(customGlobal.available['contact-form']).toBe(controller)
    expect(customGlobal.regex).toBe(regex)

    customGlobal.destroyForm('contact-form')
    expect(customGlobal.available).toEqual({})
    // Same reference: the original singleton sees the cleaned registry too.
    expect(browser.available).toEqual({})
  })

  it('supports multiple ids in the same registry', () => {
    browser.newForm({ id: 'contact-form' })
    browser.newForm({ id: 'login-form' })

    expect(Object.keys(browser.available).sort()).toEqual([
      'contact-form',
      'login-form'
    ])

    browser.destroyForm('contact-form')
    expect(Object.keys(browser.available)).toEqual(['login-form'])
  })

  it('persists state across calls within a single test', () => {
    // Confirms the beforeEach reset cleared any leftover from the
    // previous case before this one ran.
    browser.newForm({ id: 'contact-form' })
    expect(Object.keys(browser.available)).toEqual(['contact-form'])
  })
})