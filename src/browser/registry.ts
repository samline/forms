// Vanilla mirror of the browser IIFE registry helpers.
// Module-level singleton: the same shape as `window.Forms`, but
// importable from any bundler. Consumers can spread it into their own
// globals (`{ ...browser, regex }`) or use it directly.
//
// The IIFE bundle (`./global.ts`) consumes this same object — single
// source of truth for the registry helpers.

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

export const browser: FormsApi = {
  form,
  newForm,
  destroyForm,
  available
}