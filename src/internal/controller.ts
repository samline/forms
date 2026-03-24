import { createEmptyFormState, parseFormData, validateFieldValue } from '../core'
import type {
  AppendContentOptions,
  AutoSubmitOptions,
  FormController,
  FormControllerOptions,
  FormErrors,
  FormFieldElement,
  FormFieldWatcher,
  FormSubmitHandler,
  FormStateListener,
  FormStateSnapshot,
  FormTarget,
  ValidationResult,
  VisualAttributes
} from '../core/types'
import {
  applyBooleanAttribute,
  clearAttributes,
  getNamedFields,
  isFieldFilled,
  queryNamedFields,
  readFieldValue,
  resolveFormElement,
  submitForm,
  writeFieldValue
} from './dom'

const DEFAULT_ATTRIBUTES: VisualAttributes = {
  filled: 'css-filled',
  error: 'css-error'
}

const DEFAULT_OPTIONS: Required<
  Pick<FormControllerOptions, 'autoValidate' | 'clearErrorsOnSubmit'>
> = {
  autoValidate: true,
  clearErrorsOnSubmit: true
}

const mergeErrors = (left: FormErrors, right: FormErrors) => {
  const merged: FormErrors = { ...left }

  for (const [field, messages] of Object.entries(right)) {
    merged[field] = merged[field] ? [...merged[field], ...messages] : [...messages]
  }

  return merged
}

