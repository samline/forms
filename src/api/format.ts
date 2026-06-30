// api/format.ts
// Applies the optional `@samline/formatter` peer to one or many form
// fields, with cleave-style cursor tracking and an auto-managed hidden
// raw mirror.
//
// Public surface lives on `FormController` as `format()` and
// `formatAll()`. Both are chainable and both behave identically — the
// alias exists only to read naturally when the caller wants to apply
// the same configuration to several inputs.
//
// When `@samline/formatter` is not installed the methods log a single
// `console.error` (via `loadFormatter`) and return the controller
// unchanged so the rest of the app keeps working.

import type { FieldFormatConfig, FormController, FormFieldElement } from '../core/types'
import {
  applyFormattedValue,
  ensureRawMirror,
  findRawMirror,
  FORMATTER_RAW_ATTRIBUTE
} from '../core/format-helpers'
import { loadFormatter } from '../core/formatter-loader'
import type { FormControllerHelpers, FormControllerState } from '../core/state'

// Listeners added on demand; tracked here so a future `unformat(field)`
// (out of scope for v1) can detach them without trawling `state.listeners`.
type FormatEntry = {
  fields: Set<HTMLInputElement | HTMLTextAreaElement>
  mirrorName: string
  handler: (event: Event) => void
  mirrorIsOwned: boolean
}

const registry = new WeakMap<FormControllerState, Map<string, FormatEntry>>()

const getRegistry = (state: FormControllerState): Map<string, FormatEntry> => {
  let bucket = registry.get(state)
  if (!bucket) {
    bucket = new Map<string, FormatEntry>()
    registry.set(state, bucket)
  }
  return bucket
}

const resolveFieldNames = (config: FieldFormatConfig): string[] =>
  Array.isArray(config.field) ? config.field : [config.field]

const addListener = (
  state: FormControllerState,
  target: EventTarget,
  type: string,
  handler: EventListener
): void => {
  target.addEventListener(type, handler)
  state.listeners.push({ element: target, type, handler })
}

const buildHandler = (
  field: HTMLInputElement | HTMLTextAreaElement,
  mirror: HTMLInputElement | null,
  formatFn: NonNullable<Awaited<ReturnType<typeof loadFormatter>>>['format'],
  formatType: FieldFormatConfig['type'],
  formatOptions: Record<string, unknown> | undefined,
  mirrorFieldName: string
): ((event: Event) => void) => {
  const handler = (event: Event) => {
    if (!field.isConnected) return
    // Bug #1 fix: ensure the event actually came from this field,
    // since the listener is delegated to the form.
    if (event.target !== field) return
    const rawInput = (event.target as HTMLInputElement | HTMLTextAreaElement).value
    const { formatted, raw } = formatFn(rawInput, formatType, formatOptions)

    if (!formatted && !raw) {
      field.value = ''
      if (mirror && mirror.value !== '') mirror.value = ''
      return
    }

    applyFormattedValue(field, mirror, formatted, raw)
    // Keep the registry mirror pointer alive for in-place cleanup.
    void mirrorFieldName
  }
  return handler
}

