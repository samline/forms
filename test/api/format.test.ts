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
//
// The tests below cover the new mirror convention: a formatted field
// is exposed as a `<field>` hidden raw mirror (the canonical name) and
// a `<field>_displayed` visible input (configurable via
// `FieldFormatConfig.displayField`). Both names are first-class in the
// controller API — `getValue`/`getField`/`setValue`/`watch`/`getData`
// each return the value of the name they were given.

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

// Hardcoded DD/MM/YYYY formatter for the deletion-adjacent-to-delimiter
// tests. Mirrors the shape of `@samline/formatter`'s `date` mode but
// keeps the expected output string predictable so the caret math in the
// test is obvious to read.
const dateFormatter: FormatterModule = {
  format: (value, _type, _options) => {
    const digits = String(value ?? '').replace(/\D/g, '').slice(0, 8)
    let formatted = digits
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`
    }
    return { formatted, raw: digits, type: 'date' }
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

  it('renames the visible to <field>_displayed and creates a hidden <field> raw mirror', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })

    const formElement = document.getElementById('checkout-form') as HTMLFormElement
    const visible = formElement.querySelector<HTMLInputElement>(
      'input[name="phone_displayed"]'
    )
    const mirror = formElement.querySelector<HTMLInputElement>(
      'input[type="hidden"][name="phone"]'
    )

    expect(visible).not.toBeNull()
    expect(mirror).not.toBeNull()
    expect(mirror?.getAttribute('data-formatter-raw-for')).toBe('phone')
  })

  it('writes the raw value to the hidden mirror and the formatted value to the visible on input', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })

    const visible = api.getField('phone_displayed') as HTMLInputElement
    visible.value = '5512345678'
    visible.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    expect(visible.value).toBe('55 1234 5678')
    expect((api.getValue('phone') as string)).toBe('5512345678')
    expect((api.getValue('phone_displayed') as string)).toBe('55 1234 5678')
  })

  it('reuses a pre-authored hidden mirror and never duplicates it on re-bind', async () => {
    __setFormatterModuleForTests(phoneFormatter)

    const formElement = document.getElementById('checkout-form') as HTMLFormElement
    const preset = document.createElement('input')
    preset.type = 'hidden'
    preset.name = 'phone'
    preset.setAttribute('data-formatter-raw-for', 'phone')
    preset.value = 'preloaded'
    formElement.appendChild(preset)

    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })

    const mirrors = formElement.querySelectorAll<HTMLInputElement>(
      'input[type="hidden"][name="phone"]'
    )
    expect(mirrors.length).toBe(1)
    expect(mirrors[0]).toBe(preset)
    // The preset value is preserved across re-binding.
    expect(preset.value).toBe('preloaded')
  })

  it('respects a pre-authored visible with the displayField name (no rename)', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const formElement = document.getElementById('checkout-form') as HTMLFormElement
    // Replace the canonical input with one already named with the
    // display suffix, so format() should pick it up as-is and
    // just create the hidden.
    const authored = document.createElement('input')
    authored.name = 'phone_displayed'
    formElement.replaceChild(authored, formElement.querySelector('input[name="phone"]')!)

    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })

    expect(formElement.querySelectorAll('input[name="phone_displayed"]').length).toBe(1)
    expect(formElement.querySelectorAll('input[type="hidden"][name="phone"]').length).toBe(1)
  })

  it('formatAll applies the same configuration to several fields, each with its own pair', async () => {
    __setFormatterModuleForTests(numeralFormatter)
    const api = form('checkout-form')
    api.formatAll({ type: 'numeral', field: ['card', 'amount'] })

    const cardVisible = api.getField('card_displayed') as HTMLInputElement
    const amountVisible = api.getField('amount_displayed') as HTMLInputElement
    cardVisible.value = '1234'
    amountVisible.value = '56789'
    cardVisible.dispatchEvent(new Event('input', { bubbles: true }))
    amountVisible.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    expect(cardVisible.value).toBe('1,234')
    expect(amountVisible.value).toBe('56,789')
    expect(api.getValue('card')).toBe('1234')
    expect(api.getValue('amount')).toBe('56789')
    expect(api.getValue('card_displayed')).toBe('1,234')
    expect(api.getValue('amount_displayed')).toBe('56,789')
  })

  it('fires watchers on both the canonical and the display name on the same keystroke', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })
    await flush()

    const rawSeen: unknown[] = []
    const displayedSeen: unknown[] = []
    api.watch('phone', value => rawSeen.push(value))
    api.watch('phone_displayed', value => displayedSeen.push(value))

    const visible = api.getField('phone_displayed') as HTMLInputElement
    visible.value = '5512345678'
    visible.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    expect(rawSeen[rawSeen.length - 1]).toBe('5512345678')
    expect(displayedSeen[displayedSeen.length - 1]).toBe('55 1234 5678')
  })

  it('reformats the visible when setValue writes the canonical name', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })
    await flush()

    api.setValue('phone', '5512345678')

    expect(api.getValue('phone')).toBe('5512345678')
    expect(api.getValue('phone_displayed')).toBe('55 1234 5678')
  })

  it('reformats the mirror when setValue writes the display name', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })
    await flush()

    api.setValue('phone_displayed', '5512345678')

    expect(api.getValue('phone')).toBe('5512345678')
    expect(api.getValue('phone_displayed')).toBe('55 1234 5678')
  })

  it('exposes both fields in getData()', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })

    const visible = api.getField('phone_displayed') as HTMLInputElement
    visible.value = '5512345678'
    visible.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    const { data, formData } = api.getData()
    expect(data.phone).toBe('5512345678')
    expect(data.phone_displayed).toBe('55 1234 5678')
    expect(formData.get('phone')).toBe('5512345678')
    expect(formData.get('phone_displayed')).toBe('55 1234 5678')
  })

  it('preserves the caret position when typing at the end', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })

    const visible = api.getField('phone_displayed') as HTMLInputElement
    visible.value = '5512345678'
    visible.setSelectionRange(visible.value.length, visible.value.length)
    visible.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    expect(visible.value).toBe('55 1234 5678')
    expect(visible.selectionStart).toBe(visible.value.length)
    expect(visible.selectionEnd).toBe(visible.value.length)
  })

  it('preserves the caret position when typing at the start of a formatted value', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })

    const visible = api.getField('phone_displayed') as HTMLInputElement
    visible.value = '5512345678'
    visible.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    expect(visible.value).toBe('55 1234 5678')

    // Simulate the post-keystroke state: the user typed a '5' while
    // the caret was at index 0, so the input value is '5' + previous
    // content and the caret sits right after the inserted character
    // (at index 1). jsdom does not move the caret automatically when
    // we mutate `.value`, so we set it explicitly to mirror what the
    // browser would have produced.
    visible.value = '5' + visible.value
    visible.setSelectionRange(1, 1)
    visible.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    expect(visible.value).toBe('55 5123 4567')
    expect(visible.selectionStart).toBe(1)
  })

  it('cleans up owned mirrors, restores the visible name, and detaches listeners on destroy()', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })
    await flush()

    const formElement = document.getElementById('checkout-form') as HTMLFormElement
    expect(
      formElement.querySelector('input[data-formatter-raw-for="phone"]')
    ).not.toBeNull()
    expect(formElement.querySelector('input[name="phone_displayed"]')).not.toBeNull()

    api.destroy()

    expect(
      formElement.querySelector('input[data-formatter-raw-for="phone"]')
    ).toBeNull()
    // The visible's name is restored so the form goes back to the
    // developer's authored state.
    expect(formElement.querySelector('input[name="phone"]')).not.toBeNull()
    expect(formElement.querySelector('input[name="phone_displayed"]')).toBeNull()
  })

  it('keeps pre-existing raw mirrors untouched on destroy()', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const formElement = document.getElementById('checkout-form') as HTMLFormElement
    const preset = document.createElement('input')
    preset.type = 'hidden'
    preset.name = 'phone'
    preset.value = 'preloaded'
    formElement.appendChild(preset)

    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })
    await flush()
    api.destroy()

    // The preset has no `data-formatter-raw-for` attribute, so the
    // controller does not own it and leaves it alone on destroy().
    expect(formElement.querySelector('input[type="hidden"][name="phone"]')).toBe(preset)
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

    const formElement = document.getElementById('checkout-form') as HTMLFormElement
    // The visible was NOT renamed because the formatter is missing —
    // the no-op path leaves the DOM exactly as the developer
    // authored it.
    expect(formElement.querySelector('input[name="phone"]')).not.toBeNull()
    expect(formElement.querySelector('input[name="phone_displayed"]')).toBeNull()
    expect(
      formElement.querySelector('input[type="hidden"][data-formatter-raw-for="phone"]')
    ).toBeNull()
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

    const visible = api.getField('phone_displayed') as HTMLInputElement
    visible.value = '5512345678'
    visible.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    expect(visible.value).toBe('55 1234 5678')
    expect(api.getValue('phone')).toBe('5512345678')
  })

  it('honours a custom displayField name', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone', displayField: 'phoneVisible' })

    const visible = api.getField('phoneVisible') as HTMLInputElement
    visible.value = '5512345678'
    visible.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    expect(visible.value).toBe('55 1234 5678')
    expect(api.getValue('phone')).toBe('5512345678')
    // The default display suffix was not used.
    expect(api.getField('phone_displayed')).toBeNull()
  })

  // === postDelimiterBackspace contract ===
  // jsdom does not run a real keyboard stack, so each deletion test sets
  // the visible value + caret to the post-deletion state and then
  // dispatches an `InputEvent` with the appropriate `inputType`. The
  // controller reads `event.inputType` (the same field the browser
  // exposes on real InputEvent instances) and walks the caret backwards
  // past any leading delimiter so it never ends up "jumping" past one.

  const dispatchDeletion = (
    field: HTMLInputElement,
    inputType:
      | 'deleteContentBackward'
      | 'deleteContentForward'
      | 'deleteWordBackward'
  ) => {
    field.dispatchEvent(
      new InputEvent('input', { bubbles: true, inputType })
    )
  }

  it('pulls the caret back past a delimiter after deleteContentBackward removes the digit immediately after it', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })

    const visible = api.getField('phone_displayed') as HTMLInputElement
    visible.value = '5512345678'
    visible.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    expect(visible.value).toBe('55 1234 5678')

    // Simulate the browser's natural backspace at position 9 (between
    // `5` and `6`). The digit `5` at position 8 is removed; the caret
    // lands at position 8 (between the second ` ` and `6`).
    visible.value = '55 1234 678'
    visible.setSelectionRange(8, 8)
    dispatchDeletion(visible, 'deleteContentBackward')
    await flush()

    // Formatter is idempotent on already-formatted input — the visible
    // value stays `55 1234 678`. The postDelimiterBackspace scan pulls
    // the caret from 8 (with ` ` on its left) back to 7 (between `4`
    // and ` `), so the next backspace deletes a digit, not a delimiter.
    expect(visible.value).toBe('55 1234 678')
    expect(visible.selectionStart).toBe(7)
  })

  it('re-anchors the caret after deleteContentBackward removes a delimiter itself', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })

    const visible = api.getField('phone_displayed') as HTMLInputElement
    visible.value = '5512345678'
    visible.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    // Simulate the browser's natural backspace at position 8 (between
    // the second ` ` and `5`): the ` ` at position 7 is removed; the
    // caret lands at 7.
    visible.value = '55 12345678'
    visible.setSelectionRange(7, 7)
    dispatchDeletion(visible, 'deleteContentBackward')
    await flush()

    // Formatter re-inserts the delimiter (` `) at position 7. Caret
    // stays at 7 — between `4` and the re-inserted ` ` — so the next
    // backspace deletes `4`, not the delimiter.
    expect(visible.value).toBe('55 1234 5678')
    expect(visible.selectionStart).toBe(7)
  })

  it('re-anchors the caret after deleteWordBackward in the middle of a formatted value', async () => {
    __setFormatterModuleForTests(phoneFormatter)
    const api = form('checkout-form')
    api.format({ type: 'phone', field: 'phone' })

    const visible = api.getField('phone_displayed') as HTMLInputElement
    visible.value = '5512345678'
    visible.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    // Simulate Cmd+Backspace at position 10 (between `6` and `7`). In
    // real browsers `deleteWordBackward` deletes the trailing word plus
    // its leading delimiter; we simulate the resulting state directly:
    // value `55 123458` (9 chars), caret at 7 (between `4` and `5`).
    visible.value = '55 123458'
    visible.setSelectionRange(7, 7)
    dispatchDeletion(visible, 'deleteWordBackward')
    await flush()

    // Formatter re-formats `55 123458` → `55 1234 58` (10 chars),
    // re-inserting the delimiter at position 7. Caret stays at 7
    // (between `4` and the re-inserted ` `) — the postDelimiterBackspace
    // scan would have pulled it back to 6 if the formatter had landed
    // one position earlier, but the cleave-style count matches the new
    // value's digit layout, so the scan correctly leaves the caret
    // anchored just before the re-inserted delimiter.
    expect(visible.value).toBe('55 1234 58')
    expect(visible.selectionStart).toBe(7)
  })

  it('pulls the caret back past the first slash when the cursor is parked after it in a DD/MM/YYYY date field', async () => {
    __setFormatterModuleForTests(dateFormatter)
    const api = form('checkout-form')
    api.format({ type: 'date', field: 'phone' })

    const visible = api.getField('phone_displayed') as HTMLInputElement
    visible.value = '12345678'
    visible.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    expect(visible.value).toBe('12/34/5678')

    // Cursor parked right after the first `/` (position 3). Backspace
    // removes the `/`; the browser leaves the caret at position 2
    // (between `2` and the deleted position).
    visible.value = '1234/5678'
    visible.setSelectionRange(2, 2)
    dispatchDeletion(visible, 'deleteContentBackward')
    await flush()

    // Formatter re-formats to `12/34/5678`, re-inserting the `/`. Caret
    // stays at 2 — between `2` and the re-inserted `/` — so the next
    // backspace deletes `2`, not the slash.
    expect(visible.value).toBe('12/34/5678')
    expect(visible.selectionStart).toBe(2)
  })
})
