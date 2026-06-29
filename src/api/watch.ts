// api/watch.ts
// Chainable alias over `observe`. Use this when you want a fluent setup
// without holding the returned unsubscribe function.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { FormFieldWatcher } from '../core/types'
import { createObserve } from './observe'

export const createWatch = (state: FormControllerState, helpers: FormControllerHelpers) =>
  (field: string, callback: FormFieldWatcher) => {
    const observe = createObserve(state, helpers)
    observe(field, callback)
    return state.api!
  }