const cloneErrors = (errors: FormErrors) =>
  Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, [...messages]])
  )

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

  const validators = normalizedOptions.validators ?? {}
  const watchedFields = new Map<string, Set<FormFieldWatcher>>()
  const listeners: Array<{
    element: EventTarget
    type: string
    handler: EventListenerOrEventListenerObject
  }> = []
  const subscribers = new Set<FormStateListener>()
  const submitHandlers = new Set<{
    callback: FormSubmitHandler
    preventDefault: boolean
  }>()
  const fieldCache = new Map<string, FormFieldElement[]>()

  let manualErrors: FormErrors = {}
  let validationErrors: FormErrors = {}
  let isValidated = Boolean(normalizedOptions.autoValidate)
  let autoSubmitEnabled = false
  let autoSubmitDebounce = 0
  let submitCount = 0
  let autoSubmitTimer: ReturnType<typeof setTimeout> | null = null
  let mutationObserver: MutationObserver | null = null
  let isDestroyed = false

  const notifySubscribers = () => {
    const state = api.getState()
    subscribers.forEach(listener => listener(state))
  }

  const addListener = (
    listenerTarget: EventTarget,
    type: string,
    handler: EventListenerOrEventListenerObject
  ) => {
    listenerTarget.addEventListener(type, handler)
    listeners.push({ element: listenerTarget, type, handler })
  }

  const clearFieldCache = () => {
    fieldCache.clear()
  }

  const getFieldsByName = (name: string) => {
    if (!element) {
      return []
    }

    if (!fieldCache.has(name)) {
      fieldCache.set(name, queryNamedFields(element, name))
    }

    return fieldCache.get(name) ?? []
  }

  const getTrackedFieldNames = () => {
    if (!element) {
      return Object.keys(validators)
    }

    const names = new Set<string>(Object.keys(validators))
    for (const field of getNamedFields(element)) {
      names.add(field.name)
    }

    return Array.from(names)
  }

  const getValues = () => {
    const values: FormStateSnapshot['values'] = {}
    for (const name of getTrackedFieldNames()) {
      values[name] = api.getValue(name)
    }
    return values
  }

  const getMergedErrors = () => mergeErrors(validationErrors, manualErrors)

  const syncVisualState = (names?: string[]) => {
    if (!element) {
      return
    }

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

  const validateNames = (names?: string[]) => {
    const targetNames = names ?? Object.keys(validators)
    const values = getValues()
    const nextValidationErrors = names ? cloneErrors(validationErrors) : {}

    for (const name of targetNames) {
      const rules = validators[name]

      if (!rules) {
        delete nextValidationErrors[name]
        continue
      }

      const errors = validateFieldValue(name, values[name], rules, values)
      if (errors.length > 0) {
        nextValidationErrors[name] = errors
      } else {
        delete nextValidationErrors[name]
      }
    }

    validationErrors = nextValidationErrors
    syncVisualState(names)

    return {
      isValid: Object.keys(getMergedErrors()).length === 0,
      errors: cloneErrors(getMergedErrors())
    } satisfies ValidationResult
  }

  const emitFieldWatchers = (name: string) => {
    if (!element) {
      return
    }

    const callbacks = watchedFields.get(name)
    if (!callbacks || callbacks.size === 0) {
      return
    }

    const value = api.getValue(name)
    const state = api.getState()
    callbacks.forEach(callback => callback(value, element, state))
  }

  const scheduleAutoSubmit = () => {
    if (!element || !autoSubmitEnabled) {
      return
    }

    if (autoSubmitTimer) {
      clearTimeout(autoSubmitTimer)
    }

    if (autoSubmitDebounce > 0) {
      autoSubmitTimer = setTimeout(() => submitForm(element), autoSubmitDebounce)
      return
    }

    submitForm(element)
  }

  const handleDelegatedEvent = (event: Event) => {
    const target = event.target
    if (!(target instanceof Element) || !isFieldElement(target)) {
      return
    }

    const name = target.name
    if (!name) {
      return
    }

    clearFieldCache()
    syncVisualState([name])

    if (isValidated && validators[name]) {
      validateNames([name])
    }

    emitFieldWatchers(name)
    notifySubscribers()
    scheduleAutoSubmit()
  }

  const handleSubmitEvent = (event: Event) => {
    if (!element || isDestroyed) {
      return
    }

    if (normalizedOptions.clearErrorsOnSubmit) {
      manualErrors = {}
    }

    const validation = api.validate()
    const handlers = Array.from(submitHandlers)
    const shouldPrevent = validation.isValid
      ? handlers.some(handler => handler.preventDefault)
      : true

    if (shouldPrevent) {
      event.preventDefault()
    }

    submitCount += 1
    notifySubscribers()

    if (!validation.isValid) {
      return
    }

    const { data, formData } = api.getData()
    const state = api.getState()
    handlers.forEach(handler => handler.callback(element, data, formData, state))
  }

  const startMutationObserver = () => {
    if (!element || typeof MutationObserver === 'undefined') {
      return
    }

    mutationObserver = new MutationObserver(() => {
      clearFieldCache()
      if (isValidated) {
        syncVisualState()
        validateNames()
      }
      notifySubscribers()
    })

    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['name', 'type']
    })
  }

  const isFieldElement = (value: Element): value is FormFieldElement =>
    value instanceof HTMLInputElement ||
    value instanceof HTMLSelectElement ||
    value instanceof HTMLTextAreaElement

  const api: FormController = {
    element,
    f: element,
    options: normalizedOptions,
    onSubmit(callback, preventDefault = true) {
      submitHandlers.add({ callback, preventDefault })
      return api
    },
    watch(field, callback) {
      api.observe(field, callback)
      return api
    },
    observe(field, callback) {
      const callbacks = watchedFields.get(field) ?? new Set<FormFieldWatcher>()
      callbacks.add(callback)
      watchedFields.set(field, callbacks)

      if (element) {
        callback(api.getValue(field), element, api.getState())
      }

      return () => {
        const currentCallbacks = watchedFields.get(field)
        currentCallbacks?.delete(callback)
        if (currentCallbacks && currentCallbacks.size === 0) {
          watchedFields.delete(field)
        }
      }
    },
    unwatch(field, callback) {
      if (!field) {
        watchedFields.clear()
        return api
      }

      if (!callback) {
        watchedFields.delete(field)
        return api
      }

      const callbacks = watchedFields.get(field)
      callbacks?.delete(callback)
      if (callbacks && callbacks.size === 0) {
        watchedFields.delete(field)
      }
      return api
    },
    subscribe(listener) {
      subscribers.add(listener)
      listener(api.getState())
      return () => {
        subscribers.delete(listener)
      }
    },
    prefill(fieldName) {
      if (!element) {
        return api
      }

      const queryParams = new URLSearchParams(window.location.search)
      queryParams.forEach((value, key) => {
        if (fieldName && fieldName !== key) {
          return
        }

        api.setValue(key, value)
      })
      return api
    },
    append({ tag, content, class: className, atStart = false }: AppendContentOptions) {
      if (!element) {
        return null
      }

      clearFieldCache()
      if (className) {
        const classSelector = className.trim().split(/\s+/)[0]
        element.querySelector(`.${classSelector}`)?.remove()
      }

      const node = document.createElement(tag)
      if (className) {
        node.className = className
      }
      node.innerHTML = content

      if (atStart && element.firstChild) {
        element.insertBefore(node, element.firstChild)
      } else {
        element.appendChild(node)
      }

      return node
    },
    setErrors(fields) {
      if (Array.isArray(fields)) {
        manualErrors = {
          ...manualErrors,
          ...Object.fromEntries(fields.map(field => [field, ['Invalid value.']]))
        }
      } else {
        manualErrors = {
          ...manualErrors,
          ...cloneErrors(fields)
        }
      }

      syncVisualState(Array.isArray(fields) ? fields : Object.keys(fields))
      notifySubscribers()
      return api
    },
    clearErrors(fields) {
      if (!fields) {
        manualErrors = {}
        syncVisualState()
        notifySubscribers()
        return api
      }

      for (const field of fields) {
        delete manualErrors[field]
      }

      syncVisualState(fields)
      notifySubscribers()
      return api
    },
    setValue(name, value) {
      const fields = getFieldsByName(name)
      if (fields.length === 0) {
        return api
      }

      writeFieldValue(fields, value)
      const firstField = fields[0]
      if (!firstField) {
        return api
      }

      const eventType =
        firstField instanceof HTMLSelectElement ||
        (firstField instanceof HTMLInputElement &&
          (firstField.type === 'checkbox' || firstField.type === 'radio'))
          ? 'change'
          : 'input'

      firstField.dispatchEvent(new Event(eventType, { bubbles: true }))
      return api
    },
    validate(fields) {
      isValidated = true
      syncVisualState(fields)
      return validateNames(fields)
    },
    revalidate(fields) {
      return api.validate(fields)
    },
    reset() {
      if (!element) {
        return api
      }

      element.reset()
      manualErrors = {}
      validationErrors = {}
      clearAttributes(element, [attributes.error, attributes.filled])
      if (isValidated) {
        syncVisualState()
      }
      notifySubscribers()
      return api
    },
    autoSubmit(nextOptions = true) {
      autoSubmitEnabled = nextOptions !== false
      autoSubmitDebounce =
        typeof nextOptions === 'object' && nextOptions
          ? nextOptions.debounce ?? 0
          : 0
      notifySubscribers()
      return api
    },
    disableAutoSubmit() {
      autoSubmitEnabled = false
      if (autoSubmitTimer) {
        clearTimeout(autoSubmitTimer)
        autoSubmitTimer = null
      }
      notifySubscribers()
      return api
    },
    getValue(name) {
      return readFieldValue(getFieldsByName(name))
    },
    getField(name) {
      const fields = getFieldsByName(name)
      if (fields.length === 0) {
        return null
      }
      const [firstField] = fields
      if (!firstField) {
        return null
      }
      return fields.length === 1 ? firstField : fields
    },
    getData() {
      if (!element) {
        return { data: {}, formData: new FormData() }
      }
      return parseFormData(element)
    },
    getState() {
      const values = getValues()
      const errors = cloneErrors(getMergedErrors())
      const filledFields = getTrackedFieldNames().filter(name => {
        const value = values[name]
        return Array.isArray(value)
          ? value.length > 0
          : typeof value === 'string'
            ? value.trim().length > 0
            : value !== undefined
      })

      return {
        ...createEmptyFormState(),
        values,
        errors,
        filledFields,
        isValid: Object.keys(errors).length === 0,
        isValidated,
        autoSubmit: autoSubmitEnabled,
        submitCount
      }
    },
    destroy() {
      if (isDestroyed) {
        return
      }

      isDestroyed = true
      for (const listener of listeners) {
        listener.element.removeEventListener(listener.type, listener.handler)
      }
      listeners.length = 0

      if (autoSubmitTimer) {
        clearTimeout(autoSubmitTimer)
        autoSubmitTimer = null
      }

      mutationObserver?.disconnect()
      mutationObserver = null
      watchedFields.clear()
      subscribers.clear()
      submitHandlers.clear()
      clearFieldCache()
      manualErrors = {}
      validationErrors = {}
    }
  }

  if (element) {
    addListener(element, 'input', handleDelegatedEvent)
    addListener(element, 'change', handleDelegatedEvent)
    addListener(element, 'submit', handleSubmitEvent)
    startMutationObserver()
  }

  if (normalizedOptions.autoSubmit) {
    const autoSubmitOption = normalizedOptions.autoSubmit as boolean | AutoSubmitOptions
    api.autoSubmit(autoSubmitOption)
  }

  if (isValidated) {
    syncVisualState()
    validateNames()
  }

  return api
}