// Scenario behavior, shared verbatim by the live preview and the copied files.
// shared/lib/demo-source.ts copies each `#region` below into the generated
// main.js (without `export`), so the preview cannot drift from copied code.
// Every region is plain JavaScript that receives the scenario's <form> and a
// `show(id, text)` function writing one readout. It returns the controller so
// its owner can call destroy(). `form` comes from the loading mode's import
// line: `import { form } from '@samline/forms'` or `window.Forms`.
import { form } from '@samline/forms'

// #region renderErrors
/** Write the first message of every field into its [data-error-for] slot. */
const renderErrors = (element, errors) => {
  for (const slot of element.querySelectorAll('[data-error-for]')) {
    slot.textContent = errors[slot.dataset.errorFor]?.[0] ?? ''
  }
}
// #endregion renderErrors

// #region signup
export const signup = (element, show) => {
  const controller = form(element, {
    // Stay quiet until the first submit, then revalidate on every input.
    autoValidate: false,
    validators: {
      name: { required: { value: true, message: 'Tell us your name.' } },
      email: {
        required: { value: true, message: 'Enter your email address.' },
        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Use a valid email address.' },
      },
      password: {
        required: { value: true, message: 'Choose a password.' },
        minLength: { value: 8, message: 'Use at least 8 characters.' },
        pattern: { value: /\d/, message: 'Include at least one number.' },
      },
      password_confirmation: {
        required: { value: true, message: 'Repeat the password.' },
        sameAs: { value: 'password', message: 'The passwords do not match.' },
      },
    },
  })

  controller.subscribe(state => {
    renderErrors(element, state.errors)
    const count = Object.keys(state.errors).length
    show('errors', count === 0 ? 'None' : `${count} field${count === 1 ? '' : 's'} to fix`)
    show('attempts', String(state.submitCount))
  })

  controller.onSubmit((_element, data) => {
    show('result', `Account ready for ${data.email}`)
  })

  return controller
}
// #endregion signup

// #region checkout
export const checkout = (element, show) => {
  const controller = form(element, {
    // Each visible input keeps its formatting; a hidden input with the
    // original name carries the clean value that is submitted.
    formats: {
      phone: { type: 'phone', field: 'phone', options: { country: 'US' } },
      card: { type: 'creditCard', field: 'card' },
      amount: { type: 'numeral', field: 'amount' },
    },
  })

  const update = () => {
    const { data } = controller.getData()
    show('phone', data.phone || '—')
    show('card', data.card || '—')
    show('amount', data.amount || '—')
  }
  controller.subscribe(update)
  controller.onSubmit(update)

  return controller
}
// #endregion checkout

// #region filters
const catalog = [
  { name: 'Arc floor lamp', category: 'lighting', tags: ['sale'] },
  { name: 'Linen desk lamp', category: 'lighting', tags: ['new'] },
  { name: 'Oak side table', category: 'furniture', tags: ['new', 'sale'] },
  { name: 'Wool lounge chair', category: 'furniture', tags: [] },
  { name: 'Stoneware vase', category: 'decor', tags: ['sale'] },
  { name: 'Woven wall hanging', category: 'decor', tags: ['new'] },
]

export const filters = (element, show) => {
  const controller = form(element, { autoSubmit: { debounce: 250 } })

  controller.onSubmit((_element, data, formData) => {
    const query = String(data.q ?? '')
      .trim()
      .toLowerCase()
    const tags = formData.getAll('tags[]')
    const matches = catalog.filter(
      item =>
        item.name.toLowerCase().includes(query) &&
        (!data.category || item.category === data.category) &&
        tags.every(tag => item.tags.includes(tag))
    )
    show('query', `?${new URLSearchParams(formData)}`)
    show('results', matches.map(item => item.name).join(', ') || 'No matching products')
  })

  // Restore filters from a shared link such as ?category=decor&tags[]=sale.
  controller.prefill()
  element.requestSubmit()

  return controller
}
// #endregion filters

// #region feedback
export const feedback = (element, show) => {
  const button = element.querySelector('button[type="submit"]')
  const controller = form(element, {
    validators: {
      email: {
        required: { value: true, message: 'Enter an email we can reply to.' },
        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Use a valid email address.' },
      },
      message: {
        required: { value: true, message: 'Write a message.' },
        minLength: { value: 20, message: 'Add a little more detail (20 characters).' },
        maxLength: { value: 140, message: 'Keep it under 140 characters.' },
      },
    },
  })

  controller.observe('message', value => {
    show('characters', `${String(value ?? '').length} / 140`)
  })

  controller.subscribe(state => {
    // Only fields the visitor has filled show their messages.
    const visible = Object.fromEntries(
      Object.entries(state.errors).filter(([name]) => state.filledFields.includes(name))
    )
    renderErrors(element, visible)
    button.disabled = !state.isValid
    show('valid', state.isValid ? 'Ready to send' : 'Not yet')
    show('filled', state.filledFields.join(', ') || 'None')
  })

  controller.onSubmit(() => {
    controller.reset()
    show('valid', 'Sent (local demo, nothing left the page)')
  })

  return controller
}
// #endregion feedback

