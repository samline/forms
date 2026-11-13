import * as formatter from '@samline/formatter'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { form } from '../../src/api/form'
import {
  __resetFormatterLoaderForTests,
  __setFormatterModuleForTests,
  type FormatterModule
} from '../../src/core/formatter-loader'

// Uses the real @samline/formatter (>= 3.1.0), not a fixture, so the
// text and slug types are checked end to end through the controller.
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0))

const type = (input: HTMLInputElement, value: string) => {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('format() with formatter 3.1 text and slug types', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="post">
        <input name="title" />
        <input name="slug" />
      </form>
    `
    __resetFormatterLoaderForTests()
    __setFormatterModuleForTests(formatter as unknown as FormatterModule)
  })

  afterEach(() => __resetFormatterLoaderForTests())

  it('applies a casing mode with type text', async () => {
    const api = form('post', {
      formats: {
        title: {
          type: 'text',
          field: 'title',
          options: { case: 'title', smallWords: ['de', 'los'] }
        }
      }
    })
    await flush()

    type(api.getField('title_displayed') as HTMLInputElement, 'el señor de los anillos')
    await flush()

    expect(api.getValue('title_displayed')).toBe('El Señor de los Anillos')
    expect(api.getValue('title')).toBe('El Señor de los Anillos')
  })

  it('keeps a trailing separator while typing and submits the trimmed slug', async () => {
    const api = form('post', {
      formats: {
        slug: { type: 'slug', field: 'slug', options: { replacements: { '&': 'y' } } }
      }
    })
    await flush()

    const visible = api.getField('slug_displayed') as HTMLInputElement
    type(visible, 'Pan & Café ')
    await flush()

    expect(visible.value).toBe('pan-y-cafe-')
    expect(api.getValue('slug')).toBe('pan-y-cafe')
    expect(api.getData().data.slug).toBe('pan-y-cafe')
  })
})
