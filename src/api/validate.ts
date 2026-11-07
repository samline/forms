// api/validate.ts
// Runs validation. Marks the form as validated, syncs visual state, and
// returns the validation result for callers that want it.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { ValidationResult } from '../core/types'

export const createValidate =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  (fields?: string[]): ValidationResult => {
    // A destroyed controller owns no errors; never repaint the form again.
    if (state.isDestroyed) return { isValid: true, errors: {} }
    state.isValidated = true
    // validateNames synchronizes visual state for the same field set.
    return helpers.validateNames(fields)
  }
