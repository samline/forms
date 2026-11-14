import * as formatter from '@samline/formatter'
import { isValidCurp, isValidIban, regex } from '@samline/formatter'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { form } from '../../src/api/form'
import { validateFieldValue } from '../../src/core/validation'
import {
  __resetFormatterLoaderForTests,
  __setFormatterModuleForTests,
  type FormatterModule
} from '../../src/core/formatter-loader'

// Uses the real @samline/formatter (>= 3.2.0) so the documented pairing of
// `regex` patterns and check-digit validators runs end to end.
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0))

const type = (input: HTMLInputElement, value: string) => {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('formatter 3.2 regex and check digits in validators', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="profile">
        <input name="email" />
        <input name="curp" />
        <input name="iban" />
        <input name="birthday" />
        <input name="price" />
      </form>
    `
    __resetFormatterLoaderForTests()
    __setFormatterModuleForTests(formatter as unknown as FormatterModule)
  })

  afterEach(() => __resetFormatterLoaderForTests())

  it('runs a Unicode regex entry through the pattern rule', () => {
    const rule = { pattern: { value: regex.email.pattern, message: regex.email.errorMessage } }
    expect(validateFieldValue('email', 'ana@correo.méx', rule, {})).toEqual([])
    expect(validateFieldValue('email', 'ana..lopez@correo.mx', rule, {})).toEqual([
      regex.email.errorMessage
    ])
  })

  it('pairs the shape pattern with the check digit in validate', () => {
    const rules = {
      curp: {
        pattern: { value: regex.curp.pattern, message: regex.curp.errorMessage },
        validate: ({ value }: { value: unknown }) =>
          isValidCurp(value) || 'The CURP check digit does not match.'
      }
    }
    expect(validateFieldValue('curp', 'GODE561231HDFRRN00', rules.curp, {})).toEqual([])
    // Right shape, wrong check digit: only `validate` catches it.
    expect(validateFieldValue('curp', 'GODE561231HDFRRN01', rules.curp, {})).toEqual([
      'The CURP check digit does not match.'
    ])
  })

  it('validates a formatted IBAN on its raw value with the canonical name', async () => {
    const api = form('profile', {
      formats: {
        iban: {
          type: 'general',
          field: 'iban',
          options: { blocks: [4, 4, 4, 4, 4, 4], delimiter: ' ' }
        }
      },
      validators: {
        iban: { validate: ({ value }) => isValidIban(value) || 'Check the IBAN.' }
      }
    })
    await flush()

    type(api.getField('iban_displayed') as HTMLInputElement, 'ES9121000418450200051332')
    await flush()
    expect(api.getValue('iban_displayed')).toBe('ES91 2100 0418 4502 0005 1332')
    expect(api.getValue('iban')).toBe('ES9121000418450200051332')

    api.validate()
    expect(api.getState().errors.iban).toBeUndefined()

    type(api.getField('iban_displayed') as HTMLInputElement, 'ES9121000418450200051333')
    await flush()
    api.validate()
    expect(api.getState().errors.iban).toEqual(['Check the IBAN.'])
  })

  it('matches a mask-aware date rule on the canonical value, which keeps the delimiters', async () => {
    const dateOptions = { datePattern: ['d', 'm', 'Y'], delimiter: '/' }
    const dateRule = regex.date(dateOptions)
    const api = form('profile', {
      formats: { birthday: { type: 'date', field: 'birthday', options: dateOptions } },
      validators: {
        birthday: { pattern: { value: dateRule.pattern, message: dateRule.errorMessage } }
      }
    })
    await flush()

    type(api.getField('birthday_displayed') as HTMLInputElement, '30042026')
    await flush()
    expect(api.getValue('birthday_displayed')).toBe('30/04/2026')
    expect(api.getValue('birthday')).toBe('30/04/2026')

    api.validate()
    expect(api.getState().errors.birthday).toBeUndefined()

    type(api.getField('birthday_displayed') as HTMLInputElement, '3004202')
    await flush()
    api.validate()
    expect(api.getState().errors.birthday).toEqual([dateRule.errorMessage])
  })
  it('reads the display value when a numeral mask rule must see the delimiters', async () => {
    const priceOptions = { delimiter: '.', numeralDecimalMark: ',', prefix: '€ ' }
    const priceRule = regex.numeral(priceOptions)
    const api = form('profile', {
      formats: { price: { type: 'numeral', field: 'price', options: priceOptions } },
      validators: {
        price: {
          validate: ({ values }) =>
            priceRule.pattern.test(String(values.price_displayed ?? '')) || priceRule.errorMessage
        }
      }
    })
    await flush()

    type(api.getField('price_displayed') as HTMLInputElement, '1234,5')
    await flush()
    expect(api.getValue('price_displayed')).toBe('€ 1.234,5')
    expect(api.getValue('price')).toBe('1234.5')
    expect(priceRule.pattern.test('1234.5')).toBe(false)

    api.validate()
    expect(api.getState().errors.price).toBeUndefined()
  })
})
