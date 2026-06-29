// api/prefill.ts
// Reads window.location.search and writes matching values into the form.
// Pass a field name to scope prefill to a single field.

import type { FormControllerHelpers, FormControllerState } from '../core/state'

export const createPrefill =
  (state: FormControllerState, _helpers: FormControllerHelpers) =>
  (fieldName?: string) => {
    if (!state.element) return state.api!

    const params = new URLSearchParams(window.location.search)
    params.forEach((value, key) => {
      if (fieldName && fieldName !== key) return
      state.api!.setValue(key, value)
    })
    return state.api!
  }
