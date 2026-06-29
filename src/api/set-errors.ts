// api/set-errors.ts
// Sets manual errors. Accepts an array of field names (each gets a
// generic message) or a FormErrors map with per-field messages.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { FormErrors } from '../core/types'
import { cloneErrors } from '../core/state'

export const createSetErrors =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  (fields: string[] | FormErrors) => {
    if (Array.isArray(fields)) {
      state.manualErrors = {
        ...state.manualErrors,
        ...Object.fromEntries(fields.map(field => [field, ['Invalid value.']]))
      }
    } else {
      state.manualErrors = {
        ...state.manualErrors,
        ...cloneErrors(fields)
      }
    }

    helpers.syncVisualState(Array.isArray(fields) ? fields : Object.keys(fields))
    helpers.notifySubscribers()
    return state.api!
  }
