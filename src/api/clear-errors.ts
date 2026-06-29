// api/clear-errors.ts
// Clears manual errors. With no args, clears every manual error. With a
// list, clears only those fields.

import type { FormControllerHelpers, FormControllerState } from '../core/state'

export const createClearErrors =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  (fields?: string[]) => {
    if (!fields) {
      state.manualErrors = {}
      helpers.syncVisualState()
      helpers.notifySubscribers()
      return state.api!
    }

    for (const field of fields) {
      delete state.manualErrors[field]
    }
    helpers.syncVisualState(fields)
    helpers.notifySubscribers()
    return state.api!
  }
