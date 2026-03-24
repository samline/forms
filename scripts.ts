const parseFormData = (formElement: HTMLFormElement) => {
  const rawFormData = new FormData(formElement)
  const formData = new FormData()
  const data: Record<string, any> = {}

  rawFormData.forEach((value, key) => {
    if (value instanceof File && value.size === 0 && value.name === '') return

    formData.append(key, value)

    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (Array.isArray(data[key])) {
        data[key].push(value)
      } else {
        data[key] = [data[key], value]
      }
    } else {
      data[key] = value
    }
  })

  return { data, formData }
}

export const form = (id: string) => {
  const f = document.getElementById(id) as HTMLFormElement | null

  // OPTIMIZACIÓN: Almacena callbacks por nombre de campo
  const watchedFields = new Map<string, ((v: any, f: HTMLFormElement) => void)[]>()
  // OPTIMIZACIÓN: Cache de nodos para evitar querySelectorAll repetitivos
  const fieldCache = new Map<string, NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>>()

  let isValidated = false
  let isAutoSubmitted = false
  let hasSubmitListener = false

  const listeners: {
    el: EventTarget
    type: string
    handler: EventListenerOrEventListenerObject
  }[] = []

  const addListener = (
    el: EventTarget,
    type: string,
    handler: EventListenerOrEventListenerObject
  ) => {
    el.addEventListener(type, handler)
    listeners.push({ el, type, handler })
  }

  const removeAllListeners = () => {
    for (const { el, type, handler } of listeners) {
      try {
        el.removeEventListener(type, handler)
      } catch (e) {}
    }
    listeners.length = 0
  }

  const getFieldsByName = (name: string) => {
    if (!f) return null
    if (!fieldCache.has(name)) {
      const els = f.querySelectorAll(`[name="${name}"]`) as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
      fieldCache.set(name, els)
    }
    return fieldCache.get(name)!
  }

  const updateVisualState = (
    el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  ) => {
    let isFilled = false
    if (el instanceof HTMLInputElement) {
      if (el.type === 'checkbox' || el.type === 'radio') {
        isFilled = el.checked
      } else if (el.type === 'file') {
        isFilled = !!(el.files && el.files.length > 0)
      } else {
        isFilled = el.value.trim() !== ''
      }
    } else {
      isFilled = el.value !== '' && el.value !== undefined && el.value !== null
    }

    if (isFilled) el.setAttribute('css-filled', '')
    else el.removeAttribute('css-filled')
  }

  const getFieldValue = (fieldName: string) => {
    if (!f) return undefined
    const els = getFieldsByName(fieldName)
    if (!els || els.length === 0) return undefined
    const firstEl = els[0]

    if (firstEl instanceof HTMLSelectElement || firstEl instanceof HTMLTextAreaElement)
      return firstEl.value

    if (firstEl instanceof HTMLInputElement) {
      if (firstEl.type === 'radio') {
        const checked = Array.from(els).find(el => (el as HTMLInputElement).checked) as HTMLInputElement | undefined
        return checked ? checked.value : ''
      }
      if (firstEl.type === 'checkbox') {
        const checked = Array.from(els).filter(el => (el as HTMLInputElement).checked).map(el => (el as HTMLInputElement).value)
        return checked.length > 1 ? checked : (checked[0] ?? '')
      }
      if (firstEl.type === 'file') return firstEl.files ? Array.from(firstEl.files) : []
      return firstEl.value
    }
    return undefined
  }

  // DELEGACIÓN DE EVENTOS: Maneja todos los inputs con 2 listeners en lugar de cientos
  const handleDelegatedEvent = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    const name = target.getAttribute?.('name')
    if (!name) return

    if (isAutoSubmitted) f?.requestSubmit()
    if (isValidated) updateVisualState(target)

    const callbacks = watchedFields.get(name)
    if (callbacks) {
      const val = getFieldValue(name)
      callbacks.forEach(cb => cb(val, f!))
    }
  }

  const setupDelegatedListeners = () => {
    if (!f) return
    addListener(f, 'input', handleDelegatedEvent)
    addListener(f, 'change', handleDelegatedEvent)
  }

  const handleSubmit = (
    callback: (form: HTMLFormElement, data: Record<string, any>, formData: FormData) => void,
    preventDefault?: boolean
  ) => {
    if (!f || hasSubmitListener) return
    hasSubmitListener = true
    addListener(f, 'submit', (e: Event) => {
      if (preventDefault) e.preventDefault()
      const { data, formData } = parseFormData(f)
      api.clearErrors()
      callback(f, data, formData)
    })
  }

  // --- API PUBLICA ---
  const api = {
    f,
    onSubmit: (callback: any, prev = true) => {
      handleSubmit(callback, prev)
      return api
    },
    watch: (field: string, callback: (v: any, f: HTMLFormElement) => void) => {
      if (!watchedFields.has(field)) watchedFields.set(field, [])
      watchedFields.get(field)!.push(callback)
      if (f) callback(getFieldValue(field), f)
      return api
    },
    prefill: (fieldName?: string) => {
      if (!f) return api
      const queryParams = new URLSearchParams(window.location.search)
      queryParams.forEach((value, key) => {
        if (fieldName && key !== fieldName) return
        api.setValue(key, value)
      })
      return api
    },
    append: ({ tag, content, class: className, atStart = false }: any) => {
      if (!f) return null
      fieldCache.clear() // El DOM cambió, invalidamos caché
      if (className) {
        const existing = f.querySelector(`.${className.trim().split(/\s+/)[0]}`)
        if (existing) existing.remove()
      }
      const el = document.createElement(tag)
      if (className) el.className = className
      el.innerHTML = content
      atStart && f.firstChild ? f.insertBefore(el, f.firstChild) : f.appendChild(el)
      return el
    },
    setErrors: (fields: string[]) => {
      fields.forEach(name => {
        getFieldsByName(name)?.forEach(el => el.setAttribute('css-error', ''))
      })
      return api
    },
    clearErrors: () => {
      f?.querySelectorAll('[css-error]').forEach(el => el.removeAttribute('css-error'))
      return api
    },
    setValue: (name: string, value: any) => {
      const els = getFieldsByName(name)
      if (!els) return api
      els.forEach(el => {
        if (el instanceof HTMLInputElement) {
          if (el.type === 'checkbox') el.checked = Array.isArray(value) ? value.map(String).includes(el.value) : String(value) === el.value
          else if (el.type === 'radio') el.checked = el.value === String(value)
          else el.value = String(value)
        } else el.value = String(value)
        updateVisualState(el)
      })
      // Disparar evento para que el listener delegado ejecute los watchers
      const first = els[0]
      const type = (first instanceof HTMLSelectElement || (first instanceof HTMLInputElement && (first.type === 'checkbox' || first.type === 'radio'))) ? 'change' : 'input'
      first?.dispatchEvent(new Event(type, { bubbles: true }))
      return api
    },
    validate: () => {
      if (!f || isValidated) return api
      isValidated = true
      f.querySelectorAll<any>('input[name], select[name], textarea[name]').forEach(updateVisualState)
      return api
    },
    revalidate: () => {
      f?.querySelectorAll<any>('input[name], select[name], textarea[name]').forEach(updateVisualState)
      return api
    },
    reset: () => {
      if (!f) return api
      f.reset()
      f.querySelectorAll('[css-error], [css-filled]').forEach(el => {
        el.removeAttribute('css-error')
        el.removeAttribute('css-filled')
      })
      return api
    },
    autoSubmit: () => {
      isAutoSubmitted = true
      return api
    },
    getValue: (name: string) => getFieldValue(name),
    getField: (name: string) => {
      const els = getFieldsByName(name)
      if (!els || els.length === 0) return null
      return els.length === 1 ? els[0] : els
    },
    getData: () => f ? parseFormData(f) : { data: {}, formData: new FormData() },
    destroy: () => {
      removeAllListeners()
      isValidated = isAutoSubmitted = hasSubmitListener = false
      watchedFields.clear()
      fieldCache.clear()
    }
  }

  setupDelegatedListeners()
  api.validate()
  return api
}
