import { test, expect } from '@playwright/test'

test('compact Home initialization links to the actual complete starter files', async ({ page }) => {
  await page.goto('./')
  const card = page.locator('#how article').last()
  expect(await card.locator('code').textContent()).not.toContain('<!doctype')
  await card.getByRole('link', { name: 'Copy complete working files' }).click()
  // HTML / CDN and Package / ESM each render a viewer; the inactive one is hidden.
  await expect(page.locator('[data-code-files]:visible').first()).toBeVisible()
  await page.getByRole('tab', { name: 'Complete file', exact: true }).click()
  await expect(page.getByRole('tabpanel', { name: 'Complete file', exact: true })).toContainText(
    '<!doctype html>'
  )
})
