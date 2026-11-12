// api/set-options.ts
// Replaces the <option>/<optgroup> children of every <select> with the
// given name. Labels are written as text, never as HTML. The previous
// selection survives when its value is still listed (unless the caller
// marks options as `selected` or passes `keepValue: false`). The change
// pipeline (validation, watchers, subscribers, auto-submit) runs through
// one `input` event, and only when a selected value actually changed.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { SelectOption, SelectOptionInput, SetOptionsConfig } from '../core/types'

const isGroup = (
  entry: SelectOptionInput
): entry is Extract<SelectOptionInput, { options: unknown }> =>
  typeof entry === 'object' &&
  entry !== null &&
  Array.isArray((entry as { options?: unknown }).options)

const createOption = (entry: string | number | SelectOption): HTMLOptionElement => {
  const option = document.createElement('option')
  if (typeof entry === 'object') {
    option.value = String(entry.value)
    option.textContent = entry.label ?? String(entry.value)
    option.disabled = Boolean(entry.disabled)
    if (entry.selected) option.defaultSelected = true
  } else {
    option.value = String(entry)
    option.textContent = String(entry)
  }
  return option
}

const buildNodes = (options: SelectOptionInput[]) => {
  const nodes: Array<HTMLOptionElement | HTMLOptGroupElement> = []
  let hasExplicitSelection = false
  const track = (option: HTMLOptionElement) => {
    if (option.defaultSelected) hasExplicitSelection = true
    return option
  }

  for (const entry of options) {
    if (entry === null || entry === undefined) continue
    if (isGroup(entry)) {
      const group = document.createElement('optgroup')
      group.label = entry.label
      group.disabled = Boolean(entry.disabled)
      for (const child of entry.options) {
        if (child === null || child === undefined) continue
        group.appendChild(track(createOption(child)))
      }
      nodes.push(group)
      continue
    }
    nodes.push(track(createOption(entry)))
  }

  return { nodes, hasExplicitSelection }
}

const selectedValues = (select: HTMLSelectElement): string[] =>
  Array.from(select.selectedOptions, option => option.value)

const restoreSelection = (select: HTMLSelectElement, previous: string[]) => {
  if (previous.length === 0) return
  const options = Array.from(select.options)
  if (select.multiple) {
    for (const option of options) option.selected = previous.includes(option.value)
    return
  }
  const match = options.find(option => option.value === previous[0])
  if (match) match.selected = true
}

const sameValues = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index])

export const createSetOptions =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  (name: string, options: SelectOptionInput[], config: SetOptionsConfig = {}) => {
    if (!state.element || state.isDestroyed) return state.api!
    const selects = helpers
      .getFieldsByName(name)
      .filter((field): field is HTMLSelectElement => field instanceof HTMLSelectElement)
    if (selects.length === 0) return state.api!

    const keepValue = config.keepValue ?? true
    const changed: HTMLSelectElement[] = []

    for (const select of selects) {
      const previous = selectedValues(select)
      const { nodes, hasExplicitSelection } = buildNodes(options)
      select.replaceChildren(...nodes)
      if (keepValue && !hasExplicitSelection) restoreSelection(select, previous)
      if (!sameValues(previous, selectedValues(select))) changed.push(select)
    }

    // The option swap is handled here; the mutation observer must not
    // process it a second time.
    helpers.commitOwnMutations(selects)

    changed[0]?.dispatchEvent(new Event('input', { bubbles: true }))
    return state.api!
  }
