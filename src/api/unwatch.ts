// api/unwatch.ts
// Removes watched callbacks. With no args, clears every watcher. With only
// a field, removes all callbacks for that field. With field + callback,
// removes just that callback. A list of fields targets watchers registered
// with that same list (order and duplicates do not matter).

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { FormController, FormFieldsWatcher, FormFieldWatcher } from '../core/types'

const sameFields = (left: string[], right: Set<string>) =>
  left.length === right.size && left.every(name => right.has(name))

export const createUnwatch = (state: FormControllerState, _helpers: FormControllerHelpers) => {
  function unwatch(field?: string, callback?: FormFieldWatcher): FormController
  function unwatch(fields: string[], callback?: FormFieldsWatcher): FormController
  function unwatch(
    field?: string | string[],
    callback?: FormFieldWatcher | FormFieldsWatcher
  ): FormController {
    if (field === undefined || field === '') {
      state.watchedFields.clear()
      state.groupWatchers.clear()
      return state.api!
    }

    if (Array.isArray(field)) {
      const names = new Set(field)
      for (const entry of Array.from(state.groupWatchers)) {
        if (!sameFields(entry.fields, names)) continue
        if (callback && entry.callback !== callback) continue
        state.groupWatchers.delete(entry)
      }
      return state.api!
    }

    if (!callback) {
      state.watchedFields.delete(field)
      return state.api!
    }

    const callbacks = state.watchedFields.get(field)
    callbacks?.delete(callback as FormFieldWatcher)
    if (callbacks && callbacks.size === 0) {
      state.watchedFields.delete(field)
    }
    return state.api!
  }
  return unwatch
}
