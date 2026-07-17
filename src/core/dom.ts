// Low-level DOM helpers used by the controller orchestrator and by api
// methods that need direct DOM access. Pure: no controller state.

import type { FormFieldElement, FormFieldValue, FormTarget } from './types'

const isFormFieldElement = (value: Element): value is FormFieldElement =>
  value instanceof HTMLInputElement ||
  value instanceof HTMLSelectElement ||
  value instanceof HTMLTextAreaElement

// Convention: a name ending with "[]" signals multi-value inputs (the
// de facto HTML form pattern used by PHP, Rails, Express, Spring, etc.
// to collect repeated inputs as an array on the server). The `[]`
// suffix is the only signal the controller uses; bare names keep the
// original first-value semantics.
const isArraySyntax = (field: FormFieldElement): boolean =>
  typeof field.name === 'string' && field.name.endsWith('[]')

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

  // Multi-value inputs: name="foo[]". Only treat the group as an array
  // when there is more than one matching input — a single input with a
  // `[]` suffix still returns a plain string, matching the non-array
  // semantics and avoiding a one-element array that callers would
  // have to flatten.
  if (isArraySyntax(first) && fields.length > 1) {
    if (first instanceof HTMLSelectElement || first instanceof HTMLTextAreaElement) {
      return fields.map(f => f.value)
    }

    if (first instanceof HTMLInputElement) {
      if (first.type === 'radio') {
        // Radio groups stay single-valued even with the `[]` suffix —
        // they semantically mean "one of these". Find the checked one.
        const checked = fields.find(
          (f): f is HTMLInputElement =>
            f instanceof HTMLInputElement && f.checked
        )
        return checked?.value ?? ''
      }

      if (first.type === 'checkbox') {
        // Always return an array of checked values (no single-value
        // collapse) so `Array.isArray(value)` validators stay correct.
        return fields
          .filter(
            (f): f is HTMLInputElement =>
              f instanceof HTMLInputElement && f.checked
          )
          .map(f => f.value)
      }

      if (first.type === 'file') {
        // Concatenate every selected file across all matching inputs.
        return fields.flatMap(f =>
          f instanceof HTMLInputElement && f.files ? Array.from(f.files) : []
        )
      }
    }

    // text / email / password / number / hidden — one string per input.
    return fields.map(f => f.value)
  }

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

  // For `name="foo[]"` fields receiving an array, distribute one element
  // per input. Surplus inputs (more inputs than array elements) are
  // cleared to ''; surplus array elements (more elements than inputs)
  // are dropped — there's no input to write to. The distribution only
  // applies to text-like inputs; checkbox / radio / file keep their
  // own special semantics.
  const distributeArray =
    fields.length > 0 &&
    fields[0] !== undefined &&
    isArraySyntax(fields[0]) &&
    normalizedArray !== null

  for (let index = 0; index < fields.length; index++) {
    const field = fields[index]
    if (!field) continue

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
      if (distributeArray && normalizedArray) {
        field.value = normalizedArray[index] ?? ''
        continue
      }
      field.value = normalizedValue
      continue
    }

    if (distributeArray && normalizedArray) {
      field.value = normalizedArray[index] ?? ''
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
