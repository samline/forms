import { describe, expect, it } from 'vitest'

import { validateFieldValue, validateValues } from '../../src/core/validation'

describe('validation', () => {
  it('validates required, minLength and custom validators', () => {
    const errors = validateFieldValue(
      'name',
      'ab',
      {
        required: true,
        minLength: 3,
        validate: ({ value }) =>
          typeof value === 'string' && value.startsWith('x')
            ? 'Cannot start with x.'
            : undefined
      },
      { name: 'ab' }
    )

    expect(errors).toEqual(['Minimum length is 3.'])
  })

  it('returns an error map for invalid values', () => {
    const result = validateValues(
      {
        email: 'invalid',
        terms: ''
      },
      {
        email: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        terms: {
          required: { value: true, message: 'Accept the terms.' }
        }
      }
    )

    expect(result.isValid).toBe(false)
    expect(result.errors.email).toEqual([
      'Value does not match the required pattern.'
    ])
    expect(result.errors.terms).toEqual(['Accept the terms.'])
  })

  it('resets stateful regular expressions between validations', () => {
    const pattern = /^a$/g

    expect(validateFieldValue('value', 'a', { pattern }, { value: 'a' })).toEqual([])
    expect(validateFieldValue('value', 'a', { pattern }, { value: 'a' })).toEqual([])
    expect(pattern.lastIndex).toBe(0)
  })

  it('validates matching fields with sameAs', () => {
    expect(
      validateFieldValue(
        'password_confirmation',
        'secret123',
        { sameAs: 'password' },
        { password: 'secret123', password_confirmation: 'secret123' }
      )
    ).toEqual([])

    expect(
      validateFieldValue(
        'password_confirmation',
        'different',
        {
          sameAs: { value: 'password', message: 'Passwords do not match.' }
        },
        { password: 'secret123', password_confirmation: 'different' }
      )
    ).toEqual(['Passwords do not match.'])
  })

  it('skips sameAs until both fields have values', () => {
    expect(
      validateFieldValue(
        'password_confirmation',
        '',
        { required: true, sameAs: 'password' },
        { password: 'secret123', password_confirmation: '' }
      )
    ).toEqual(['This field is required.'])

    expect(
      validateFieldValue(
        'password_confirmation',
        'secret123',
        { sameAs: 'password' },
        { password: '', password_confirmation: 'secret123' }
      )
    ).toEqual([])
  })

  it('compares array values by ordered contents', () => {
    expect(
      validateFieldValue(
        'confirmation',
        ['a', 'b'],
        { sameAs: 'original' },
        { original: ['a', 'b'], confirmation: ['a', 'b'] }
      )
    ).toEqual([])

    expect(
      validateFieldValue(
        'confirmation',
        ['b', 'a'],
        { sameAs: 'original' },
        { original: ['a', 'b'], confirmation: ['b', 'a'] }
      )
    ).toEqual(['Value must match original.'])
  })

  it('validates strict numeric values and inclusive ranges', () => {
    for (const value of ['12', '-12.5', '+12', '.5', '12.']) {
      expect(validateFieldValue('amount', value, { numeric: true }, { amount: value })).toEqual([])
    }

    for (const value of ['12px', '1e3', '0x10', '1,000', 'Infinity', 'NaN']) {
      expect(validateFieldValue('amount', value, { numeric: true }, { amount: value })).toEqual([
        'Value must be a number.'
      ])
    }

    expect(validateFieldValue('amount', '10', { min: 10, max: 20 }, { amount: '10' })).toEqual([])
    expect(validateFieldValue('amount', '21', { min: 10, max: 20 }, { amount: '21' })).toEqual([
      'Maximum value is 20.'
    ])
    expect(validateFieldValue('amount', '', { numeric: true, min: 10 }, { amount: '' })).toEqual([])
  })

  it('applies each rules to collection members with their indexes', () => {
    const indexes: number[] = []
    const result = validateValues(
      { emails: ['valid@example.com', 'invalid'] },
      {
        emails: {
          each: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            validate: ({ index }) => {
              indexes.push(index!)
              return undefined
            }
          }
        }
      }
    )

    expect(indexes).toEqual([0, 1])
    expect(result.errors.emails).toEqual(['Value does not match the required pattern.'])
  })
})
