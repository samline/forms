---
locale: en
sidebar:
  group: api
  order: 14
title: 'Replace select options with setOptions()'
titleAccent: 'setOptions()'
description: 'Replaces the options of a select, keeps the current value when still listed, and runs the change pipeline only when it changes.'
---

Replaces the `<option>` and `<optgroup>` children of every `<select>` with the given `name`. Use it for dependent dropdowns, data loaded from an API, or a temporary "Loading…" state.

## Signature

```ts
setOptions(
  name: string,
  options: SelectOptionInput[],
  config?: SetOptionsConfig
): FormController
```

## Parameters

| Name      | Type                                                                   | Required | Description                                               |
| --------- | ---------------------------------------------------------------------- | -------- | --------------------------------------------------------- |
| `name`    | `string`                                                               | yes      | The `name` attribute of the target `<select>`.            |
| `options` | [`SelectOptionInput[]`](../../reference/typescript/#selectoptioninput) | yes      | The new list. An empty array removes every option.        |
| `config`  | [`SetOptionsConfig`](../../reference/typescript/#setoptionsconfig)     | no       | `keepValue` (default `true`) keeps the current selection. |

Each entry of `options` can be:

| Entry                                     | Result                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| `'mx'` or `42`                            | `<option value="mx">mx</option>`. The label is `String(value)`.            |
| `{ value, label?, disabled?, selected? }` | One `<option>`. `label` defaults to `String(value)`.                       |
| `{ label, options: [...], disabled? }`    | One `<optgroup>` holding the listed options (strings, numbers or objects). |

## Returns

The same [`FormController`](../../reference/typescript/#formcontroller) — chainable. Returns the controller unchanged when no `<select>` has that name.

## Behaviour

- Every `<select>` with the name gets the same list. Each one keeps its own selection. Inputs and textareas with the same name are ignored.
- Labels are written with `textContent`, never as HTML, so data from an API cannot inject markup.
- **Which option ends up selected**, for each select:
  1. If any new option has `selected: true`, those options are selected. They also become the default that [`reset()`](../reset/) restores. In a single select, the last one wins.
  2. Otherwise, with `keepValue: true` (default), the previous value stays selected if it is still in the list. A `<select multiple>` keeps every previous value that is still listed.
  3. Otherwise the browser picks the first option that is not disabled. A select with only disabled options has the value `''`.
- When the selected value changes, the controller dispatches one bubbling `input` event from the first changed select. The usual pipeline runs once: manual errors are cleared (default), validation runs, `css-filled` / `css-error` are updated, watchers fire, subscribers are notified and auto-submit is scheduled.
- When the selected value does not change, nothing fires: no event, no watchers, no subscriber notification.

## Examples

### Load options from an API

```ts
import { form } from '@samline/forms'

const address = form('address-form')

address.watch('country', async country => {
  address.setOptions('city', [{ value: '', label: 'Loading…', disabled: true }])

  const response = await fetch(`/api/cities?country=${country}`)
  const cities: { id: string; name: string }[] = await response.json()

  address.setOptions('city', [
    { value: '', label: 'Choose a city' },
    ...cities.map(city => ({ value: city.id, label: city.name })),
  ])
})
```

The first call shows a disabled "Loading…" option, so the city value becomes `''`. If `city` has `required: true`, the error shows until the user picks a city.

### Group options

```ts
address.setOptions('city', [
  { value: '', label: 'Choose a city' },
  { label: 'North', options: ['Monterrey', 'Tijuana'] },
  { label: 'South', options: [{ value: 'mid', label: 'Mérida' }] },
])
```

### Select a value while replacing

```ts
address.setOptions('city', [
  { value: 'mty', label: 'Monterrey' },
  { value: 'gdl', label: 'Guadalajara', selected: true },
])
```

### Start over instead of keeping the value

```ts
address.setOptions('city', ['Monterrey', 'Guadalajara'], { keepValue: false })
```

## Edge cases

- **Changing options by hand also works.** If your code adds or removes `<option>` elements directly, the controller notices. When that changes the selected value, it revalidates, updates visual state, fires watchers and notifies subscribers. It does not clear manual errors or schedule auto-submit, because no one edited the field. Prefer `setOptions()`: it runs the full pipeline, including auto-submit.
- **`keepValue` compares values, not labels.** An option with the same `value` and a new label keeps the selection.
- **After `destroy()`, `setOptions()` is a no-op.**

## Related

- [`setValue`](../set-value/) — select one of the existing options.
- [`getField`](../get-field/) — read the `<select>` element.
- [`watch`](../watch/) — react to the parent field of a dependent dropdown.
- [`reset`](../reset/) — selects the options marked `selected` again, or the browser default.
