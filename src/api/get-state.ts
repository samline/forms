// api/get-state.ts
// Builds a snapshot of values, errors, filled fields and submission
// metadata. Pure read — does not mutate controller state.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { FormStateSnapshot } from '../core/types'
import { cloneErrors, createEmptyFormState } from '../core/state'

export const createGetState =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  (): FormStateSnapshot => {
    const values = helpers.getValues()
    const errors = cloneErrors(helpers.getMergedErrors())
    const filledFields = helpers.getTrackedFieldNames().filter(name => {
      const value = values[name]
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'string') return value.trim().length > 0
      return value !== undefined
    })

    return {
      ...createEmptyFormState(),
      values,
      errors,
      filledFields,
      isValid: Object.keys(errors).length === 0,
      isValidated: state.isValidated,
      autoSubmit: state.autoSubmitEnabled,
      submitCount: state.submitCount
    }
  }
