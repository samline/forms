// api/form.ts
// Public entry point: the `form(target, options)` factory.
// Thin wrapper around the core orchestrator for ergonomic imports.

import { createFormController } from '../core/controller'
import type { FormControllerOptions, FormTarget } from '../core/types'

export const form = (
  target: FormTarget,
  options: FormControllerOptions = {}
) => createFormController(target, options)
