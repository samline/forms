import { test, expect } from '@playwright/test'
import { readFile, readdir } from 'node:fs/promises'
import { codeColors } from '../shared/testing/code-colors'
import { project } from '../shared/lib/project.mjs'
import {
  scenarios,
  presetIds,
  homePresets,
  demoModes,
  type DemoPreset,
  type Scenario,
} from '../shared/i18n/translations/en/demo'
import { localBuilds } from './demo-builds'
import { readBuild, routeExample } from './demo-routing'
import type { Locator, Page } from '@playwright/test'
const articles = (
  await readdir(new URL('../docs/src/content/docs/', import.meta.url), { recursive: true })
)
  .filter(path => /\.mdx?$/.test(path))
  .map(
    path =>
      'docs/' +
      path
        .replace(/\.mdx?$/, '')
        .replace(/(^|\/)index$/, '$1')
        .replace(/\/$/, '') +
      '/'
  )
const paths = [
  ...new Set([
    '',
    'examples/',
    'docs/',
    'docs/changelog/',
    ...articles.map(path => path.replace('docs//', 'docs/')),
  ]),
]
test('all routes share readable metadata and fit both themes and enlarged mobile text', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const path of paths) {
    await page.goto(path || './')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('meta[charset]')).toHaveCount(1)
    await expect(page.locator('meta[name=viewport]')).toHaveCount(1)
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      new URL(path, project.url).href
    )
    // Parametrized from project.config.json: starter mode is noindex, an adapted site indexes.
    await expect(page.locator('meta[name=robots]')).toHaveAttribute(
      'content',
      project.template ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'
    )
    for (const width of [320, 768, 1440, 320]) {
      await page.setViewportSize({ width, height: 900 })
      for (const theme of ['light', 'dark']) {
        await page.evaluate(theme => {
          document.documentElement.dataset.theme = theme
        }, theme)
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${path} ${width} ${theme}`
        ).toBe(true)
      }
    }
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `${path} enlarged: ${JSON.stringify(
        await page.evaluate(() =>
          [...document.querySelectorAll('body *')]
            .filter(el => {
              let p = el.parentElement
              while (p && p !== document.body) {
                if (['hidden', 'clip', 'auto', 'scroll'].includes(getComputedStyle(p).overflowX))
                  return false
                p = p.parentElement
              }
              const r = el.getBoundingClientRect()
              return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1)
            })
            .slice(0, 12)
            .map(el => ({
              tag: el.tagName,
              class: el.className,
              text: el.textContent?.slice(0, 55),
              right: el.getBoundingClientRect().right,
            }))
        )
      )}`
    ).toBe(true)
  }
})
test('Home, Examples and Docs share the title font pairing and actual preview', async ({
  page,
}) => {
  for (const path of ['', 'examples/', 'docs/getting-started/']) {
    await page.goto(path || './')
    const styles = await page.locator('h1').evaluate(el => ({
      primary: getComputedStyle(el).fontFamily,
      weight: getComputedStyle(el).fontWeight,
      accent: getComputedStyle(el.querySelector('.serif')!).fontFamily,
      style: getComputedStyle(el.querySelector('.serif')!).fontStyle,
    }))
    expect(styles.primary).toContain('Inter')
    expect(styles.weight).toBe('500')
    expect(styles.accent).toContain('Instrument Serif')
    expect(styles.style).toBe('italic')
  }
  // Every scenario's live preview obeys the catalog contract on all three routes:
  // a sample changes the readouts, Reset restores the initial state.
  for (const path of ['', 'examples/', 'docs/guides/examples/']) {
    await page.goto(path || './')
    for (const preset of presetIds) {
      const item = scenarios[preset]
      if (!path && !(homePresets as readonly string[]).includes(preset)) continue
      const demo = page.locator(`package-site-demo[data-preset="${preset}"]`).first()
      if (!path)
        await page.locator('#demo').getByRole('tab', { name: item.tab, exact: true }).click()
      await expect(demo).toBeVisible()
      const read = () =>
        demo.locator('output[data-readout]').evaluateAll(els => els.map(el => el.textContent))
      await expect.poll(read).not.toContain(null)
      const initial = await read()
      await demo.getByRole('button', { name: item.samples[0].label, exact: true }).click()
      await expect.poll(read).not.toEqual(initial)
      await demo.getByRole('button', { name: 'Reset', exact: true }).click()
      await expect.poll(read).toEqual(initial)
    }
  }
})
const codeFor = async (page: Page, preset: DemoPreset, mode: string) => {
  const root = page.locator(
    `[data-demo-code="${preset}"] [data-panel="${mode}"], [data-demo-code="${preset}"] [data-mode="${mode}"]`
  )
  const files: Record<string, string> = {}
  for (const id of ['html', 'css', 'javascript', 'complete'])
    files[id] = (await root.locator(`[data-code-files] [data-panel="${id}"] code`).textContent())!
  return files
}
test('file tabs copy exact highlighted source and feedback resets independently', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('examples/')
  const section = page.locator(`#${presetIds[0]}`)
  await section.getByText('Explore the code', { exact: true }).click()
  const viewer = section.locator('[data-code-files]:visible').first()
  for (const label of ['HTML', 'CSS', 'JavaScript', 'Complete file']) {
    await viewer.getByRole('tab', { name: label, exact: true }).click()
    const panel = viewer.getByRole('tabpanel', { name: label, exact: true })
    const text = await panel.locator('code').textContent()
    expect(await panel.locator('code span[style]').count()).toBeGreaterThan(2)
    const copy = panel.getByRole('button')
    await copy.click()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text)
    await expect(copy).toContainText('Copied!')
    await expect(copy).toContainText('Copy', { timeout: 4000 })
  }
})
test("every scenario's copied files and complete document run in each loading mode", async ({
  page,
  context,
}) => {
  test.setTimeout(240000)
  const builds = {
    cdnScript: project.delivery.cdnScript,
    npmName: project.npmName,
    iife: localBuilds.iife ? await readBuild(localBuilds.iife, 'iife') : null,
    esm: localBuilds.esm ? await readBuild(localBuilds.esm, 'esm') : null,
  }
  await page.goto('examples/')
  for (const preset of presetIds) {
    const item: Scenario = scenarios[preset]
    // Expected readouts come from the live preview, sample by sample.
    const live = page.locator(`#${preset} package-site-demo`)
    const read = (root: Locator) =>
      root.locator('output[data-readout]').evaluateAll(els => els.map(el => el.textContent ?? ''))
    const expected: string[][] = []
    for (const sample of item.samples) {
      await live.getByRole('button', { name: sample.label, exact: true }).click()
      await page.waitForTimeout(item.behavior === 'username' ? 900 : 500)
      expected.push(await read(live))
    }
    await live.getByRole('button', { name: 'Reset', exact: true }).click()
    for (const mode of demoModes) {
      const files = await codeFor(page, preset, mode)
      const example = await context.newPage()
      const errors: string[] = []
      example.on('pageerror', error => errors.push(error.message))
      await routeExample(example, files, builds)
      // Navigate (never setContent) so each document gets fresh globals.
      for (const document of ['index.html', 'complete/index.html']) {
        for (const [index, sample] of item.samples.entries()) {
          await example.goto(`https://example.test/${document}`)
          await example.waitForTimeout(150)
          const main = example.locator('main')
          for (const [name, value] of Object.entries(sample.values)) {
            const field = item.fields.find(candidate => candidate.name === name)!
            const optionLabel = (option: string) =>
              field.options!.find(([key]) => key === option)![1]
            if (field.type === 'checkboxes' || field.type === 'radios') {
              for (const option of [value].flat())
                await main.getByLabel(optionLabel(option), { exact: true }).check()
            } else if (field.type === 'checkbox') {
              await main.getByLabel(field.options![0]![1], { exact: true }).check()
            } else if (field.type === 'multiselect') {
              await main
                .getByLabel(field.label, { exact: true })
                .selectOption([value].flat().map(option => ({ label: optionLabel(option) })))
            } else if (field.type === 'select') {
              await main.getByLabel(field.label, { exact: true }).selectOption(String(value))
            } else {
              await main.getByLabel(field.label, { exact: true }).fill(String(value))
            }
          }
          const action = item.actions?.find(candidate => candidate.hook === sample.press)
          if (action) await main.getByRole('button', { name: action.label, exact: true }).click()
          else if (sample.submit) await main.getByRole('button', { name: item.submit }).click()
          await expect
            .poll(() => read(main), { message: `${preset} ${mode} ${document} ${sample.label}` })
            .toEqual(expected[index])
        }
        // A real departure destroys the controller: later input changes nothing.
        const before = await read(example.locator('main'))
        await example.evaluate(() =>
          window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }))
        )
        const text = item.fields.find(
          field =>
            ['text', 'email', 'password', 'tel', 'search', 'textarea', 'repeated'].includes(
              field.type
            ) && (field.step ?? 0) === 0
        )
        const input = text && example.locator('main').getByLabel(text.label, { exact: true })
        if (input && (await input.isVisible())) await input.fill('zz')
        await example.waitForTimeout(400)
        expect(await read(example.locator('main'))).toEqual(before)
      }
      expect(errors, `${preset} ${mode}`).toEqual([])
      await example.close()
    }
  }
})
test('every native select uses the shared Select styling', async ({ page }) => {
  let total = 0
  for (const path of paths) {
    await page.goto(path || './')
    const styles = await page.locator('select').evaluateAll(els =>
      els.map(el => ({
        cursor: getComputedStyle(el).cursor,
        appearance: getComputedStyle(el).appearance,
      }))
    )
    total += styles.length
    for (const style of styles)
      expect(style, path).toEqual({ cursor: 'pointer', appearance: 'none' })
  }
  expect(total).toBeGreaterThan(0)
})
test('the package skill downloads unchanged from the footer and Examples', async ({
  page,
  request,
}) => {
  const source = await readFile(
    new URL(`../skills/${project.skill}/SKILL.md`, import.meta.url),
    'utf8'
  )
  for (const [path, scope] of [
    ['./', 'footer'],
    ['examples/', '.resources'],
  ]) {
    await page.goto(path)
    const link = page.locator(`${scope} a[download="SKILL.md"]`)
    await expect(link).toHaveAttribute('href', `${project.base}skills/${project.skill}/SKILL.md`)
    const response = await request.get(new URL(await link.getAttribute('href')!, page.url()).href)
    expect(response.ok()).toBe(true)
    expect(await response.text()).toBe(source)
  }
})
test('production Pagefind search returns meaningful links in a compact top drawer', async ({
  page,
}) => {
  await page.goto('docs/')
  await page.getByRole('button', { name: 'Search documentation', exact: true }).click()
  const input = page.getByRole('searchbox')
  await input.fill('configuration')
  await expect(page.getByRole('link', { name: /Configuration/ }).last()).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(input).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Search documentation', exact: true })
  ).toBeFocused()
})
test('mobile menu closes without moving the background and keeps docs last', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./#how')
  const before = await page.evaluate(() => scrollY)
  const trigger = page.getByRole('button', { name: 'Open navigation menu' })
  await trigger.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const links = page.getByRole('navigation', { name: 'Mobile navigation' }).locator('.menu-link')
  await expect(links.last()).toHaveText(/Docs/)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThanOrEqual(1)
})
test('no JavaScript preserves content, code, alternative installs and mobile navigation', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 900 },
  })
  const page = await context.newPage()
  await page.goto(new URL(project.base, test.info().project.use.baseURL as string).href)
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('code').filter({ hasText: 'pnpm add' })).toBeVisible()
  await page.locator('.menu-fallback summary').click()
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible()
  await context.close()
})
test('all pages pass automated accessibility checks in both themes', async ({ page }) => {
  test.setTimeout(120000)
  const axe = await readFile(
    new URL('../node_modules/axe-core/axe.min.js', import.meta.url),
    'utf8'
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const path of paths) {
    await page.goto(path || './')
    await page.addScriptTag({ content: axe })
    for (const theme of ['dark', 'light']) {
      await page.evaluate(async theme => {
        document.documentElement.dataset.theme = theme
        await document.fonts.ready
        await Promise.all(document.getAnimations().map(a => a.finished.catch(() => {})))
      }, theme)
      const violations = await page.evaluate(async () => {
        const result = await (window as any).axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] },
        })
        return result.violations.map((item: any) => ({
          id: item.id,
          nodes: item.nodes.map((n: any) => n.target),
        }))
      })
      expect(violations, `${path} ${theme}`).toEqual([])
    }
  }
})

