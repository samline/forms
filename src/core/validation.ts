// Pure validation routines. No DOM, no controller state.

import type {
  FieldValidationContext,
  FieldValidationRules,
  FormErrors,
  FormFieldValue,
  FormValues,
  RuleConfig,
  ValueValidationRules,
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

const valuesAreEqual = (left: FormFieldValue, right: FormFieldValue): boolean => {
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((entry, index) => entry === right[index])
  }
  return left === right
}

const DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/

const parseStrictNumber = (value: FormFieldValue): number | undefined => {
  if (typeof value !== 'string') return undefined
  const candidate = value.trim()
  if (!DECIMAL_PATTERN.test(candidate)) return undefined
  const number = Number(candidate)
  return Number.isFinite(number) ? number : undefined
}

export interface FieldValidationItem {
  value: FormFieldValue
  element?: import('./types').FormFieldElement
}

export interface DetailedValidationResult {
  groupErrors: string[]
  itemErrors: Array<{
    index: number
    element?: import('./types').FormFieldElement
    messages: string[]
  }>
}

const validateValue = (
  field: string,
  value: FormFieldValue,
  rules: ValueValidationRules,
  values: FormValues,
  contextOverrides: Partial<Pick<FieldValidationContext, 'element' | 'index'>> = {}
): string[] => {
  const errors: string[] = []
  const context: FieldValidationContext = {
    field,
    value,
    values,
    ...contextOverrides
  }
  const required = resolveRule(rules.required)
  const minLength = resolveRule(rules.minLength)
  const maxLength = resolveRule(rules.maxLength)
  const pattern = resolveRule(rules.pattern)
  const numeric = resolveRule(rules.numeric)
  const min = resolveRule(rules.min)
  const max = resolveRule(rules.max)

  if (required.value && !hasValue(value)) {
    errors.push(required.message ?? 'This field is required.')
  }
  if (minLength.value !== undefined && getValueLength(value) < minLength.value) {
    errors.push(minLength.message ?? `Minimum length is ${minLength.value}.`)
  }
  if (maxLength.value !== undefined && getValueLength(value) > maxLength.value) {
    errors.push(maxLength.message ?? `Maximum length is ${maxLength.value}.`)
  }
  if (pattern.value && hasValue(value)) {
    pattern.value.lastIndex = 0
    const matches = pattern.value.test(toPatternTarget(value))
    pattern.value.lastIndex = 0
    if (!matches) {
      errors.push(pattern.message ?? 'Value does not match the required pattern.')
    }
  }

  if (hasValue(value) && (numeric.value || min.value !== undefined || max.value !== undefined)) {
    const number = parseStrictNumber(value)
    if (number === undefined) {
      errors.push(numeric.message ?? 'Value must be a number.')
    } else {
      if (min.value !== undefined && number < min.value) {
        errors.push(min.message ?? `Minimum value is ${min.value}.`)
      }
      if (max.value !== undefined && number > max.value) {
        errors.push(max.message ?? `Maximum value is ${max.value}.`)
      }
    }
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

export const validateFieldValueDetailed = (
  field: string,
  value: FormFieldValue,
  rules: FieldValidationRules,
  values: FormValues,
  items?: FieldValidationItem[]
): DetailedValidationResult => {
  const groupErrors = validateValue(field, value, rules, values)
  const sameAs = resolveRule(rules.sameAs)

  if (sameAs.value !== undefined) {
    const otherValue = values[sameAs.value]
    if (hasValue(value) && hasValue(otherValue) && !valuesAreEqual(value, otherValue)) {
      groupErrors.push(sameAs.message ?? `Value must match ${sameAs.value}.`)
    }
  }

  const itemErrors: DetailedValidationResult['itemErrors'] = []
  if (rules.each) {
    const sourceItems: FieldValidationItem[] =
      items ??
      (Array.isArray(value)
        ? value.map(entry => ({
            value: typeof entry === 'string' ? entry : ([entry] as File[])
          }))
        : [{ value }])

    sourceItems.forEach((item, index) => {
      const overrides: Partial<Pick<FieldValidationContext, 'element' | 'index'>> = {
        index
      }
      if (item.element) overrides.element = item.element
      const messages = validateValue(field, item.value, rules.each!, values, overrides)
      if (messages.length === 0) return
      const error: DetailedValidationResult['itemErrors'][number] = {
        index,
        messages
      }
      if (item.element) error.element = item.element
      itemErrors.push(error)
    })
  }

  return { groupErrors, itemErrors }
}

export const validateFieldValue = (
  field: string,
  value: FormFieldValue,
  rules: FieldValidationRules,
  values: FormValues
): string[] => {
  const result = validateFieldValueDetailed(field, value, rules, values)
  return [...result.groupErrors, ...result.itemErrors.flatMap(item => item.messages)]
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
