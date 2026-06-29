// Pure validation routines. No DOM, no controller state.

import type {
  FieldValidationContext,
  FieldValidationRules,
  FormErrors,
  FormFieldValue,
  FormValues,
  RuleConfig,
  ValidationResult,
  ValidationSchema
} from './types'

const resolveRule = <T>(rule: RuleConfig<T> | undefined) => {
  if (rule === undefined) {
    return { value: undefined as T | undefined, message: undefined as string | undefined }
  }
  if (typeof rule === 'object' && rule !== null && 'value' in rule) {
    return { value: rule.value, message: rule.message }
  }
  return { value: rule, message: undefined as string | undefined }
}

const hasValue = (value: FormFieldValue): boolean => {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'string') return value.trim().length > 0
  return value !== undefined
}

const getValueLength = (value: FormFieldValue): number => {
  if (Array.isArray(value)) return value.length
  if (typeof value === 'string') return value.length
  return 0
}

const toPatternTarget = (value: FormFieldValue): string => {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value
      .map(entry => (typeof entry === 'string' ? entry : entry.name))
      .join(',')
  }
  return ''
}

export const validateFieldValue = (
  field: string,
  value: FormFieldValue,
  rules: FieldValidationRules,
  values: FormValues
): string[] => {
  const errors: string[] = []
  const context: FieldValidationContext = { field, value, values }
  const required = resolveRule(rules.required)
  const minLength = resolveRule(rules.minLength)
  const maxLength = resolveRule(rules.maxLength)
  const pattern = resolveRule(rules.pattern)

  if (required.value && !hasValue(value)) {
    errors.push(required.message ?? 'This field is required.')
  }
  if (minLength.value !== undefined && getValueLength(value) < minLength.value) {
    errors.push(minLength.message ?? `Minimum length is ${minLength.value}.`)
  }
  if (maxLength.value !== undefined && getValueLength(value) > maxLength.value) {
    errors.push(maxLength.message ?? `Maximum length is ${maxLength.value}.`)
  }
  if (pattern.value && hasValue(value) && !pattern.value.test(toPatternTarget(value))) {
    errors.push(pattern.message ?? 'Value does not match the required pattern.')
  }

  const custom = rules.validate
    ? Array.isArray(rules.validate)
      ? rules.validate
      : [rules.validate]
    : []

  for (const validator of custom) {
    const result = validator(context)
    if (typeof result === 'string' && result.length > 0) errors.push(result)
    if (result === false) errors.push('Validation failed.')
  }

  return errors
}

export const validateValues = (
  values: FormValues,
  schema: ValidationSchema
): ValidationResult => {
  const errors: FormErrors = {}
  for (const [field, rules] of Object.entries(schema)) {
    const messages = validateFieldValue(field, values[field], rules, values)
    if (messages.length > 0) errors[field] = messages
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
