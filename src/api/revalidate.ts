// api/revalidate.ts
// Alias of validate(); kept separate for readability at call sites that
// want to express "re-run validation now".

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import { createValidate } from './validate'

export const createRevalidate = createValidate
