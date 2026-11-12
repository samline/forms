---
locale: en
sidebar:
  group: api
  order: 12
title: 'Remove watchers with unwatch()'
titleAccent: 'unwatch()'
description: 'Removes watched callbacks for one field, a list of fields or the whole form, depending on the arguments you pass.'
---

Removes watched callbacks for one field, a list of fields or the whole form, depending on the arguments you pass.

## Signature

```ts
unwatch(): FormController
unwatch(field: string): FormController
unwatch(field: string, callback: FormFieldWatcher): FormController
unwatch(fields: string[]): FormController
unwatch(fields: string[], callback: FormFieldsWatcher): FormController
```

## Parameters

| Overload                    | Description                                                   |
| --------------------------- | ------------------------------------------------------------- |
| `unwatch()`                 | Removes every watcher from every field.                       |
| `unwatch(field)`            | Removes every watcher for the given field.                    |
| `unwatch(field, callback)`  | Removes only the matching callback for the given field.       |
| `unwatch(fields)`           | Removes every watcher registered with that list of fields.    |
| `unwatch(fields, callback)` | Removes only the matching callback registered with that list. |

## Returns

The same [`FormController`](../../reference/typescript/#formcontroller) — chainable.

## Behaviour

- Watchers added via [`watch`](../watch/) and [`observe`](../observe/) share the same internal registry.
- For exact-match removal (`field` + `callback`), the same function reference must be passed.
- For bulk removal (`field` only or no args), all matching watchers are removed.
- A list matches watchers registered with the same set of names; order and duplicates do not matter. `unwatch(['a'])` does not remove a watcher of `['a', 'b']`.
- A single name only removes single-field watchers. `unwatch('price')` leaves `watch(['quantity', 'price'], …)` in place. `unwatch()` with no arguments removes both kinds.

## Examples

### Remove a specific watcher

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')

const callback = (value: unknown) => console.log(value)
profile.watch('email', callback)

profile.unwatch('email', callback)
```

### Remove all watchers for a field

```ts
profile.unwatch('email')
```

### Remove a watcher of several fields

```ts
const updateTotal = (values: Record<string, unknown>) => console.log(values)
profile.watch(['quantity', 'price'], updateTotal)

profile.unwatch(['quantity', 'price'], updateTotal)
```

### Remove every watcher

```ts
profile.unwatch()
```

### Use `observe`’s unsubscribe

```ts
const stop = profile.observe('email', value => console.log(value))
stop() // Equivalent to profile.unwatch('email', theCallback)
```

## Edge cases

- **`unwatch` does not affect subscribers** added via [`subscribe`](../subscribe/). Use the unsubscribe returned by `subscribe`.
- **Watchers added with the same callback twice are deduplicated** — calling `unwatch` with that callback removes only one entry.
- **Bulk removal is safe to call at any time** — it does not throw if there are no watchers.

## Related

- [`watch`](../watch/) — add a watcher.
- [`observe`](../observe/) — add a watcher with an unsubscribe function.
