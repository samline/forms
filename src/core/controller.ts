// Core orchestrator. Wires shared state, internal helpers and the public
// api method factories into a single FormController instance.
//
// Internal event handlers and DOM wiring live here. Every public method
// lives in `../api/<method>.ts` as an isolated factory.

import { createAppend } from '../api/append'
import { createAddCleanup } from '../api/add-cleanup'
import { createAutoSubmit } from '../api/auto-submit'
import { createClearErrors } from '../api/clear-errors'
import { createDestroy } from '../api/destroy'
import { createDisableAutoSubmit } from '../api/disable-auto-submit'
import {
  createFormat,
  createFormatAll,
  resolveCanonicalForName,
  resolveDisplayNameForName,
  resetFormattedFields
} from '../api/format'
import { createGetData } from '../api/get-data'
import { createGetField } from '../api/get-field'
import { createGetState } from '../api/get-state'
import { createGetValue } from '../api/get-value'
import { createObserve } from '../api/observe'
import { createOnSubmit } from '../api/on-submit'
import { createPrefill } from '../api/prefill'
import { createReset } from '../api/reset'
import { createRevalidate } from '../api/revalidate'
import { createSetErrors } from '../api/set-errors'
import { createSetOptions } from '../api/set-options'
import { createSetValue } from '../api/set-value'
import { createSubscribe } from '../api/subscribe'
import { createUnwatch } from '../api/unwatch'
import { createValidate } from '../api/validate'
import { createWatch } from '../api/watch'
import { validateFieldValueDetailed } from '../core/validation'
import { parseFormData } from './serialize'
import {
  applyBooleanAttribute,
  clearAttributes,
  getNamedFields,
  isFieldElement,
  isFieldFilled,
  queryNamedFields,
  readFieldValue,
  resolveFormElement,
  submitForm,
  writeFieldValue
} from './dom'
import { cloneErrors, mergeErrors } from './state'
import type {
  FormController,
  FormControllerOptions,
  FormFieldElement,
  FormFieldValue,
  FormTarget,
  ValidationResult,
  VisualAttributes
} from './types'
import type { FormControllerHelpers, FormControllerState } from './state'

const DEFAULT_ATTRIBUTES: Required<VisualAttributes> = {
  filled: 'css-filled',
  error: 'css-error'
}

const DEFAULT_OPTIONS = {
  autoValidate: true,
  clearErrorsOnSubmit: true,
  clearManualErrorsOnChange: true
} satisfies Pick<
  FormControllerOptions,
  'autoValidate' | 'clearErrorsOnSubmit' | 'clearManualErrorsOnChange'
>

