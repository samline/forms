import type { FormControllerOptions, FormTarget } from '../core'
import { createFormController } from '../internal/controller'

export const form = (
  target: FormTarget,
  options?: FormControllerOptions
) => createFormController(target, options)

export { createFormController }