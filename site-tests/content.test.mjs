import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { checkContent, README_HEADINGS, DEFAULT_ICONS } from '../site-tools/check-content.mjs'

const project = {
  name: 'Widget',
  npmName: '@example/widget',
  skill: 'widget',
  version: '3.2.1',
  delivery: { cdnScript: 'https://cdn.example.com/widget@3.2.1/global.js' },
}
const skillLink = '<a href="/skills/widget/SKILL.md" download="SKILL.md">Widget skill</a>'
const page = (title, description, body = '') =>
  `<html><head><title>${title}</title><meta name="description" content="${description}"></head><body>${body}${skillLink}</body></html>`
const faq = Array.from({ length: 8 }, () => '<details class="faq-item"></details>').join('')
const skill = `---\nname: widget\ndescription: Integrate @example/widget.\n---\n\n# Widget 3.2.1\n`
const readme = `# @example/widget\n\nTagline.\n\n${README_HEADINGS.map(h => `## ${h}\n\n${h === 'AI agent skill' ? 'skills/widget/SKILL.md' : h === 'License' ? 'MIT — [LICENSE.md](LICENSE.md)' : 'Text.'}\n`).join('\n')}`

const fixture = async (changes = {}) => {
  const root = await mkdtemp(join(tmpdir(), 'package-site-content-'))
  const files = {
    'landing/dist/index.html': page(
      'Widget: accessible widgets for the web',
      'Widget renders accessible, dependency-free widgets for any web page, with one small API.',
      faq
    ),
    'landing/dist/examples/index.html': page(
      'Widget examples: live previews and code',
      'Try live Widget previews for distinct tasks, then copy separate files or one complete document.'
    ),
    'landing/dist/skills/widget/SKILL.md': skill,
    'skills/widget/SKILL.md': skill,
    'landing/src/sections/Features.astro': '<svg><path d="M1 1h2"></path></svg>',
    'README.md': readme,
    'LICENSE.md': 'MIT',
    'AGENTS.md': '# Memory',
    'SITE.md': '# Site',
    'package.json': JSON.stringify({
      name: '@example/widget',
      packageManager: 'npm@11.0.0',
      files: ['dist'],
      scripts: { 'test:package': 'node test.mjs' },
    }),
    ...changes,
  }
  for (const [path, body] of Object.entries(files)) {
    if (body === null) continue
    await mkdir(join(root, path, '..'), { recursive: true })
    await writeFile(join(root, path), body)
  }
  execFileSync('git', ['init', '-q'], { cwd: root })
  execFileSync('git', ['add', 'AGENTS.md'], { cwd: root })
  return root
}
const run = async (changes, options = {}) => {
  const root = await fixture(changes)
  try {
    return await checkContent({ root, project, release: true, ...options })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('a complete adapted site passes every release content check', async () => {
  assert.deepEqual(await run(), [])
})

for (const [name, changes, message] of [
  [
    'a short title',
    {
      'landing/dist/examples/index.html': page(
        'Widget examples.',
        'Try live Widget previews for distinct tasks, then copy separate files or one complete document.'
      ),
    },
    /shorter than 20/,
  ],
  [
    'a short description',
    {
      'landing/dist/examples/index.html': page('Widget examples: live previews', 'Too short.'),
    },
    /meta description has 10/,
  ],
  [
    'duplicate descriptions',
    {
      'landing/dist/examples/index.html': page(
        'Widget examples: live previews and code',
        'Widget renders accessible, dependency-free widgets for any web page, with one small API.'
      ),
    },
    /duplicate description/,
  ],
  [
    'starter copy',
    {
      'landing/dist/examples/index.html': page(
        'Widget examples: live previews and code',
        'Try live Widget previews for distinct tasks, then copy separate files or one complete document.',
        'A working interaction'
      ),
    },
    /template default text remains/,
  ],
  [
    'a default Overview icon',
    { 'landing/src/sections/Features.astro': `<path d="${DEFAULT_ICONS.eye}"></path>` },
    /default "eye" icon/,
  ],
  [
    'a shallow FAQ',
    {
      'landing/dist/index.html': page(
        'Widget: accessible widgets for the web',
        'Widget renders accessible, dependency-free widgets for any web page, with one small API.'
      ),
    },
    /FAQ items/,
  ],
  ['a missing package skill', { 'skills/widget/SKILL.md': null }, /Missing skills\/widget/],
  [
    'the starter skill',
    {
      'skills/widget/SKILL.md': skill + '<!-- package-site:starter-skill -->\n',
      'landing/dist/skills/widget/SKILL.md': skill + '<!-- package-site:starter-skill -->\n',
    },
    /still the starter/,
  ],
  [
    'a link to the adaptation skill',
    {
      'landing/dist/examples/index.html': page(
        'Widget examples: live previews and code',
        'Try live Widget previews for distinct tasks, then copy separate files or one complete document.',
        '<a href="/skills/package-site/SKILL.md">skill</a>'
      ),
    },
    /template adaptation skill/,
  ],
  [
    'README headings out of sibling order',
    { 'README.md': readme.replace('## Capabilities', '## Features') },
    /H2 headings/,
  ],
  ['a bare LICENSE file', { LICENSE: 'MIT' }, /Rename LICENSE/],
  [
    'a merged site postinstall',
    {
      'package.json': JSON.stringify({
        name: '@example/widget',
        packageManager: 'npm@11.0.0',
        files: ['dist'],
        scripts: { 'test:package': 'x', postinstall: 'node site-tools/assets.mjs' },
      }),
    },
    /postinstall/,
  ],
])
  test(`release content checks reject ${name}`, async () => {
    const problems = await run(changes)
    assert.ok(
      problems.some(problem => message.test(problem)),
      problems.join('\n')
    )
  })

test('an explicitly reviewed default icon may stay', async () => {
  const changes = {
    'landing/src/sections/Features.astro': `<path d="${DEFAULT_ICONS.eye}"></path>`,
  }
  assert.deepEqual(await run(changes, { audit: { iconReview: { kept: ['eye'] } } }), [])
})
