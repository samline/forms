// api/validate.ts
// Runs validation. Marks the form as validated, syncs visual state, and
// returns the validation result for callers that want it.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { ValidationResult } from '../core/types'

export const createValidate =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  (fields?: string[]): ValidationResult => {
    state.isValidated = true
    helpers.syncVisualState(fields)
    return helpers.validateNames(fields)
  }
