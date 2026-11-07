// api/prefill.ts
// Reads window.location.search and writes matching values into the form.
// Pass a field name to scope prefill to a single field. Repeated keys
// (`?tags[]=a&tags[]=b`) are written together as one array.

import type { FormControllerHelpers, FormControllerState } from '../core/state'

export const createPrefill =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  (fieldName?: string) => {
    if (!state.element || state.isDestroyed) return state.api!

    const params = new URLSearchParams(window.location.search)
    const keys = Array.from(new Set(params.keys())).filter(
      key => !fieldName || fieldName === key
    )
    if (keys.length === 0) return state.api!

    // Every written field still runs the delegated pipeline (watchers,
    // validation, visual state); auto-submit waits for the whole batch.
    state.autoSubmitSuspended = true
    try {
      for (const key of keys) {
        const values = params.getAll(key)
        state.api!.setValue(key, values.length > 1 ? values : values[0])
      }
    } finally {
      state.autoSubmitSuspended = false
    }
    helpers.scheduleAutoSubmit()
    return state.api!
  }
