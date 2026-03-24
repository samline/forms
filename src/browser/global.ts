import { parseFormData, validateValues } from '../core'
import { createFormController, form } from '../vanilla'

const browserApi = {
  createFormController,
  form,
  parseFormData,
  validateValues
}

declare global {
  interface Window {
    forms: typeof browserApi
  }
}

if (typeof globalThis !== 'undefined') {
  ;(globalThis as typeof globalThis & { forms: typeof browserApi }).forms =
    browserApi
}

export default browserApi