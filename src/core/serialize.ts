import type { SerializedFormResult, SerializedFormValue } from './types'

const isEmptyFile = (value: FormDataEntryValue): value is File =>
  value instanceof File && value.size === 0 && value.name === ''

const appendValue = (
  data: Record<string, SerializedFormValue>,
  key: string,
  value: FormDataEntryValue
) => {
  const current = data[key]

  if (current === undefined) {
    data[key] = value
    return
  }

  if (Array.isArray(current)) {
    current.push(value)
    return
  }

  data[key] = [current, value]
}

export const parseFormData = (
  formElement: HTMLFormElement
): SerializedFormResult => {
  const rawFormData = new FormData(formElement)
  const formData = new FormData()
  const data: Record<string, SerializedFormValue> = {}

  rawFormData.forEach((value, key) => {
    if (isEmptyFile(value)) {
      return
    }

    formData.append(key, value)
    appendValue(data, key, value)
  })

  return { data, formData }
}