test('highlighting has the same computed palette across all three routes', async ({ page }) => {
  for (const theme of ['dark', 'light']) {
    let reference: unknown
    for (const path of ['', 'examples/', 'docs/getting-started/']) {
      await page.goto(path || './')
      await page.evaluate(theme => {
        document.documentElement.dataset.theme = theme
      }, theme)
      if (path === 'examples/')
        await page
          .locator(`#${presetIds[0]}`)
          .getByText('Explore the code', { exact: true })
          .click()
      const code =
        path === 'examples/'
          ? page.locator('[data-code-files] pre[data-language=html]:visible').first()
          : path
            ? page.locator('main pre[data-language=html]:visible').first()
            : page.locator('#how pre[data-language=html]:visible').first()
      const colors = await code.evaluate(codeColors)
      for (const token of Object.values(colors)) expect(token.actual).toBe(token.expected)
      if (reference) expect(colors).toEqual(reference)
      else reference = colors
    }
  }
})
test('ToC follows the clicked section and anchors retain the 2.5rem header gap', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 500 })
  await page.goto('docs/getting-started/')
  const nav = page.locator('.desktop-toc').getByRole('navigation', { name: 'On this page' })
  const target = nav.getByRole('link', { name: 'Your first form', exact: true })
  await target.click()
  await expect(target).toHaveAttribute('aria-current', 'location')
  const spacing = await page.locator('#your-first-form').evaluate(el => ({
    gap:
      el.getBoundingClientRect().top -
      document.querySelector('package-site-docs-header')!.getBoundingClientRect().bottom,
    expected: parseFloat(getComputedStyle(document.documentElement).fontSize) * 2.5,
  }))
  expect(Math.abs(spacing.gap - spacing.expected)).toBeLessThan(2)
})
