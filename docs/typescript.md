# TypeScript Reference

This page lists every type exported from `@samline/forms`, what it represents, and where it shows up. Each type links to the method(s) that consume or produce it.

All types are exported from the package root:

```ts
import type {
  AppendContentOptions,
  AutoSubmitOptions,
  FieldValidationContext,
  FieldValidationRules,
  FieldValidator,
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
} from '@samline/forms'
```

---

## `FormController`

The full controller surface returned by [`form()`](api/form.md). All public methods are defined here.

```ts
interface FormController {
  readonly element: HTMLFormElement | null
  readonly f: HTMLFormElement | null
  readonly options: FormControllerOptions
  onSubmit: (callback: FormSubmitHandler, preventDefault?: boolean) => FormController
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

---

## `FormControllerOptions`

The second argument to [`form()`](api/form.md). See [docs/options.md](options.md) for the full reference.

```ts
interface FormControllerOptions {
  attributes?: Partial<VisualAttributes>
  autoValidate?: boolean
  autoSubmit?: boolean | AutoSubmitOptions
  clearManualErrorsOnChange?: boolean
  clearErrorsOnSubmit?: boolean
  validators?: ValidationSchema
}
```

---

## `FormTarget`

What [`form()`](api/form.md) accepts as its first argument.

```ts
type FormTarget =
  | string                                  // element id
  | HTMLFormElement                         // direct element
  | { current: HTMLFormElement | null }     // ref-like
  | null
  | undefined
```

A string is treated as a `document.getElementById(id)` lookup; only `HTMLFormElement` matches count. A ref-like value lets you pass a Vue/React-style ref object.

---

## `FormFieldElement`

The set of DOM field types the controller manages.

```ts
type FormFieldElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
```

Returned by [`getField`](api/get-field.md).

---

## `FormFieldValue`

The normalized value of a field.

```ts
type FormFieldValue = string | string[] | File[] | undefined
```

- `string` — for text inputs, textareas, single selects, and single checked checkboxes / radios.
- `string[]` — for groups of checkboxes / radios where more than one is selected.
- `File[]` — for `<input type="file">` (may be empty).
- `undefined` — when no field with that name exists.

Returned by [`getValue`](api/get-value.md).

---

## `FormValues`

The aggregated values map produced by the controller and the helpers.

```ts
type FormValues = Record<string, FormFieldValue>
```

Useful when you build custom validators that need to read other fields:

```ts
form('signup-form', {
  validators: {
    confirm: {
      validate: ({ value, values }) =>
        value === values.password ? null : 'Passwords do not match.'
    }
  }
})
```

---

## `FormErrors`

A map from field name to an array of error messages. Each field can have multiple errors (one per failed rule or per failing custom validator).

```ts
type FormErrors = Record<string, string[]>
```

Drives the `css-error` attribute on fields and is returned inside [`FormStateSnapshot`](#formstatesnapshot) and [`ValidationResult`](#validationresult).

---

## `FormStateSnapshot`

The shape returned by [`getState()`](api/get-state.md). Built fresh on every call — it does not retain references to controller internals.

```ts
interface FormStateSnapshot {
  values: FormValues
  errors: FormErrors
  filledFields: string[]
  isValid: boolean
  isValidated: boolean
  autoSubmit: boolean
  submitCount: number
}
```

| Field | Meaning |
| --- | --- |
| `values` | Current values for every tracked field. |
| `errors` | Merged validation and manual errors. |
| `filledFields` | Names of fields that have a non-empty value. |
| `isValid` | `true` when `errors` has no entries. |
| `isValidated` | `true` once [`validate`](api/validate.md) has run at least once. |
| `autoSubmit` | `true` while auto-submit is enabled. |
| `submitCount` | Number of submit attempts (valid or invalid). |

---

## `FormStateListener`

The callback passed to [`subscribe`](api/subscribe.md).

```ts
type FormStateListener = (state: FormStateSnapshot) => void
```

Receives the current snapshot immediately on subscription, then on every state mutation.

---

## `FormSubmitHandler`

The callback passed to [`onSubmit`](api/on-submit.md).

```ts
type FormSubmitHandler = (
  form: HTMLFormElement,
  data: Record<string, SerializedFormValue>,
  formData: FormData,
  state: FormStateSnapshot
) => void
```

Only invoked when the form is valid. `data` and `formData` are produced fresh on each invocation.

---

## `FormFieldWatcher`

The callback passed to [`watch`](api/watch.md) and [`observe`](api/observe.md).

```ts
type FormFieldWatcher = (
  value: FormFieldValue,
  form: HTMLFormElement,
  state: FormStateSnapshot
) => void
```

`observe` fires this once immediately with the current value, then on every change. `watch` is a chainable alias and only fires on changes after it is registered.

---

## `SerializedFormResult`

The shape returned by [`getData()`](api/get-data.md) and [`parseFormData()`](api/parse-form-data.md).

```ts
interface SerializedFormResult {
  data: Record<string, SerializedFormValue>
  formData: FormData
}
```

`data` is a plain object mirror of the `FormData`. Repeated names become arrays (e.g. `interests: ['design', 'code']`). Empty file entries are filtered out.

---

## `SerializedFormValue`

The value shape inside `SerializedFormResult.data`.

```ts
type SerializedFormValue = FormDataPrimitive | FormDataPrimitive[]

type FormDataPrimitive = FormDataEntryValue
```

`FormDataEntryValue` is `string | File` in the DOM lib types.

---

## `ValidationResult`

The shape returned by [`validate`](api/validate.md), [`revalidate`](api/revalidate.md), and [`validateValues`](api/validate-values.md).

```ts
interface ValidationResult {
  isValid: boolean
  errors: FormErrors
}
```

`errors` is always a fresh object — safe to mutate.

---

## `ValidationSchema`

The shape of `options.validators`.

```ts
type ValidationSchema = Record<string, FieldValidationRules>
```

```ts
form('signup-form', {
  validators: {
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { required: true, minLength: 8 }
  }
})
```

---

## `FieldValidationRules`

The rule set for a single field.

```ts
interface FieldValidationRules {
  required?: RuleConfig<boolean>
  minLength?: RuleConfig<number>
  maxLength?: RuleConfig<number>
  pattern?: RuleConfig<RegExp>
  validate?: FieldValidator | FieldValidator[]
}
```

Rules run in the order: `required` → `minLength` → `maxLength` → `pattern` → `validate`. All are optional; an empty rules object contributes nothing.

---

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

---

## `FieldValidationContext`

The argument passed to a custom validator.

```ts
interface FieldValidationContext {
  field: string
  value: FormFieldValue
  values: FormValues
}
```

Use it to write cross-field validators:

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

---

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

---

## `AutoSubmitOptions`

The argument to [`autoSubmit()`](api/auto-submit.md) and the `autoSubmit` option.

```ts
interface AutoSubmitOptions {
  debounce?: number
}
```

`debounce` is in milliseconds.

---

## `AppendContentOptions`

The argument to [`append()`](api/append.md).

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

---

## `VisualAttributes`

The shape of `options.attributes`.

```ts
interface VisualAttributes {
  filled: string
  error: string
}
```

`Partial<VisualAttributes>` is accepted, so you can override only one of them. See [docs/css-styling.md](css-styling.md).