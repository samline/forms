// api/set-value.ts
// Writes a value into a field and dispatches the correct DOM event so
// listeners, validators, and visual state run as if a user typed.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import { writeFieldValue } from '../core/dom'

export const createSetValue =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  (name: string, value: unknown) => {
    const fields = helpers.getFieldsByName(name)
    if (fields.length === 0) return state.api!

    writeFieldValue(fields, value)
    const firstField = fields[0]
    if (!firstField) return state.api!

    const eventType =
      firstField instanceof HTMLSelectElement ||
      (firstField instanceof HTMLInputElement &&
        (firstField.type === 'checkbox' || firstField.type === 'radio'))
        ? 'change'
        : 'input'

    firstField.dispatchEvent(new Event(eventType, { bubbles: true }))
    return state.api!
  }
