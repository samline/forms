---
title: Configuration
description: Every FormControllerOptions field accepted by @samline/forms, with defaults and rationale.
template: doc
sidebar:
  order: 2
---

`form(target, options?)` accepts a `FormControllerOptions` object. Every option has a default, so you only pass what you need.

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
  }
})
```

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

## Options reference

| Option | Type | Default | Behaviour |
| --- | --- | --- | --- |
| `attributes` | `Partial<VisualAttributes>` | `{ filled: 'css-filled', error: 'css-error' }` | Override the names of the visual attributes applied to fields. |
| `autoValidate` | `boolean` | `true` | Run validation on construction and on handled `input` events for fields that have rules. |
| `autoSubmit` | `boolean \| AutoSubmitOptions` | `false` | Submit the form automatically after handled `input` events. Pass `{ debounce: ms }` to delay. |
| `clearErrorsOnSubmit` | `boolean` | `true` | Clear all manual errors before submit validation runs. |
| `clearManualErrorsOnChange` | `boolean` | `true` | Clear the manual error of a field when it changes. Set `false` to keep manual errors until you call [`clearErrors`](/forms/reference/api/#clearerrorsfields). |
| `validators` | `ValidationSchema` | `{}` | Field → rules map. See [`ValidationSchema`](/forms/reference/typescript/#validationschema) and the rule reference below. |
| `formats` | [`FieldFormatConfigMap`](/forms/reference/typescript/#fieldformatconfig-and-fieldformatconfigmap) | `{}` | Declarative `@samline/formatter` configuration. Each entry is applied during `form()` initialization using the same logic as [`format()`](/forms/reference/api/#formatconfig). Requires the optional peer dependency. |

## `attributes`

By default the controller adds `css-filled` to a field when it has a value, and `css-error` when it has at least one error. Override the names with `attributes`:

```ts
form('profile-form', {
  attributes: { filled: 'is-filled', error: 'is-invalid' }
})
```

This affects which DOM attributes the controller toggles. You provide the CSS — see [CSS styling](/forms/reference/css-styling/) for recipes.

## `autoValidate`

When `true` (default), the controller:

- Runs an initial validation pass on mount for every field that has rules.
- Validates each field on every delegated `input` event when the field has rules.

Set this to `false` if you want to validate manually (e.g. only on submit, or only when the user moves past a step):

```ts
form('wizard-form', { autoValidate: false }).validate(['step-1'])
```

## `autoSubmit`

When `true`, the controller schedules a native submit (`form.requestSubmit()`, with a submit-event fallback) after each handled `input` event. Pass an `AutoSubmitOptions` object to add a debounce:

```ts
form('search-form', {
  autoSubmit: { debounce: 300 }
})
```

- `autoSubmit: true` — submit immediately after each handled input.
- `autoSubmit: { debounce: 300 }` — submit 300ms after the last handled input.
- `autoSubmit: false` — disabled at mount; enable later with [`autoSubmit()`](/forms/reference/api/#autosubmitoptions).

Disable at any time with [`disableAutoSubmit()`](/forms/reference/api/#disableautosubmit).

## `clearErrorsOnSubmit`

When `true` (default), all manual errors created with [`setErrors`](/forms/reference/api/#seterrorsfields) are cleared before submit validation runs. Validation errors from the current rules are computed fresh. Set this to `false` if you want manual errors to survive submit attempts:

```ts
form('profile-form', { clearErrorsOnSubmit: false })
```

This only affects manual errors. Validation errors always recompute on submit.

## `clearManualErrorsOnChange`

When `true` (default), the manual error of a field is cleared the moment the field changes (including changes triggered through [`setValue`](/forms/reference/api/#setvaluename-value)). Validation then runs and decides the new error state.

Set this to `false` to keep manual errors visible until you explicitly clear them with [`clearErrors`](/forms/reference/api/#clearerrorsfields):

```ts
form('profile-form', { clearManualErrorsOnChange: false })

profileForm.setErrors({ email: ['This email is already in use.'] })
// The error stays visible even after the user edits the field.
```

Use this when manual errors come from server validation and you want them to persist across edits.

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
| `sameAs` | `string \| { value: string; message?: string }` | Non-empty value must equal the named field. Changing the named field automatically revalidates this field. |
| `validate` | [`FieldValidator \| FieldValidator[]`](/forms/reference/typescript/#fieldvalidator) | Custom validators. Return a string to push an error, or `null` / `undefined` / `true` to pass. Return `false` to push a generic `"Validation failed."` message. |

Built-in rules accept either a plain value or a `{ value, message }` object. Use the object form when you want a custom error message per rule.

All enabled rules run and messages accumulate. `pattern` skips empty values, while length and custom rules still run. Array values use item count for length rules. Validator keys are exact HTML field names; wildcard paths such as `rows[*].name` are not expanded. See [Validation and accessible errors](/forms/guides/validation-and-errors/#built-in-rule-behavior) for the complete behavior table.

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

The custom validator receives `{ field, value, values }` and runs after the built-in rules. See [`FieldValidationContext`](/forms/reference/typescript/#fieldvalidationcontext).

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

## `formats`

Declarative way to bind one or more `@samline/formatter` pipelines at construction time. Each entry is applied during `form()` initialization using the same logic as [`format()`](/forms/reference/api/#formatconfig).

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

The map key is just an identifier — the **canonical** field name lives in `FieldFormatConfig.field`. `displayField` works only when `field` is a single string; combining it with an array logs an error and leaves the form unchanged. Array configurations derive one `<field>_displayed` name per field.

:::caution[Optional peer dependency]
Module builds require `@samline/formatter` for `formats`. When it is missing, the module instance logs one cached `console.error`, asynchronously rolls back each affected visible/mirror pair, and keeps the controller usable. The standalone global IIFE already bundles the formatter. See [Formatting inputs](/forms/guides/formatting/).
:::
