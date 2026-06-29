// Browser entrypoint. Exposes the same surface as `@samline/forms` but as
// a single global accessible via `window.forms` (or `globalThis.forms`).

import { createFormController } from '../core/controller'
import { parseFormData } from '../core/serialize'
import { validateFieldValue, validateValues } from '../core/validation'
import { form } from '../api/form'

const browserApi = {
  createFormController,
  form,
  parseFormData,
  validateFieldValue,
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
