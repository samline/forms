// api/auto-submit.ts
// Enables native auto-submit. Pass `true` to enable, `false` to disable,
// or an { debounce } object to delay.

import type { FormControllerHelpers, FormControllerState } from '../core/state'

export const createAutoSubmit =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  (next: boolean | { debounce?: number } = true) => {
    state.autoSubmitEnabled = next !== false
    state.autoSubmitDebounce =
      typeof next === 'object' && next ? next.debounce ?? 0 : 0
    helpers.notifySubscribers()
    return state.api!
  }
