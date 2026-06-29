# `revalidate(fields?)`

Alias of [`validate`](validate.md) kept separate for readability at call sites that want to express “re-run validation now”.

## Signature

```ts
revalidate(): ValidationResult
revalidate(fields: string[]): ValidationResult
```

## Parameters

Same as [`validate`](validate.md).

## Returns

Same as [`validate`](validate.md) — a [`ValidationResult`](../typescript.md#validationresult).

## Behaviour

Identical to [`validate`](validate.md). The two methods share the same internal implementation.

## When to use which

Use `validate` when you are running validation as part of an initial check. Use `revalidate` when you are explicitly asking the controller to recompute validation after a state change (e.g. after `setErrors`, after async data loads, after resetting partial form state).

```ts
import { form } from '@samline/forms'

const profile = form('profile-form', {
  validators: { email: { required: true } }
})

// Initial check.
profile.validate()

// After a manual state change:
profile.setValue('email', '')
profile.revalidate(['email'])
```

## Edge cases

- **`revalidate` is not a different operation from `validate`.** Pick whichever name reads better at the call site.
- **Both methods mark the form as validated** the first time they are called.

## Related

- [`validate`](validate.md) — same implementation, different name.