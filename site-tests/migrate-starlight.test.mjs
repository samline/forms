import test from 'node:test'
import assert from 'node:assert/strict'
import { convertStarlight, resolveLink } from '../site-tools/migrate-starlight.mjs'

const routes = {
  index: 'index',
  'guides/install': 'getting-started',
  'guides/options': 'reference/configuration',
  'reference/api': 'reference/api',
}
const page = {
  source: 'guides/install.mdx',
  destination: 'getting-started',
  title: 'Install the package',
  titleAccent: 'the package',
  group: 'start',
  order: 2,
}

test('links resolve against the source parent directory and become base-independent', () => {
  const context = { source: 'guides/install.mdx', destination: 'getting-started', routes }
  assert.equal(resolveLink('./options', context), '../reference/configuration/')
  assert.equal(resolveLink('options.mdx#defaults', context), '../reference/configuration/#defaults')
  assert.equal(resolveLink('../reference/api/', context), '../reference/api/')
  assert.equal(resolveLink('/', context), '../')
  assert.equal(resolveLink('https://example.com/', context), 'https://example.com/')
  assert.equal(resolveLink('#local', context), '#local')
  assert.equal(resolveLink('./missing', context), null)
})

test('asides, tabs, imports and frontmatter convert to shared components', () => {
  const source = `---
title: Install
description: Install the package with npm, pnpm or bun and add it to a page in a minute or two.
sidebar:
  order: 1
---
import { Tabs, TabItem } from '@astrojs/starlight/components';

:::tip[Before you start]
Read the [options](./options#defaults).
:::

<Tabs syncKey="pkg">
  <TabItem label="npm">
    \`\`\`sh
    npm install widget
    \`\`\`
  </TabItem>
  <TabItem label="pnpm">
    \`\`\`sh
    pnpm add widget
    \`\`\`
  </TabItem>
</Tabs>

:::note
See [the API](../reference/api/) and [a missing page](./gone).
:::
`
  const { mdx, unresolved } = convertStarlight(source, page, routes)
  assert.match(
    mdx,
    /^---\nlocale: en\nsidebar:\n {2}group: start\n {2}order: 2\ntitle: 'Install the package'\ntitleAccent: 'the package'\n/
  )
  assert.ok(mdx.includes("import Callout from '../../../../shared/components/Callout.astro'"))
  assert.ok(mdx.includes("import TabPanel from '../../../../shared/components/TabPanel.astro'"))
  assert.ok(!mdx.includes('@astrojs/starlight'))
  assert.ok(mdx.includes("<Callout title='Before you start'>"))
  assert.ok(mdx.includes("<Callout title='Note'>"))
  assert.ok(mdx.includes('[options](../reference/configuration/#defaults)'))
  assert.ok(mdx.includes('[the API](../reference/api/)'))
  assert.ok(mdx.includes("<Tabs id='getting-started-tabs-1' label='pkg'"))
  assert.ok(
    mdx.includes("<TabPanel id='pnpm' label='pnpm'>\n\n```sh\npnpm add widget\n```\n\n</TabPanel>")
  )
  assert.deepEqual(unresolved, ['./gone'])
})

test('title accents must be chosen by hand', () => {
  for (const titleAccent of [undefined, 'Install the package', 'missing'])
    assert.throws(() => convertStarlight('---\ntitle: x\n---\n', { ...page, titleAccent }, routes))
})
