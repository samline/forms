import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
const root = fileURLToPath(new URL('../', import.meta.url))
const temporary = await mkdtemp(join(tmpdir(), 'package-site-adaptation-'))
const ignored = new Set([
  '.git',
  'coverage',
  'packages',
  'node_modules',
  'dist',
  '.astro',
  'test-results',
  'playwright-report',
])
try {
  await cp(root, temporary, { recursive: true, filter: path => !ignored.has(basename(path)) })
  await symlink(join(root, 'node_modules'), join(temporary, 'node_modules'), 'dir')
  for (const app of ['landing', 'docs', 'shared']) {
    if (existsSync(join(root, app, 'node_modules'))) {
      await symlink(join(root, app, 'node_modules'), join(temporary, app, 'node_modules'), 'dir')
    }
  }
  // Exercise the documented importer against an invented package, then make the
  // editorial name change a maintainer would make after reviewing the import.
  const fixture = join(temporary, '.fixture-package')
  const manifest = JSON.stringify({
    name: '@example/widget',
    version: '3.2.1',
    description:
      'A separate package used only to verify that the website adapts its identity, metadata and links.',
    author: { name: 'Example maintainers' },
    license: 'MIT',
    repository: { url: 'git+https://github.com/example/widget.git' },
    exports: { '.': './dist/index.js' },
    scripts: { prepare: 'exit 1' },
  })
  await mkdir(join(fixture, 'src'), { recursive: true })
  await writeFile(join(fixture, 'package.json'), manifest)
  await writeFile(join(fixture, 'README.md'), '# Widget\n')
  await writeFile(join(fixture, 'src/index.ts'), 'export const widget = () => 1\n')
  execFileSync(
    process.execPath,
    [
      join(temporary, 'site-tools/configure.mjs'),
      '--package',
      fixture,
      '--site-url',
      'https://example.com/',
      '--accent-light',
      '#245778',
      '--accent-dark',
      '#9ccfe8',
      '--cdn-script',
      'https://cdn.example.com/widget@3.2.1/global.js',
      '--cdn-stylesheet',
      'https://cdn.example.com/widget@3.2.1/style.css',
      // The copy is the adapted Forms site: overwrite its configuration on purpose.
      '--force',
    ],
    { cwd: temporary, stdio: 'pipe' }
  )
  assert.equal(await readFile(join(fixture, 'package.json'), 'utf8'), manifest)
  const audit = JSON.parse(await readFile(join(temporary, 'content-audit.json'), 'utf8'))
  assert.deepEqual(audit.sources.map(item => item.source).sort(), [
    'README.md',
    'package.json',
    'src/index.ts',
  ])
  assert.equal(audit.themeReview.status, 'pending')
  const config = JSON.parse(await readFile(join(temporary, 'project.config.json'), 'utf8'))
  assert.equal(config.package.npmName, '@example/widget')
  assert.equal(config.site.repository, 'https://github.com/example/widget')
  assert.equal(config.site.template, true)
  config.package.name = 'Example widget'
  config.dev = { landingPort: 4350, docsPort: 4351, testPort: 4358 }
  await rm(fixture, { recursive: true, force: true })
  // The importer scaffolds the package skill from the starter template.
  const skill = await readFile(join(temporary, 'skills/widget/SKILL.md'), 'utf8')
  assert.ok(skill.startsWith('---\nname: widget\n') && skill.includes('@example/widget'))
  // A retired route from a former docs site must keep working after assembly.
  await writeFile(
    join(temporary, 'site-tools/doc-migration.json'),
    JSON.stringify({
      source: null,
      pages: [],
      redirects: { 'guide/options': 'reference/configuration' },
    })
  )
  const { checkContent } = await import(join(temporary, 'site-tools/check-content.mjs'))
  for (const base of ['/', '/tools/widget/']) {
    config.site.url = 'https://example.com' + base
    await writeFile(join(temporary, 'project.config.json'), JSON.stringify(config))
    execFileSync('npm', ['run', 'site:build'], { cwd: temporary, stdio: 'pipe' })
    for (const route of [
      'index.html',
      'examples/index.html',
      'docs/index.html',
      'docs/getting-started/index.html',
    ]) {
      const html = await readFile(join(temporary, 'landing/dist', route), 'utf8')
      assert.ok(html.includes('Example widget'), route + ' must use the new name')
      assert.ok(
        html.includes('#245778') && html.includes('#9ccfe8'),
        route + ' must use both configured accents'
      )
      assert.ok(
        html.includes('https://example.com' + base),
        route + ' must use the configured public URL'
      )
      assert.ok(
        !html.includes('samline.github.io/package-landing-docs'),
        route + ' retained the old deployment URL'
      )
    }
    const install = await readFile(
      join(temporary, 'landing/dist/docs/getting-started/index.html'),
      'utf8'
    )
    assert.ok(
      install.includes('HTML / CDN') && install.includes('cdn.example.com/widget@3.2.1/global.js'),
      'Configured CDN must be shown'
    )
    assert.ok(
      (await readFile(join(temporary, 'landing/dist/favicon.svg'), 'utf8')).includes('#9ccfe8'),
      'Favicon must follow the accent'
    )
    const home = await readFile(join(temporary, 'landing/dist/index.html'), 'utf8')
    assert.ok(
      home.includes(`href="${base}skills/widget/SKILL.md"`) &&
        home.includes('Example widget skill for AI agents'),
      'Footer must link the scaffolded package skill'
    )
    assert.equal(
      await readFile(join(temporary, 'landing/dist/skills/widget/SKILL.md'), 'utf8'),
      skill,
      'The skill endpoint must serve skills/widget/SKILL.md unchanged'
    )
    const examples = await readFile(join(temporary, 'landing/dist/examples/index.html'), 'utf8')
    assert.ok(
      examples.includes('HTML / CDN') && examples.includes('Package / ESM'),
      'A configured CDN adds the HTML / CDN loading mode beside Package / ESM'
    )
    const redirect = await readFile(
      join(temporary, 'landing/dist/guide/options/index.html'),
      'utf8'
    )
    assert.ok(redirect.includes(`url=${base}docs/reference/configuration/`), 'Redirect target')
    const { resolveProject } = await import(join(temporary, 'shared/lib/project.mjs'))
    const problems = await checkContent({
      root: temporary,
      project: resolveProject(config),
      release: false,
    })
    // The sentinels that prove starter strings/icons still render belong to the
    // canonical template; this copy renders the adapted Forms content instead.
    assert.deepEqual(
      problems.filter(problem => !problem.includes(' is stale')),
      [],
      'Template-mode content checks on the alternate package'
    )
    const png = await readFile(join(temporary, 'landing/dist/social.png'))
    assert.equal(png.subarray(1, 4).toString(), 'PNG')
    console.log(`Alternate package build and all local links verified at ${base}`)
  }
} finally {
  await rm(temporary, { recursive: true, force: true })
}
