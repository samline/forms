import { test, expect } from '@playwright/test'
import { project } from '../shared/lib/project.mjs'

test('package identity and compatibility preserve the shared Hero composition', async ({
  page,
}) => {
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('./')
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => {
        document.documentElement.dataset.theme = theme
      }, theme)
      await expect(page.locator('header .logo-name')).toHaveText(project.npmName)
      await expect(page.locator('.compatibility > a')).toHaveCount(0)
      // The desktop-only line break must not join the description sentences.
      expect(await page.locator('.hero-description').innerText()).not.toMatch(/\S\.[A-Z]/)
      const row = page.locator('.compatibility > div')
      const result = await row.evaluate(el => {
        const style = getComputedStyle(el)
        const boxes = [...el.children].map(child => child.getBoundingClientRect())
        return {
          display: style.display,
          gap: parseFloat(style.columnGap),
          fits: boxes.every(box => box.left >= 0 && box.right <= innerWidth),
          separated: boxes.every(
            (box, i) =>
              i === 0 ||
              Math.abs(box.top - boxes[i - 1].top) > 2 ||
              box.left - boxes[i - 1].right > 10
          ),
        }
      })
      expect(result).toMatchObject({ display: 'flex', fits: true, separated: true })
      expect(result.gap).toBeGreaterThan(16)
      await expect(page.locator('footer').getByRole('link', { name: /^npm(?: |$)/ })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      )
    }
  }
})

test('headers stay on one row and keep their actions visible', async ({ page }) => {
  // Sibling names are short (@samline/formatter is the longest published one).
  // Between 64rem and 75rem GitHub is icon-only and the version badge hides.
  for (const path of ['./', 'examples/', 'docs/'])
    for (const width of [1024, 1100, 1200, 1280, 1440]) {
      await page.setViewportSize({ width, height: 800 })
      await page.goto(path)
      const header = page.locator('package-site-header, package-site-docs-header').first()
      // Verify the actual rendered identity before substituting the longest sibling.
      for (const substitute of [null, '@samline/formatter']) {
        const centers = await header.evaluate((root, substitute) => {
          if (substitute)
            for (const name of root.querySelectorAll('.logo-name')) name.textContent = substitute
          return [...root.querySelectorAll('a, button')]
            .map(item => item.getBoundingClientRect())
            .filter(box => box.width > 0 && box.height > 0)
            .map(box => box.top + box.height / 2)
        }, substitute)
        expect(
          Math.max(...centers) - Math.min(...centers),
          `${path} at ${width}px (${substitute ?? 'configured identity'})`
        ).toBeLessThan(8)
      }
      if (path !== 'docs/') {
        await expect(header.getByRole('link', { name: 'GitHub' })).toBeVisible()
        await expect(header.locator('a.btn').filter({ hasText: 'Get started' })).toBeVisible()
        await expect(
          header.getByRole('navigation').getByRole('link', { name: 'Docs' })
        ).toBeVisible()
      }
    }
})
