// Low-level DOM helpers used by the controller orchestrator and by api
// methods that need direct DOM access. Pure: no controller state.

import type { FormFieldElement, FormFieldValue, FormTarget } from './types'

const isFormFieldElement = (value: Element): value is FormFieldElement =>
  value instanceof HTMLInputElement ||
  value instanceof HTMLSelectElement ||
  value instanceof HTMLTextAreaElement

export const resolveFormElement = (target: FormTarget): HTMLFormElement | null => {
  if (!target) return null
  if (target instanceof HTMLFormElement) return target
  if (typeof target === 'string') {
    const node = document.getElementById(target)
    return node instanceof HTMLFormElement ? node : null
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

export const isFieldElement = (value: Element): value is FormFieldElement =>
  isFormFieldElement(value)

export const isFieldFilled = (field: FormFieldElement): boolean => {
  if (field instanceof HTMLInputElement) {
    if (field.type === 'checkbox' || field.type === 'radio') return field.checked
    if (field.type === 'file') return Boolean(field.files && field.files.length > 0)
    return field.value.trim() !== ''
  }
  return field.value !== ''
}

export const applyBooleanAttribute = (
  field: FormFieldElement,
  attribute: string,
  enabled: boolean
): void => {
  if (enabled) {
    field.setAttribute(attribute, '')
  } else {
    field.removeAttribute(attribute)
  }
}

export const readFieldValue = (fields: FormFieldElement[]): FormFieldValue => {
  if (fields.length === 0) return undefined
  const first = fields[0]
  if (!first) return undefined

  if (first instanceof HTMLSelectElement || first instanceof HTMLTextAreaElement) {
    return first.value
  }

  if (first instanceof HTMLInputElement) {
    if (first.type === 'radio') {
      const checked = fields.find(
        (f): f is HTMLInputElement =>
          f instanceof HTMLInputElement && f.checked
      )
      return checked?.value ?? ''
    }

    if (first.type === 'checkbox') {
      const values = fields
        .filter(
          (f): f is HTMLInputElement =>
            f instanceof HTMLInputElement && f.checked
        )
        .map(f => f.value)
      return values.length > 1 ? values : (values[0] ?? '')
    }

    if (first.type === 'file') {
      return first.files ? Array.from(first.files) : []
    }
  }

  return first.value
}

export const writeFieldValue = (fields: FormFieldElement[], value: unknown): void => {
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
        if (Array.isArray(value) && value.length === 0) field.value = ''
        continue
      }
      field.value = normalizedValue
      continue
    }

    field.value = normalizedValue
  }
}

export const clearAttributes = (form: HTMLFormElement, attributes: string[]): void => {
  for (const attribute of attributes) {
    form
      .querySelectorAll(`[${attribute}]`)
      .forEach(node => node.removeAttribute(attribute))
  }
}

export const submitForm = (form: HTMLFormElement): void => {
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
