import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import vm from 'node:vm'

const helpers = ['createFormController', 'form', 'parseFormData', 'validateFieldValue', 'validateValues']
const functionsOf = api =>
  Object.keys(api)
    .filter(key => typeof api[key] === 'function')
    .sort()

const require = createRequire(import.meta.url)
const esm = await import('../dist/index.js')
const cjs = require('../dist/index.cjs')
for (const api of [esm, cjs]) {
  assert.deepEqual(functionsOf(api), helpers)
  assert.equal(typeof api.browser.newForm, 'function')
  // The pure helpers run without a DOM.
  assert.deepEqual(api.validateValues({ email: '' }, { email: { required: true } }), {
    isValid: false,
    errors: { email: ['This field is required.'] }
  })
}
assert.equal(globalThis.Forms, undefined, 'The root import must not install a global')

const browser = await import('../dist/browser/index.js')
assert.equal(browser.default.newForm, browser.newForm)
assert.equal(typeof globalThis.Forms?.form, 'function', 'The /browser subpath sets globalThis.Forms')

// The standalone build must define exactly the documented global as a classic script.
const source = await readFile(new URL('../dist/browser/global.global.js', import.meta.url), 'utf8')
const context = { clearTimeout, console, FormData, queueMicrotask, setTimeout, URLSearchParams }
vm.runInNewContext(source, context)
assert.deepEqual(Object.keys(context.Forms).sort(), ['available', 'destroyForm', 'form', 'newForm'])

const [packed] = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8' })
)
const paths = new Set(packed.files.map(file => file.path))
const allowed = ['package.json', 'README.md', 'LICENSE.md', 'CHANGELOG.md']
for (const file of [...allowed, 'dist/browser/global.global.js']) {
  assert.ok(paths.has(file), `Missing published file: ${file}`)
}
const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const checkExport = entry => {
  if (typeof entry === 'string') assert.ok(paths.has(entry.replace(/^\.\//, '')), `Missing export: ${entry}`)
  else Object.values(entry).forEach(checkExport)
}
checkExport(manifest.exports)
for (const file of paths) {
  assert.ok(
    file.startsWith('dist/') || allowed.includes(file),
    `Development or website file leaked into npm: ${file}`
  )
}
console.log(`Package smoke test passed: ESM, CommonJS, /browser, IIFE and ${paths.size} npm files.`)
