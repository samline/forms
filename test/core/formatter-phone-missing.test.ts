import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@samline/formatter/phone', () => {
  throw new Error('not installed')
})

import {
  __resetFormatterLoaderForTests,
  __setFormatterModuleForTests,
  loadFormatter,
  type FormatterModule
} from '../../src/core/formatter-loader'

afterEach(() => {
  __resetFormatterLoaderForTests()
})

describe('formatter 3 phone opt-in without the phone subpath', () => {
  it('reports the problem and returns null so the field is left untouched', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const modern: FormatterModule = {
      format: value => ({ formatted: String(value), raw: String(value), type: 'phone' }),
      isPhoneRegistered: () => false
    }
    __setFormatterModuleForTests(modern)

    await expect(loadFormatter({ phone: true })).resolves.toBeNull()
    expect(error).toHaveBeenCalledWith(expect.stringContaining('@samline/formatter/phone'))
  })
})
