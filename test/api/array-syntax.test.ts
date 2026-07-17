import { beforeEach, describe, expect, it } from 'vitest'

import { form } from '../../src/api/form'

// JSDOM 26 has no `DataTransfer` constructor and rejects non-FileList
// values on the `files` setter. `readFieldValue` calls
// `Array.from(f.files)`, so a length + indexed access surface is enough —
// we install it via `Object.defineProperty` to bypass the setter check.
const makeFileList = (...files: File[]): FileList => {
  const list = Object.create(FileList.prototype)
  for (const [index, file] of files.entries()) {
    Object.defineProperty(list, index, { value: file })
  }
  Object.defineProperty(list, 'length', { value: files.length })
  return list as FileList
}

const setFiles = (input: HTMLInputElement, files: FileList): void => {
  Object.defineProperty(input, 'files', { value: files, configurable: true })
}

// Regression coverage for the `name="foo[]"` convention: the de facto
// HTML pattern used by PHP, Rails, Express, Spring, etc. to collect
// repeated inputs as an array on the server. Before the fix, `getValue`
// only returned the first matching input's value and `setValue` wrote
// the same string to every matching input — both broke the contract
// that custom validators rely on (`Array.isArray(value)`).

describe('form controller — name="foo[]" multi-value inputs', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', 'http://localhost/')
  })

  it('getValue returns string[] for two text inputs sharing name="foo[]"', () => {
    document.body.innerHTML = `
      <form id="array-form">
        <input type="text" name="tags[]" />
        <input type="text" name="tags[]" />
      </form>
    `

    const api = form('array-form')
    const inputs = document.querySelectorAll<HTMLInputElement>('input[name="tags[]"]')
    inputs[0]!.value = 'alpha'
    inputs[1]!.value = 'beta'

    expect(api.getValue('tags[]')).toEqual(['alpha', 'beta'])
  })

  it('getValue returns a plain string when name="foo[]" matches a single input', () => {
    document.body.innerHTML = `
      <form id="array-form">
        <input type="text" name="tags[]" />
      </form>
    `

    const api = form('array-form')
    const input = document.querySelector<HTMLInputElement>('input[name="tags[]"]')!
    input.value = 'solo'

    // A single input with the `[]` suffix still returns a string —
    // wrapping it in an array would force every consumer to flatten
    // it before use, which is exactly the noise the convention avoids.
    expect(api.getValue('tags[]')).toBe('solo')
  })

  it('getValue returns string[] for two email inputs sharing name="foo[]"', () => {
    document.body.innerHTML = `
      <form id="array-form">
        <input type="email" name="docusign_email[]" />
        <input type="email" name="docusign_email[]" />
      </form>
    `

    const api = form('array-form')
    const inputs = document.querySelectorAll<HTMLInputElement>('input[name="docusign_email[]"]')
    inputs[0]!.value = 'a@example.com'
    inputs[1]!.value = 'b@example.com'

    expect(api.getValue('docusign_email[]')).toEqual([
      'a@example.com',
      'b@example.com'
    ])
  })

  it('getValue returns string[] of checked values for checkbox groups with name="foo[]"', () => {
    document.body.innerHTML = `
      <form id="array-form">
        <input type="checkbox" name="interests[]" value="design" />
        <input type="checkbox" name="interests[]" value="code" />
        <input type="checkbox" name="interests[]" value="writing" />
      </form>
    `

    const api = form('array-form')
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      'input[name="interests[]"]'
    )
    checkboxes[0]!.checked = true
    checkboxes[1]!.checked = true
    checkboxes[2]!.checked = false

    // Always an array (no single-value collapse) so `Array.isArray(value)`
    // validators stay correct even with exactly one checked item.
    expect(api.getValue('interests[]')).toEqual(['design', 'code'])
  })

  it('getValue concatenates FileList across file inputs sharing name="foo[]"', () => {
    document.body.innerHTML = `
      <form id="array-form">
        <input type="file" name="attachments[]" />
        <input type="file" name="attachments[]" />
      </form>
    `

    const api = form('array-form')
    const inputs = document.querySelectorAll<HTMLInputElement>('input[name="attachments[]"]')

    setFiles(
      inputs[0]!,
      makeFileList(new File(['a'], 'a.txt', { type: 'text/plain' }))
    )
    setFiles(
      inputs[1]!,
      makeFileList(
        new File(['b'], 'b.txt', { type: 'text/plain' }),
        new File(['c'], 'c.txt', { type: 'text/plain' })
      )
    )

    const value = api.getValue('attachments[]')
    expect(Array.isArray(value)).toBe(true)
    expect((value as File[]).map(f => f.name)).toEqual(['a.txt', 'b.txt', 'c.txt'])
  })

  it('getValue keeps the original first-value semantics for name="foo" (no brackets)', () => {
    document.body.innerHTML = `
      <form id="bare-form">
        <input type="text" name="foo" />
        <input type="text" name="foo" />
      </form>
    `

    const api = form('bare-form')
    const inputs = document.querySelectorAll<HTMLInputElement>('input[name="foo"]')
    inputs[0]!.value = 'first'
    inputs[1]!.value = 'second'

    // Backward-compat: bare names are still treated as "single field,
    // first value wins". The `[]` suffix is the explicit opt-in.
    expect(api.getValue('foo')).toBe('first')
  })

  it('setValue distributes array elements one per input for name="foo[]"', () => {
    document.body.innerHTML = `
      <form id="array-form">
        <input type="text" name="tags[]" />
        <input type="text" name="tags[]" />
      </form>
    `

    const api = form('array-form')
    api.setValue('tags[]', ['alpha', 'beta'])

    const inputs = document.querySelectorAll<HTMLInputElement>('input[name="tags[]"]')
    expect(inputs[0]!.value).toBe('alpha')
    expect(inputs[1]!.value).toBe('beta')
  })

  it('setValue clears surplus inputs to "" when the array is shorter than the input count', () => {
    document.body.innerHTML = `
      <form id="array-form">
        <input type="text" name="tags[]" />
        <input type="text" name="tags[]" />
      </form>
    `

    const api = form('array-form')
    api.setValue('tags[]', ['alpha'])

    const inputs = document.querySelectorAll<HTMLInputElement>('input[name="tags[]"]')
    expect(inputs[0]!.value).toBe('alpha')
    expect(inputs[1]!.value).toBe('')
  })

  it('setValue drops surplus array elements when the array is longer than the input count', () => {
    document.body.innerHTML = `
      <form id="array-form">
        <input type="text" name="tags[]" />
        <input type="text" name="tags[]" />
      </form>
    `

    const api = form('array-form')
    api.setValue('tags[]', ['alpha', 'beta', 'gamma'])

    const inputs = document.querySelectorAll<HTMLInputElement>('input[name="tags[]"]')
    expect(inputs[0]!.value).toBe('alpha')
    expect(inputs[1]!.value).toBe('beta')
  })

  it('setValue keeps the original broadcast semantics for name="foo" (no brackets)', () => {
    document.body.innerHTML = `
      <form id="bare-form">
        <input type="text" name="foo" />
        <input type="text" name="foo" />
      </form>
    `

    const api = form('bare-form')
    api.setValue('foo', 'x')

    const inputs = document.querySelectorAll<HTMLInputElement>('input[name="foo"]')
    expect(inputs[0]!.value).toBe('x')
    expect(inputs[1]!.value).toBe('x')
  })

  it('custom validator that checks Array.isArray(value) runs against the full array', () => {
    document.body.innerHTML = `
      <form id="array-form">
        <input type="email" name="docusign_email[]" />
        <input type="email" name="docusign_email[]" />
      </form>
    `

    const observed: unknown[] = []
    const api = form('array-form', {
      autoValidate: true,
      validators: {
        'docusign_email[]': {
          validate: ({ value }) => {
            observed.push(value)
            if (!Array.isArray(value)) return 'expected an array'
            return undefined
          }
        }
      }
    })

    // Populate via setValue so the synthetic event reaches the
    // validator pipeline. After the fix, the validator receives the
    // full array — before the fix, it would have received only the
    // first input's value, tripping the `Array.isArray` guard and
    // returning 'expected an array'.
    api.setValue('docusign_email[]', ['a@example.com', 'b@example.com'])

    expect(observed.some(value => Array.isArray(value))).toBe(true)
    expect(api.getState().errors['docusign_email[]']).toBeUndefined()
  })
})
