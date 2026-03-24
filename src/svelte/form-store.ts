import { writable, type Readable } from 'svelte/store'

import { createEmptyFormState, type FormController, type FormControllerOptions, type FormStateSnapshot, type FormTarget } from '../core'
import { createFormController } from '../internal/controller'
import { resolveFormElement } from '../internal/dom'

export interface SvelteFormStore {
  state: Readable<FormStateSnapshot>
  ready: Readable<boolean>
  getController: () => FormController | null
  mount: () => void
  destroy: () => void
}

export interface FormActionOptions extends FormControllerOptions {
  onStateChange?: (state: FormStateSnapshot) => void
}

export const createFormStore = (
  target: FormTarget,
  options: FormControllerOptions = {}
): SvelteFormStore => {
  const state = writable<FormStateSnapshot>(createEmptyFormState())
  const ready = writable(false)
  let controller: FormController | null = null
  let unsubscribe: (() => void) | null = null

  const mount = () => {
    if (controller) {
      return
    }

    const element = resolveFormElement(target)
    if (!element) {
      return
    }

    controller = createFormController(element, options)
    state.set(controller.getState())
    ready.set(true)
    unsubscribe = controller.subscribe(nextState => {
      state.set(nextState)
    })
  }

  const destroy = () => {
    unsubscribe?.()
    unsubscribe = null
    controller?.destroy()
    controller = null
    ready.set(false)
    state.set(createEmptyFormState())
  }

  mount()

  return {
    state: { subscribe: state.subscribe },
    ready: { subscribe: ready.subscribe },
    getController: () => controller,
    mount,
    destroy
  }
}

export const formAction = (node: HTMLFormElement, options: FormActionOptions = {}) => {
  let controller = createFormController(node, options)
  let unsubscribe = controller.subscribe(state => {
    options.onStateChange?.(state)
  })

  return {
    update(nextOptions: FormActionOptions) {
      unsubscribe()
      controller.destroy()
      controller = createFormController(node, nextOptions)
      unsubscribe = controller.subscribe(state => {
        nextOptions.onStateChange?.(state)
      })
    },
    destroy() {
      unsubscribe()
      controller.destroy()
    }
  }
}