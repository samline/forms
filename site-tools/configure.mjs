import { realpathSync } from 'node:fs'
import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises'
import { resolve, relative, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { createHash } from 'node:crypto'
import { resolveProject } from '../shared/lib/project.mjs'
const root = fileURLToPath(new URL('../', import.meta.url))
const normalizeRepository = value =>
  String(typeof value === 'string' ? value : (value?.url ?? ''))
    .replace(/^git\+/, '')
    .replace(/^git@github.com:/, 'https://github.com/')
    .replace(/\.git$/, '')

/** Read metadata and evidence; never execute or change the source package. */
export async function prepareConfiguration(sourceDirectory, current, options = {}) {
  const directory = resolve(sourceDirectory)
  const manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
  if (!manifest.name || !manifest.version)
    throw new Error('The source package needs a name and version.')
  const url = options['site-url'] ?? manifest.homepage
  const repository = options.repository ?? normalizeRepository(manifest.repository)
  if (!url) throw new Error('Provide --site-url; the package has no homepage.')
  if (!repository) throw new Error('Provide --repository; the package has no repository URL.')
  const owner = new URL(repository).pathname.split('/').filter(Boolean)[0]
  const previousOwner = new URL(current.site.repository).pathname.split('/').filter(Boolean)[0]
  const credit = options.credit ?? (owner === previousOwner ? current.site.credit : null) ?? owner
  if (!credit) throw new Error('Provide --credit for the public footer identity.')
  const next = {
    ...current,
    package: {
      name: manifest.name,
      npmName: manifest.name,
      version: manifest.version,
      description: manifest.description || 'Describe the package before publishing.',
      author:
        typeof manifest.author === 'string'
          ? manifest.author
          : manifest.author?.name || 'Package maintainers',
      license: typeof manifest.license === 'string' ? manifest.license : 'See repository',
      keywords: manifest.keywords ?? [],
    },
    site: {
      ...current.site,
      url,
      repository,
      credit,
      namespace:
        'pkg-' +
        manifest.name
          .replace(/[^a-z0-9]+/gi, '-')
          .toLowerCase()
          .replace(/^-|-$/g, ''),
      template: true,
    },
    delivery: {
      cdnScript: options['cdn-script'] ?? null,
      cdnStylesheet: options['cdn-stylesheet'] ?? null,
    },
    theme: {
      accentLight: options['accent-light'] ?? current.theme.accentLight,
      accentDark: options['accent-dark'] ?? current.theme.accentDark,
    },
  }
  resolveProject(next)
  const ignored = new Set([
    'node_modules',
    '.git',
    'dist',
    'coverage',
    '.astro',
    '.agents',
    '.codex',
    'test-results',
    'playwright-report',
  ])
  // When this website is already embedded in the package (a re-run, or a package
  // that adopted the template), its own landing/docs/shared/tooling files are not
  // package evidence. A package's own docs/ stays evidence unless it is the site.
  const exists = path =>
    access(join(directory, path)).then(
      () => true,
      () => false
    )
  const embedded = await exists('shared/lib/project.mjs')
  const siteRoots = new Set(
    embedded
      ? [
          'landing',
          'shared',
          'brief',
          'site-tools',
          'site-tests',
          'site-e2e',
          ...((await exists('docs/astro.config.mjs')) ? ['docs'] : []),
        ]
      : []
  )
  const siteFiles = new Set(['content-audit.json', 'design-reference.json', 'project.config.json'])
  const evidence = []
  async function scan(path, prefix = '') {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (ignored.has(entry.name) || entry.isSymbolicLink()) continue
      if (!prefix && (siteRoots.has(entry.name) || siteFiles.has(entry.name))) continue
      const local = prefix + entry.name
      if (entry.isDirectory()) await scan(join(path, entry.name), local + '/')
      else if (
        /^(README|CHANGELOG|CHANGES|HISTORY)(\.|$)/i.test(entry.name) ||
        local === 'package.json' ||
        (/^(src|docs|types|example|examples)\//.test(local) &&
          /\.(mdx?|[cm]?[jt]sx?|css)$/.test(local))
      ) {
        const bytes = await readFile(join(path, entry.name))
        evidence.push({
          source: local,
          sha256: createHash('sha256').update(bytes).digest('hex'),
          destination: null,
          reviewed: false,
        })
      }
    }
  }
  await scan(directory)
  return {
    config: next,
    context: {
      sourcePackagePath: relative(root, directory),
      package: manifest.name,
      version: manifest.version,
      exports: manifest.exports ?? null,
      main: manifest.main ?? null,
      module: manifest.module ?? null,
      types: manifest.types ?? null,
      sideEffects: manifest.sideEffects ?? null,
    },
    audit: {
      capabilityReview: { status: 'pending', integrations: [], scenarios: [], onboarding: null },
      themeReview: { status: 'pending', source: null, accentLight: null, accentDark: null },
      status: 'starter',
      packageVersion: manifest.version,
      sources: evidence,
      publicExports: [],
      notes:
        'Review all sources and actual public symbols; export paths alone are not semantic API coverage.',
    },
  }
}
export async function configure(args = process.argv.slice(2)) {
  const { values } = parseArgs({
    args,
    options: {
      package: { type: 'string' },
      'site-url': { type: 'string' },
      repository: { type: 'string' },
      credit: { type: 'string' },
      'accent-light': { type: 'string' },
      'accent-dark': { type: 'string' },
      'cdn-script': { type: 'string' },
      'cdn-stylesheet': { type: 'string' },
      force: { type: 'boolean' },
      'dry-run': { type: 'boolean' },
    },
  })
  if (!values.package)
    throw new Error(
      'Usage: npm run configure -- --package ../your-package --site-url https://owner.github.io/your-package/'
    )
  const current = JSON.parse(await readFile(join(root, 'project.config.json'), 'utf8'))
  if (!current.site.template && !values.force)
    throw new Error(
      'This site is already customized. Use --force only after reviewing the configuration/audit diff.'
    )
  const prepared = await prepareConfiguration(values.package, current, values)
  if (values['dry-run']) {
    console.log(JSON.stringify(prepared, null, 2))
    return
  }
  await mkdir(join(root, 'brief'), { recursive: true })
  await writeFile(
    join(root, 'project.config.json'),
    JSON.stringify(prepared.config, null, 2) + '\n'
  )
  await writeFile(
    join(root, 'brief/package-context.json'),
    JSON.stringify(prepared.context, null, 2) + '\n'
  )
  await writeFile(join(root, 'content-audit.json'), JSON.stringify(prepared.audit, null, 2) + '\n')
  // Every package site ships its integration skill at skills/<name>/SKILL.md.
  // Preserve a maintained skill; otherwise scaffold the starter, which
  // check:release rejects until it is rewritten from verified APIs.
  const { npmName, name, version } = prepared.config.package
  // Draft the shared structure without overwriting the source package README.
  const siteUrl = prepared.config.site.url.replace(/\/?$/, '/')
  const skillName = npmName.replace(/^@[^/]+\//, '')
  const cdn = prepared.config.delivery.cdnScript
  const fields = {
    npmName,
    name,
    version,
    siteUrl,
    skill: skillName,
    description: prepared.config.package.description,
    license: prepared.config.package.license,
    cdnToc: cdn ? '- [HTML / CDN](#html--cdn)\n' : '',
    cdnSection: cdn
      ? '## HTML / CDN\n\nUse the verified pinned standalone build and document its real global, required markup/styles and cleanup.\n\n'
      : '',
  }
  const readmeDraft = (
    await readFile(new URL('./package-readme-template.md', import.meta.url), 'utf8')
  ).replace(/\{\{(\w+)\}\}/g, (_, key) => fields[key] ?? '')
  await writeFile(join(root, 'brief/readme-proposal.md'), readmeDraft)
  const skill = npmName.replace(/^@[^/]+\//, '')
  const skillPath = join(root, 'skills', skill, 'SKILL.md')
  let skillState = 'kept'
  try {
    await access(skillPath)
  } catch {
    let source
    try {
      source = await readFile(join(resolve(values.package), 'skills', skill, 'SKILL.md'), 'utf8')
      skillState = 'copied from the package'
    } catch {
      source = (await readFile(join(root, 'site-tools/package-skill-template.md'), 'utf8')).replace(
        /\{\{(\w+)\}\}/g,
        (_, key) => ({ skill, npmName, name, version })[key] ?? ''
      )
      skillState = 'scaffolded (starter; rewrite before release)'
    }
    await mkdir(join(root, 'skills', skill), { recursive: true })
    await writeFile(skillPath, source)
  }
  for (const name of ['README.md', 'CHANGELOG.md']) {
    try {
      await writeFile(
        join(root, 'brief', 'source-' + name.toLowerCase()),
        await readFile(join(resolve(values.package), name))
      )
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  console.log(
    `Imported ${prepared.config.package.name}@${prepared.config.package.version}; ${prepared.audit.sources.length} evidence files inventoried. Package skill skills/${skill}/SKILL.md ${skillState}. Source package unchanged. Read ADAPTATION.md to write verified content.`
  )
}
if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1]))
  configure().catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
