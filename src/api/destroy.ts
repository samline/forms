// api/destroy.ts
// Tears down the controller: removes DOM listeners, disconnects the
// mutation observer, clears caches, and resets internal state.
// Safe to call multiple times.

import type { FormControllerHelpers, FormControllerState } from '../core/state'

export const createDestroy =
  (state: FormControllerState, _helpers: FormControllerHelpers) =>
  () => {
    if (state.isDestroyed) return

    state.isDestroyed = true
    for (const listener of state.listeners) {
      listener.element.removeEventListener(listener.type, listener.handler)
    }
    state.listeners.length = 0

    if (state.autoSubmitTimer) {
      clearTimeout(state.autoSubmitTimer)
      state.autoSubmitTimer = null
    }

    state.mutationObserver?.disconnect()
    state.mutationObserver = null
    state.watchedFields.clear()
    state.subscribers.clear()
    state.submitHandlers.clear()
    state.fieldCache.clear()
    state.manualErrors = {}
    state.validationErrors = {}
  }
