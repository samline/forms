import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { prepareConfiguration } from '../site-tools/configure.mjs'
import config from '../project.config.json' with { type: 'json' }
test('configuration inventories real evidence and never executes or modifies source scripts', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'package-site-input-'))
  try {
    const manifest = {
      name: '@example/widget',
      version: '3.2.1',
      description: 'A real package fixture.',
      author: { name: 'Maintainer' },
      license: 'MIT',
      homepage: 'https://example.com/widget/',
      repository: { url: 'git+https://github.com/example/widget.git' },
      exports: { '.': { import: './dist/index.js', types: './dist/index.d.ts' } },
      scripts: { prepare: 'this must never run' },
    }
    const source = JSON.stringify(manifest)
    await writeFile(join(directory, 'package.json'), source)
    await writeFile(join(directory, 'README.md'), '# Evidence\n')
    await mkdir(join(directory, 'src'))
    await writeFile(join(directory, 'src/index.ts'), 'export const widget = () => 1\n')
    await mkdir(join(directory, 'node_modules'))
    await writeFile(join(directory, 'node_modules/README.md'), 'Ignore dependency docs')
    const result = await prepareConfiguration(directory, config)
    assert.equal(result.config.package.npmName, manifest.name)
    assert.equal(result.config.site.url, manifest.homepage)
    assert.equal(result.config.site.repository, 'https://github.com/example/widget')
    assert.deepEqual(result.context.exports, manifest.exports)
    assert.deepEqual(result.audit.sources.map(s => s.source).sort(), [
      'README.md',
      'package.json',
      'src/index.ts',
    ])
    assert.ok(
      result.audit.sources.every(
        s => s.sha256.length === 64 && s.reviewed === false && s.destination === null
      )
    )
    assert.equal(await readFile(join(directory, 'package.json'), 'utf8'), source)
    await mkdir(join(directory, 'example/src/content/docs'), { recursive: true })
    await writeFile(
      join(directory, 'example/src/content/docs/installation.mdx'),
      '# Original installation\n'
    )
    const withLegacy = await prepareConfiguration(directory, config)
    assert.ok(
      withLegacy.audit.sources.some(
        item => item.source === 'example/src/content/docs/installation.mdx'
      )
    )
    assert.equal(withLegacy.audit.capabilityReview.status, 'pending')
    // Exercise writes only in a fresh isolated copy, never in this template or package.
    const isolated = join(directory, 'website')
    await mkdir(join(isolated, 'scripts'), { recursive: true })
    await mkdir(join(isolated, 'shared/lib'), { recursive: true })
    for (const path of [
      'site-tools/configure.mjs',
      'shared/lib/project.mjs',
      'site-tools/package-skill-template.md',
    ]) {
      await mkdir(join(isolated, path, '..'), { recursive: true })
      await cp(new URL('../' + path, import.meta.url), join(isolated, path))
    }
    // The importer refuses a customized site, so start from a starter copy even
    // when this checkout's own project.config.json is already adapted.
    await writeFile(
      join(isolated, 'project.config.json'),
      JSON.stringify({ ...config, site: { ...config.site, template: true } })
    )
    execFileSync(process.execPath, [
      join(isolated, 'site-tools/configure.mjs'),
      '--package',
      directory,
      '--site-url',
      'https://example.com/widget/',
    ])
    const imported = JSON.parse(await readFile(join(isolated, 'project.config.json'), 'utf8'))
    assert.equal(imported.package.version, '3.2.1')
    assert.equal(imported.site.template, true)
    assert.equal(await readFile(join(isolated, 'brief/source-readme.md'), 'utf8'), '# Evidence\n')
    const skill = await readFile(join(isolated, 'skills/widget/SKILL.md'), 'utf8')
    assert.match(skill, /^---\nname: widget\n/)
    assert.ok(
      skill.includes("package: '@example/widget'") && skill.includes('package-site:starter-skill')
    )
    assert.equal(await readFile(join(directory, 'package.json'), 'utf8'), source)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('an embedded site is not inventoried as package evidence', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'package-site-embedded-'))
  try {
    const files = {
      'package.json': JSON.stringify({
        name: 'embedded',
        version: '1.0.0',
        homepage: 'https://example.com/embedded/',
        repository: 'https://github.com/example/embedded',
      }),
      'README.md': '# Embedded\n',
      'src/index.ts': 'export const run = () => 1\n',
      'project.config.json': '{}',
      'content-audit.json': '{}',
      'shared/lib/project.mjs': 'export {}\n',
      'shared/README.md': '# Theme\n',
      'landing/README.md': '# Landing\n',
      'docs/astro.config.mjs': 'export default {}\n',
      'docs/src/content/docs/index.mdx': '# Site docs\n',
      'site-tools/configure.mjs': 'export {}\n',
    }
    for (const [path, body] of Object.entries(files)) {
      await mkdir(join(directory, path, '..'), { recursive: true })
      await writeFile(join(directory, path), body)
    }
    const result = await prepareConfiguration(directory, config)
    assert.deepEqual(result.audit.sources.map(s => s.source).sort(), [
      'README.md',
      'package.json',
      'src/index.ts',
    ])
    // Without the embedded site marker, a package's own docs/ remains evidence.
    await rm(join(directory, 'shared'), { recursive: true })
    await rm(join(directory, 'docs/astro.config.mjs'))
    const plain = await prepareConfiguration(directory, config)
    assert.ok(plain.audit.sources.some(s => s.source === 'docs/src/content/docs/index.mdx'))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
