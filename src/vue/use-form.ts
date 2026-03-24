import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  type ComputedRef,
  type Ref,
  type ShallowRef
} from 'vue'

import { createEmptyFormState, type FormController, type FormControllerOptions, type FormStateSnapshot, type FormTarget } from '../core'
import { createFormController } from '../internal/controller'
import { resolveFormElement } from '../internal/dom'

export interface VueUseFormResult {
  controller: ShallowRef<FormController | null>
  state: Ref<FormStateSnapshot>
  ready: ComputedRef<boolean>
  mount: () => void
  destroy: () => void
}

export const useForm = (
  target: FormTarget,
  options: FormControllerOptions = {}
): VueUseFormResult => {
  const controller = shallowRef<FormController | null>(null)
  const state = ref<FormStateSnapshot>(createEmptyFormState())
  let unsubscribe: (() => void) | null = null

  const mount = () => {
    if (controller.value) {
      return
    }

    const element = resolveFormElement(target)
    if (!element) {
      return
    }

    const nextController = createFormController(element, options)
    controller.value = nextController
    state.value = nextController.getState()
    unsubscribe = nextController.subscribe(nextState => {
      state.value = nextState
    })
  }

  const destroy = () => {
    unsubscribe?.()
    unsubscribe = null
    controller.value?.destroy()
    controller.value = null
    state.value = createEmptyFormState()
  }

  onMounted(mount)
  onBeforeUnmount(destroy)

  return {
    controller,
    state,
    ready: computed(() => controller.value !== null),
    mount,
    destroy
  }
}