// Internal: core apply routine shared by `format()` and `formatAll()`.
// Returns the controller to preserve chainability even on the missing
// peer path.
const applyFormat = async (
  state: FormControllerState,
  helpers: FormControllerHelpers,
  config: FieldFormatConfig
): Promise<void> => {
  if (!state.element || !state.api) return

  const formatter = await loadFormatter()
  if (!formatter) return

  const formatType = config.type
  const formatOptions = config.options
  const fieldNames = resolveFieldNames(config)
  const bucket = getRegistry(state)

  for (const fieldName of fieldNames) {
    const fields = helpers.getFieldsByName(fieldName) as FormFieldElement[]
    if (fields.length === 0) continue

    // Filter to text-like inputs — the formatter does not work on
    // checkboxes, radios, files, etc.
    const writable = fields.filter(
      (f): f is HTMLInputElement | HTMLTextAreaElement =>
        (f instanceof HTMLInputElement &&
          f.type !== 'checkbox' &&
          f.type !== 'radio' &&
          f.type !== 'file' &&
          f.type !== 'submit' &&
          f.type !== 'button') ||
        f instanceof HTMLTextAreaElement
    )

    if (writable.length === 0) continue

    for (const field of writable) {
      // Idempotency: a second `format()` call for the same field
      // refreshes the configuration in `state.formattedFields` but
      // does not double-bind listeners or duplicate the hidden mirror.
      const existing = bucket.get(fieldName)
      const mirrorName = config.rawField ?? `${fieldName}_raw`
      // Bug #2a fix: search by fieldName (the data-formatter-raw-for value),
      // not mirrorName (the input name). findRawMirror looks for
      // data-formatter-raw-for="<fieldName>", not data-formatter-raw-for="<fieldName>Raw".
      let mirror = findRawMirror(state.element, fieldName) ?? null
      const mirrorIsOwned = !mirror
      if (!mirror) mirror = ensureRawMirror(state.element, fieldName)
      // Sync the mirror's `name` attribute when the user overrides it
      // via `config.rawField` (default `<field>Raw`).
      if (mirror && mirror.name !== mirrorName) mirror.name = mirrorName
      const trackerMirrorName = mirror?.name ?? mirrorName

      if (existing) {
        // Refresh the stored config so `destroy()` knows the entry is
        // still active, but do not re-attach listeners.
        existing.mirrorName = trackerMirrorName
        existing.mirrorIsOwned = mirrorIsOwned
        state.formattedFields.set(fieldName, {
          config,
          mirrorName: trackerMirrorName,
          mirrorIsOwned
        })
        // Bug #2b fix: re-format the current value with the new options
        // (e.g. country_code change needs to re-format the phone).
        // Only re-format when the field has a value; when the field is
        // empty we leave the mirror untouched so pre-existing raw values
        // (set before format() was called) are preserved.
        const current = field.value
        if (current !== '') {
          const { formatted, raw } = formatter.format(current, formatType, formatOptions)
          applyFormattedValue(field, mirror, formatted, raw)
        }
        continue
      }

      const handler = buildHandler(
        field,
        mirror,
        formatter.format,
        formatType,
        formatOptions,
        trackerMirrorName
      )

      addListener(state, state.element, 'input', handler)
      bucket.set(fieldName, {
        fields: new Set([field]),
        mirrorName: trackerMirrorName,
        handler,
        mirrorIsOwned
      })
      state.formattedFields.set(fieldName, {
        config,
        mirrorName: trackerMirrorName,
        mirrorIsOwned
      })

      // Apply the formatter to the current value so pre-filled data
      // (e.g. coming from `setValue`, `prefill`, or server-rendered
      // HTML) is normalised immediately and the hidden mirror is
      // populated without waiting for a user keystroke.
      const initial = field.value
      if (initial !== '') {
        const { formatted, raw } = formatter.format(initial, formatType, formatOptions)
        applyFormattedValue(field, mirror, formatted, raw)
      } else if (mirrorIsOwned && mirror && mirror.value !== '') {
        // Only clear an owned mirror when the field is empty. Pre-existing
        // mirrors are left untouched so their values are preserved.
        mirror.value = ''
      }
    }
  }
}

export const createFormat =
  (state: FormControllerState, helpers: FormControllerHelpers) =>
  (config: FieldFormatConfig): FormController => {
    if (state.isDestroyed) return state.api!
    if (!state.element) return state.api!

    // Fire and forget: the loader surfaces a single console.error if
    // the peer is missing, then resolves with `null`.
    void applyFormat(state, helpers, config)

    return state.api!
  }

export const createFormatAll = createFormat

// Cleanup hook consumed by `api/destroy.ts`. Removes every listener
// registered through this module and drops the owned raw mirrors that
// were created during the controller's lifetime. Mirrors that already
// existed in the DOM (i.e. `mirrorIsOwned === false`) are left alone.
export const cleanupFormatRegistry = (state: FormControllerState): void => {
  if (!state.element) {
    registry.delete(state)
    return
  }

  const bucket = registry.get(state)
  if (!bucket) {
    state.element
      .querySelectorAll<HTMLInputElement>(`[${FORMATTER_RAW_ATTRIBUTE}]`)
      .forEach(node => node.remove())
    return
  }

  for (const [fieldName, entry] of bucket) {
    state.element.removeEventListener('input', entry.handler)
    if (entry.mirrorIsOwned) {
      const mirror = findRawMirror(state.element, entry.mirrorName)
      mirror?.remove()
    }
    bucket.delete(fieldName)
    state.formattedFields.delete(fieldName)
  }

  // Catch any leftover owned mirrors (defensive — should not happen
  // because every `applyFormat` path registers in the bucket, but the
  // second pass guarantees no orphans escape `destroy()`).
  state.element
    .querySelectorAll<HTMLInputElement>(`[${FORMATTER_RAW_ATTRIBUTE}]`)
    .forEach(node => node.remove())
}