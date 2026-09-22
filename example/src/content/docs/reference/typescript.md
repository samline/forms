---
title: TypeScript reference
description: Every exported type, callback signature, and helper return shape in @samline/forms.
template: doc
sidebar:
  order: 4
---

This page lists every type exported from `@samline/forms`, what it represents, and where it shows up. Each type links to the method(s) that consume or produce it.

All types are exported from the package root:

```ts
import type {
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
  FormCleanup,
  FormDataPrimitive,
  FormErrors,
  FormFieldElement,
  FormFieldValue,
  FormFieldWatcher,
  FormsApi,
  FormsAvailable,
  FormStateListener,
  FormStateSnapshot,
  FormSubmitHandler,
  FormTarget,
  FormValues,
  NewFormInput,
  RuleConfig,
  SerializedFormResult,
  SerializedFormValue,
  ValidationResult,
  ValidationSchema,
  ValueValidationRules,
  VisualAttributes
} from '@samline/forms'
```

## `FormController`

The full controller surface returned by `form()`.

```ts
interface FormController {
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
```

## `FormControllerOptions`

The second argument to [`form()`](/forms/reference/api/#formtarget-options). See [Configuration](/forms/reference/configuration/) for the full reference.

```ts
interface FormControllerOptions {
  attributes?: Partial<VisualAttributes>
  autoValidate?: boolean
  autoSubmit?: boolean | AutoSubmitOptions
  clearManualErrorsOnChange?: boolean
  clearErrorsOnSubmit?: boolean
  validators?: ValidationSchema
  formats?: FieldFormatConfigMap
}
```

## `FormTarget`

What `form()` accepts as its first argument.

```ts
type FormTarget =
  | string                                  // element id
  | HTMLFormElement                         // direct element
  | { current: HTMLFormElement | null }     // ref-like
  | null
  | undefined
```

A string is treated as a `document.getElementById(id)` lookup; only `HTMLFormElement` matches count. A ref-like value lets you pass a Vue/React-style ref object.

## `FormFieldElement`

The set of DOM field types the controller manages.

```ts
type FormFieldElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
```

Returned by [`getField`](/forms/reference/api/#getfieldname).

## `FormFieldValue`

The normalized value of a field.

```ts
type FormFieldValue = string | string[] | File[] | undefined
```

- `string` — for text inputs, textareas, single selects, and single checked checkboxes / radios.
- `string[]` — for checkbox groups, multiple selects, and repeated `name="field[]"` controls. Radio groups remain scalar.
- `File[]` — for `<input type="file">` (may be empty).
- `undefined` — when no field with that name exists.

Returned by [`getValue`](/forms/reference/api/#getvaluename).

## `FormValues`

The aggregated values map produced by the controller and the helpers.

```ts
type FormValues = Record<string, FormFieldValue>
```

Useful when you build custom validators that need cross-field logic beyond exact equality (`sameAs` handles equality directly):

```ts
form('booking-form', {
  validators: {
    end_date: {
      dependsOn: 'start_date',
      validate: ({ value, values }) =>
        typeof value === 'string' &&
        typeof values.start_date === 'string' &&
        value >= values.start_date
          ? null
          : 'End date must not precede start date.'
    }
  }
})
```

The controller infers reactive dependencies from `sameAs`; use `dependsOn` for arbitrary reads inside `validate`. Here a change to `start_date` revalidates `end_date` once validation is active.

## `FormErrors`

A map from field name to an array of error messages. Each field can have multiple errors (one per failed rule or per failing custom validator).

```ts
type FormErrors = Record<string, string[]>
```

Drives the `css-error` attribute on fields and is returned inside [`FormStateSnapshot`](#formstatesnapshot) and [`ValidationResult`](#validationresult).

## `FormStateSnapshot`

The shape returned by [`getState()`](/forms/reference/api/#getstate). Built fresh on every call — it does not retain references to controller internals.

```ts
interface FormStateSnapshot {
  values: FormValues
  errors: FormErrors
  filledFields: string[]
  isValid: boolean
  isValidated: boolean
  autoSubmit: boolean
  isSubmitting: boolean
  submitCount: number
}
```

| Field | Meaning |
| --- | --- |
| `values` | Current values for every tracked field. |
| `errors` | Merged validation and manual errors. |
| `filledFields` | Names of fields that have a non-empty value. |
| `isValid` | `true` when `errors` has no entries. |
| `isValidated` | `true` once [`validate`](/forms/reference/api/#validatefields) has run at least once. |
| `autoSubmit` | `true` while auto-submit is enabled. |
| `isSubmitting` | `true` while at least one valid submission has pending async handlers. Overlapping submissions remain tracked until all their handlers settle. |
| `submitCount` | Number of submit attempts (valid or invalid). |

## `FormStateListener`

The callback passed to [`subscribe`](/forms/reference/api/#subscribelistener).

```ts
type FormStateListener = (state: FormStateSnapshot) => void
```

Receives the current snapshot immediately, then at controller notification points such as handled input, manual-error changes, reset, submit attempts, auto-submit toggles, and observed DOM mutations. A direct `validate()` call does not independently notify it.

## `FormSubmitHandler`

The callback passed to [`onSubmit`](/forms/reference/api/#onsubmitcallback-preventdefault).

```ts
type FormSubmitHandler = (
  form: HTMLFormElement,
  data: Record<string, SerializedFormValue>,
  formData: FormData,
  state: FormStateSnapshot
) => void | Promise<void>
```

Only invoked when the form is valid. `data` and `formData` are produced fresh on each invocation. Promise-returning handlers contribute to `isSubmitting`; fulfillment and rejection both settle tracking.

## `FormCleanup`

The callback accepted by [`addCleanup()`](/forms/reference/api/#addcleanupcleanup).

```ts
type FormCleanup = () => void
```

Cleanups run in reverse registration order during `destroy()`. `addCleanup()` returns an idempotent function that unregisters the callback without running it.

## `FormFieldWatcher`

The callback passed to [`watch`](/forms/reference/api/#watchfield-callback) and [`observe`](/forms/reference/api/#observefield-callback).

```ts
type FormFieldWatcher = (
  value: FormFieldValue,
  field: FormFieldElement | FormFieldElement[] | null,
  form: HTMLFormElement,
  state: FormStateSnapshot
) => void
```

- `value` — the current value of the field that just changed.
- `field` — the DOM element(s) backing the field. Single matching field → `HTMLInputElement` / `HTMLSelectElement` / `HTMLTextAreaElement`; repeated fields → array; no match → `null`.
- `form` — the bound `HTMLFormElement`.
- `state` — a snapshot of the whole controller state.

`observe` and `watch` fire once immediately with the current value, then on every matching `input` event. `observe` returns an unsubscribe function; `watch` returns the controller.

## `SerializedFormResult`

The shape returned by [`getData()`](/forms/reference/api/#getdata) and [`parseFormData()`](/forms/reference/api/#parseformdataformelement-submitter).

```ts
interface SerializedFormResult {
  data: Record<string, SerializedFormValue>
  formData: FormData
}
```

`data` is a plain object mirror of the `FormData`. Repeated names become arrays. Empty file entries are filtered out.

## `SerializedFormValue`

The value shape inside `SerializedFormResult.data`.

```ts
type SerializedFormValue = FormDataPrimitive | FormDataPrimitive[]
type FormDataPrimitive = FormDataEntryValue  // string | File
```

## `ValidationResult`

The shape returned by [`validate`](/forms/reference/api/#validatefields), [`revalidate`](/forms/reference/api/#revalidatefields), and [`validateValues`](/forms/reference/api/#validatevaluesvalues-schema).

```ts
interface ValidationResult {
  isValid: boolean
  errors: FormErrors
}
```

`errors` is always a fresh object — safe to mutate.

## `ValidationSchema`

The shape of `options.validators`.

```ts
type ValidationSchema = Record<string, FieldValidationRules>
```

## `FieldValidationRules`

The rule set for a single field.

```ts
interface FieldValidationRules extends ValueValidationRules {
  sameAs?: RuleConfig<string>
  dependsOn?: string | string[]
  each?: ValueValidationRules
}
```

Value rules run in the order: `required` → `minLength` → `maxLength` → `pattern` → numeric/range checks → `validate`. `sameAs` then runs at field level, and `each` applies its value rules to every member. All are optional; an empty rules object contributes nothing. `dependsOn` only declares reactive sources and does not produce an error.

`sameAs` names another exact field key. It compares non-empty strings exactly and arrays by ordered contents; file entries compare by `File` object identity. In a controller, changing the referenced field automatically revalidates the field that declares `sameAs`. Reciprocal declarations are cycle-safe, but usually duplicate the same error on both controls; prefer declaring the rule only on the confirmation field.

## `ValueValidationRules`

The exported subset used for whole values and inside `FieldValidationRules.each`.

```ts
interface ValueValidationRules {
  required?: RuleConfig<boolean>
  minLength?: RuleConfig<number>
  maxLength?: RuleConfig<number>
  pattern?: RuleConfig<RegExp>
  numeric?: RuleConfig<boolean>
  min?: RuleConfig<number>
  max?: RuleConfig<number>
  validate?: FieldValidator | FieldValidator[]
}
```

`numeric`, `min`, and `max` skip empty values. Non-empty values must be finite signed decimal strings; bounds are inclusive. `sameAs`, `dependsOn`, and nested `each` are field-level concerns and are intentionally absent.

## `RuleConfig<T>`

Lets a rule be configured with a plain value or a `{ value, message }` object.

```ts
type RuleConfig<T> = T | { value: T; message?: string }
```

```ts
form('signup-form', {
  validators: {
    password: {
      minLength: { value: 8, message: 'Use at least 8 characters.' }
    },
    terms: {
      required: { value: true, message: 'Please accept the terms.' }
    }
  }
})
```

When the plain form is used, default messages are produced automatically.

## `FieldValidationContext`

The argument passed to a custom validator.

```ts
interface FieldValidationContext {
  field: string
  value: FormFieldValue
  values: FormValues
  element?: FormFieldElement
  index?: number
}
```

`element` and zero-based `index` are present while a validator runs through `each`; they are omitted for group-level validation. Use `dependsOn` to declare fields read by cross-field validators:

```ts
form('checkout-form', {
  validators: {
    card: {
      validate: ({ value, field }) => {
        if (typeof value !== 'string') return `${field} is required.`
        return /^\d{16}$/.test(value.replace(/\s+/g, ''))
          ? null
          : 'Card number must be 16 digits.'
      }
    }
  }
})
```

## `FieldValidator`

The custom validator signature.

```ts
type FieldValidator = (
  context: FieldValidationContext
) => string | undefined | null | false | true
```

| Return | Meaning |
| --- | --- |
| `string` (non-empty) | Push as the error message. |
| `undefined`, `null`, `true` | Pass. |
| `false` | Push the generic error message `"Validation failed."`. |

Multiple validators can be chained by passing an array as `validate`:

```ts
form('order-form', {
  validators: {
    quantity: {
      validate: [
        ({ value }) => (typeof value === 'string' && Number(value) > 0 ? null : 'Must be greater than zero.'),
        ({ value }) => (typeof value === 'string' && Number.isInteger(Number(value)) ? null : 'Must be an integer.')
      ]
    }
  }
})
```

## `AutoSubmitOptions`

The argument to [`autoSubmit()`](/forms/reference/api/#autosubmitoptions) and the `autoSubmit` option.

```ts
interface AutoSubmitOptions {
  debounce?: number
}
```

`debounce` is in milliseconds.

## `AppendContentOptions`

The argument to [`append()`](/forms/reference/api/#appendoptions).

```ts
interface AppendContentOptions {
  tag: keyof HTMLElementTagNameMap
  content: string
  class?: string
  atStart?: boolean
}
```

| Field | Meaning |
| --- | --- |
| `tag` | The HTML tag to create. |
| `content` | `innerHTML` content for the new node. |
| `class` | Optional class name. If a node with the same first class already exists inside the form, it is removed before the new one is inserted. |
| `atStart` | When `true`, inserts at the start of the form. Defaults to `false` (append at the end). |

## `VisualAttributes`

The shape of `options.attributes`.

```ts
interface VisualAttributes {
  filled: string
  error: string
}
```

`Partial<VisualAttributes>` is accepted, so you can override only one of them. See [CSS styling](/forms/reference/css-styling/).

## `FieldFormatConfig` and `FieldFormatConfigMap`

The argument to [`format()`](/forms/reference/api/#formatconfig) and [`formatAll()`](/forms/reference/api/#formatallconfig).

```ts
interface FieldFormatConfig {
  type: FormatType
  field: string | string[]
  displayField?: string
  options?: Record<string, unknown>
}

type FormatType =
  | 'general'
  | 'phone'
  | 'numeral'
  | 'date'
  | 'time'
  | 'creditCard'
  | 'creditCardType'

type FieldFormatConfigMap = Record<string, FieldFormatConfig>
```

The `field` name is the **canonical** name of the formatted pair. A custom `displayField` is valid only for one string field; passing it with a field array logs an error and leaves the form unchanged. Array configurations derive `${fieldName}_displayed` independently for every field. Every map value includes its own `field` because the map key is only an identifier.

## `FormsApi`

The shape of the [`browser`](/forms/getting-started/#browser-registry-helpers-bundler) singleton exported from the vanilla entrypoint. The IIFE bundle exposes the same shape as `window.Forms`.

```ts
interface FormsApi {
  form: (target: FormTarget, options?: FormControllerOptions) => FormController
  newForm: (input: NewFormInput) => FormController | undefined
  destroyForm: (id: string) => void
  available: FormsAvailable
}
```

`form` is the same reference exported from `@samline/forms`. `newForm` and `destroyForm` manage the module-level `available` registry keyed by form id. Spreading `browser` copies references but does not create an independent registry: the methods close over the same `available` object. Use `form()` plus your own `Map` when isolation is required.

## `NewFormInput`

The argument to `FormsApi.newForm`.

```ts
interface NewFormInput {
  id: string
  options?: FormControllerOptions
}
```

A missing `id` logs `Form ID is required` to `console.error` and `newForm` returns `undefined` without touching the registry.

## `FormsAvailable`

The shape of `FormsApi.available`.

```ts
interface FormsAvailable {
  [id: string]: FormController
}
```

Use it to inspect or iterate over every live controller in the registry. Each entry is the `FormController` returned by `newForm` for that id.
