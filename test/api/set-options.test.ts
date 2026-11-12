import { beforeEach, describe, expect, it, vi } from 'vitest'

import { form } from '../../src/api/form'

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0))

const optionTexts = (select: HTMLSelectElement) =>
  Array.from(select.options, option => `${option.value}:${option.textContent}`)

describe('setOptions', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="options-form">
        <select name="country">
          <option value="">Choose</option>
          <option value="mx" selected>Mexico</option>
          <option value="us">United States</option>
        </select>
        <select name="city"></select>
        <select name="tags" multiple>
          <option value="a" selected>A</option>
          <option value="b" selected>B</option>
          <option value="c">C</option>
        </select>
        <input type="text" name="note" />
      </form>
    `
  })

  it('replaces options from strings, numbers, objects and groups', () => {
    const api = form('options-form')
    const result = api.setOptions('city', [
      { value: '', label: 'Choose a city' },
      'Monterrey',
      42,
      { label: 'North', options: ['Tijuana', { value: 'mxl', label: 'Mexicali', disabled: true }] },
    ])

    expect(result).toBe(api)
    const city = api.getField('city') as HTMLSelectElement
    expect(optionTexts(city)).toEqual([
      ':Choose a city',
      'Monterrey:Monterrey',
      '42:42',
      'Tijuana:Tijuana',
      'mxl:Mexicali',
    ])
    const group = city.querySelector('optgroup')!
    expect(group.label).toBe('North')
    expect(city.options[4]!.disabled).toBe(true)
  })

  it('writes labels as text, not HTML', () => {
    const api = form('options-form')
    api.setOptions('city', [{ value: 'x', label: '<img src=x onerror=alert(1)>' }])
    const city = api.getField('city') as HTMLSelectElement
    expect(city.querySelector('img')).toBeNull()
    expect(city.options[0]!.textContent).toBe('<img src=x onerror=alert(1)>')
  })

  it('keeps the current value when it is still listed and skips watchers', async () => {
    const api = form('options-form')
    const watcher = vi.fn()
    const subscriber = vi.fn()
    api.watch('country', watcher)
    api.subscribe(subscriber)
    watcher.mockClear()
    subscriber.mockClear()

    api.setOptions('country', ['us', 'mx', 'ca'])
    await flush()

    expect(api.getValue('country')).toBe('mx')
    expect(watcher).not.toHaveBeenCalled()
    expect(subscriber).not.toHaveBeenCalled()
  })

  it('runs the change pipeline once when the value changes', async () => {
    const api = form('options-form', { validators: { country: { required: true } } })
    const watcher = vi.fn()
    api.watch('country', watcher)
    watcher.mockClear()

    api.setOptions('country', [{ value: '', label: 'Loading…', disabled: true }])
    await flush()

    expect(api.getValue('country')).toBe('')
    expect(watcher).toHaveBeenCalledTimes(1)
    expect(watcher.mock.calls[0]![0]).toBe('')
    expect(api.getState().errors.country).toBeDefined()
    const country = api.getField('country') as HTMLSelectElement
    expect(country.hasAttribute('css-filled')).toBe(false)
  })

  it('lets explicit selected options win over the kept value', () => {
    const api = form('options-form')
    api.setOptions('country', ['mx', { value: 'us', selected: true }])
    expect(api.getValue('country')).toBe('us')

    api.reset()
    expect(api.getValue('country')).toBe('us')
  })

  it('drops the previous value with keepValue: false', () => {
    const api = form('options-form')
    api.setOptions('country', ['us', 'mx'], { keepValue: false })
    expect(api.getValue('country')).toBe('us')
  })

  it('keeps the intersection for multiple selects', () => {
    const api = form('options-form')
    api.setOptions('tags', ['b', 'c', 'd'])
    expect(api.getValue('tags')).toEqual(['b'])
  })

  it('ignores non-select fields, unknown names and destroyed controllers', () => {
    const api = form('options-form')
    expect(() => api.setOptions('note', ['x'])).not.toThrow()
    expect(() => api.setOptions('missing', ['x'])).not.toThrow()
    api.destroy()
    const city = document.querySelector<HTMLSelectElement>('select[name="city"]')!
    api.setOptions('city', ['x'])
    expect(city.options).toHaveLength(0)
  })

  it('auto-submits when the selection changes', async () => {
    const api = form('options-form', { autoSubmit: true })
    const submit = vi.fn()
    api.onSubmit(submit)

    api.setOptions('country', ['mx', 'ca'])
    expect(submit).not.toHaveBeenCalled()

    api.setOptions('country', ['ca'])
    await flush()
    expect(submit).toHaveBeenCalledTimes(1)
  })
})

describe('option lists changed outside the controller', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="external-options">
        <select name="size">
          <option value="s">S</option>
          <option value="m" selected>M</option>
        </select>
      </form>
    `
  })

  it('fires watchers and revalidates when removing the selected option changes the value', async () => {
    const api = form('external-options', {
      validators: {
        size: { validate: ({ value }) => (value === 'l' ? 'Size L is sold out' : true) },
      },
    })
    const watcher = vi.fn()
    api.watch('size', watcher)
    watcher.mockClear()

    const select = api.getField('size') as HTMLSelectElement
    const large = document.createElement('option')
    large.value = 'l'
    large.textContent = 'L'
    select.replaceChildren(large)
    await flush()

    expect(api.getValue('size')).toBe('l')
    expect(watcher).toHaveBeenCalledTimes(1)
    expect(watcher.mock.calls[0]![0]).toBe('l')
    expect(api.getState().errors.size).toBeDefined()
  })

  it('stays quiet when an added option leaves the selection unchanged', async () => {
    const api = form('external-options')
    const watcher = vi.fn()
    const subscriber = vi.fn()
    api.watch('size', watcher)
    api.subscribe(subscriber)
    watcher.mockClear()
    subscriber.mockClear()

    const select = api.getField('size') as HTMLSelectElement
    select.add(new Option('XL', 'xl'))
    await flush()

    expect(watcher).not.toHaveBeenCalled()
    expect(subscriber).not.toHaveBeenCalled()
  })
})
