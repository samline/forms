import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { form } from '../../src/api/form'
import {
  __resetFormatterLoaderForTests,
  __setFormatterModuleForTests,
  type FormatterModule
} from '../../src/core/formatter-loader'

// The formatter loader is exposed via `__setFormatterModuleForTests`
// so we can simulate both the "installed" and "missing" peer scenarios
// without going through a real dynamic import in jsdom.

const buildFixture = () => {
  document.body.innerHTML = `
    <form id="checkout-form">
      <input name="phone" />
      <input name="card" />
      <input name="amount" />
      <input name="notes" />
      <button type="submit">Send</button>
    </form>
  `
}

const phoneFormatter: FormatterModule = {
  format: (value, _type, _options) => {
    const digits = String(value ?? '').replace(/\D/g, '').slice(0, 10)
    const formatted =
      digits.length > 6
        ? `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`
        : digits.length > 2
        ? `${digits.slice(0, 2)} ${digits.slice(2)}`
        : digits
    return { formatted, raw: digits, type: 'phone' }
  }
}

const numeralFormatter: FormatterModule = {
  format: (value, _type, _options) => {
    const digits = String(value ?? '').replace(/[^\d.]/g, '')
    const formatted = digits
      ? Number(digits).toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        })
      : ''
    return { formatted, raw: digits, type: 'numeral' }
  }
}

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0))

describe('format() integration', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    buildFixture()
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    __resetFormatterLoaderForTests()
  })

  afterEach(() => {
    errorSpy.mockRestore()
    __resetFormatterLoaderForTests()
  })

  it('formats a single field and writes the raw value to an owned hidden mirror', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })

    const phoneField = api.getField('phone') as HTMLInputElement
    phoneField.value = '5512345678'
    phoneField.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    expect(phoneField.value).toBe('55 1234 5678')

    const mirror = api.getField('phoneRaw') as HTMLInputElement | null
    expect(mirror).not.toBeNull()
    expect(mirror?.type).toBe('hidden')
    expect(mirror?.value).toBe('5512345678')
    expect(mirror?.getAttribute('data-formatter-raw-for')).toBe('phone')
  })

  it('reuses an existing raw mirror and never duplicates it on re-bind', async () => {
    __setFormatterModuleForTests(phoneFormatter)

    const formElement = document.getElementById('checkout-form') as HTMLFormElement
    const preset = document.createElement('input')
    preset.type = 'hidden'
    preset.name = 'phoneRaw'
    formElement.appendChild(preset)

    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })

    const mirrors = formElement.querySelectorAll('input[name="phoneRaw"]')
    expect(mirrors.length).toBe(1)
    expect(mirrors[0]).toBe(preset)
  })

  it('formatAll applies the same configuration to several fields', async () => {
    __setFormatterModuleForTests(numeralFormatter)
    const api = form('checkout-form')
    api.formatAll({ type: 'numeral', field: ['card', 'amount'] })

    const card = api.getField('card') as HTMLInputElement
    const amount = api.getField('amount') as HTMLInputElement
    card.value = '1234'
    amount.value = '56789'
    card.dispatchEvent(new Event('input', { bubbles: true }))
    amount.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    expect(card.value).toBe('1,234')
    expect(amount.value).toBe('56,789')
    expect((api.getField('cardRaw') as HTMLInputElement | null)?.value).toBe('1234')
    expect((api.getField('amountRaw') as HTMLInputElement | null)?.value).toBe('56789')
  })

  it('preserves the caret position when typing at the end', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })

    const phoneField = api.getField('phone') as HTMLInputElement
    phoneField.value = '5512345678'
    phoneField.setSelectionRange(phoneField.value.length, phoneField.value.length)
    phoneField.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    expect(phoneField.value).toBe('55 1234 5678')
    expect(phoneField.selectionStart).toBe(phoneField.value.length)
    expect(phoneField.selectionEnd).toBe(phoneField.value.length)
  })

  it('preserves the caret position when typing at the start of a formatted value', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })

    const phoneField = api.getField('phone') as HTMLInputElement
    phoneField.value = '5512345678'
    phoneField.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    expect(phoneField.value).toBe('55 1234 5678')

    // Simulate the post-keystroke state: the user typed a '5' while
    // the caret was at index 0, so the input value is '5' + previous
    // content and the caret sits right after the inserted character
    // (at index 1). jsdom does not move the caret automatically when
    // we mutate `.value`, so we set it explicitly to mirror what the
    // browser would have produced.
    phoneField.value = '5' + phoneField.value
    phoneField.setSelectionRange(1, 1)
    phoneField.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    expect(phoneField.value).toBe('55 5123 4567')
    expect(phoneField.selectionStart).toBe(1)
  })

  it('cleans up owned mirrors and listeners on destroy()', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })
    await flush()

    const formElement = document.getElementById('checkout-form') as HTMLFormElement
    expect(
      formElement.querySelector('input[data-formatter-raw-for="phone"]')
    ).not.toBeNull()

    api.destroy()

    expect(
      formElement.querySelector('input[data-formatter-raw-for="phone"]')
    ).toBeNull()
  })

  it('keeps pre-existing raw mirrors untouched on destroy()', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const formElement = document.getElementById('checkout-form') as HTMLFormElement
    const preset = document.createElement('input')
    preset.type = 'hidden'
    preset.name = 'phoneRaw'
    preset.value = 'preloaded'
    formElement.appendChild(preset)

    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })
    await flush()
    api.destroy()

    expect(formElement.querySelector('input[name="phoneRaw"]')).toBe(preset)
    expect(preset.value).toBe('preloaded')
  })

  it('falls back to console.error + no-op when the peer is missing', async () => {
    __setFormatterModuleForTests(null)
    const api = form('checkout-form')
    const returned = api.format({ type: 'phone', field: 'phone' })
    await flush()

    expect(returned).toBe(api)
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0]?.[0]).toContain('@samline/formatter')

    const phoneField = api.getField('phone') as HTMLInputElement
    phoneField.value = '5512345678'
    phoneField.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    expect(phoneField.value).toBe('5512345678')
  })

  it('logs the missing-peer warning only once across multiple calls', async () => {
    __setFormatterModuleForTests(null)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })
    api.formatAll({ type: 'numeral', field: ['card', 'amount'] })
    api.format({ type: 'phone', field: 'phone' })
    await flush()

    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('applies declarative formats from FormControllerOptions on mount', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form', {
      formats: {
        phone: { type: 'phone', field: 'phone' }
      }
    })

    const phoneField = api.getField('phone') as HTMLInputElement
    phoneField.value = '5512345678'
    phoneField.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    expect(phoneField.value).toBe('55 1234 5678')
    expect((api.getField('phoneRaw') as HTMLInputElement | null)?.value).toBe('5512345678')
  })

  it('honours a custom rawField name', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone', rawField: 'phoneBackend' })

    const phoneField = api.getField('phone') as HTMLInputElement
    phoneField.value = '5512345678'
    phoneField.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    expect(
      (api.getField('phoneBackend') as HTMLInputElement | null)?.value
    ).toBe('5512345678')
    expect(api.getField('phoneRaw')).toBeNull()
  })
})