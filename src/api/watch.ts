// api/watch.ts
// Chainable alias over `observe`. Use this when you want a fluent setup
// without holding the returned unsubscribe function.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { FormController, FormFieldsWatcher, FormFieldWatcher } from '../core/types'
import { createObserve } from './observe'

export const createWatch = (state: FormControllerState, helpers: FormControllerHelpers) => {
  const observe = createObserve(state, helpers)
  function watch(field: string, callback: FormFieldWatcher): FormController
  function watch(fields: string[], callback: FormFieldsWatcher): FormController
  function watch(field: string | string[], callback: FormFieldWatcher | FormFieldsWatcher) {
    if (Array.isArray(field)) observe(field, callback as FormFieldsWatcher)
    else observe(field, callback as FormFieldWatcher)
    return state.api!
  }
  return watch
}
