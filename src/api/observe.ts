// api/observe.ts
// Registers a callback that runs on mount and whenever the field changes.
// Returns an unsubscribe function.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { FormFieldWatcher } from '../core/types'

export const createObserve =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  (field: string, callback: FormFieldWatcher) => {
    const callbacks = state.watchedFields.get(field) ?? new Set<FormFieldWatcher>()
    callbacks.add(callback)
    state.watchedFields.set(field, callbacks)

    if (state.element) {
      callback(state.api!.getValue(field), state.element, state.api!.getState())
    }

    return () => {
      const current = state.watchedFields.get(field)
      current?.delete(callback)
      if (current && current.size === 0) {
        state.watchedFields.delete(field)
      }
    }
  }
