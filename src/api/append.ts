// api/append.ts
// Appends DOM content to the bound form. If a class is provided, removes
// any existing node with that class first to avoid duplicates.
// Returns the created node or null when no element is bound.

import type { FormControllerHelpers, FormControllerState } from '../core/state'
import type { AppendContentOptions } from '../core/types'

export const createAppend =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  ({ tag, content, class: className, atStart = false }: AppendContentOptions) => {
    if (!state.element) return null

    helpers.clearFieldCache()

    if (className) {
      const classSelector = className.trim().split(/\s+/)[0]
      const existing = classSelector
        ? state.element.querySelector(`.${classSelector}`)
        : null
      existing?.remove()
    }

    const node = document.createElement(tag)
    if (className) node.className = className
    node.innerHTML = content

    if (atStart && state.element.firstChild) {
      state.element.insertBefore(node, state.element.firstChild)
    } else {
      state.element.appendChild(node)
    }

    return node
  }
