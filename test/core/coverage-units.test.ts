import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  clearAttributes,
  isFieldFilled,
  readFieldValue,
  resolveFormElement,
  submitForm,
  writeFieldValue,
} from '../../src/core/dom'
import { validateFieldValue, validateFieldValueDetailed } from '../../src/core/validation'
import { createFormController } from '../../src/core/controller'
import type { FormFieldElement } from '../../src/core/types'

const html = (markup: string) => {
  document.body.innerHTML = markup
  return document.querySelector('form')!
}
const named = (form: HTMLFormElement, name: string) =>
  Array.from(form.elements).filter(
    element => (element as HTMLInputElement).name === name
  ) as FormFieldElement[]
const withFiles = (input: HTMLInputElement, files: File[]) =>
  Object.defineProperty(input, 'files', { value: files, configurable: true })

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('dom helpers', () => {
  it('resolves forms from elements, ids and refs, and rejects everything else', () => {
    const form = html('<form id="f"></form><div id="d"></div>')
    expect(resolveFormElement(form)).toBe(form)
    expect(resolveFormElement('f')).toBe(form)
    expect(resolveFormElement('d')).toBeNull()
    expect(resolveFormElement({ current: form })).toBe(form)
    expect(resolveFormElement({ current: null })).toBeNull()
    expect(resolveFormElement(null)).toBeNull()
    expect(resolveFormElement(document.createElement('div') as never)).toBeNull()
  })

  it('reads and writes every array-syntax group', () => {
    const form = html(`<form>
      <select name="s[]"><option>a</option><option selected>b</option></select>
      <select name="s[]"><option selected>c</option></select>
      <input type="radio" name="r[]" value="x"><input type="radio" name="r[]" value="y" checked>
      <input type="radio" name="n[]" value="x"><input type="radio" name="n[]" value="y">
      <input type="checkbox" name="c[]" value="1" checked><input type="checkbox" name="c[]" value="2">
      <input type="file" name="f[]"><input type="file" name="f[]">
      <input name="t[]" value="one"><input name="t[]" value="two">
      <textarea name="ta[]">x</textarea><textarea name="ta[]">y</textarea>
    </form>`)
    expect(readFieldValue(named(form, 's[]'))).toEqual(['b', 'c'])
    expect(readFieldValue(named(form, 'r[]'))).toBe('y')
    expect(readFieldValue(named(form, 'n[]'))).toBe('')
    expect(readFieldValue(named(form, 'c[]'))).toEqual(['1'])
    const [a, b] = named(form, 'f[]') as HTMLInputElement[]
    const file = new File(['x'], 'x.txt')
    withFiles(a!, [file])
    withFiles(b!, null as never)
    expect(readFieldValue(named(form, 'f[]'))).toEqual([file])
    expect(readFieldValue(named(form, 't[]'))).toEqual(['one', 'two'])

    writeFieldValue(named(form, 't[]'), ['only'])
    expect(readFieldValue(named(form, 't[]'))).toEqual(['only', ''])
    writeFieldValue(named(form, 'ta[]'), ['p', 'q', 'r'])
    expect(readFieldValue(named(form, 'ta[]'))).toEqual(['p', 'q'])
    writeFieldValue(named(form, 'c[]'), ['2'])
    expect(readFieldValue(named(form, 'c[]'))).toEqual(['2'])
    writeFieldValue(named(form, 'f[]'), [])
    writeFieldValue(named(form, 'f[]'), ['ignored'])
    writeFieldValue([undefined as never], 'skip')
  })

  it('reads and writes single fields of every kind', () => {
    const form = html(`<form>
      <select name="m" multiple><option>a</option><option>b</option></select>
      <input type="checkbox" name="one" value="yes">
      <input type="checkbox" name="pair" value="a" checked><input type="checkbox" name="pair" value="b" checked>
      <input type="radio" name="pick" value="a">
      <input type="file" name="file">
      <input name="single[]" value="solo">
      <textarea name="note"></textarea>
    </form>`)
    writeFieldValue(named(form, 'm'), 'b')
    expect(readFieldValue(named(form, 'm'))).toEqual(['b'])
    writeFieldValue(named(form, 'm'), ['a', 'b'])
    expect(readFieldValue(named(form, 'm'))).toEqual(['a', 'b'])
    expect(readFieldValue(named(form, 'one'))).toBe('')
    writeFieldValue(named(form, 'one'), 'yes')
    expect(readFieldValue(named(form, 'one'))).toBe('yes')
    expect(readFieldValue(named(form, 'pair'))).toEqual(['a', 'b'])
    expect(readFieldValue(named(form, 'pick'))).toBe('')
    writeFieldValue(named(form, 'pick'), 'a')
    expect(readFieldValue(named(form, 'pick'))).toBe('a')
    const file = named(form, 'file')[0] as HTMLInputElement
    withFiles(file, null as never)
    expect(readFieldValue([file])).toEqual([])
    expect(isFieldFilled(file)).toBe(false)
    withFiles(file, [new File(['x'], 'x')])
    expect(isFieldFilled(file)).toBe(true)
    expect(readFieldValue(named(form, 'single[]'))).toBe('solo')
    writeFieldValue(named(form, 'note'), null)
    expect(isFieldFilled(named(form, 'note')[0]!)).toBe(false)
    expect(readFieldValue([])).toBeUndefined()
    expect(readFieldValue([undefined as never])).toBeUndefined()

    form.querySelector('input[name="one"]')!.setAttribute('data-x', '')
    clearAttributes(form, ['data-x'])
    expect(form.querySelector('[data-x]')).toBeNull()
  })

  it('submits through requestSubmit, a submit button or form.submit', () => {
    const form = html('<form><button type="submit">Go</button></form>')
    const request = vi.fn()
    Object.defineProperty(form, 'requestSubmit', { value: request, configurable: true })
    submitForm(form)
    expect(request).toHaveBeenCalled()
    Object.defineProperty(form, 'requestSubmit', { value: undefined, configurable: true })
    const click = vi.spyOn(form.querySelector('button')!, 'click').mockImplementation(() => {})
    submitForm(form)
    expect(click).toHaveBeenCalled()
    form.querySelector('button')!.remove()
    const submit = vi.spyOn(form, 'submit').mockImplementation(() => {})
    submitForm(form)
    expect(submit).toHaveBeenCalled()
  })
})