// #region username
const takenNames = ['admin', 'ada', 'support']

// Stands in for your API. It answers after 600 ms and never uses the network.
const checkAvailability = username =>
  new Promise(resolve => {
    setTimeout(() => resolve(!takenNames.includes(username.toLowerCase())), 600)
  })

export const username = (element, show) => {
  const controller = form(element, {
    autoValidate: false,
    validators: {
      username: {
        required: { value: true, message: 'Pick a username.' },
        pattern: { value: /^[a-z0-9_]{3,}$/i, message: 'Use 3+ letters, numbers or _.' },
      },
    },
  })

  controller.subscribe(state => {
    renderErrors(element, state.errors)
    if (state.isSubmitting) show('request', 'Checking availability…')
  })

  controller.onSubmit(async (_element, data) => {
    const available = await checkAvailability(String(data.username))
    if (available) {
      show('request', `“${data.username}” is yours`)
    } else {
      // A manual error stays until the visitor edits the field.
      controller.setErrors({ username: ['That username is already taken.'] })
      show('request', 'The server rejected the username')
    }
  })

  return controller
}
// #endregion username

// #region guests
export const guests = (element, show) => {
  const list = element.querySelector('[data-guests]')
  const template = list.querySelector('[data-guest]').cloneNode(true)

  const controller = form(element, {
    autoValidate: false,
    validators: {
      'guests[]': {
        // `each` checks every row on its own, so only the empty row is marked.
        each: { required: { value: true, message: 'Enter a name or remove the empty row.' } },
      },
    },
  })

  const renumber = () => {
    list.querySelectorAll('[data-guest]').forEach((row, index) => {
      const input = row.querySelector('input')
      input.id = `guest-${index + 1}`
      row.querySelector('label').htmlFor = input.id
      row.querySelector('label').textContent = `Guest ${index + 1}`
    })
  }

  const onClick = event => {
    const target = event.target.closest('button')
    if (target?.matches('[data-add]')) {
      const row = template.cloneNode(true)
      list.append(row)
      renumber()
      row.querySelector('input').focus()
    } else if (target?.matches('[data-remove]') && list.children.length > 1) {
      target.closest('[data-guest]').remove()
      renumber()
    }
  }
  element.addEventListener('click', onClick)
  // destroy() runs registered cleanups, so the row buttons stop with the form.
  controller.addCleanup(() => element.removeEventListener('click', onClick))

  controller.subscribe(state => {
    const names = [state.values['guests[]'] ?? []].flat().filter(Boolean)
    show('guests', names.join(', ') || 'Nobody yet')
    show('errors', state.errors['guests[]']?.[0] ?? 'None')
  })

  controller.onSubmit((_element, _data, formData) => {
    const count = formData.getAll('guests[]').length
    show('guests', `${count} invitation${count === 1 ? '' : 's'} ready`)
  })

  return controller
}
// #endregion guests

// #region wizard
export const wizard = (element, show) => {
  const steps = [...element.querySelectorAll('[data-step]')]
  const back = element.querySelector('[data-back]')
  const next = element.querySelector('[data-next]')
  const submit = element.querySelector('button[type="submit"]')
  const stepFields = [
    ['email', 'password'],
    ['company', 'role'],
  ]
  let current = 0

  const controller = form(element, {
    autoValidate: false,
    validators: {
      email: {
        required: { value: true, message: 'Enter your email.' },
        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Use a valid email address.' },
      },
      password: {
        required: { value: true, message: 'Choose a password.' },
        minLength: { value: 8, message: 'Use at least 8 characters.' },
      },
      company: { required: { value: true, message: 'Name your company.' } },
      role: { required: { value: true, message: 'Choose a role.' } },
    },
  })

  const go = index => {
    current = index
    steps.forEach((step, position) => {
      step.hidden = position !== index
    })
    back.hidden = index === 0
    next.hidden = index === steps.length - 1
    submit.hidden = index !== steps.length - 1
    show('step', `${index + 1} of ${steps.length}`)
  }

  const onClick = event => {
    if (event.target.closest('[data-next]')) {
      // Check only the fields of the visible step.
      // validate() returns the result without notifying subscribers.
      const { isValid, errors } = controller.validate(stepFields[current])
      renderErrors(element, errors)
      const count = Object.keys(errors).length
      show('errors', count === 0 ? 'None' : `${count} field${count === 1 ? '' : 's'} to fix`)
      if (isValid) {
        go(current + 1)
        steps[current].querySelector('input, select')?.focus()
      }
    } else if (event.target.closest('[data-back]')) {
      go(current - 1)
    }
  }
  element.addEventListener('click', onClick)
  controller.addCleanup(() => element.removeEventListener('click', onClick))

  controller.subscribe(state => renderErrors(element, state.errors))
  controller.onSubmit((_element, data) => {
    show('result', `Workspace for ${data.company} (${data.role}) is ready`)
  })

  go(0)
  return controller
}
// #endregion wizard

