// Pure serialization helpers for HTMLFormElement.
// No DOM mutation, no controller state — safe to tree-shake into any bundle.

import type { SerializedFormResult, SerializedFormValue } from './types'

const isEmptyFile = (value: FormDataEntryValue): value is File =>
  value instanceof File && value.size === 0 && value.name === ''

const appendValue = (
  data: Record<string, SerializedFormValue>,
  key: string,
  value: FormDataEntryValue
): void => {
  if (!Object.prototype.hasOwnProperty.call(data, key)) {
    Object.defineProperty(data, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true
    })
    return
  }
  const current = data[key] as SerializedFormValue
  if (Array.isArray(current)) {
    current.push(value)
    return
  }
  data[key] = [current, value]
}

export const parseFormData = (
  formElement: HTMLFormElement,
  submitter?: HTMLElement | null
): SerializedFormResult => {
  const raw = submitter
    ? new FormData(formElement, submitter)
    : new FormData(formElement)
  const formData = new FormData()
  const data: Record<string, SerializedFormValue> = {}

  raw.forEach((value, key) => {
    if (isEmptyFile(value)) return
    formData.append(key, value)
    appendValue(data, key, value)
  })

  return { data, formData }
}
