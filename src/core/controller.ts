// Core orchestrator. Wires shared state, internal helpers and the public
// api method factories into a single FormController instance.
//
// Internal event handlers and DOM wiring live here. Every public method
// lives in `../api/<method>.ts` as an isolated factory.

import { createAppend } from '../api/append'
import { createAutoSubmit } from '../api/auto-submit'
import { createClearErrors } from '../api/clear-errors'
import { createDestroy } from '../api/destroy'
import { createDisableAutoSubmit } from '../api/disable-auto-submit'
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
import { createSetValue } from '../api/set-value'
import { createSubscribe } from '../api/subscribe'
import { createUnwatch } from '../api/unwatch'
import { createValidate } from '../api/validate'
import { createWatch } from '../api/watch'
import { validateFieldValue } from '../core/validation'
import {
  applyBooleanAttribute,
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
    subscribers: new Set(),
    submitHandlers: new Set(),
    fieldCache: new Map(),
    manualErrors: {},
    validationErrors: {},
    isValidated: Boolean(normalizedOptions.autoValidate),
    autoSubmitEnabled: false,
    autoSubmitDebounce: 0,
    submitCount: 0,
    autoSubmitTimer: null,
    isDestroyed: false,
    listeners: [],
    mutationObserver: null,
    api: null
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
    handler: EventListenerOrEventListenerObject
  ) => {
    node.addEventListener(type, handler)
    state.listeners.push({ element: node, type, handler })
  }

  const clearFieldCache = () => state.fieldCache.clear()

  const getFieldsByName = (name: string): FormFieldElement[] => {
    if (!state.element) return []
    if (!state.fieldCache.has(name)) {
      state.fieldCache.set(name, queryNamedFields(state.element, name))
    }
    return state.fieldCache.get(name) ?? []
  }

  const getTrackedFieldNames = (): string[] => {
    if (!state.element) return Object.keys(state.validators)
    const names = new Set<string>(Object.keys(state.validators))
    for (const field of getNamedFields(state.element)) {
      names.add(field.name)
    }
    return Array.from(names)
  }

  const getValues = () => {
    const values: Record<string, FormFieldValue> = {}
    for (const name of getTrackedFieldNames()) {
      values[name] = readFieldValue(getFieldsByName(name))
    }
    return values
  }

  const getMergedErrors = () => mergeErrors(state.validationErrors, state.manualErrors)

  const syncVisualState = (names?: string[]) => {
    if (!state.element) return
    const targetNames = names ?? getTrackedFieldNames()
    const errors = getMergedErrors()
    for (const name of targetNames) {
      const fields = getFieldsByName(name)
      const hasError = Boolean(errors[name]?.length)
      for (const field of fields) {
        applyBooleanAttribute(field, attributes.filled, isFieldFilled(field))
        applyBooleanAttribute(field, attributes.error, hasError)
      }
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

    for (const name of targetNames) {
      const rules = state.validators[name]
      if (!rules) {
        delete nextValidationErrors[name]
        continue
      }
      const messages = validateFieldValue(name, values[name], rules, values)
      if (messages.length > 0) nextValidationErrors[name] = messages
      else delete nextValidationErrors[name]
    }

    state.validationErrors = nextValidationErrors
    syncVisualState(names)

    return {
      isValid: Object.keys(getMergedErrors()).length === 0,
      errors: cloneErrors(getMergedErrors())
    }
  }

  const emitFieldWatchers = (name: string) => {
    if (!state.element || !state.api) return
    const callbacks = state.watchedFields.get(name)
    if (!callbacks || callbacks.size === 0) return
    const value = state.api.getValue(name)
    const fieldElement = state.api.getField(name)
    const snapshot = state.api.getState()
    callbacks.forEach(callback => callback(value, fieldElement, state.element!, snapshot))
  }

  const scheduleAutoSubmit = () => {
    if (!state.element || !state.autoSubmitEnabled) return
    if (state.autoSubmitTimer) clearTimeout(state.autoSubmitTimer)
    if (state.autoSubmitDebounce > 0) {
      state.autoSubmitTimer = setTimeout(
        () => submitForm(state.element!),
        state.autoSubmitDebounce
      )
      return
    }
    submitForm(state.element)
  }

  const helpers: FormControllerHelpers = {
    notifySubscribers,
    clearFieldCache,
    getFieldsByName,
    getTrackedFieldNames,
    getValues,
    getMergedErrors,
    syncVisualState,
    validateNames,
    emitFieldWatchers,
    scheduleAutoSubmit
  }

  // ------- DOM event wiring ---------------------------------------------

  const handleDelegatedEvent = (event: Event) => {
    const target = event.target
    if (!(target instanceof Element) || !isFieldElement(target)) return
    const name = target.name
    if (!name) return

    clearFieldCache()

    if (normalizedOptions.clearManualErrorsOnChange) {
      delete state.manualErrors[name]
    }

    syncVisualState([name])

    if (state.isValidated && state.validators[name]) {
      validateNames([name])
    }

    emitFieldWatchers(name)
    notifySubscribers()
    scheduleAutoSubmit()
  }

  const handleSubmitEvent = (event: Event) => {
    if (!state.element || state.isDestroyed || !state.api) return

    if (normalizedOptions.clearErrorsOnSubmit) state.manualErrors = {}

    const validation = state.api.validate()
    const handlers = Array.from(state.submitHandlers)
    const shouldPrevent = validation.isValid
      ? handlers.some(handler => handler.preventDefault)
      : true

    if (shouldPrevent) event.preventDefault()

    state.submitCount += 1
    notifySubscribers()

    if (!validation.isValid) return

    const { data, formData } = state.api.getData()
    const snapshot = state.api.getState()
    handlers.forEach(handler =>
      handler.callback(state.element!, data, formData, snapshot)
    )
  }

  const startMutationObserver = () => {
    if (!state.element || typeof MutationObserver === 'undefined') return

    state.mutationObserver = new MutationObserver(() => {
      clearFieldCache()
      if (state.isValidated) {
        syncVisualState()
        validateNames()
      }
      notifySubscribers()
    })

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
    watch: createWatch(state, helpers),
    observe: createObserve(state, helpers),
    unwatch: createUnwatch(state, helpers),
    subscribe: createSubscribe(state, helpers),
    prefill: createPrefill(state, helpers),
    append: createAppend(state, helpers),
    setErrors: createSetErrors(state, helpers),
    clearErrors: createClearErrors(state, helpers),
    setValue: createSetValue(state, helpers),
    getValue: createGetValue(state, helpers),
    getField: createGetField(state, helpers),
    validate: createValidate(state, helpers),
    revalidate: createRevalidate(state, helpers),
    reset: createReset(state, helpers),
    autoSubmit: createAutoSubmit(state, helpers),
    disableAutoSubmit: createDisableAutoSubmit(state, helpers),
    getData: createGetData(state, helpers),
    getState: createGetState(state, helpers),
    destroy: createDestroy(state, helpers)
  }

  state.api = api

  // ------- Lifecycle hooks ---------------------------------------------

  if (state.element) {
    addListener(state.element, 'input', handleDelegatedEvent)
    addListener(state.element, 'change', handleDelegatedEvent)
    addListener(state.element, 'submit', handleSubmitEvent)
    startMutationObserver()
  }

  if (normalizedOptions.autoSubmit) {
    api.autoSubmit(normalizedOptions.autoSubmit)
  }

  if (state.isValidated) {
    syncVisualState()
    validateNames()
  }

  return api
}
