// Low-level helpers used by `api/format.ts`:
//   - DOM cursor tracking equivalent to cleave.js' `getNextCursorPosition`
//     (so typing/backspacing inside formatted inputs keeps the caret
//     in a sensible place, even when delimiters are inserted or removed).
//   - Raw-mirror lookup & creation: each formatted input gets a hidden
//     sibling (`type="hidden"`) that holds the backend-ready `raw`
//     value. The mirror is created on first `format()` call and reused
//     on subsequent calls so re-binding the controller does not duplicate
//     hidden inputs.
//
// The helpers here are pure DOM utilities — they do not know about the
// controller state.

import type { FormFieldElement } from './types'

export const FORMATTER_RAW_ATTRIBUTE = 'data-formatter-raw-for'

// Resolve a field by name (used to read the original input that owns the
// raw mirror). Returns the first matching element or `null`.
export const getFormatterField = (
  form: HTMLFormElement,
  name: string
): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null => {
  const selector = `[name="${cssEscape(name)}"]`
  const node = form.querySelector(selector)
  if (
    node instanceof HTMLInputElement ||
    node instanceof HTMLTextAreaElement ||
    node instanceof HTMLSelectElement
  ) {
    return node
  }
  return null
}

// Minimal CSS.escape polyfill for selectors that may contain special
// characters (`[1].phone`, `email[primary]`, etc.).
const cssEscape = (value: string): string => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }
  return value.replace(/([!"#$%&'()*+,./:;<=>?@\[\\\]^`{|}~])/g, '\\$1')
}

// Find the hidden input that mirrors `raw` for the given field name.
// Returns the existing element or `null`.
export const findRawMirror = (
  form: HTMLFormElement,
  fieldName: string
): HTMLInputElement | null => {
  const byAttr = form.querySelector<HTMLInputElement>(
    `[${FORMATTER_RAW_ATTRIBUTE}="${cssEscape(fieldName)}"]`
  )
  if (byAttr) return byAttr

  // Backwards-compatible lookup: existing deployments may have used
  // `<input name="<field>_raw">` or `<input name="<field>Raw">` to carry the raw value. Reuse it.
  const byName = form.querySelector<HTMLInputElement>(
    `[name="${cssEscape(`${fieldName}_raw`)}"]`
  )
  if (byName) return byName
  const byNameOld = form.querySelector<HTMLInputElement>(
    `[name="${cssEscape(`${fieldName}Raw`)}"]`
  )
  if (byNameOld) return byNameOld

  return null
}

// Create a hidden input that will mirror the raw value of `fieldName`.
// Idempotent: if a mirror already exists it is returned as-is.
export const ensureRawMirror = (
  form: HTMLFormElement,
  fieldName: string
): HTMLInputElement => {
  const existing = findRawMirror(form, fieldName)
  if (existing) return existing

  const input = document.createElement('input')
  input.type = 'hidden'
  input.name = `${fieldName}_raw`
  input.setAttribute('aria-hidden', 'true')
  input.tabIndex = -1
  input.setAttribute(FORMATTER_RAW_ATTRIBUTE, fieldName)
  form.appendChild(input)
  return input
}

// Remove every raw mirror owned by `format()`. Mirrors created by this
// controller carry the `data-formatter-raw-for` attribute; mirrors that
// existed before are left untouched.
export const removeOwnedRawMirrors = (form: HTMLFormElement): void => {
  form
    .querySelectorAll<HTMLInputElement>(`[${FORMATTER_RAW_ATTRIBUTE}]`)
    .forEach(node => node.remove())
}

// Write `formatted` into the visible field and `raw` into the hidden
// mirror, preserving the cursor as best as possible.
//
// Returns the new caret position so callers can debug or run additional
// assertions. The function avoids triggering `MutationObserver` cascades
// for the hidden mirror by setting `.value` directly (the controller's
// own delegated handler ignores hidden inputs via `isFieldElement`).
export const applyFormattedValue = (
  visible: HTMLInputElement | HTMLTextAreaElement,
  mirror: HTMLInputElement | null,
  formatted: string,
  raw: string
): number => {
  // Capture the caret in the **raw** input the user just typed — this
  // is what cleave's `getNextCursorPosition` does. Using the formatted
  // previous value would lose information when the user edits in the
  // middle of a masked field (deletion adjacent to delimiters, etc.).
  const rawInput = visible.value
  const caret = clamp(
    visible.selectionStart ?? rawInput.length,
    0,
    rawInput.length
  )

  if (rawInput === formatted) {
    if (mirror && mirror.value !== raw) mirror.value = raw
    return caret
  }

  visible.value = formatted

  if (mirror) mirror.value = raw

  const newCaret = computeCursorPosition(caret, rawInput, formatted)
  restoreCursor(visible, newCaret)
  return newCaret
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

// `computeCursorPosition` is a cleave-style implementation:
//   - count "non-format" characters (digits / letters) between the caret
//     and the start of the **raw input the user just typed**, then
//     locate that same logical index in the new formatted value
//     (jumping over inserted delimiters).
//   - when the caret is at (or past) the end of the raw input, place
//     it at the end of the formatted value.
//
// The algorithm intentionally avoids any cleave-zen dependency so this
// file is pure DOM arithmetic.
export const computeCursorPosition = (
  caretPos: number,
  rawInput: string,
  newValue: string
): number => {
  if (newValue.length === 0) return 0

  // Caret at (or past) the end of the raw input — place at new end.
  if (caretPos >= rawInput.length) return newValue.length

  // Caret within the raw input: count non-format characters to its
  // LEFT (i.e. how many real characters are before the caret) and
  // find that same count in the new formatted value.
  const targetNonFormat = countNonFormat(rawInput.slice(0, caretPos))

  if (targetNonFormat === 0) {
    // Skip leading delimiters / prefix symbols (`$`, `+`, …) so the
    // caret lands at the first real character of the new value.
    let i = 0
    while (i < newValue.length && isFormatChar(newValue[i]!)) i += 1
    return i
  }

  let seen = 0
  for (let i = 0; i < newValue.length; i += 1) {
    if (!isFormatChar(newValue[i]!)) {
      seen += 1
      if (seen === targetNonFormat) {
        return Math.min(i + 1, newValue.length)
      }
    }
  }

  return newValue.length
}

const countNonFormat = (value: string): number => {
  let count = 0
  for (const char of value) {
    if (!isFormatChar(char)) count += 1
  }
  return count
}

// "Format characters" are delimiters, prefix symbols, and other
// non-alphanumeric separators that the formatter may insert or remove.
// We deliberately keep this conservative — anything that is not a digit
// or ASCII letter counts as a format character.
export const isFormatChar = (char: string): boolean => {
  if (!char) return false
  if (char >= '0' && char <= '9') return false
  if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')) return false
  return true
}

const restoreCursor = (
  field: HTMLInputElement | HTMLTextAreaElement,
  position: number
): void => {
  const max = field.value.length
  const safe = clamp(position, 0, max)

  const apply = () => {
    try {
      field.setSelectionRange(safe, safe)
    } catch {
      // Some input types (number, email) throw on setSelectionRange.
      // Ignore — the caret just stays where the browser put it.
    }
  }

  // Android keyboard fix: defer one frame so the IME catches up before
  // we re-position the caret. Mirrors cleave.js' `isAndroid` branch.
  if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(apply)
    } else {
      setTimeout(apply, 1)
    }
    return
  }

  apply()
}

// `getFormatterField` re-exported above is the canonical entry point,
// but it is intentionally restricted to controller-owned fields. This
// looser helper accepts a wider set of inputs for test fixtures.
export const isFormatterFieldElement = (node: Element): node is FormFieldElement =>
  node instanceof HTMLInputElement ||
  node instanceof HTMLTextAreaElement ||
  node instanceof HTMLSelectElement