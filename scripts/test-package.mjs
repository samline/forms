import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import vm from 'node:vm'

const esm = await import('../dist/index.js')
assert.equal(typeof esm.form, 'function')
assert.equal(typeof esm.createFormController, 'function')

const require = createRequire(import.meta.url)
const cjs = require('../dist/index.cjs')
assert.equal(typeof cjs.form, 'function')
assert.equal(typeof cjs.createFormController, 'function')

const browser = await import('../dist/browser/index.js')
assert.equal(typeof browser.default.newForm, 'function')
assert.equal(browser.default.newForm, browser.newForm)

const source = await readFile(
  new URL('../dist/browser/global.global.js', import.meta.url),
  'utf8'
)
const context = {
  clearTimeout,
  console,
  FormData,
  queueMicrotask,
  setTimeout,
  URLSearchParams
}
vm.runInNewContext(source, context)
assert.equal(typeof context.Forms.form, 'function')
assert.equal(typeof context.Forms.newForm, 'function')
assert.equal(typeof context.Forms.destroyForm, 'function')
