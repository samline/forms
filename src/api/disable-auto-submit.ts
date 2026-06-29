// api/disable-auto-submit.ts
// Disables autoSubmit and cancels any pending debounce timer.

import type { FormControllerHelpers, FormControllerState } from '../core/state'

export const createDisableAutoSubmit =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  () => {
    state.autoSubmitEnabled = false
    if (state.autoSubmitTimer) {
      clearTimeout(state.autoSubmitTimer)
      state.autoSubmitTimer = null
    }
    helpers.notifySubscribers()
    return state.api!
  }
