// api/reset.ts
// Resets the native form, clears manual and validation errors, strips
// css-filled/css-error attributes, re-emits field watchers and notifies
// subscribers. Native reset buttons run the same state pass.

import type { FormControllerHelpers, FormControllerState } from '../core/state'

export const createReset =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  () => {
    if (!state.element || state.isDestroyed) return state.api!

    state.isResetting = true
    try {
      state.element.reset()
    } finally {
      state.isResetting = false
    }
    helpers.applyReset()
    return state.api!
  }
