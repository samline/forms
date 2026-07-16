// api/format.ts
// Applies the optional `@samline/formatter` peer to one or many form
// fields, with cleave-style cursor tracking and an auto-managed hidden
// raw mirror.
//
// Mirror convention
// -----------------
// `format()` mirrors the developer's authoring intent. The developer
// writes a single visible input with the name they want the backend
// to read (the "canonical" name, e.g. `phone`). The first time
// `format()` runs for that field it:
//
//   1. Renames the visible from `phone` to `phone_displayed`
//      (configurable via `FieldFormatConfig.displayField`). The
//      visible keeps showing the formatted value the user types.
//   2. Creates a hidden `<input type="hidden" name="phone">` that
//      carries the raw value the backend ultimately receives.
//
// After the rename both names are first-class in the controller's
// API:
//   - `getValue('phone')`            -> raw
//   - `getValue('phone_displayed')`  -> formatted
//   - `watch('phone', cb)`           -> cb receives the raw value
//   - `watch('phone_displayed', cb)` -> cb receives the formatted value
//   - `setValue('phone', x)`         -> writes raw, reformats visible
//   - `setValue('phone_displayed', x)` -> writes formatted, reformats raw
//   - `getData()`                    -> FormData carries both keys
//   - `validators.phone`             -> runs against the raw value
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
  ensureHiddenMirror,
  findHiddenMirror,
  findVisibleField,
  FORMATTER_RAW_ATTRIBUTE,
  renameVisibleField,
  restoreVisibleName
} from '../core/format-helpers'
import { loadFormatter } from '../core/formatter-loader'
import type { FormControllerHelpers, FormControllerState } from '../core/state'

// Listeners added on demand; tracked here so `destroy()` can detach
// the input listeners and remove the mirrors the controller owns.
type FormatEntry = {
  canonicalName: string
  displayName: string
  visible: HTMLInputElement | HTMLTextAreaElement
  mirror: HTMLInputElement
  mirrorIsOwned: boolean
  /**
   * The bound input listener. `null` until phase 2 of `applyFormat`
   * installs the real closure (after the formatter peer resolves);
   * the placeholder skips input events so the visible / mirror
   * remain consistent even before the peer loads.
   */
  handler: ((event: Event) => void) | null
}

/**
 * Sentinel for "no handler bound yet" so phase 2 of `applyFormat`
 * can tell first-time bindings apart from idempotent re-binds.
 */
const UNBOUND: ((event: Event) => void) | null = null

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
  handler: EventListener,
  useCapture?: boolean
): void => {
  if (useCapture) {
    target.addEventListener(type, handler, { capture: true })
  } else {
    target.addEventListener(type, handler)
  }
  // `exactOptionalPropertyTypes: true` rejects explicit `undefined`
  // values for optional properties; only attach `capture` when it
  // actually has a value.
  const entry: {
    element: EventTarget
    type: string
    handler: EventListener
    capture?: boolean
  } = { element: target, type, handler }
  if (useCapture !== undefined) entry.capture = useCapture
  state.listeners.push(entry)
}

// `InputEvent.inputType` is the canonical signal for "what just
// happened". The listener is registered as a plain `Event` handler so
// older / synthetic events without `inputType` simply fall through and
// behave as insertions — which preserves the pre-existing cursor math.
const readInputType = (event: Event): string | undefined => {
  const candidate = event as Partial<InputEvent>
  return typeof candidate.inputType === 'string' ? candidate.inputType : undefined
}

const buildHandler = (
  visible: HTMLInputElement | HTMLTextAreaElement,
  mirror: HTMLInputElement,
  formatFn: NonNullable<Awaited<ReturnType<typeof loadFormatter>>>['format'],
  formatType: FieldFormatConfig['type'],
  formatOptions: Record<string, unknown> | undefined
): ((event: Event) => void) => {
  const handler = (event: Event) => {
    if (!visible.isConnected || !mirror.isConnected) return

    // Two valid event sources: the visible (user typing) or the
    // mirror (a `setValue('phone', x)` or external script that
    // wrote the raw). Any other source is unrelated.
    const isVisible = event.target === visible
    const isMirror = event.target === mirror
    if (!isVisible && !isMirror) return

    // When the mirror is the source, take its current value as the
    // raw input — it is the developer's authoritative intent. When
    // the visible is the source, take the visible's value as usual
    // (it is the unformatted text the user just typed).
    const rawInput = isMirror ? mirror.value : visible.value
    const inputType = readInputType(event)
    const { formatted, raw } = formatFn(rawInput, formatType, formatOptions)

    if (!formatted && !raw) {
      visible.value = ''
      if (mirror.value !== '') mirror.value = ''
      return
    }

    applyFormattedValue(visible, mirror, formatted, raw, inputType)
  }
  return handler
}

