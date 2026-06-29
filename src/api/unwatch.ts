// api/unwatch.ts
// Removes watched callbacks. With no args, clears every watcher. With only
// a field, removes all callbacks for that field. With field + callback,
// removes just that callback.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { FormFieldWatcher } from '../core/types'

export const createUnwatch =
  (state: FormControllerState, _helpers: FormControllerHelpers) =>
  (field?: string, callback?: FormFieldWatcher) => {
    if (!field) {
      state.watchedFields.clear()
      return state.api!
    }

    if (!callback) {
      state.watchedFields.delete(field)
      return state.api!
    }

    const callbacks = state.watchedFields.get(field)
    callbacks?.delete(callback)
    if (callbacks && callbacks.size === 0) {
      state.watchedFields.delete(field)
    }
    return state.api!
  }
