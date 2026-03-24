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
    SamlineForms: typeof browserApi
  }
}

if (typeof globalThis !== 'undefined') {
  ;(globalThis as typeof globalThis & { SamlineForms: typeof browserApi }).SamlineForms =
    browserApi
}

export default browserApi