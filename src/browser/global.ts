// Browser entrypoint. Exposes a minimal surface as a single global
// accessible via `window.Forms` (or `globalThis.Forms`).
//
// Public shape:
//   - Forms.form(target, options)
//   - Forms.newForm({ id, options })
//   - Forms.destroyForm(id)
//   - Forms.available (registry keyed by form id)
//
// The IIFE bundle consumes the same `browser` singleton as the vanilla
// entrypoint — single source of truth for the registry helpers.

import { browser } from './registry'
import type { FormsApi } from './registry'

const Forms: FormsApi = browser

export const form = Forms.form
export const newForm = Forms.newForm
export const destroyForm = Forms.destroyForm
export const available = Forms.available

declare global {
  interface Window {
    Forms: FormsApi
  }
}

if (typeof globalThis !== 'undefined') {
  ;(globalThis as typeof globalThis & { Forms: FormsApi }).Forms = Forms
}

export default Forms
