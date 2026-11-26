import { expect, test } from './fixtures'

const markup = `
  <form id="signup" novalidate>
    <label>Email <input name="email" type="email"></label>
    <label>Name <input name="name"></label>
    <button type="submit">Send</button>
  </form>
`

test('the CDN bundle exposes window.Forms with exactly the documented API', async ({ load }) => {
  const page = await load(markup, 'forms')
  expect(await page.evaluate(() => Object.keys((window as any).Forms).sort())).toEqual([
    'available',
    'destroyForm',
    'form',
    'newForm',
  ])
})

test('a failed submit marks invalid fields and focuses the first one in document order', async ({
  load,
}) => {
  const page = await load(markup, 'forms')
  await page.evaluate(() => {
    ;(window as any).submitted = 0
    const controller = (window as any).Forms.form('signup', {
      validators: {
        email: { required: true, pattern: { value: /@/, message: 'Enter an email.' } },
        name: { required: true },
      },
    })
    controller.onSubmit(() => {
      ;(window as any).submitted += 1
    })
  })
  await page.getByRole('button', { name: 'Send' }).click()
  const email = page.getByLabel('Email')
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toHaveAttribute('css-error', '')
  await expect(email).toBeFocused()
  expect(await page.evaluate(() => (window as any).submitted)).toBe(0)

  await email.fill('ana@example.com')
  await page.getByLabel('Name').fill('Ana')
  await expect(email).not.toHaveAttribute('aria-invalid', 'true')
  await expect(email).toHaveAttribute('css-filled', '')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect.poll(() => page.evaluate(() => (window as any).submitted)).toBe(1)
})

test('the bundled formatter formats input in the classic script', async ({ load }) => {
  const page = await load(
    '<form id="price"><input name="amount" aria-label="Amount"></form>',
    'forms'
  )
  await page.evaluate(() =>
    (window as any).Forms.form('price').format({ type: 'numeral', field: 'amount' })
  )
  await page.getByLabel('Amount').pressSequentially('1234567')
  await expect(page.getByLabel('Amount')).toHaveValue('1,234,567')
  await expect(page.locator('input[type="hidden"][name="amount"]')).toHaveValue('1234567')
})

test('the bundled formatter 3.3.0 transliterates slugs with charMap', async ({ load }) => {
  const page = await load(`<form id="post"><label>Slug <input name="slug"></label></form>`, 'forms')
  await page.evaluate(() =>
    (window as any).Forms.form('post').format({
      type: 'slug',
      field: 'slug',
      options: { charMap: 'cyrillic', preserve: '.' },
    })
  )
  await page.getByLabel('Slug').pressSequentially('Привет v1.2')
  await expect(page.getByLabel('Slug')).toHaveValue('privet-v1.2')
  await expect(page.locator('input[type="hidden"][name="slug"]')).toHaveValue('privet-v1.2')
})

test('a server error with no matching control never locks the form', async ({ load }) => {
  const page = await load(markup, 'forms')
  await page.evaluate(() => {
    ;(window as any).attempts = 0
    const controller = (window as any).Forms.form('signup')
    controller.onSubmit(async () => {
      ;(window as any).attempts += 1
      await Promise.resolve()
      controller.setErrors({ non_field_errors: ['Wrong email or password.'] })
    })
    ;(window as any).controller = controller
  })
  await page.getByLabel('Email').fill('ana@example.com')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect
    .poll(() => page.evaluate(() => (window as any).controller.getState().errors))
    .toEqual({ non_field_errors: ['Wrong email or password.'] })

  await page.getByRole('button', { name: 'Send' }).click()
  await expect.poll(() => page.evaluate(() => (window as any).attempts)).toBe(2)
})

test('a server error on a field blocks until that field is edited', async ({ load }) => {
  const page = await load(markup, 'forms')
  await page.evaluate(() => {
    ;(window as any).attempts = 0
    const controller = (window as any).Forms.form('signup')
    controller.onSubmit(() => {
      ;(window as any).attempts += 1
      if ((window as any).attempts === 1) controller.setErrors({ email: ['Already in use.'] })
    })
  })
  const email = page.getByLabel('Email')
  await email.fill('ana@example.com')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(email).toHaveAttribute('aria-invalid', 'true')

  await page.getByLabel('Name').fill('Ana')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(email).toBeFocused()
  expect(await page.evaluate(() => (window as any).attempts)).toBe(1)

  await email.fill('ana+2@example.com')
  await expect(email).not.toHaveAttribute('aria-invalid', 'true')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect.poll(() => page.evaluate(() => (window as any).attempts)).toBe(2)
})
