// api/get-value.ts
// Returns the current value of a field, with normalization for checkboxes,
// radios, files, and multi-value inputs.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { FormFieldValue } from '../core/types'
import { readFieldValue } from '../core/dom'

export const createGetValue =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  (name: string): FormFieldValue => readFieldValue(helpers.getFieldsByName(name))