describe('validation rules', () => {
  it('applies lengths, patterns, numbers and custom validators to every value shape', () => {
    const file = new File(['x'], 'photo.png')
    expect(validateFieldValue('f', [file], { pattern: /\.png$/, minLength: 2 }, {})).toEqual([
      'Minimum length is 2.',
    ])
    expect(validateFieldValue('f', undefined, { maxLength: 0, required: true }, {})).toEqual([
      'This field is required.',
    ])
    expect(validateFieldValue('f', '12', { min: 20, max: 5 }, {})).toEqual([
      'Minimum value is 20.',
      'Maximum value is 5.',
    ])
    expect(validateFieldValue('f', '1e999', { numeric: true }, {})).toEqual([
      'Value must be a number.',
    ])
    expect(
      validateFieldValue('f', ['a'], { numeric: { value: true, message: 'num' } }, {})
    ).toEqual(['num'])
    expect(
      validateFieldValue('f', 'x', { validate: [() => false, () => 'bad', () => ''] }, {})
    ).toEqual(['Validation failed.', 'bad'])
    expect(validateFieldValue('f', undefined, { pattern: /x/ }, {})).toEqual([])
    expect(validateFieldValue('f', 3 as never, { pattern: /x/ }, {})).toEqual([
      'Value does not match the required pattern.',
    ])
  })

  it('compares arrays for sameAs and validates each item with elements', () => {
    expect(validateFieldValue('a', ['1', '2'], { sameAs: 'b' }, { b: ['1', '2'] })).toEqual([])
    expect(validateFieldValue('a', ['1'], { sameAs: 'b' }, { b: ['1', '2'] })).toEqual([
      'Value must match b.',
    ])
    const file = new File(['x'], 'x.txt')
    const element = document.createElement('input')
    const detailed = validateFieldValueDetailed(
      'a',
      ['', file] as never,
      { each: { required: true, pattern: /\.png$/ } },
      {},
      [{ value: '', element }, { value: [file] }]
    )
    expect(detailed.itemErrors.map(item => item.index)).toEqual([0, 1])
    expect(detailed.itemErrors[0]!.element).toBe(element)
    const files = validateFieldValueDetailed('a', [file], { each: { minLength: 2 } }, {})
    expect(files.itemErrors).toHaveLength(1)
    const single = validateFieldValueDetailed('a', 'v', { each: { maxLength: 0 } }, {})
    expect(single.itemErrors).toHaveLength(1)
  })
})

