// api/get-data.ts
// Returns the form serialized as both a plain object and a fresh
// FormData instance. Empty file inputs are filtered out.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { SerializedFormResult } from '../core/types'
import { parseFormData } from '../core/serialize'

export const createGetData =
  (_state: FormControllerState, _helpers: FormControllerHelpers) =>
  (): SerializedFormResult => {
    if (!_state.element) return { data: {}, formData: new FormData() }
    return parseFormData(_state.element)
  }