// Internal: core apply routine shared by `format()` and `formatAll()`.
// Splits the setup into two phases so the developer-facing effects
// (visible renamed, hidden created) are visible synchronously after
// `format()` returns. The formatter peer still loads asynchronously
// on the first call, but only the "bind input listener + apply
// formatter to the current value" step is deferred — every other
// piece of state is in place by the time the method returns.
//
// Phase 2 only touches the entries for the fields in THIS
// `applyFormat` call — never iterates the whole bucket. Multiple
// concurrent `format()` calls (e.g. `format(phone)`, `format(date)`,
// `format(general)` in the same script tick) each have their own
// phase 2, and each binds its own entry with its own config. If
// phase 2 walked the whole bucket, the first call to resume would
// bind every entry with the first call's config and the rest would
// short-circuit on the "already bound" check, leaving subsequent
// fields wired to the wrong formatter.
//
// Returns the controller to preserve chainability even on the missing
// peer path.
const applyFormat = async (
  state: FormControllerState,
  helpers: FormControllerHelpers,
  config: FieldFormatConfig
): Promise<void> => {
  if (!state.element || !state.api) return

  const formatType = config.type
  const formatOptions = config.options
  const fieldNames = resolveFieldNames(config)
  const bucket = getRegistry(state)

  // Track the entries phase 1 just inserted (or re-bound) so
  // phase 2 only touches those — never the entries of a previous
  // `format()` call. Without this, the first call to resume from
  // `await loadFormatter()` would bind every entry in the bucket
  // with the first call's config.
  const phase1Entries: FormatEntry[] = []

  // Phase 1 (sync): rename the visible, create / reuse the hidden
  // mirror, refresh the `formattedFields` registry. After this
  // returns, the controller's API surface is fully functional for
  // the field — `getValue('phone')` reads the hidden, `getValue(
  // 'phone_displayed')` reads the visible. The input listener and
  // the initial value pass through the formatter are installed
  // once the peer resolves in phase 2.
  for (const fieldName of fieldNames) {
    const displayName = config.displayField ?? `${fieldName}_displayed`

    // Resolve the visible input. Two authoring styles are supported:
    //
    //   1. The dev wrote `<input name="phone">` (the canonical
    //      name). `format()` will rename it to `phone_displayed`
    //      on first run.
    //   2. The dev pre-authored `<input name="phone_displayed">`
    //      (or whatever `displayField` resolves to). `format()`
    //      leaves the name alone.
    //
    // Both paths end up with the same DOM: a visible carrying the
    // display name + a hidden carrying the canonical name.
    const canonicalFields = helpers.getFieldsByName(fieldName) as FormFieldElement[]
    const candidates = canonicalFields.filter(
      (f): f is HTMLInputElement | HTMLTextAreaElement =>
        (f instanceof HTMLInputElement && f.type !== 'hidden') ||
        f instanceof HTMLTextAreaElement
    )
    let visible: HTMLInputElement | HTMLTextAreaElement | null = candidates[0] ?? null
    if (!visible) {
      visible = findVisibleField(state.element, displayName)
    }
    if (!visible) continue

    // Idempotency: a second `format()` call for the same canonical
    // name refreshes the configuration but does not double-bind
    // listeners or duplicate the hidden mirror.
    const existing = bucket.get(fieldName)

    // Pre-authored hidden? Reuse it. Otherwise create one.
    let mirror = findHiddenMirror(state.element, fieldName)
    const mirrorIsOwned = !mirror
    if (!mirror) mirror = ensureHiddenMirror(state.element, fieldName)

    // Rename the visible from the canonical name to the display
    // name. No-op if the developer pre-authored the visible with
    // the display name (skip-rename path).
    renameVisibleField(visible, displayName)

    if (existing) {
      // Refresh the stored config so `destroy()` knows the entry
      // is still active, but do not re-attach listeners.
      existing.displayName = displayName
      existing.mirrorIsOwned = mirrorIsOwned
      state.formattedFields.set(fieldName, {
        config,
        displayName,
        mirrorIsOwned
      })
      phase1Entries.push(existing)
    } else {
      // Reserve the slot in the bucket so subsequent
      // `getFieldsByName` lookups can find the visible + mirror
      // and so phase 2 has a target to bind the handler to.
      // The handler is installed in phase 2 (after the formatter
      // peer resolves); until then the entry is tracked but the
      // capture-phase input listener is not yet on the form.
      const entry: FormatEntry = {
        canonicalName: fieldName,
        displayName,
        visible,
        mirror,
        mirrorIsOwned,
        handler: UNBOUND
      }
      bucket.set(fieldName, entry)
      state.formattedFields.set(fieldName, {
        config,
        displayName,
        mirrorIsOwned
      })
      phase1Entries.push(entry)
    }
  }

  // Phase 2 (async): load the formatter peer (cached on second
  // call) and install the real input listener + initial-value
  // pass. If the peer is missing, every entry phase 1 created is
  // rolled back: the visible's name is restored, the owned hidden
  // mirror is removed, the bucket + registry are cleared. The user
  // sees a single `console.error` from `loadFormatter` and the form
  // is left exactly as the developer authored it.
  const formatter = await loadFormatter()
  if (!formatter) {
    rollbackPhase1(phase1Entries, bucket, state.formattedFields)
    return
  }

  for (const entry of phase1Entries) {
    if (entry.handler !== UNBOUND) {
      // Idempotent re-bind path (e.g. the country_code watch
      // re-calling `format({ type: 'phone', field: 'phone' })`
      // with a new country): re-format the current value with
      // the new options. The handler is already installed with
      // its original closure; we do not re-bind it on every
      // re-call because the listener was bound with capture and
      // updating it would require detach + reattach, which is
      // out of scope for v2.3. If you need hot-swap semantics,
      // call `destroy()` + `format()` again.
      const current = entry.visible.value
      if (current !== '') {
        const { formatted, raw } = formatter.format(current, formatType, formatOptions)
        applyFormattedValue(entry.visible, entry.mirror, formatted, raw)
      }
      continue
    }

    // First-time bind: install the real capture-phase handler
    // and run the initial value through the formatter so
    // pre-filled data (set before format() ran) is normalised
    // and the hidden mirror is populated without waiting for a
    // user keystroke.
    const handler = buildHandler(
      entry.visible,
      entry.mirror,
      formatter.format,
      formatType,
      formatOptions
    )
    addListener(state, state.element, 'input', handler, true)
    entry.handler = handler

    const initial = entry.visible.value
    if (initial !== '') {
      const { formatted, raw } = formatter.format(initial, formatType, formatOptions)
      applyFormattedValue(entry.visible, entry.mirror, formatted, raw)
    } else if (entry.mirrorIsOwned && entry.mirror.value !== '') {
      // Only clear an owned mirror when the visible is empty.
      // Pre-existing mirrors are left untouched so their values
      // are preserved.
      entry.mirror.value = ''
    }
  }
}