describe('controller guards', () => {
  const callEverything = (api: ReturnType<typeof createFormController>) => {
    api.onSubmit(() => {})
    api.addCleanup(() => {})()
    api.watch('a', () => {})
    api.observe('a', () => {})
    api.unwatch('a')
    api.subscribe(() => {})()
    api.prefill('a')
    api.append({ tag: 'p', content: 'x' })
    api.setErrors({ a: ['bad'] })
    api.clearErrors()
    api.clearErrors(['a'])
    api.setValue('a', '1')
    api.setOptions('a', [{ value: '1', label: 'One' }])
    api.getValue('a')
    api.getField('a')
    api.validate()
    api.revalidate()
    api.reset()
    api.autoSubmit({ debounce: 10 })
    api.disableAutoSubmit()
    api.getData()
    api.getState()
    api.format({ type: 'numeral', field: 'a' })
    api.formatAll({ type: 'numeral', field: ['a'] })
    api.destroy()
  }

  it('turns every method into a safe no-op without a form element', () => {
    const api = createFormController('#missing', { validators: { a: { required: true } } })
    expect(api.element).toBeNull()
    expect(api.f).toBeNull()
    expect(() => callEverything(api)).not.toThrow()
  })

  it('turns every method into a safe no-op after destroy and runs late cleanups at once', () => {
    const form = html('<form id="g"><input name="a"></form>')
    const api = createFormController(form, { validators: { a: { required: true } } })
    api.destroy()
    api.destroy()
    const cleanup = vi.fn()
    api.addCleanup(cleanup)
    expect(cleanup).toHaveBeenCalled()
    expect(() => callEverything(api)).not.toThrow()
    expect(api.append({ tag: 'p', content: 'x' })).toBeNull()
  })

  it('unregisters a cleanup only once', () => {
    const form = html('<form><input name="a"></form>')
    const api = createFormController(form)
    const cleanup = vi.fn()
    const off = api.addCleanup(cleanup)
    off()
    off()
    api.destroy()
    expect(cleanup).not.toHaveBeenCalled()
  })

  it('appends at the start and replaces nodes that share the first class', () => {
    const form = html('<form><input name="a"></form>')
    const api = createFormController(form)
    api.append({ tag: 'p', content: 'one', class: 'note big' })
    const second = api.append({ tag: 'p', content: 'two', class: 'note', atStart: true })!
    expect(form.firstElementChild).toBe(second)
    expect(form.querySelectorAll('.note')).toHaveLength(1)
    api.append({ tag: 'p', content: 'blank', class: '  ' })
    api.destroy()
  })
})

describe('browser globals', () => {
  it('installs window.Forms from the module entry and the IIFE source', async () => {
    vi.resetModules()
    const global = await import('../../src/browser/global')
    expect(window.Forms.form).toBe(global.form)
    expect('default' in global).toBe(false)
    const iife = await import('../../src/browser/iife')
    expect(Object.keys(iife).sort()).toEqual(['available', 'destroyForm', 'form', 'newForm'])
  })
})

describe('controller events', () => {
  it('ignores input from non-fields, rethrows synchronous submit errors and cancels resets on destroy', async () => {
    const form = html(
      '<form><input name="a"><div id="x"></div><button type="submit">Go</button></form>'
    )
    const api = createFormController(form, { validators: { a: { required: true } } })
    form.querySelector('#x')!.dispatchEvent(new Event('input', { bubbles: true }))
    api.onSubmit(() => {
      throw new Error('submit failed')
    })
    api.setValue('a', 'filled')
    const reported: unknown[] = []
    const onError = (event: ErrorEvent) => {
      reported.push(event.error)
      event.preventDefault()
    }
    window.addEventListener('error', onError)
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    window.removeEventListener('error', onError)
    expect((reported[0] as Error).message).toBe('submit failed')
    form.dispatchEvent(new Event('reset'))
    api.destroy()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(api.getState()).toBeTruthy()
  })

  it('finds formatter fields without CSS.escape', async () => {
    const { getFormatterField, findVisibleField } = await import('../../src/core/format-helpers')
    vi.stubGlobal('CSS', undefined)
    const form = html('<form><input name="email[primary]"><input name="a.b_displayed"></form>')
    expect(getFormatterField(form, 'email[primary]')).toBe(form.elements[0])
    expect(getFormatterField(form, 'missing')).toBeNull()
    expect(findVisibleField(form, 'a.b_displayed')).toBe(form.elements[1])
    expect(findVisibleField(form, 'none')).toBeNull()
    vi.unstubAllGlobals()
  })
})
