---
locale: en
sidebar:
  group: api
  order: 5
title: 'Run rules again with revalidate()'
titleAccent: 'revalidate()'
description: 'Alias of validate kept separate for readability at call sites that want to express “re-run validation now”.'
---

Alias of [`validate`](../validate/) kept separate for readability at call sites that want to express “re-run validation now”.

## Signature

```ts
revalidate(): ValidationResult
revalidate(fields: string[]): ValidationResult
```

## Parameters

Same as [`validate`](../validate/).

## Returns

Same as [`validate`](../validate/) — a [`ValidationResult`](../../reference/typescript/#validationresult).

## Behaviour

Identical to [`validate`](../validate/). The two methods share the same internal implementation.

This includes strict decimal `numeric` / inclusive `min` / `max` rules, per-member `each` validation and element-level error styling. Explicit field lists are not expanded through `sameAs` or `dependsOn`; those relationships drive revalidation after input events.

## When to use which

Use `validate` when you are running validation as part of an initial check. Use `revalidate` when you are explicitly asking the controller to recompute validation after a state change (e.g. after `setErrors`, after async data loads, after resetting partial form state).

```ts
import { form } from '@samline/forms'

const profile = form('profile-form', {
  validators: { email: { required: true } },
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

- [`validate`](../validate/) — same implementation, different name.
