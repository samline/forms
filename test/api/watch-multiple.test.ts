import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { form } from '../../src/api/form'
import {
  __resetFormatterLoaderForTests,
  __setFormatterModuleForTests,
  type FormatterModule
} from '../../src/core/formatter-loader'

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0))

const type = (input: HTMLInputElement, value: string) => {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('watching several fields', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="order-form">
        <input type="number" name="quantity" value="2" />
        <input type="number" name="price" value="10" />
        <input type="text" name="note" />
        <button type="reset">Reset</button>
      </form>
    `
  })

  it('fires once on registration with every value and changed: null', () => {
    const api = form('order-form')
    const watcher = vi.fn()

    expect(api.watch(['quantity', 'price'], watcher)).toBe(api)

    expect(watcher).toHaveBeenCalledTimes(1)
    const [values, changed, element, state] = watcher.mock.calls[0]!
    expect(values).toEqual({ quantity: '2', price: '10' })
    expect(changed).toBeNull()
    expect(element).toBe(api.element)
    expect(state.values.quantity).toBe('2')
  })

  it('fires with the changed field name for each listed field only', () => {
    const api = form('order-form')
    const watcher = vi.fn()
    api.watch(['quantity', 'price'], watcher)
    watcher.mockClear()

    type(api.getField('price') as HTMLInputElement, '12')
    expect(watcher).toHaveBeenCalledTimes(1)
    expect(watcher.mock.calls[0]![0]).toEqual({ quantity: '2', price: '12' })
    expect(watcher.mock.calls[0]![1]).toBe('price')

    api.setValue('quantity', 3)
    expect(watcher).toHaveBeenCalledTimes(2)
    expect(watcher.mock.calls[1]![1]).toBe('quantity')

    type(api.getField('note') as HTMLInputElement, 'hello')
    expect(watcher).toHaveBeenCalledTimes(2)
  })

  it('deduplicates names and ignores an empty list', () => {
    const api = form('order-form')
    const watcher = vi.fn()
    api.watch(['price', 'price'], watcher)
    expect(watcher.mock.calls[0]![0]).toEqual({ price: '10' })

    const empty = vi.fn()
    const stop = api.observe([], empty)
    expect(empty).not.toHaveBeenCalled()
    expect(() => stop()).not.toThrow()
  })

  it('observe returns an unsubscribe for the list', () => {
    const api = form('order-form')
    const watcher = vi.fn()
    const stop = api.observe(['quantity', 'price'], watcher)
    watcher.mockClear()

    stop()
    api.setValue('price', 20)
    expect(watcher).not.toHaveBeenCalled()
  })

  it('unwatch removes list watchers by the same set of names', () => {
    const api = form('order-form')
    const first = vi.fn()
    const second = vi.fn()
    const single = vi.fn()
    api.watch(['quantity', 'price'], first).watch(['price', 'quantity'], second).watch('price', single)
    first.mockClear()
    second.mockClear()
    single.mockClear()

    api.unwatch(['price', 'quantity'], first)
    api.setValue('price', 11)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)

    api.unwatch(['quantity'])
    api.setValue('price', 12)
    expect(second).toHaveBeenCalledTimes(2)

    api.unwatch(['quantity', 'price'])
    api.setValue('price', 13)
    expect(second).toHaveBeenCalledTimes(2)
    expect(single).toHaveBeenCalledTimes(3)

    api.watch(['quantity', 'price'], first)
    first.mockClear()
    api.unwatch()
    api.setValue('price', 14)
    expect(first).not.toHaveBeenCalled()
    expect(single).toHaveBeenCalledTimes(3)
  })

  it('unwatch with a single name leaves list watchers in place', () => {
    const api = form('order-form')
    const watcher = vi.fn()
    api.watch(['quantity', 'price'], watcher)
    watcher.mockClear()

    api.unwatch('price')
    api.setValue('price', 15)
    expect(watcher).toHaveBeenCalledTimes(1)
  })

  it('fires once with changed: null after reset', () => {
    const api = form('order-form')
    const watcher = vi.fn()
    api.setValue('price', 99)
    api.watch(['quantity', 'price'], watcher)
    watcher.mockClear()

    api.reset()
    expect(watcher).toHaveBeenCalledTimes(1)
    expect(watcher.mock.calls[0]![0]).toEqual({ quantity: '2', price: '10' })
    expect(watcher.mock.calls[0]![1]).toBeNull()
  })

  it('is a no-op after destroy', () => {
    const api = form('order-form')
    const before = vi.fn()
    api.watch(['quantity', 'price'], before)
    api.destroy()
    before.mockClear()

    const after = vi.fn()
    api.watch(['quantity', 'price'], after)
    expect(after).not.toHaveBeenCalled()
    type(api.getField('price') as HTMLInputElement, '1')
    expect(before).not.toHaveBeenCalled()
  })
})

describe('watching several fields: formatted fields and option lists', () => {
  const digitsFormatter: FormatterModule = {
    format: value => {
      const digits = String(value ?? '').replace(/\D/g, '')
      return { formatted: digits.replace(/(\d{2})(?=\d)/g, '$1 '), raw: digits, type: 'phone' }
    }
  }

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="mixed-form">
        <input name="phone" />
        <select name="size">
          <option value="s">S</option>
          <option value="m" selected>M</option>
        </select>
      </form>
    `
    __resetFormatterLoaderForTests()
  })

  afterEach(() => {
    __resetFormatterLoaderForTests()
  })

  it('fires once per keystroke for a formatted field listed under both names', async () => {
    __setFormatterModuleForTests(digitsFormatter)
    const api = form('mixed-form')
    api.format({ type: 'phone', field: 'phone' })
    await flush()

    const watcher = vi.fn()
    api.watch(['phone', 'phone_displayed', 'size'], watcher)
    watcher.mockClear()

    type(api.getField('phone_displayed') as HTMLInputElement, '5512')
    await flush()

    expect(watcher).toHaveBeenCalledTimes(1)
    expect(watcher.mock.calls[0]![0]).toEqual({
      phone: '5512',
      phone_displayed: '55 12',
      size: 'm'
    })
    expect(watcher.mock.calls[0]![1]).toBe('phone')
  })

  it('fires when setOptions changes a listed select', () => {
    const api = form('mixed-form')
    const watcher = vi.fn()
    api.watch(['phone', 'size'], watcher)
    watcher.mockClear()

    api.setOptions('size', ['l', 'xl'])

    expect(watcher).toHaveBeenCalledTimes(1)
    expect(watcher.mock.calls[0]![0]).toEqual({ phone: '', size: 'l' })
    expect(watcher.mock.calls[0]![1]).toBe('size')
  })

  it('fires when options changed by hand change a listed select', async () => {
    const api = form('mixed-form')
    const watcher = vi.fn()
    api.watch(['phone', 'size'], watcher)
    watcher.mockClear()

    const select = api.getField('size') as HTMLSelectElement
    select.replaceChildren(new Option('L', 'l'))
    await flush()

    expect(watcher).toHaveBeenCalledTimes(1)
    expect(watcher.mock.calls[0]![1]).toBe('size')
  })
})
