// Public types for the form controller.
// Keep this file focused on shape only — no runtime logic.

export type FormatType =
  | 'general'
  | 'phone'
  | 'numeral'
  | 'date'
  | 'time'
  | 'creditCard'
  | 'creditCardType'

export interface FieldFormatConfig {
  /** One of the supported `@samline/formatter` `FormatType` values. */
  type: FormatType
  /** Canonical field name or fields whose raw values are submitted. */
  field: string | string[]
  /**
   * Name of the visible input for a single field. Array configurations
   * must omit this option and derive one display name per field.
   */
  displayField?: string
  /**
   * Format-specific options forwarded to `@samline/formatter`.
   * Any key documented for the chosen `type` is accepted (e.g.
   * `country`, `delimiter`, `numeralDecimalMark`, `datePattern`).
   */
  options?: Record<string, unknown>
}

export type FieldFormatConfigMap = Record<string, FieldFormatConfig>

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
  /** Concrete control while validating one member through `each`. */
  element?: FormFieldElement
  /** Zero-based member position while validating through `each`. */
  index?: number
}

export type FieldValidator = (
  context: FieldValidationContext
) => string | undefined | null | false | true

export interface ValueValidationRules {
  required?: RuleConfig<boolean>
  minLength?: RuleConfig<number>
  maxLength?: RuleConfig<number>
  pattern?: RuleConfig<RegExp>
  numeric?: RuleConfig<boolean>
  min?: RuleConfig<number>
  max?: RuleConfig<number>
  validate?: FieldValidator | FieldValidator[]
}

export interface FieldValidationRules extends ValueValidationRules {
  /** Field name whose non-empty value must equal this field's value. */
  sameAs?: RuleConfig<string>
  /** Fields whose changes should revalidate this field. */
  dependsOn?: string | string[]
  /** Rules applied independently to each collection member. */
  each?: ValueValidationRules
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
  clearManualErrorsOnChange?: boolean
  clearErrorsOnSubmit?: boolean
  validators?: ValidationSchema
  /**
   * Declarative format configuration. Each entry is applied during
   * `form()` initialization using the same logic as `controller.format(...)`.
   * The key is just an identifier — the visible field name lives in
   * `FieldFormatConfig.field`.
   */
  formats?: FieldFormatConfigMap
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
  isSubmitting: boolean
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
  field: FormFieldElement | FormFieldElement[] | null,
  form: HTMLFormElement,
  state: FormStateSnapshot
) => void

export type FormSubmitHandler = (
  form: HTMLFormElement,
  data: Record<string, SerializedFormValue>,
  formData: FormData,
  state: FormStateSnapshot
) => void | Promise<void>

export type FormCleanup = () => void

export interface FormController {
  readonly element: HTMLFormElement | null
  readonly f: HTMLFormElement | null
  readonly options: FormControllerOptions
  onSubmit: (callback: FormSubmitHandler, preventDefault?: boolean) => FormController
  addCleanup: (cleanup: FormCleanup) => () => void
  watch: (field: string, callback: FormFieldWatcher) => FormController
  observe: (field: string, callback: FormFieldWatcher) => () => void
  unwatch: (field?: string, callback?: FormFieldWatcher) => FormController
  subscribe: (listener: FormStateListener) => () => void
  prefill: (fieldName?: string) => FormController
  append: (options: AppendContentOptions) => HTMLElement | null
  setErrors: (fields: string[] | FormErrors) => FormController
  clearErrors: (fields?: string[]) => FormController
  setValue: (name: string, value: unknown) => FormController
  validate: (fields?: string[]) => ValidationResult
  revalidate: (fields?: string[]) => ValidationResult
  /**
   * Apply the same `@samline/formatter` pipeline to a single field or
   * to a list of fields sharing one configuration. Chainable.
   *
   * Requires the optional peer dependency `@samline/formatter`. When
   * the peer is not installed the call logs a single `console.error`
   * and returns the controller unchanged.
   */
  format: (config: FieldFormatConfig) => FormController
  formatAll: (config: FieldFormatConfig) => FormController
  reset: () => FormController
  autoSubmit: (options?: boolean | AutoSubmitOptions) => FormController
  disableAutoSubmit: () => FormController
  getValue: (name: string) => FormFieldValue
  getField: (name: string) => FormFieldElement | FormFieldElement[] | null
  getData: () => SerializedFormResult
  getState: () => FormStateSnapshot
  destroy: () => void
}
