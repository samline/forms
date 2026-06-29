// Shared mutable state for the controller plus the small pure helpers used
// by both core utilities and the api method factories.

import type {
  FormController,
  FormControllerOptions,
  FormErrors,
  FormFieldElement,
  FormFieldWatcher,
  FormStateListener,
  FormStateSnapshot,
  FormValues,
  ValidationResult,
  ValidationSchema,
  VisualAttributes
} from './types'

export interface FormControllerState {
  element: HTMLFormElement | null
  options: FormControllerOptions
  attributes: Required<VisualAttributes>
  validators: ValidationSchema
  watchedFields: Map<string, Set<FormFieldWatcher>>
  subscribers: Set<FormStateListener>
  submitHandlers: Set<{
    callback: import('./types').FormSubmitHandler
    preventDefault: boolean
  }>
  fieldCache: Map<string, FormFieldElement[]>
  manualErrors: FormErrors
  validationErrors: FormErrors
  isValidated: boolean
  autoSubmitEnabled: boolean
  autoSubmitDebounce: number
  submitCount: number
  autoSubmitTimer: ReturnType<typeof setTimeout> | null
  isDestroyed: boolean
  listeners: Array<{
    element: EventTarget
    type: string
    handler: EventListenerOrEventListenerObject
  }>
  mutationObserver: MutationObserver | null
  // Back-reference to the assembled public controller. Populated by the
  // controller orchestrator after the api method factories are wired.
  api: FormController | null
}

// Internal helpers bound by the controller orchestrator and consumed by
// the api method factories. Kept here so api/*.ts only depends on the
// shape, not on the orchestrator implementation.
export interface FormControllerHelpers {
  notifySubscribers: () => void
  clearFieldCache: () => void
  getFieldsByName: (name: string) => FormFieldElement[]
  getTrackedFieldNames: () => string[]
  getValues: () => FormValues
  getMergedErrors: () => FormErrors
  syncVisualState: (names?: string[]) => void
  validateNames: (names?: string[]) => ValidationResult
  emitFieldWatchers: (name: string) => void
  scheduleAutoSubmit: () => void
}

export const createEmptyFormState = (): FormStateSnapshot => ({
  values: {},
  errors: {},
  filledFields: [],
  isValid: true,
  isValidated: false,
  autoSubmit: false,
  submitCount: 0
})

export const cloneErrors = (errors: FormErrors): FormErrors =>
  Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, [...messages]])
  )

export const mergeErrors = (left: FormErrors, right: FormErrors): FormErrors => {
  const merged: FormErrors = { ...left }
  for (const [field, messages] of Object.entries(right)) {
    merged[field] = merged[field] ? [...merged[field], ...messages] : [...messages]
  }
  return merged
}
