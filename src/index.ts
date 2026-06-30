// Main vanilla entrypoint.
// Public surface exposed to `@samline/forms`.

export { form } from './api/form'
export { createFormController } from './core/controller'

export type {
  AppendContentOptions,
  AutoSubmitOptions,
  FieldFormatConfig,
  FieldFormatConfigMap,
  FieldValidationContext,
  FieldValidationRules,
  FieldValidator,
  FormatType,
  FormController,
  FormControllerOptions,
  FormErrors,
  FormFieldElement,
  FormFieldValue,
  FormStateListener,
  FormStateSnapshot,
  FormSubmitHandler,
  FormTarget,
  FormValues,
  RuleConfig,
  SerializedFormResult,
  SerializedFormValue,
  ValidationResult,
  ValidationSchema,
  VisualAttributes
} from './core/types'

export { parseFormData } from './core/serialize'
export { validateFieldValue, validateValues } from './core/validation'
