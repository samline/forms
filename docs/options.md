# Options

`form(target, options?)` accepts a `FormControllerOptions` object. Every option has a default, so you can pass only what you need.

```ts
import { form } from '@samline/forms'

const contactForm = form('contact-form', {
  attributes: { filled: 'is-filled', error: 'is-invalid' },
  autoValidate: true,
  autoSubmit: { debounce: 500 },
  clearErrorsOnSubmit: true,
  clearManualErrorsOnChange: true,
  validators: {
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
  },
  formats: {
    phone: { type: 'phone', field: 'phone', options: { country: 'MX' } }
  }
})
```

---

## Signature

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

---

## Options reference

| Option | Type | Default | Behaviour |
| --- | --- | --- | --- |
| `attributes` | `Partial<VisualAttributes>` | `{ filled: 'css-filled', error: 'css-error' }` | Override the names of the visual attributes applied to fields. |
| `autoValidate` | `boolean` | `true` | Run validation on construction and on handled `input` events for fields that have rules. Initial `css-filled` synchronization still runs when this is `false`. |
| `autoSubmit` | `boolean \| AutoSubmitOptions` | `false` | Submit automatically after handled `input` events. Pass `{ debounce: ms }` to delay. |
| `clearErrorsOnSubmit` | `boolean` | `true` | Clear all manual errors before submit validation runs. |
| `clearManualErrorsOnChange` | `boolean` | `true` | Clear the manual error of a field when it changes. Set `false` to keep manual errors until you call [`clearErrors`](api/clear-errors.md). |
| `validators` | `ValidationSchema` | `{}` | Field → rules map. See [docs/typescript.md](typescript.md#validationschema) and the rule reference below. |
| `formats` | [`FieldFormatConfigMap`](typescript.md#fieldformatconfig-and-fieldformatconfigmap) | `{}` | Declarative `@samline/formatter` configuration. Each entry is applied during `form()` initialization using the same logic as [`format()`](api/format.md). Requires the optional peer dependency. |

---

## `attributes`

By default the controller adds `css-filled` to a field when it has a value, and `css-error` when it has at least one error. Override the names with `attributes`:

```ts
form('profile-form', {
  attributes: { filled: 'is-filled', error: 'is-invalid' }
})
```

This affects which DOM attributes the controller toggles. You provide the CSS. See [docs/css-styling.md](css-styling.md) for recipes.

---

## `autoValidate`

When `true` (default), the controller:

- Runs an initial validation pass on mount for every field that has rules.
- Validates each field on every delegated `input` event when the field has rules.

Set this to `false` if you want to validate manually (e.g. only on submit, or only when the user moves past a step):

```ts
form('wizard-form', { autoValidate: false }).validate(['step-1'])
```

The initial visual-state pass is independent of validation. Prefilled controls receive `css-filled` on mount even when `autoValidate` is `false`, but no rules run and `isValidated` remains `false` until validation is requested.

---

## `autoSubmit`

When `true`, the controller schedules a native submit (`form.requestSubmit()`) on every change. Pass an `AutoSubmitOptions` object to add a debounce:

```ts
form('search-form', {
  autoSubmit: { debounce: 300 }
})
```

- `autoSubmit: true` — submit immediately on every change.
- `autoSubmit: { debounce: 300 }` — submit 300ms after the last change.
- `autoSubmit: false` — disabled at mount; enable later with [`autoSubmit()`](api/auto-submit.md).

Disable at any time with [`disableAutoSubmit()`](api/disable-auto-submit.md).

---

## `clearErrorsOnSubmit`

When `true` (default), all manual errors created with [`setErrors`](api/set-errors.md) are cleared before submit validation runs. Validation errors from the current rules are computed fresh. Set this to `false` if you want manual errors to survive submit attempts:

```ts
form('profile-form', { clearErrorsOnSubmit: false })
```

This only affects manual errors. Validation errors always recompute on submit.

---

## `clearManualErrorsOnChange`

When `true` (default), the manual error of a field is cleared the moment the field changes (including changes triggered through [`setValue`](api/set-value.md)). Validation then runs and decides the new error state.

Set this to `false` to keep manual errors visible until you explicitly clear them with [`clearErrors`](api/clear-errors.md):

```ts
form('profile-form', { clearManualErrorsOnChange: false })

profileForm.setErrors({ email: ['This email is already in use.'] })
// The error stays visible even after the user edits the field.
```

Use this when manual errors come from server validation and you want them to persist across edits.

---

## `validators`

A map of field names to rule sets. Each rule set is a `FieldValidationRules` object.

```ts
form('signup-form', {
  validators: {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
      required: true,
      minLength: { value: 8, message: 'Use at least 8 characters.' },
      maxLength: 64
    },
    password_confirmation: {
      required: true,
      sameAs: {
        value: 'password',
        message: 'Passwords do not match.'
      }
    },
    amount: {
      required: true,
      numeric: true,
      min: 0,
      max: 10000
    },
    'attendees[].email': {
      each: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      }
    }
  }
})
```

### Supported rules

| Rule | Type | Description |
| --- | --- | --- |
| `required` | `boolean \| { value: boolean; message?: string }` | Field must have a non-empty value. |
| `minLength` | `number \| { value: number; message?: string }` | Minimum string length (for checkbox groups, the minimum number of selected items). |
| `maxLength` | `number \| { value: number; message?: string }` | Maximum string length (for checkbox groups, the maximum number of selected items). |
| `pattern` | `RegExp \| { value: RegExp; message?: string }` | String must match the regular expression. Skipped when the field is empty. |
| `numeric` | `boolean \| { value: boolean; message?: string }` | Non-empty value must be an ordinary signed decimal. |
| `min` | `number \| { value: number; message?: string }` | Non-empty numeric value must be greater than or equal to the inclusive bound. |
| `max` | `number \| { value: number; message?: string }` | Non-empty numeric value must be less than or equal to the inclusive bound. |
| `sameAs` | `string \| { value: string; message?: string }` | Non-empty value must equal the named field. Changing the named field automatically revalidates this field. |
| `dependsOn` | `string \| string[]` | Names fields whose changes should revalidate this field. Useful for custom cross-field validators; it does not itself add a validation error. |
| `each` | `ValueValidationRules` | Applies value-level rules independently to every member/control in a collection. |
| `validate` | `FieldValidator \| FieldValidator[]` | Custom validators. Return a string to push an error, or `null` / `undefined` / `true` to pass. Return `false` to push a generic `"Validation failed."` message. |

Built-in rules accept either a plain value or a `{ value, message }` object. Use the object form when you want a custom error message per rule.

`numeric`, `min`, and `max` trim surrounding whitespace and accept only ordinary signed decimal syntax, such as `12`, `-3.5`, `+4`, `.75`, or `10.`. They reject exponent notation, hexadecimal, `Infinity`, `NaN`, and formatted values containing separators. Empty values skip all three rules; add `required` when emptiness should fail. `min` and `max` are inclusive and also reject a non-numeric value even when `numeric` is omitted.

Their default messages are `"Value must be a number."`, `"Minimum value is N."`, and `"Maximum value is N."` respectively.

### Matching fields with `sameAs`

Declare `sameAs` on the field that owns the error, normally the confirmation field:

```ts
form('signup-form', {
  validators: {
    password: { required: true, minLength: 8 },
    password_confirmation: {
      required: true,
      sameAs: {
        value: 'password',
        message: 'Passwords do not match.'
      }
    }
  }
})
```

The controller records that `password_confirmation` depends on `password`. Once validation is active, input in either field validates the confirmation, including updates made through `setValue()`. Validation is active immediately with the default `autoValidate: true`; with `autoValidate: false`, it begins after the first `validate()` or `revalidate()` call. You do not need `watch()` or a manual `revalidate()` call for this dependency.

Important behavior:

- `sameAs` is skipped until both fields have non-empty values. Use `required` separately when either field is mandatory.
- Strings use exact, case-sensitive equality. Arrays use ordered item equality, so `['a', 'b']` does not equal `['b', 'a']`. File entries compare by `File` object identity.
- The referenced name must be the exact HTML field name. Wildcards and inferred `_confirmation` names are not supported.
- Put the rule on the confirmation field only in most forms. Putting reciprocal rules on both fields is cycle-safe, but both fields will own and display the same mismatch error.
- Dependency cycles do not recurse. The controller resolves the affected fields with a visited set and validates each field at most once per input event.

### Custom cross-field dependencies with `dependsOn`

Custom validators can read any value, but the controller cannot infer those reads. Declare each source with `dependsOn` so changing it revalidates the field that owns the custom validator:

```ts
form('shipping-form', {
  validators: {
    method: { required: true },
    country: {
      dependsOn: 'method',
      validate: ({ value, values }) =>
        values.method === 'domestic' && value !== 'US'
          ? 'Domestic shipping requires a US address.'
          : null
    }
  }
})
```

Names are exact HTML field names. A string array declares multiple sources. Like `sameAs`, dependencies become reactive once validation is active, and transitive chains and cycles are deduplicated so each affected field runs at most once per input event. `dependsOn` is controller metadata only: the pure validation helpers evaluate the supplied snapshot without tracking changes.

### Validate every collection member with `each`

Use `each` for repeated controls, checkbox groups, or other fields whose value is a collection:

```ts
form('attendees-form', {
  validators: {
    'attendees[].email': {
      minLength: { value: 1, message: 'Add at least one attendee.' },
      each: {
        required: true,
        pattern: {
          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Enter a valid attendee email.'
        }
      }
    }
  }
})
```

Rules outside `each` validate the aggregate value. Rules inside `each` validate members independently. In a bound controller, `css-error` and `aria-invalid="true"` are applied only to the controls whose `each` rules fail; an aggregate or manual field error still marks every control in the field. Public errors remain `Record<string, string[]>`: item messages are flattened under the field name in member order rather than exposing a nested error shape.

### Custom validators

```ts
form('checkout-form', {
  validators: {
    card: {
      validate: ({ value, field }) => {
        if (typeof value !== 'string') return `${field} is required.`
        if (!/^\d{16}$/.test(value.replace(/\s+/g, ''))) {
          return 'Card number must be 16 digits.'
        }
        return null
      }
    }
  }
})
```

The custom validator receives `{ field, value, values }` and runs after the built-in rules. During `each`, it also receives the optional concrete `element` and zero-based `index`. See [`FieldValidationContext`](typescript.md#fieldvalidationcontext).

---

## Defaults at a glance

```ts
const DEFAULT_ATTRIBUTES = {
  filled: 'css-filled',
  error: 'css-error'
}

const DEFAULT_OPTIONS = {
  autoValidate: true,
  clearErrorsOnSubmit: true,
  clearManualErrorsOnChange: true
}
```

Everything else (`autoSubmit`, `validators`, `formats`, partial `attributes`) defaults to neutral / empty values.

---

## `formats`

Declarative way to bind one or more `@samline/formatter` pipelines at construction time. Each entry is applied during `form()` initialization using the same logic as [`format()`](api/format.md).

```ts
import { form } from '@samline/forms'

const checkout = form('checkout', {
  formats: {
    phone:  { type: 'phone',      field: 'phone',  options: { country: 'MX' } },
    card:   { type: 'creditCard', field: 'card' },
    amount: { type: 'numeral',    field: 'amount', options: { prefix: '$' } }
  }
})
```

The map key is just an identifier — the **canonical** field name lives in `FieldFormatConfig.field`. `format()` renames the visible to `<field>_displayed` (or `config.displayField`) on first run and creates a hidden `<input type="hidden" name="<field>">` that carries the raw value. Both names are first-class in the controller's API. See [`FieldFormatConfigMap`](typescript.md#fieldformatconfig-and-fieldformatconfigmap) for the full type, and the [formatting recipe](recipes.md#13-format-inputs-with-samlineformatter) for an end-to-end example.

Module builds require `@samline/formatter` for `formats`. When it is missing, the module instance logs one cached `console.error`, asynchronously rolls back affected visible/mirror pairs, and keeps the controller usable. The standalone global IIFE bundles the formatter.
