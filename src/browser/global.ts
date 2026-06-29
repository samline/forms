// Browser entrypoint. Exposes a minimal surface as a single global
// accessible via `window.Forms` (or `globalThis.Forms`).
//
// Public shape:
//   - Forms.form(target, options)
//   - Forms.newForm({ id, options })
//   - Forms.destroyForm(id)
//   - Forms.available (registry keyed by form id)

import { form } from '../api/form'
import type {
  FormController,
  FormControllerOptions,
  FormTarget
} from '../core/types'

export interface NewFormInput {
  id: string
  options?: FormControllerOptions
}

export interface FormsAvailable {
  [id: string]: FormController
}

export interface FormsApi {
  form: (
    target: FormTarget,
    options?: FormControllerOptions
  ) => FormController
  newForm: (input: NewFormInput) => FormController | undefined
  destroyForm: (id: string) => void
  available: FormsAvailable
}

const available: FormsAvailable = {}

const newForm = (input: NewFormInput): FormController | undefined => {
  const { id, options } = input
  if (!id) {
    console.error('Form ID is required')
    return
  }
  const controller = form(id, { ...options })
  available[id] = controller
  return controller
}

const destroyForm = (id: string): void => {
  if (!id) {
    console.error('Form ID is required')
    return
  }
  const controller = available[id]
  if (controller) {
    controller.destroy()
    delete available[id]
  } else {
    console.warn(`Form with ID ${id} not found`)
  }
}

const Forms: FormsApi = {
  form,
  newForm,
  destroyForm,
  available
}

declare global {
  interface Window {
    Forms: FormsApi
  }
}

if (typeof globalThis !== 'undefined') {
  ;(globalThis as typeof globalThis & { Forms: FormsApi }).Forms = Forms
}

export default Forms