// Roll back every change made in phase 1 of `applyFormat`. Used
// when the formatter peer is missing — we promised the user that
// `format()` is a no-op in that case, so we have to put the DOM
// back the way it was before the sync rename + hidden creation.
//
// Only the entries that the current `applyFormat` call touched
// are rolled back; pre-existing entries from previous calls are
// left alone.
const rollbackPhase1 = (
  entries: FormatEntry[],
  bucket: Map<string, FormatEntry>,
  registry: FormControllerState['formattedFields']
): void => {
  for (const entry of entries) {
    if (entry.visible.isConnected) {
      restoreVisibleName(entry.visible, entry.canonicalName)
    }
    if (entry.mirrorIsOwned && entry.mirror.isConnected) {
      entry.mirror.remove()
    }
    bucket.delete(entry.canonicalName)
    registry.delete(entry.canonicalName)
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

// Expose the lookup builder for the controller's delegated event
// handler. It maps either name (canonical or display) to the
// canonical so watchers on either name resolve to the same formatted
// pair.
export const resolveCanonicalForName = (
  state: FormControllerState,
  name: string
): string | null => {
  const bucket = registry.get(state)
  if (!bucket) return null
  for (const [canonical, entry] of bucket) {
    if (canonical === name || entry.displayName === name) return canonical
  }
  return null
}

// Companion to `resolveCanonicalForName` that resolves a name to
// the corresponding display name (the visible's name, not the
// canonical). The controller uses this to drive `syncVisualState`
// — the visual attributes (`css-filled`, `css-error`) need to land
// on the visible element, which is what the project's CSS targets
// via `:has([css-filled])` on the label parent. Setting them on
// the canonical (the hidden) leaves the label invisible because
// the hidden lives outside the label wrapper.
//
// For non-formatted fields, the display name is just the field's
// own name — there's no rename and no mirror.
export const resolveDisplayNameForName = (
  state: FormControllerState,
  name: string
): string => {
  const bucket = registry.get(state)
  if (!bucket) return name
  for (const [canonical, entry] of bucket) {
    if (canonical === name) return entry.displayName
    if (entry.displayName === name) return entry.displayName
  }
  return name
}

// Cleanup hook consumed by `api/destroy.ts`. Removes every listener
// registered through this module, restores the visible's name to the
// canonical, and drops the owned hidden mirrors that were created
// during the controller's lifetime. Pre-existing mirrors and the
// developer's original HTML are left untouched.
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
    if (entry.handler !== UNBOUND) {
      state.element.removeEventListener('input', entry.handler, true)
    }
    // Restore the visible's name so the form goes back to the
    // developer's authored state.
    if (entry.visible.isConnected) {
      restoreVisibleName(entry.visible, fieldName)
    }
    if (entry.mirrorIsOwned && entry.mirror.isConnected) {
      entry.mirror.remove()
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
