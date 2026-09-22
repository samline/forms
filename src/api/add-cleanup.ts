// api/add-cleanup.ts
// Registers controller-owned teardown work and returns an unregister function.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { FormCleanup } from '../core/types'

export const createAddCleanup =
  (state: FormControllerState, _helpers: FormControllerHelpers) =>
  (cleanup: FormCleanup): (() => void) => {
    if (state.isDestroyed) {
      cleanup()
      return () => undefined
    }

    const registration = () => cleanup()
    state.cleanups.add(registration)
    let active = true
    return () => {
      if (!active) return
      active = false
      state.cleanups.delete(registration)
    }
  }
