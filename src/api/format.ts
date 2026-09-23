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

type FormatEntry = {
  canonicalName: string
  displayName: string
  visible: HTMLInputElement | HTMLTextAreaElement
  mirror: HTMLInputElement
  mirrorIsOwned: boolean
  defaultVisible: string | null
  defaultRaw: string | null
  /** Bound after the formatter peer resolves. */
  handler: ((event: Event) => void) | null
}

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
  const entry: {
    element: EventTarget
    type: string
    handler: EventListener
    capture?: boolean
  } = { element: target, type, handler }
  if (useCapture !== undefined) entry.capture = useCapture
  state.listeners.push(entry)
}

const readInputType = (event: Event): string | undefined => {
  const candidate = event as Partial<InputEvent>
  return typeof candidate.inputType === 'string' ? candidate.inputType : undefined
}

// Canonical mirrors use auto detection; visible input is always display-order.
const buildAutoInterpretedOptions = (
  formatOptions: Record<string, unknown> | undefined
): Record<string, unknown> => ({
  ...(formatOptions ?? {}),
  interpretInputAs: 'auto'
})

const buildDisplayInterpretedOptions = (
  formatOptions: Record<string, unknown> | undefined
): Record<string, unknown> => ({
  ...(formatOptions ?? {}),
  interpretInputAs: 'display'
})

const shouldForceAutoInterpretation = (
  formatOptions: Record<string, unknown> | undefined
): boolean => formatOptions?.interpretInputAs === undefined

const buildHandler = (
  visible: HTMLInputElement | HTMLTextAreaElement,
  mirror: HTMLInputElement,
  formatFn: NonNullable<Awaited<ReturnType<typeof loadFormatter>>>['format'],
  formatType: FieldFormatConfig['type'],
  formatOptions: Record<string, unknown> | undefined
): ((event: Event) => void) => {
  const handler = (event: Event) => {
    if (!visible.isConnected || !mirror.isConnected) return

    const isVisible = event.target === visible
    const isMirror = event.target === mirror
    if (!isVisible && !isMirror) return

    const rawInput = isMirror ? mirror.value : visible.value
    const inputType = readInputType(event)
    const sourceOptions = shouldForceAutoInterpretation(formatOptions)
      ? isMirror
        ? buildAutoInterpretedOptions(formatOptions)
        : buildDisplayInterpretedOptions(formatOptions)
      : formatOptions
    const { formatted, raw } = formatFn(rawInput, formatType, sourceOptions)

    if (!formatted && !raw) {
      visible.value = ''
      if (mirror.value !== '') mirror.value = ''
      return
    }

    applyFormattedValue(visible, mirror, formatted, raw, inputType)
  }
  return handler
}

// Phase one mutates the DOM synchronously; phase two binds only this call's entries.
const applyFormat = async (
  state: FormControllerState,
  helpers: FormControllerHelpers,
  config: FieldFormatConfig
): Promise<void> => {
  if (!state.element || !state.api) return
  if (Array.isArray(config.field) && config.displayField) {
    console.error(
      '[samline/forms] `displayField` can only be used when `field` is a string.'
    )
    return
  }

  const formatType = config.type
  const formatOptions = config.options
  const fieldNames = resolveFieldNames(config)
  const bucket = getRegistry(state)

  const phase1Entries: FormatEntry[] = []

  // Phase 1: establish the visible/canonical pair synchronously.
  for (const fieldName of fieldNames) {
    const displayName = config.displayField ?? `${fieldName}_displayed`

    // Accept either a canonical visible field or a pre-authored display field.
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

    const existing = bucket.get(fieldName)

    let mirror = findHiddenMirror(state.element, fieldName)
    const mirrorIsOwned = !mirror
    if (!mirror) mirror = ensureHiddenMirror(state.element, fieldName)

    renameVisibleField(visible, displayName)

    if (existing) {
      existing.displayName = displayName
      existing.mirrorIsOwned = mirrorIsOwned
      state.formattedFields.set(fieldName, {
        config,
        displayName,
        mirrorIsOwned
      })
      phase1Entries.push(existing)
    } else {
      const entry: FormatEntry = {
        canonicalName: fieldName,
        displayName,
        visible,
        mirror,
        mirrorIsOwned,
        defaultVisible: null,
        defaultRaw: null,
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

  // Phase 2: load the peer, bind listeners, and normalize initial values.
  const formatter = await loadFormatter()
  if (state.isDestroyed) {
    rollbackPhase1(phase1Entries, bucket, state.formattedFields)
    return
  }
  if (!formatter) {
    rollbackPhase1(phase1Entries, bucket, state.formattedFields)
    return
  }

  for (const entry of phase1Entries) {
    if (entry.handler !== UNBOUND) {
      // Reformat without duplicating the existing capture listener.
      const current = entry.visible.value
      if (current !== '') {
        const rebindOptions = shouldForceAutoInterpretation(formatOptions)
          ? buildDisplayInterpretedOptions(formatOptions)
          : formatOptions
        const { formatted, raw } = formatter.format(current, formatType, rebindOptions)
        applyFormattedValue(entry.visible, entry.mirror, formatted, raw)
      }
      continue
    }

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
      // Initial values may be canonical server data; preserve explicit modes.
      const initialOptions = shouldForceAutoInterpretation(formatOptions)
        ? buildAutoInterpretedOptions(formatOptions)
        : formatOptions
      const { formatted, raw } = formatter.format(initial, formatType, initialOptions)
      applyFormattedValue(entry.visible, entry.mirror, formatted, raw)
    } else if (entry.mirrorIsOwned && entry.mirror.value !== '') {
      entry.mirror.value = ''
    }
    entry.defaultVisible = entry.visible.value
    entry.defaultRaw = entry.mirror.value
  }
}

export const resetFormattedFields = (state: FormControllerState): void => {
  const bucket = registry.get(state)
  if (!bucket) return
  for (const entry of bucket.values()) {
    if (entry.defaultVisible !== null) entry.visible.value = entry.defaultVisible
    if (entry.defaultRaw !== null) entry.mirror.value = entry.defaultRaw
  }
}

// Restore only entries touched by the current call when peer loading fails.
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

    void applyFormat(state, helpers, config)

    return state.api!
  }

export const createFormatAll = createFormat

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
    if (entry.visible.isConnected) {
      restoreVisibleName(entry.visible, fieldName)
    }
    if (entry.mirrorIsOwned && entry.mirror.isConnected) {
      entry.mirror.remove()
    }
    bucket.delete(fieldName)
    state.formattedFields.delete(fieldName)
  }

  // Remove any orphaned mirrors defensively.
  state.element
    .querySelectorAll<HTMLInputElement>(`[${FORMATTER_RAW_ATTRIBUTE}]`)
    .forEach(node => node.remove())
}
