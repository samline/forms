// api/get-field.ts
// Returns the underlying DOM field(s) for a given name:
// - null when no field matches
// - a single element when there's exactly one
// - an array when there are multiple (radios, checkbox groups)

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { FormFieldElement } from '../core/types'

export const createGetField =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  (name: string): FormFieldElement | FormFieldElement[] | null => {
    const fields = helpers.getFieldsByName(name)
    if (fields.length === 0) return null
    return fields.length === 1 ? fields[0]! : fields
  }
