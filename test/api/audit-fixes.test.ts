import { beforeEach, describe, expect, it, vi } from 'vitest'

import { form } from '../../src/api/form'
import { applyFormattedValue } from '../../src/core/format-helpers'

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0))
const microtasks = () => new Promise<void>(resolve => queueMicrotask(resolve))

describe('2.8.0 audit regressions', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="audit-form">
        <input type="text" name="name" value="" />
        <input type="email" name="email" />
        <input type="checkbox" name="tags[]" value="news" />
        <input type="checkbox" name="tags[]" value="offers" />
        <input type="checkbox" name="tags[]" value="events" />
        <div id="messages"></div>
        <button type="reset">Reset</button>
        <button type="submit">Send</button>
      </form>
    `
    window.history.replaceState({}, '', 'http://localhost/')
  })

  it('prefills every value of a repeated query key', () => {
    window.history.replaceState({}, '', 'http://localhost/?tags[]=news&tags[]=events&name=Ada')
    const api = form('audit-form').prefill()

    expect(api.getValue('tags[]')).toEqual(['news', 'events'])
    expect(api.getValue('name')).toBe('Ada')
  })

  it('auto-submits once after a prefill batch', () => {
    window.history.replaceState({}, '', 'http://localhost/?name=Ada&email=ada%40example.com')
    const api = form('audit-form', { autoSubmit: true })
    const submit = vi.fn()
    api.onSubmit(submit)

    api.prefill()

    expect(submit).toHaveBeenCalledTimes(1)
  })

  it('synchronizes state after a native reset button', async () => {
    const api = form('audit-form', { validators: { email: { required: true } } })
    const watcher = vi.fn()
    api.setValue('name', 'Ada')
    api.watch('name', watcher)
    watcher.mockClear()
    expect(api.getField('name')).toHaveProperty('value', 'Ada')
    expect((api.getField('name') as HTMLInputElement).hasAttribute('css-filled')).toBe(true)

    const reset = api.element!.querySelector<HTMLButtonElement>('button[type="reset"]')!
    reset.click()
    await flush()

    const name = api.getField('name') as HTMLInputElement
    expect(name.value).toBe('')
    expect(name.hasAttribute('css-filled')).toBe(false)
    expect(api.getState().errors).toEqual({})
    expect(watcher).toHaveBeenCalledWith('', name, api.element, expect.any(Object))
  })

  it('ignores a canceled native reset', async () => {
    const api = form('audit-form', { validators: { email: { required: true } } })
    api.element!.addEventListener('reset', event => event.preventDefault())
    api.element!.querySelector<HTMLButtonElement>('button[type="reset"]')!.click()
    await flush()

    expect(api.getState().errors.email).toBeDefined()
  })

  it('re-emits watchers when reset() restores defaults', () => {
    const api = form('audit-form')
    const watcher = vi.fn()
    api.setValue('name', 'Ada')
    api.observe('name', watcher)
    watcher.mockClear()

    api.reset()

    expect(watcher).toHaveBeenCalledTimes(1)
    expect(watcher.mock.calls[0]?.[0]).toBe('')
  })

  it('does not loop when a subscriber renders markup into the form', async () => {
    const api = form('audit-form', { validators: { email: { required: true } } })
    const listener = vi.fn(() => {
      api.append({ tag: 'p', class: 'summary', content: 'Fix the highlighted fields.' })
    })
    api.subscribe(listener)
    for (let index = 0; index < 5; index += 1) await microtasks()
    await flush()

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('still revalidates when a control is added', async () => {
    const api = form('audit-form', { validators: { phone: { required: true } } })
    expect(api.getState().errors.phone).toEqual(['This field is required.'])
    const phone = document.createElement('input')
    phone.name = 'phone'
    phone.value = '555'
    api.element!.prepend(phone)
    await flush()

    expect(api.getState().errors.phone).toBeUndefined()
  })

  it('focuses the first invalid control in document order', () => {
    const api = form('audit-form', {
      validators: { email: { required: true }, name: { required: true } }
    })
    api.element!.dispatchEvent(new Event('submit', { cancelable: true }))

    expect(document.activeElement).toBe(api.getField('name'))
  })

  it('does not move focus when an automatic submit is invalid', () => {
    const api = form('audit-form', {
      autoSubmit: true,
      validators: { email: { required: true } }
    })
    const name = api.getField('name') as HTMLInputElement
    name.focus()
    name.value = 'A'
    name.dispatchEvent(new Event('input', { bubbles: true }))

    expect(document.activeElement).toBe(name)
  })

  it('reports a rejected asynchronous submit handler', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const api = form('audit-form')
    const failure = new Error('network down')
    api.onSubmit(() => Promise.reject(failure))
    api.element!.dispatchEvent(new Event('submit', { cancelable: true }))
    await flush()

    expect(error).toHaveBeenCalledWith('[forms] submit handler failed', failure)
    expect(api.getState().isSubmitting).toBe(false)
    error.mockRestore()
  })

  it('does not move the selection of an unfocused formatted input', () => {
    const visible = document.createElement('input')
    document.body.append(visible)
    visible.value = '5512345678'
    const select = vi.spyOn(visible, 'setSelectionRange')

    applyFormattedValue(visible, null, '55 1234 5678', '5512345678')

    expect(visible.value).toBe('55 1234 5678')
    expect(select).not.toHaveBeenCalled()
  })
})

describe('destroyed controllers', () => {
  it('ignore late calls from callbacks that settle after destroy()', async () => {
    document.body.innerHTML = '<form id="late"><input name="user" /></form>'
    const api = form('late')
    let finish!: () => void
    api.onSubmit(() => new Promise<void>(resolve => (finish = resolve)))
    api.element!.dispatchEvent(new Event('submit', { cancelable: true }))
    api.destroy()
    finish()
    await flush()
    api.setErrors({ user: ['Taken.'] }).setValue('user', 'x').validate()

    const field = document.querySelector('input')!
    expect(field.hasAttribute('css-error')).toBe(false)
    expect(field.value).toBe('')
    expect(api.append({ tag: 'p', content: 'late' })).toBeNull()
    const listener = vi.fn()
    api.subscribe(listener)
    api.observe('user', listener)
    expect(listener).not.toHaveBeenCalled()
  })
})
