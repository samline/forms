import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { form } from '../../src/api/form'

const build = (html?: string) => {
  document.body.innerHTML =
    html ??
    `
    <form id="f">
      <input name="name" />
      <input name="email" />
      <button type="submit">Send</button>
    </form>
  `
}

const el = (name: string) => document.querySelector(`[name="${name}"]`) as HTMLInputElement
const type = (name: string, value: string) => {
  const field = el(name)
  field.value = value
  field.dispatchEvent(new Event('input', { bubbles: true }))
}
const submit = () =>
  document
    .getElementById('f')!
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

const rules = { validators: { name: { required: true }, email: { required: true } } }

describe('aria-invalid exposure', () => {
  beforeEach(() => build())
  afterEach(() => vi.useRealTimers())

  it('marks css-error but not aria-invalid="true" on load', () => {
    const api = form('f', rules)
    expect(el('email').hasAttribute('css-error')).toBe(true)
    expect(el('email').getAttribute('aria-invalid')).not.toBe('true')
    api.destroy()
  })

  it('sets aria-invalid="false" on native required controls without a shown error', () => {
    build('<form id="f"><input name="email" required /><input name="name" /></form>')
    const api = form('f', { validators: { email: { required: true } } })
    expect(el('email').getAttribute('aria-invalid')).toBe('false')
    expect(el('name').hasAttribute('aria-invalid')).toBe(false)
    api.destroy()
  })

  it('exposes a field once the user edits it', () => {
    const api = form('f', { validators: { email: { pattern: /@/ } } })
    type('email', 'bad')
    expect(el('email').getAttribute('aria-invalid')).toBe('true')
    type('email', 'a@b.co')
    expect(el('email').hasAttribute('aria-invalid')).toBe(false)
    api.destroy()
  })

  it('exposes every field on a user submit and focuses the first', () => {
    const api = form('f', rules)
    submit()
    expect(el('name').getAttribute('aria-invalid')).toBe('true')
    expect(el('email').getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(el('name'))
    api.destroy()
  })

  it('does not expose untouched fields on an auto-submit', () => {
    vi.useFakeTimers()
    const api = form('f', { ...rules, autoSubmit: { debounce: 100 } })
    type('name', 'Ana')
    vi.advanceTimersByTime(150)
    expect(el('email').hasAttribute('css-error')).toBe(true)
    expect(el('email').getAttribute('aria-invalid')).not.toBe('true')
    api.destroy()
  })

  it('validate(names) exposes only those names; validate() exposes all', () => {
    const api = form('f', rules)
    api.validate(['email'])
    expect(el('email').getAttribute('aria-invalid')).toBe('true')
    expect(el('name').getAttribute('aria-invalid')).not.toBe('true')
    api.validate()
    expect(el('name').getAttribute('aria-invalid')).toBe('true')
    api.destroy()
  })

  it('setErrors exposes immediately', () => {
    const api = form('f')
    api.setErrors({ email: ['Taken.'] })
    expect(el('email').getAttribute('aria-invalid')).toBe('true')
    api.destroy()
  })

  it('exposes a prefilled invalid value on load', () => {
    build('<form id="f"><input name="email" value="bad" /><input name="name" /></form>')
    const api = form('f', { validators: { email: { pattern: /@/ }, name: { required: true } } })
    expect(el('email').getAttribute('aria-invalid')).toBe('true')
    expect(el('name').getAttribute('aria-invalid')).not.toBe('true')
    api.destroy()
  })

  it('reset() returns to unexposed', () => {
    const api = form('f', rules)
    submit()
    expect(el('email').getAttribute('aria-invalid')).toBe('true')
    api.reset()
    expect(el('email').getAttribute('aria-invalid')).not.toBe('true')
    api.destroy()
  })

  it('destroy() removes aria-invalid from every field', () => {
    const api = form('f', rules)
    submit()
    api.destroy()
    expect(document.querySelectorAll('[aria-invalid]').length).toBe(0)
  })

  it('validate() called from an auto-submit-triggered listener still exposes', () => {
    vi.useFakeTimers()
    const api = form('f', { ...rules, autoSubmit: { debounce: 100 } })
    document.getElementById('f')!.addEventListener('submit', () => {
      api.validate()
    })
    type('name', 'Ana')
    vi.advanceTimersByTime(150)
    expect(el('email').getAttribute('aria-invalid')).toBe('true')
    api.destroy()
  })

  it('destroy() removes css-filled, css-error and aria-invalid and is idempotent', () => {
    const api = form('f', rules)
    type('name', 'Ana')
    submit()
    expect(el('name').hasAttribute('css-filled')).toBe(true)
    expect(el('email').hasAttribute('css-error')).toBe(true)
    api.destroy()
    expect(document.querySelectorAll('[css-filled],[css-error],[aria-invalid]').length).toBe(0)
    el('email').setAttribute('css-error', '')
    api.destroy()
    expect(el('email').hasAttribute('css-error')).toBe(true)
  })

  it('destroy() respects custom attribute names', () => {
    const api = form('f', { ...rules, attributes: { filled: 'is-filled', error: 'is-error' } })
    type('name', 'Ana')
    submit()
    expect(el('name').hasAttribute('is-filled')).toBe(true)
    expect(el('email').hasAttribute('is-error')).toBe(true)
    api.destroy()
    expect(document.querySelectorAll('[is-filled],[is-error],[aria-invalid]').length).toBe(0)
  })

  it('a group-level error announces on every member when one member is filled', () => {
    build(
      '<form id="f"><input type="checkbox" name="t[]" value="a" checked /><input type="checkbox" name="t[]" value="b" /></form>'
    )
    const api = form('f', {
      validators: {
        't[]': { validate: ({ value }) => (Array.isArray(value) && value.length >= 2) || 'pick 2' },
      },
    })
    const boxes = document.querySelectorAll('input')
    expect(Array.from(boxes, box => box.getAttribute('aria-invalid'))).toEqual(['true', 'true'])
    api.destroy()
  })

  it('clearErrors() keeps aria-invalid after setErrors() while a rule error remains', () => {
    const api = form('f', { validators: { email: { required: true } } })
    api.setErrors({ email: ['Taken.'] })
    api.clearErrors()
    expect(el('email').hasAttribute('css-error')).toBe(true)
    expect(el('email').getAttribute('aria-invalid')).toBe('true')
    api.destroy()
  })

  it('setValue() and prefill() of an empty value do not expose the field', () => {
    window.history.replaceState({}, '', 'http://localhost/?email=')
    const api = form('f', rules)
    api.prefill()
    api.setValue('name', '')
    expect(el('email').getAttribute('aria-invalid')).not.toBe('true')
    expect(el('name').getAttribute('aria-invalid')).not.toBe('true')
    api.setValue('email', '')
    expect(el('email').getAttribute('aria-invalid')).not.toBe('true')
    api.destroy()
    window.history.replaceState({}, '', 'http://localhost/')
  })

  it('a programmatic non-empty invalid value is exposed because the field holds a value', () => {
    const api = form('f', { validators: { email: { pattern: /@/ } } })
    api.setValue('email', 'bad')
    expect(el('email').getAttribute('aria-invalid')).toBe('true')
    api.destroy()
  })

  it('keeps a server-rendered aria-invalid="true" on an empty required control', () => {
    build('<form id="f"><input name="email" required aria-invalid="true" /></form>')
    const api = form('f', { validators: { email: { required: true } } })
    expect(el('email').getAttribute('aria-invalid')).toBe('true')
    api.destroy()
  })

  it('focus skips a field inside a hidden ancestor when checkVisibility exists', () => {
    build(`
      <form id="f">
        <div hidden><input name="name" /></div>
        <input name="email" />
      </form>
    `)
    const proto = HTMLElement.prototype as unknown as { checkVisibility?: unknown }
    const original = proto.checkVisibility
    proto.checkVisibility = function (this: HTMLElement) {
      return !this.closest('[hidden]')
    }
    try {
      const api = form('f', rules)
      submit()
      expect(document.activeElement).toBe(el('email'))
      api.destroy()
    } finally {
      if (original === undefined) delete proto.checkVisibility
      else proto.checkVisibility = original
    }
  })
})
