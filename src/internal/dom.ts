import type { FormFieldElement, FormFieldValue, FormTarget } from '../core/types'

const isFormFieldElement = (value: Element): value is FormFieldElement =>
  value instanceof HTMLInputElement ||
  value instanceof HTMLSelectElement ||
  value instanceof HTMLTextAreaElement

export const resolveFormElement = (target: FormTarget): HTMLFormElement | null => {
  if (!target) {
    return null
  }

  if (target instanceof HTMLFormElement) {
    return target
  }

  if (typeof target === 'string') {
    const element = document.getElementById(target)
    return element instanceof HTMLFormElement ? element : null
  }

  if ('current' in target) {
    return target.current instanceof HTMLFormElement ? target.current : null
  }

  return null
}

export const getNamedFields = (form: HTMLFormElement): FormFieldElement[] =>
  Array.from(form.querySelectorAll('input[name], select[name], textarea[name]')).filter(
    isFormFieldElement
  )

export const queryNamedFields = (
  form: HTMLFormElement,
  name: string
): FormFieldElement[] => getNamedFields(form).filter(field => field.name === name)

export const isFieldFilled = (field: FormFieldElement) => {
  if (field instanceof HTMLInputElement) {
    if (field.type === 'checkbox' || field.type === 'radio') {
      return field.checked
    }

    if (field.type === 'file') {
      return Boolean(field.files && field.files.length > 0)
    }

    return field.value.trim() !== ''
  }

  return field.value !== ''
}

export const applyBooleanAttribute = (
  field: FormFieldElement,
  attribute: string,
  enabled: boolean
) => {
  if (enabled) {
    field.setAttribute(attribute, '')
    return
  }

  field.removeAttribute(attribute)
}

export const readFieldValue = (
  fields: FormFieldElement[]
): FormFieldValue => {
  if (fields.length === 0) {
    return undefined
  }

  const firstField = fields[0]
  if (!firstField) {
    return undefined
  }

  if (firstField instanceof HTMLSelectElement || firstField instanceof HTMLTextAreaElement) {
    return firstField.value
  }

  if (firstField.type === 'radio') {
    const checked = fields.find(
      field => field instanceof HTMLInputElement && field.checked
    ) as HTMLInputElement | undefined

    return checked?.value ?? ''
  }

  if (firstField.type === 'checkbox') {
    const values = fields
      .filter(field => field instanceof HTMLInputElement && field.checked)
      .map(field => (field as HTMLInputElement).value)

    return values.length > 1 ? values : (values[0] ?? '')
  }

  if (firstField.type === 'file') {
    return firstField.files ? Array.from(firstField.files) : []
  }

  return firstField.value
}

export const writeFieldValue = (
  fields: FormFieldElement[],
  value: unknown
) => {
  const normalizedArray = Array.isArray(value)
    ? value.map(item => String(item))
    : null
  const normalizedValue = value === undefined || value === null ? '' : String(value)

  for (const field of fields) {
    if (field instanceof HTMLInputElement) {
      if (field.type === 'checkbox') {
        field.checked = normalizedArray
          ? normalizedArray.includes(field.value)
          : normalizedValue === field.value
        continue
      }

      if (field.type === 'radio') {
        field.checked = field.value === normalizedValue
        continue
      }

      if (field.type === 'file') {
        if (Array.isArray(value) && value.length === 0) {
          field.value = ''
        }
        continue
      }

      field.value = normalizedValue
      continue
    }

    field.value = normalizedValue
  }
}

export const clearAttributes = (
  form: HTMLFormElement,
  attributes: string[]
) => {
  for (const attribute of attributes) {
    form.querySelectorAll(`[${attribute}]`).forEach(element => {
      element.removeAttribute(attribute)
    })
  }
}

export const submitForm = (form: HTMLFormElement) => {
  if (typeof form.requestSubmit === 'function') {
    form.requestSubmit()
    return
  }

  const submitButton = form.querySelector(
    'button[type="submit"], input[type="submit"]'
  ) as HTMLButtonElement | HTMLInputElement | null

  if (submitButton) {
    submitButton.click()
    return
  }

  form.submit()
}