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
})