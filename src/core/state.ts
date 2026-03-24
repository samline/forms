import type { FormStateSnapshot } from './types'

export const createEmptyFormState = (): FormStateSnapshot => ({
  values: {},
  errors: {},
  filledFields: [],
  isValid: true,
  isValidated: false,
  autoSubmit: false,
  submitCount: 0
})