// api/subscribe.ts
// Subscribes to global form state. Listener fires once immediately with
// the current snapshot, then on every state mutation. Returns an
// unsubscribe function.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { FormStateListener } from '../core/types'

export const createSubscribe =
  (state: FormControllerState, _helpers: FormControllerHelpers) =>
  (listener: FormStateListener) => {
    state.subscribers.add(listener)
    listener(state.api!.getState())
    return () => {
      state.subscribers.delete(listener)
    }
  }
