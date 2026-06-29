// api/on-submit.ts
// Registers a submit handler. preventDefault=true intercepts valid submits,
// which is the right choice for AJAX/fetch flows. Invalid submits are
// always prevented regardless of the flag.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { FormSubmitHandler } from '../core/types'

export const createOnSubmit =
  (state: FormControllerState, _helpers: FormControllerHelpers) =>
  (callback: FormSubmitHandler, preventDefault = true) => {
    state.submitHandlers.add({ callback, preventDefault })
    return state.api!
  }
