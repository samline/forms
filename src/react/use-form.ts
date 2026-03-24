import { useEffect, useState } from 'react'

import { createEmptyFormState, type FormController, type FormControllerOptions, type FormStateSnapshot, type FormTarget } from '../core'
import { createFormController } from '../internal/controller'
import { resolveFormElement } from '../internal/dom'

export interface ReactUseFormResult {
  controller: FormController | null
  state: FormStateSnapshot
  ready: boolean
}

export const useForm = (
  target: FormTarget,
  options: FormControllerOptions = {}
): ReactUseFormResult => {
  const [controller, setController] = useState<FormController | null>(null)
  const [state, setState] = useState<FormStateSnapshot>(createEmptyFormState())

  useEffect(() => {
    const element = resolveFormElement(target)
    if (!element) {
      setController(null)
      setState(createEmptyFormState())
      return
    }

    const nextController = createFormController(element, options)
    setController(nextController)
    setState(nextController.getState())

    const unsubscribe = nextController.subscribe(nextState => {
      setState(nextState)
    })

    return () => {
      unsubscribe()
      nextController.destroy()
      setController(null)
      setState(createEmptyFormState())
    }
  }, [target])

  return {
    controller,
    state,
    ready: controller !== null
  }
}