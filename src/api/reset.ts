// api/reset.ts
// Resets the native form, clears manual and validation errors, strips
// css-filled/css-error attributes, and notifies subscribers.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import { clearAttributes } from '../core/dom'
import { resetFormattedFields } from './format'

export const createReset =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  () => {
    if (!state.element) return state.api!

    state.element.reset()
    resetFormattedFields(state)
    state.manualErrors = {}
    state.validationErrors = {}
    clearAttributes(state.element, [
      state.attributes.error,
      state.attributes.filled,
      'aria-invalid'
    ])

    if (state.isValidated) helpers.syncVisualState()
    helpers.notifySubscribers()
    return state.api!
  }
