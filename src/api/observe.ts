// api/observe.ts
// Registers a callback that runs on mount and whenever the field changes.
// Accepts one field name or a list of names. Returns an unsubscribe function.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { FormFieldsWatcher, FormFieldWatcher } from '../core/types'

const observeField = (state: FormControllerState, field: string, callback: FormFieldWatcher) => {
  const callbacks = state.watchedFields.get(field) ?? new Set<FormFieldWatcher>()
  callbacks.add(callback)
  state.watchedFields.set(field, callbacks)

  if (state.element) {
    callback(state.api!.getValue(field), state.api!.getField(field), state.element, state.api!.getState())
  }

  return () => {
    const current = state.watchedFields.get(field)
    current?.delete(callback)
    if (current && current.size === 0) {
      state.watchedFields.delete(field)
    }
  }
}

const observeFields = (
  state: FormControllerState,
  fields: string[],
  callback: FormFieldsWatcher
) => {
  const names = Array.from(new Set(fields))
  if (names.length === 0) return () => undefined
  const entry = { fields: names, callback }
  state.groupWatchers.add(entry)

  if (state.element) {
    const values = Object.fromEntries(names.map(name => [name, state.api!.getValue(name)]))
    callback(values, null, state.element, state.api!.getState())
  }

  return () => {
    state.groupWatchers.delete(entry)
  }
}

export const createObserve = (state: FormControllerState, _helpers: FormControllerHelpers) => {
  function observe(field: string, callback: FormFieldWatcher): () => void
  function observe(fields: string[], callback: FormFieldsWatcher): () => void
  function observe(field: string | string[], callback: FormFieldWatcher | FormFieldsWatcher) {
    if (state.isDestroyed) return () => undefined
    return Array.isArray(field)
      ? observeFields(state, field, callback as FormFieldsWatcher)
      : observeField(state, field, callback as FormFieldWatcher)
  }
  return observe
}