// #region delivery
export const delivery = (element, show) => {
  const controller = form(element, {
    autoValidate: false,
    validators: {
      date: {
        // Runs again whenever `method` changes, thanks to dependsOn.
        validate: ({ value, values }) =>
          values.method === 'scheduled' && !value ? 'Pick a delivery date.' : undefined,
        dependsOn: 'method',
        pattern: { value: /^\d{4}-\d{2}-\d{2}$/, message: 'Use the YYYY-MM-DD format.' },
      },
    },
  })

  controller.observe('method', value => show('method', String(value)))
  controller.subscribe(state => renderErrors(element, state.errors))
  controller.onSubmit((_element, data) => {
    show('result', data.method === 'scheduled' ? `Arrives on ${data.date}` : 'Arrives in 2–4 days')
  })

  return controller
}
// #endregion delivery

// #region order
const seatPrice = 24

export const order = (element, show) => {
  const controller = form(element, {
    validators: {
      quantity: {
        required: { value: true, message: 'Enter how many seats you need.' },
        numeric: { value: true, message: 'Use digits, for example 3.' },
        min: { value: 1, message: 'Buy at least 1 seat.' },
        max: { value: 10, message: 'Contact us for more than 10 seats.' },
      },
    },
  })

  controller.observe('quantity', value => {
    const seats = Number(value)
    show('total', Number.isFinite(seats) && seats > 0 ? `$${(seats * seatPrice).toFixed(2)}` : '—')
  })

  controller.subscribe(state => {
    renderErrors(element, state.errors)
    show('status', state.errors.quantity?.[0] ?? 'Ready to buy')
  })

  controller.onSubmit((_element, data) => {
    show('status', `Reserved ${data.quantity} seats`)
  })

  return controller
}
// #endregion order

// #region preferences
export const preferences = (element, show) => {
  const controller = form(element, {
    autoValidate: false,
    validators: {
      'topics[]': { minLength: { value: 1, message: 'Pick at least one topic.' } },
      consent: { required: { value: true, message: 'Tick the box to subscribe.' } },
    },
  })

  controller.subscribe(state => {
    renderErrors(element, state.errors)
    const { channel, days, consent } = state.values
    show('values', JSON.stringify({ channel, 'topics[]': state.values['topics[]'], days, consent }))
  })

  controller.onSubmit((_element, data) => {
    show('result', `Saved ${[data['topics[]']].flat().length} topic(s) by ${data.channel}`)
  })

  return controller
}
// #endregion preferences

// #region floating
export const floating = (element, show) => {
  const email = element.querySelector('input[type="email"]')
  const controller = form(element, {
    // Your own attribute names instead of css-filled and css-error.
    attributes: { filled: 'data-filled', error: 'data-invalid' },
    validators: {
      name: { required: true },
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    },
  })

  controller.subscribe(() => {
    const names = ['data-filled', 'data-invalid', 'aria-invalid'].filter(name =>
      email.hasAttribute(name)
    )
    show('attributes', names.join(' ') || 'none')
  })

  controller.onSubmit((_element, data) => {
    show('result', `${data.name} joined the list`)
  })

  return controller
}
// #endregion floating

// #region summary
export const summary = (element, show) => {
  const controller = form(element, {
    autoValidate: false,
    validators: {
      title: { required: { value: true, message: 'Add an event title.' } },
      venue: { required: { value: true, message: 'Say where it happens.' } },
      capacity: {
        required: { value: true, message: 'Set a capacity.' },
        numeric: { value: true, message: 'Capacity must be a number.' },
      },
    },
  })

  let attempts = 0
  controller.subscribe(state => {
    const entries = Object.entries(state.errors)
    show('problems', String(entries.length))
    if (entries.length === 0) element.querySelector('.error-summary')?.remove()
    // Rebuild the summary once per submit attempt, not on every keystroke.
    if (state.submitCount === attempts || entries.length === 0) return
    attempts = state.submitCount
    const items = entries
      .map(([name, messages]) => {
        const field = [controller.getField(name)].flat()[0]
        return `<li><a href="#${field.id}">${messages[0]}</a></li>`
      })
      .join('')
    controller.append({
      tag: 'div',
      class: 'error-summary',
      atStart: true,
      content: `<p role="alert">Fix ${entries.length} problem${entries.length === 1 ? '' : 's'} before publishing:</p><ul>${items}</ul>`,
    })
  })

  controller.onSubmit((_element, data) => {
    show('result', `“${data.title}” is published`)
  })

  return controller
}
// #endregion summary
