import { afterEach, describe, expect, it, vi } from 'vitest'

import { form } from '../../src/api/form'
import {
  __resetFormatterLoaderForTests,
  __setFormatterModuleForTests,
  loadFormatter,
  type FormatterModule
} from '../../src/core/formatter-loader'

afterEach(() => {
  __resetFormatterLoaderForTests()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('formatter 3 phone opt-in', () => {
  it('registers @samline/formatter/phone on demand for phone fields', async () => {
    const real = await import('@samline/formatter')
    expect(typeof real.isPhoneRegistered).toBe('function')

    document.body.innerHTML = `
      <form id="phone-form"><input name="phone" value="5512345678" /></form>
    `
    const api = form('phone-form')
    api.format({ type: 'phone', field: 'phone', options: { country: 'MX' } })
    const visible = document.querySelector<HTMLInputElement>('input[name="phone_displayed"]')
    const mirror = document.querySelector<HTMLInputElement>('input[type="hidden"][name="phone"]')
    // Loading libphonenumber-js is a real dynamic import: wait for it.
    await vi.waitFor(() => expect(visible?.value).toBe('55 1234 5678'), { timeout: 5000 })

    expect(real.isPhoneRegistered()).toBe(true)
    expect(mirror?.value).toBe('5512345678')
  })

  it('does not load phones for other types and treats 2.x as always ready', async () => {
    const legacy: FormatterModule = {
      format: value => ({ formatted: String(value), raw: String(value), type: 'phone' })
    }
    __setFormatterModuleForTests(legacy)
    await expect(loadFormatter({ phone: true })).resolves.toBe(legacy)

    const modern: FormatterModule = { ...legacy, isPhoneRegistered: vi.fn(() => false) }
    __setFormatterModuleForTests(modern)
    await expect(loadFormatter()).resolves.toBe(modern)
    expect(modern.isPhoneRegistered).not.toHaveBeenCalled()

    const ready: FormatterModule = { ...legacy, isPhoneRegistered: () => true }
    __setFormatterModuleForTests(ready)
    await expect(loadFormatter({ phone: true })).resolves.toBe(ready)
  })
})
