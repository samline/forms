import { test, expect } from '@playwright/test'
import { routeExample, type CopiedFiles } from './demo-routing'

// Exercises the HTML / CDN and Package / ESM substitution that adapted packages
// rely on, with simulated builds: the neutral template scenarios need no package.
const cdnScript = 'https://cdn.example.test/fixture@1.0.0/global.js'
const npmName = '@fixture/package'
const iife = 'var Fixture = (() => ({ shout: value => value.toUpperCase() + "!" }))()'
// A default export plus globalName produced this shape in Formatter 2.0.x.
const brokenIife = 'var Fixture = (() => ({ default: { shout: value => value } }))()'
const esm = 'export const shout = value => value.toUpperCase() + "!"'
const markup = '<main><output data-result></output></main>'
const behavior = "document.querySelector('[data-result]').value = shout('ready')"
const documentFor = (head: string, body: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Fixture</title>${head}</head><body>${markup}${body}</body></html>`
const modes: Record<'cdn' | 'esm', CopiedFiles> = {
  cdn: {
    html: documentFor(
      '',
      `<script src="${cdnScript}"></script><script src="./main.js" defer></script>`
    ),
    css: '',
    javascript: `const { shout } = window.Fixture\n${behavior}`,
    complete: documentFor(
      '',
      `<script src="${cdnScript}"></script><script>const { shout } = window.Fixture\n${behavior}</script>`
    ),
  },
  esm: {
    html: documentFor('', '<script type="module" src="./main.js"></script>'),
    css: '',
    javascript: `import { shout } from '${npmName}'\n${behavior}`,
    complete: documentFor(
      '',
      `<script type="module">import { shout } from '${npmName}'\n${behavior}</script>`
    ),
  },
}

for (const mode of ['cdn', 'esm'] as const)
  test(`copied ${mode} files run against the local package build`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await routeExample(page, modes[mode], { cdnScript, npmName, iife, esm })
    for (const document of ['index.html', 'complete/index.html']) {
      await page.goto(`https://example.test/${document}`)
      await expect(page.locator('[data-result]')).toHaveText('READY!')
    }
    expect(errors).toEqual([])
  })

test('a broken standalone global fails the copied CDN files', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await routeExample(page, modes.cdn, { cdnScript, npmName, iife: brokenIife, esm })
  await page.goto('https://example.test/index.html')
  await expect.poll(() => errors.length).toBeGreaterThan(0)
  await expect(page.locator('[data-result]')).toHaveText('')
})
