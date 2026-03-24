export type FormDataPrimitive = FormDataEntryValue

export type SerializedFormValue = FormDataPrimitive | FormDataPrimitive[]

export type FormFieldValue = string | string[] | File[] | undefined

export type FormValues = Record<string, FormFieldValue>

export type FormErrors = Record<string, string[]>

export type RuleConfig<T> = T | { value: T; message?: string }

export interface FieldValidationContext {
  field: string
  value: FormFieldValue
  values: FormValues
}

export type FieldValidator = (
  context: FieldValidationContext
) => string | undefined | null | false | true

export interface FieldValidationRules {
  required?: RuleConfig<boolean>
  minLength?: RuleConfig<number>
  maxLength?: RuleConfig<number>
  pattern?: RuleConfig<RegExp>
  validate?: FieldValidator | FieldValidator[]
}

export type ValidationSchema = Record<string, FieldValidationRules>

export interface VisualAttributes {
  filled: string
  error: string
}

export interface AutoSubmitOptions {
  debounce?: number
}

export interface FormControllerOptions {
  attributes?: Partial<VisualAttributes>
  autoValidate?: boolean
  autoSubmit?: boolean | AutoSubmitOptions
  clearErrorsOnSubmit?: boolean
  validators?: ValidationSchema
}

export interface SerializedFormResult {
  data: Record<string, SerializedFormValue>
  formData: FormData
}

export interface ValidationResult {
  isValid: boolean
  errors: FormErrors
}

export interface FormStateSnapshot {
  values: FormValues
  errors: FormErrors
  filledFields: string[]
  isValid: boolean
  isValidated: boolean
  autoSubmit: boolean
  submitCount: number
}

export type FormStateListener = (state: FormStateSnapshot) => void

export type FormFieldElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement

export type FormTarget =
  | string
  | HTMLFormElement
  | { current: HTMLFormElement | null }
  | null
  | undefined

export interface AppendContentOptions {
  tag: keyof HTMLElementTagNameMap
  content: string
  class?: string
  atStart?: boolean
}

export type FormFieldWatcher = (
  value: FormFieldValue,
  form: HTMLFormElement,
  state: FormStateSnapshot
) => void

export type FormSubmitHandler = (
  form: HTMLFormElement,
  data: Record<string, SerializedFormValue>,
  formData: FormData,
  state: FormStateSnapshot
) => void

export interface FormController {
  readonly element: HTMLFormElement | null
  readonly f: HTMLFormElement | null
  readonly options: FormControllerOptions
  onSubmit(callback: FormSubmitHandler, preventDefault?: boolean): FormController
  watch(field: string, callback: FormFieldWatcher): FormController
  observe(field: string, callback: FormFieldWatcher): () => void
  unwatch(field?: string, callback?: FormFieldWatcher): FormController
  subscribe(listener: FormStateListener): () => void
  prefill(fieldName?: string): FormController
  append(options: AppendContentOptions): HTMLElement | null
  setErrors(fields: string[] | FormErrors): FormController
  clearErrors(fields?: string[]): FormController
  setValue(name: string, value: unknown): FormController
  validate(fields?: string[]): ValidationResult
  revalidate(fields?: string[]): ValidationResult
  reset(): FormController
  autoSubmit(options?: boolean | AutoSubmitOptions): FormController
  disableAutoSubmit(): FormController
  getValue(name: string): FormFieldValue
  getField(name: string): FormFieldElement | FormFieldElement[] | null
  getData(): SerializedFormResult
  getState(): FormStateSnapshot
  destroy(): void
}