export const createFormController = (
  target: FormTarget,
  options: FormControllerOptions = {}
): FormController => {
  const element = resolveFormElement(target)
  const attributes = { ...DEFAULT_ATTRIBUTES, ...options.attributes }
  const normalizedOptions: FormControllerOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    attributes
  }

  const state: FormControllerState = {
    element,
    options: normalizedOptions,
    attributes,
    validators: normalizedOptions.validators ?? {},
    watchedFields: new Map(),
    groupWatchers: new Set(),
    subscribers: new Set(),
    submitHandlers: new Set(),
    fieldCache: new Map(),
    manualErrors: {},
    validationErrors: {},
    validationGroupErrors: {},
    validationElementErrors: new Map(),
    isValidated: Boolean(normalizedOptions.autoValidate),
    autoSubmitEnabled: false,
    autoSubmitDebounce: 0,
    submitCount: 0,
    pendingSubmitCount: 0,
    autoSubmitTimer: null,
    isAutoSubmitting: false,
    autoSubmitSuspended: false,
    isResetting: false,
    isDestroyed: false,
    listeners: [],
    mutationObserver: null,
    cleanups: new Set(),
    formattedFields: new Map(),
    api: null
  }

  // Reverse cross-field references once so source changes can revalidate
  // dependent fields without installing per-field listeners.
  const validationDependents = new Map<string, Set<string>>()
  for (const [field, rules] of Object.entries(state.validators)) {
    const sources = new Set<string>()
    const sameAs = rules.sameAs
    if (sameAs !== undefined) {
      sources.add(typeof sameAs === 'string' ? sameAs : sameAs.value)
    }
    if (typeof rules.dependsOn === 'string') sources.add(rules.dependsOn)
    else rules.dependsOn?.forEach(source => sources.add(source))

    for (const source of sources) {
      const dependents = validationDependents.get(source) ?? new Set<string>()
      dependents.add(field)
      validationDependents.set(source, dependents)
    }
  }

  // ------- Internal helpers (no DOM wiring of their own) -----------------

  const notifySubscribers = () => {
    if (!state.api) return
    const snapshot = state.api.getState()
    state.subscribers.forEach(listener => listener(snapshot))
  }

  const addListener = (
    node: EventTarget,
    type: string,
    handler: EventListenerOrEventListenerObject,
    capture?: boolean
  ) => {
    if (capture) {
      node.addEventListener(type, handler, { capture: true })
    } else {
      node.addEventListener(type, handler)
    }
    // `exactOptionalPropertyTypes: true` rejects explicit `undefined`
    // values for optional properties; only attach `capture` when it
    // actually has a value.
    const entry: {
      element: EventTarget
      type: string
      handler: EventListenerOrEventListenerObject
      capture?: boolean
    } = { element: node, type, handler }
    if (capture !== undefined) entry.capture = capture
    state.listeners.push(entry)
  }

  const clearFieldCache = () => state.fieldCache.clear()

  const getFieldsByName = (name: string): FormFieldElement[] => {
    if (!state.element) return []
    const fields = queryNamedFields(state.element, name)
    state.fieldCache.set(name, fields)
    return fields
  }

  // Group every named control in one pass over `form.elements`. Reading
  // all values field-by-field would rescan the collection once per name.
  const indexFieldsByName = (): Map<string, FormFieldElement[]> => {
    const index = new Map<string, FormFieldElement[]>()
    if (!state.element) return index
    for (const field of getNamedFields(state.element)) {
      const bucket = index.get(field.name)
      if (bucket) bucket.push(field)
      else index.set(field.name, [field])
    }
    return index
  }

  const getTrackedFieldNames = (index = indexFieldsByName()): string[] => {
    if (!state.element) return Object.keys(state.validators)
    const names = new Set<string>(Object.keys(state.validators))
    for (const name of index.keys()) names.add(name)
    // The formatted registry keeps the canonical name as the bucket
    // key. The display name (e.g. `phone_displayed`) is also a
    // tracked field because the developer can `watch`/`getValue` it
    // and `getData()` exposes it in the serialized payload.
    for (const [canonical, entry] of state.formattedFields) {
      names.add(canonical)
      if (entry.displayName && entry.displayName !== canonical) {
        names.add(entry.displayName)
      }
    }
    return Array.from(names)
  }

  const getValues = () => {
    const values: Record<string, FormFieldValue> = {}
    const index = indexFieldsByName()
    for (const name of getTrackedFieldNames(index)) {
      values[name] = readFieldValue(index.get(name) ?? [])
    }
    return values
  }

  const getMergedErrors = () => mergeErrors(state.validationErrors, state.manualErrors)

  const syncVisualState = (names?: string[]) => {
    if (!state.element) return

    // Resolve every input name to its display name so visual
    // attributes (`css-filled`, `css-error`) land on the visible
    // input, never on the hidden raw mirror. After `format()` runs
    // the canonical name (`phone`) is held by the hidden, which
    // lives at the end of the form, outside any label wrapper —
    // so writing the attribute there is invisible to the project
    // CSS that targets `:has([css-error])` on a parent label. The
    // visual attribute contract is documented in
    // `api/format.ts:resolveDisplayNameForName` and in
    // `docs/css-styling.md`.
    //
    // Errors are still keyed by canonical name (the backend's
    // view of the field); reverse-resolve so the lookup works
    // whether the caller passed canonical, display, or both.
    const sourceNames = names ?? getTrackedFieldNames()
    for (const name of sourceNames) {
      const displayName = resolveDisplayNameForName(state, name)
      const canonical = resolveCanonicalForName(state, name) ?? name
      const fields = getFieldsByName(displayName)
      const hasGroupError = Boolean(
        state.validationGroupErrors[canonical]?.length || state.manualErrors[canonical]?.length
      )
      const elementErrors = state.validationElementErrors.get(canonical)
      fields.forEach(field => {
        const hasError = hasGroupError || Boolean(elementErrors?.get(field)?.length)
        applyBooleanAttribute(field, attributes.filled, isFieldFilled(field))
        applyBooleanAttribute(field, attributes.error, hasError)
        if (hasError) field.setAttribute('aria-invalid', 'true')
        else field.removeAttribute('aria-invalid')
      })
    }
  }

  // readFieldValue/writeFieldValue are exported from core/dom for direct
  // callers; referenced here so the linter keeps them as part of the
  // controlled API surface.
  void readFieldValue
  void writeFieldValue

  const validateNames = (names?: string[]): ValidationResult => {
    const targetNames = names ?? Object.keys(state.validators)
    const values = getValues()
    const nextValidationErrors = names ? cloneErrors(state.validationErrors) : {}
    const nextGroupErrors = names ? cloneErrors(state.validationGroupErrors) : {}
    const nextElementErrors = names
      ? new Map(state.validationElementErrors)
      : new Map<string, Map<FormFieldElement, string[]>>()

    for (const name of targetNames) {
      const rules = state.validators[name]
      if (!rules) {
        delete nextValidationErrors[name]
        delete nextGroupErrors[name]
        nextElementErrors.delete(name)
        continue
      }
      const fields = getFieldsByName(name)
      const displayFields = getFieldsByName(resolveDisplayNameForName(state, name))
      const items = fields.map((field, index) => ({
        value: readFieldValue([field]),
        element: displayFields[index] ?? field
      }))
      const result = validateFieldValueDetailed(name, values[name], rules, values, items)
      const messages = [...result.groupErrors, ...result.itemErrors.flatMap(item => item.messages)]
      if (messages.length > 0) nextValidationErrors[name] = messages
      else delete nextValidationErrors[name]

      if (result.groupErrors.length > 0) nextGroupErrors[name] = result.groupErrors
      else delete nextGroupErrors[name]

      const perElement = new Map<FormFieldElement, string[]>()
      result.itemErrors.forEach(item => {
        if (item.element) perElement.set(item.element, item.messages)
      })
      if (perElement.size > 0) nextElementErrors.set(name, perElement)
      else nextElementErrors.delete(name)
    }

    state.validationErrors = nextValidationErrors
    state.validationGroupErrors = nextGroupErrors
    state.validationElementErrors = nextElementErrors
    syncVisualState(names)

    return {
      isValid: Object.keys(getMergedErrors()).length === 0,
      errors: cloneErrors(getMergedErrors())
    }
  }

  const getAffectedValidationNames = (name: string): string[] => {
    const affected: string[] = []
    const pending = [name]
    const visited = new Set<string>()

    for (let index = 0; index < pending.length; index += 1) {
      const current = pending[index]!
      if (visited.has(current)) continue
      visited.add(current)
      affected.push(current)

      for (const dependent of validationDependents.get(current) ?? []) {
        if (!visited.has(dependent)) pending.push(dependent)
      }
    }

    return affected
  }

  const emitSingleWatchers = (name: string) => {
    if (!state.element || !state.api) return
    const callbacks = state.watchedFields.get(name)
    if (!callbacks || callbacks.size === 0) return
    const value = state.api.getValue(name)
    const fieldElement = state.api.getField(name)
    const snapshot = state.api.getState()
    callbacks.forEach(callback => callback(value, fieldElement, state.element!, snapshot))
  }

  // Calls every multi-field watcher that lists one of `names`, once, with
  // the first matching name as `changed`. `null` calls every one of them
  // with `changed: null` (reset).
  const emitGroupWatchers = (names: string[] | null) => {
    if (!state.element || !state.api || state.groupWatchers.size === 0) return
    let snapshot: ReturnType<FormController['getState']> | undefined
    for (const entry of Array.from(state.groupWatchers)) {
      const changed = names ? names.find(name => entry.fields.includes(name)) : null
      if (changed === undefined) continue
      snapshot ??= state.api.getState()
      const values = Object.fromEntries(
        entry.fields.map(field => [field, state.api!.getValue(field)])
      )
      entry.callback(values, changed, state.element, snapshot)
    }
  }

  const emitFieldWatchers = (name: string) => {
    emitSingleWatchers(name)
    emitGroupWatchers([name])
  }

  // `requestSubmit()` dispatches `submit` synchronously, so the flag tells
  // the submit handler that no user asked to submit. An invalid automatic
  // submission must not move focus away from the field being edited.
  const runAutoSubmit = () => {
    state.autoSubmitTimer = null
    if (!state.element || state.isDestroyed || !state.autoSubmitEnabled) return
    state.isAutoSubmitting = true
    try {
      submitForm(state.element)
    } finally {
      state.isAutoSubmitting = false
    }
  }

  const scheduleAutoSubmit = () => {
    if (!state.element || !state.autoSubmitEnabled || state.autoSubmitSuspended) return
    if (state.autoSubmitTimer) clearTimeout(state.autoSubmitTimer)
    state.autoSubmitTimer = null
    if (state.autoSubmitDebounce > 0) {
      state.autoSubmitTimer = setTimeout(runAutoSubmit, state.autoSubmitDebounce)
      return
    }
    runAutoSubmit()
  }

  // Last selection seen for every <select>, so option-list mutations made
  // outside the controller fire watchers only when the selection changed.
  const selectSnapshots = new WeakMap<HTMLSelectElement, string>()

  const readSelectSnapshot = (select: HTMLSelectElement) =>
    Array.from(select.selectedOptions, option => option.value).join('\u0000')

  const snapshotSelect = (select: HTMLSelectElement) => {
    selectSnapshots.set(select, readSelectSnapshot(select))
  }

  const snapshotAllSelects = () => {
    if (!state.element) return
    for (const field of getNamedFields(state.element)) {
      if (field instanceof HTMLSelectElement) snapshotSelect(field)
    }
  }

  const emitAllFieldWatchers = () => {
    for (const name of Array.from(state.watchedFields.keys())) emitSingleWatchers(name)
    emitGroupWatchers(null)
  }

  // Shared by `reset()` and native reset buttons: values are already back
  // to their defaults, so clear every error and resynchronize the DOM.
  const applyReset = () => {
    if (!state.element || state.isDestroyed) return
    clearFieldCache()
    resetFormattedFields(state)
    state.manualErrors = {}
    state.validationErrors = {}
    state.validationGroupErrors = {}
    state.validationElementErrors.clear()
    clearAttributes(state.element, [attributes.error, attributes.filled, 'aria-invalid'])
    syncVisualState()
    snapshotAllSelects()
    emitAllFieldWatchers()
    notifySubscribers()
  }

  const helpers: FormControllerHelpers = {
    notifySubscribers,
    clearFieldCache,
    getFieldsByName,
    getTrackedFieldNames: () => getTrackedFieldNames(),
    getValues,
    getMergedErrors,
    syncVisualState,
    validateNames,
    emitFieldWatchers,
    scheduleAutoSubmit,
    applyReset,
    commitOwnMutations: selects => commitOwnMutations(selects)
  }

  // ------- DOM event wiring ---------------------------------------------

  const handleDelegatedEvent = (event: Event) => {
    const target = event.target
    if (!(target instanceof Element) || !isFieldElement(target)) return
    const name = target.name
    if (!name) return

    clearFieldCache()
    if (target instanceof HTMLSelectElement) snapshotSelect(target)

    // A formatted field is exposed under two names: the canonical
    // (e.g. `phone`, on the hidden raw mirror) and the display
    // (`phone_displayed`, on the visible). Resolve whichever side
    // fired this event to the canonical so the controller's
    // validation + error-clearing path runs once on the field the
    // backend actually reads. The display name is the visible's
    // name — `syncVisualState` targets it so visual attributes
    // (`css-filled`, `css-error`) land on the element the user
    // sees, not on the hidden. Project CSS commonly uses
    // `:has([css-filled])` on a parent label to animate the
    // label; that selector only matches when the visible (inside
    // the label) carries the attribute, never the hidden.
    const canonical = resolveCanonicalForName(state, name) ?? name
    const displayName = resolveDisplayNameForName(state, name)

    if (normalizedOptions.clearManualErrorsOnChange) {
      delete state.manualErrors[canonical]
    }

    syncVisualState([displayName])

    const affectedValidationNames = getAffectedValidationNames(canonical)
    if (
      state.isValidated &&
      affectedValidationNames.some(field => state.validators[field] !== undefined)
    ) {
      validateNames(affectedValidationNames)
    }

    emitSingleWatchers(canonical)
    if (canonical !== name) emitSingleWatchers(name)
    emitGroupWatchers(canonical !== name ? [canonical, name] : [canonical])
    notifySubscribers()
    scheduleAutoSubmit()
  }

  const handleExternalDelegatedEvent = (event: Event) => {
    const target = event.target
    if (!(target instanceof Element) || !isFieldElement(target)) return
    if (target.form !== state.element || state.element?.contains(target)) return
    handleDelegatedEvent(event)
  }

  const isFocusable = (candidate: FormFieldElement) => {
    if (!candidate.isConnected || candidate.disabled || candidate.hidden) return false
    return !(candidate instanceof HTMLInputElement && candidate.type === 'hidden')
  }

  // Focus the invalid control that comes first in the document, not the
  // first rule declared in the schema, so keyboard users land where the
  // form visually starts failing.
  const focusFirstInvalidField = (errors: Record<string, string[]>) => {
    const candidates: FormFieldElement[] = []
    for (const name of Object.keys(errors)) {
      const fields = getFieldsByName(resolveDisplayNameForName(state, name)).filter(isFocusable)
      const elementErrors = state.validationElementErrors.get(name)
      const field = fields.find(candidate => elementErrors?.has(candidate)) ?? fields[0]
      if (field) candidates.push(field)
    }
    candidates.sort((left, right) =>
      left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    )
    candidates[0]?.focus()
  }

  const handleSubmitEvent = (event: Event) => {
    if (!state.element || state.isDestroyed || !state.api) return

    // A submission the user started supersedes a pending debounced
    // auto-submit; letting the timer run would submit the form twice.
    if (!state.isAutoSubmitting && state.autoSubmitTimer) {
      clearTimeout(state.autoSubmitTimer)
      state.autoSubmitTimer = null
    }

    if (normalizedOptions.clearErrorsOnSubmit) state.manualErrors = {}

    const validation = state.api.validate()
    const handlers = Array.from(state.submitHandlers)
    const shouldPrevent = validation.isValid
      ? handlers.some(handler => handler.preventDefault)
      : true

    if (shouldPrevent) event.preventDefault()

    state.submitCount += 1
    notifySubscribers()

    if (!validation.isValid) {
      if (!state.isAutoSubmitting) focusFirstInvalidField(validation.errors)
      return
    }

    const candidate = event as Event & { submitter?: unknown }
    const submitter = candidate.submitter instanceof HTMLElement
      ? candidate.submitter
      : null
    const { data, formData } = parseFormData(state.element, submitter)
    const snapshot = state.api.getState()
    const pending: Promise<void>[] = []
    let synchronousError: unknown
    let hasSynchronousError = false
    try {
      for (const handler of handlers) {
        const result = handler.callback(state.element!, data, formData, snapshot)
        if (result && typeof result.then === 'function') {
          pending.push(
            Promise.resolve(result).catch(error => {
              console.error('[forms] submit handler failed', error)
            })
          )
        }
      }
    } catch (error) {
      synchronousError = error
      hasSynchronousError = true
    }

    if (pending.length > 0) {
      state.pendingSubmitCount += 1
      notifySubscribers()
      void Promise.allSettled(pending).then(() => {
        state.pendingSubmitCount = Math.max(0, state.pendingSubmitCount - 1)
        if (!state.isDestroyed) notifySubscribers()
      })
    }

    if (hasSynchronousError) throw synchronousError
  }

  // The `reset` event fires before the browser restores default values,
  // and a user-initiated reset runs microtasks between the two steps, so
  // the state pass waits for the next task. `reset()` handles itself.
  const handleResetEvent = (event: Event) => {
    if (state.isResetting) return
    const timer = setTimeout(() => {
      state.cleanups.delete(cancel)
      if (!event.defaultPrevented) applyReset()
    }, 0)
    const cancel = () => clearTimeout(timer)
    state.cleanups.add(cancel)
  }

  const touchesFields = (node: Node) =>
    node instanceof Element &&
    (isFieldElement(node) || node.querySelector('input, select, textarea') !== null)

  // Error messages or other markup rendered into the form by a subscriber
  // must not re-enter validation; that would notify the same subscriber
  // again and loop. Only control additions/removals and renames count.
  const isStructural = (record: MutationRecord) =>
    record.type === 'attributes' ||
    Array.from(record.addedNodes).some(touchesFields) ||
    Array.from(record.removedNodes).some(touchesFields)

  const isOptionNode = (node: Node) =>
    node instanceof HTMLOptionElement || node instanceof HTMLOptGroupElement

  // The <select> whose option list a childList record changed, if any.
  const optionListOwner = (record: MutationRecord): HTMLSelectElement | null => {
    if (record.type !== 'childList') return null
    const touchesOptions =
      Array.from(record.addedNodes).some(isOptionNode) ||
      Array.from(record.removedNodes).some(isOptionNode)
    if (!touchesOptions) return null
    const target = record.target
    if (target instanceof HTMLSelectElement) return target
    if (
      target instanceof HTMLOptGroupElement &&
      target.parentElement instanceof HTMLSelectElement
    ) {
      return target.parentElement
    }
    return null
  }

  const handleMutations = (records: MutationRecord[]) => {
    if (state.isDestroyed) return
    const structural = records.some(isStructural)
    const changedNames = new Set<string>()

    for (const record of records) {
      const select = optionListOwner(record)
      if (!select || !select.name) continue
      const next = readSelectSnapshot(select)
      if (selectSnapshots.get(select) !== next) changedNames.add(select.name)
      selectSnapshots.set(select, next)
    }

    if (!structural && changedNames.size === 0) return
    clearFieldCache()

    if (structural) {
      snapshotAllSelects()
      if (state.isValidated) validateNames()
      else syncVisualState()
    } else {
      const affected = new Set<string>()
      for (const name of changedNames) {
        for (const field of getAffectedValidationNames(name)) affected.add(field)
      }
      const names = Array.from(affected)
      syncVisualState(Array.from(changedNames))
      if (state.isValidated && names.some(field => state.validators[field] !== undefined)) {
        validateNames(names)
      }
    }

    for (const name of changedNames) emitFieldWatchers(name)
    notifySubscribers()
  }

  // Called by api methods that rewrite option lists themselves: drop the
  // records those writes produced, keep processing everything else.
  const commitOwnMutations = (selects: HTMLSelectElement[]) => {
    selects.forEach(snapshotSelect)
    const pending = state.mutationObserver?.takeRecords() ?? []
    const foreign = pending.filter(
      record => !selects.some(select => select.contains(record.target))
    )
    if (foreign.length > 0) handleMutations(foreign)
  }

  const startMutationObserver = () => {
    if (!state.element || typeof MutationObserver === 'undefined') return

    state.mutationObserver = new MutationObserver(handleMutations)

    state.mutationObserver.observe(state.element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['name', 'type']
    })
  }

  // ------- Public api composition --------------------------------------

  const api: FormController = {
    get element() {
      return state.element
    },
    get f() {
      return state.element
    },
    get options() {
      return state.options
    },
    onSubmit: createOnSubmit(state, helpers),
    addCleanup: createAddCleanup(state, helpers),
    watch: createWatch(state, helpers),
    observe: createObserve(state, helpers),
    unwatch: createUnwatch(state, helpers),
    subscribe: createSubscribe(state, helpers),
    prefill: createPrefill(state, helpers),
    append: createAppend(state, helpers),
    setErrors: createSetErrors(state, helpers),
    clearErrors: createClearErrors(state, helpers),
    setValue: createSetValue(state, helpers),
    setOptions: createSetOptions(state, helpers),
    getValue: createGetValue(state, helpers),
    getField: createGetField(state, helpers),
    validate: createValidate(state, helpers),
    revalidate: createRevalidate(state, helpers),
    reset: createReset(state, helpers),
    autoSubmit: createAutoSubmit(state, helpers),
    disableAutoSubmit: createDisableAutoSubmit(state, helpers),
    getData: createGetData(state, helpers),
    getState: createGetState(state, helpers),
    format: createFormat(state, helpers),
    formatAll: createFormatAll(state, helpers),
    destroy: createDestroy(state, helpers)
  }

  state.api = api

  // ------- Lifecycle hooks ---------------------------------------------

  if (state.element) {
    addListener(state.element, 'input', handleDelegatedEvent)
    addListener(document, 'input', handleExternalDelegatedEvent)
    addListener(state.element, 'submit', handleSubmitEvent)
    addListener(state.element, 'reset', handleResetEvent)
    snapshotAllSelects()
    startMutationObserver()
  }

  if (normalizedOptions.autoSubmit) {
    api.autoSubmit(normalizedOptions.autoSubmit)
  }

  if (normalizedOptions.formats) {
    for (const config of Object.values(normalizedOptions.formats)) {
      api.format(config)
    }
  }

  if (state.isValidated) validateNames()
  else syncVisualState()

  return api
}
