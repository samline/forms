import { readFile, readdir, access } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { realpathSync } from 'node:fs'
import { README_SECTIONS, proseLines } from './lib/identity-checks.mjs'

/**
 * Content and convention checks that structural checks (links, axe, design
 * fingerprints) cannot see. Each one exists because an adaptation shipped the
 * defect while every other check was green (Formatter review, 2026-11-05).
 *
 * In template mode the checker proves its own lists are in sync with the
 * starter (defaults must be present) and enforces the universal rules. In
 * release mode (site.template:false) every starter default must be gone.
 */

/** Visitor-facing starter copy rendered by the template build. */
export const TEMPLATE_DEFAULTS = [
  'Examples with context',
  // Hero and section voice: sibling-style placeholders an adaptation must rewrite.
  'Small library. Clear purpose.',
  'Make the first step easy.',
  'Install it, try a working example, then read the complete reference.',
  'One clear purpose',
  '01 / More than the basics',
  'Thoughtful by default.',
  'Clear in every detail.',
  'The problem it solves',
  'Describe only verified compatibility',
  'Supported environments',
  'One clear API.',
  '03 / From install to result',
  'One working result.',
  '04 / After the first result',
  'Keep the basics simple.',
  'Grow from there.',
  'Where is the full documentation?',
  'Can I copy the examples?',
  'A clear start goes a long way',
  'Make the next step',
  'Neutral template scenario',
  'Turn an article title into a URL slug',
  'Count a message against a character limit',
  'Change the case of a heading',
  'Verified release notes for every version, with breaking changes',
  'Keep previews readable and provide accessible controls for the real package.',
]
/** Older starter strings that must never reappear in an adapted site. */
export const RETIRED_DEFAULTS = [
  'A working interaction',
  'Website adaptation skill',
  'website adaptation skill',
  'Verified release notes, including explicit breaking changes.',
  'Neutral template preview',
  'Counter demo',
  'Add one',
  'A clear starting point for your package.',
  'Start with understanding.',
  'Template preview — replace instructional copy',
  '01 / The package at a glance',
  '02 / Choose your integration',
  'A useful starting point.',
  'Details where needed.',
  'Three steps.',
  '04 / Useful patterns',
  'Small examples.',
  'Practical context.',
  'Build with understanding',
  'Ready for the details?',
]
/*
 * Not flagged: sibling-standard copy kept verbatim by Drawer and Formatter,
 * such as "02 / Fit it into your stack", "Two ways in.", "05 / Before you build"
 * and "A few details. Clearly answered."
 */
/** One distinctive path prefix per default Overview card icon in Features.astro. */
export const DEFAULT_ICONS = {
  package: 'M21 16V8a2 2 0 0 0-1-1.73',
  eye: 'M2 12s3-7 10-7 10 7 10 7',
  refresh: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8',
  branch: 'M5 8v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M12 12v4',
  layers: 'M12 2L2 7l10 5 10-5-10-5z',
  wrench: 'M14.7 6.3a1 1 0 0 0 0 1.4',
}
/** Root README H2 order shared by Ticker, Drawer, Notify and Formatter. */
export const README_HEADINGS = README_SECTIONS
export const LIMITS = { title: 20, descriptionMin: 70, descriptionMax: 160, faq: 8 }

const decode = value =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
const exists = path =>
  access(path).then(
    () => true,
    () => false
  )

async function pages(directory, prefix = '') {
  const result = []
  for (const entry of await readdir(join(directory, prefix), { withFileTypes: true })) {
    const local = prefix + entry.name
    if (entry.isDirectory()) {
      if (!['pagefind', 'font-licenses', '_astro'].includes(entry.name))
        result.push(...(await pages(directory, local + '/')))
    } else if (entry.name.endsWith('.html')) result.push(local)
  }
  return result
}

/** README H2 headings, ignoring fenced code. */
export const readmeHeadings = markdown =>
  proseLines(markdown)
    .filter(line => /^## /.test(line))
    .map(line => line.slice(3).trim())

/**
 * @param {{ root: string, project: Record<string, any>, release: boolean, audit?: any }} options
 * @returns {Promise<string[]>} problems; empty when every check passes
 */
export async function checkContent({ root, project, release, audit = {} }) {
  const problems = []
  const fail = message => problems.push(message)
  const dist = join(root, 'landing/dist')
  if (!(await exists(join(dist, 'index.html'))))
    return [
      'Build the combined site first (npm run site:build); landing/dist/index.html is missing.',
    ]
  const html = {}
  for (const path of await pages(dist)) html[path] = await readFile(join(dist, path), 'utf8')
  const all = Object.values(html).join('\n')

  // Titles and descriptions: descriptive, unique and within search-snippet length.
  const seen = { title: new Map(), description: new Map() }
  for (const [path, page] of Object.entries(html)) {
    if (/http-equiv="refresh"/i.test(page)) continue
    const title = decode(page.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').trim()
    const description = decode(
      page.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ''
    ).trim()
    if (title.length < LIMITS.title)
      fail(`${path}: <title> "${title}" is shorter than ${LIMITS.title} characters.`)
    if (description.length < LIMITS.descriptionMin || description.length > LIMITS.descriptionMax)
      fail(
        `${path}: meta description has ${description.length} characters; write ${LIMITS.descriptionMin}–${LIMITS.descriptionMax}.`
      )
    for (const [key, value] of [
      ['title', title],
      ['description', description],
    ]) {
      if (seen[key].has(value))
        fail(`${path}: duplicate ${key} also used by ${seen[key].get(value)}.`)
      else seen[key].set(value, path)
    }
    if (/href="[^"]*skills\/package-site\//.test(page))
      fail(`${path}: links to the template adaptation skill; link the package skill instead.`)
  }

  // Starter copy: present in the template (keeps this list honest), absent after adaptation.
  if (release) {
    for (const text of [...TEMPLATE_DEFAULTS, ...RETIRED_DEFAULTS]) {
      const page = Object.keys(html).find(path => html[path].includes(text))
      if (page) fail(`${page}: template default text remains: "${text}".`)
    }
  } else {
    for (const text of TEMPLATE_DEFAULTS)
      if (!all.includes(text))
        fail(`TEMPLATE_DEFAULTS is stale: "${text}" is no longer rendered by the starter.`)
  }

  // Overview icons must depict their cards; a default may stay only by explicit review.
  const features = await readFile(join(root, 'landing/src/sections/Features.astro'), 'utf8')
  const kept = new Set(audit.iconReview?.kept ?? [])
  for (const [name, path] of Object.entries(DEFAULT_ICONS)) {
    const present = features.includes(path)
    if (release && present && !kept.has(name))
      fail(
        `Features.astro still uses the default "${name}" icon. Draw one that depicts its card, or record it in content-audit.json.iconReview.kept with a reason.`
      )
    if (!release && !present)
      fail(`DEFAULT_ICONS is stale: the "${name}" path is not in Features.astro.`)
  }

  // FAQ depth: answer the real integration questions, not three placeholders.
  const faq = (html['index.html'].match(/class="[^"]*\bfaq-item\b/g) ?? []).length
  if (release && faq < LIMITS.faq)
    fail(`Home has ${faq} FAQ items; answer at least ${LIMITS.faq} real integration questions.`)

  // Package integration skill: one maintained source, served and linked.
  const skillSource = join(root, 'skills', project.skill, 'SKILL.md')
  if (!(await exists(skillSource))) fail(`Missing skills/${project.skill}/SKILL.md.`)
  else {
    const skill = await readFile(skillSource, 'utf8')
    if (!skill.startsWith(`---\nname: ${project.skill}\n`))
      fail(`skills/${project.skill}/SKILL.md frontmatter must start with name: ${project.skill}.`)
    if (!skill.includes(project.npmName))
      fail(`skills/${project.skill}/SKILL.md must name ${project.npmName}.`)
    const served = join(dist, 'skills', project.skill, 'SKILL.md')
    if (!(await exists(served)) || (await readFile(served, 'utf8')) !== skill)
      fail(
        `landing/dist/skills/${project.skill}/SKILL.md must serve the maintained skill unchanged.`
      )
    if (release && skill.includes('package-site:starter-skill'))
      fail(`skills/${project.skill}/SKILL.md is still the starter; write it from verified APIs.`)
    if (release && !skill.includes(project.version))
      fail(`skills/${project.skill}/SKILL.md does not mention version ${project.version}.`)
  }
  const skillHref = new RegExp(
    `href="[^"]*skills/${project.skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/SKILL\\.md"[^>]*download="SKILL\\.md"`
  )
  for (const path of ['index.html', 'examples/index.html'])
    if (!skillHref.test(html[path] ?? ''))
      fail(`${path}: missing the downloadable package skill link (footer / Examples resources).`)

  // Root README follows the sibling structure.
  const readme = await readFile(join(root, 'README.md'), 'utf8')
  const headings = readmeHeadings(readme)
  // HTML / CDN is optional, but required in release mode when a CDN script is configured.
  const core = headings.filter(heading => README_HEADINGS.includes(heading))
  const cdn = core.includes('HTML / CDN') || (release && Boolean(project.delivery.cdnScript))
  const expected = README_HEADINGS.filter(heading => heading !== 'HTML / CDN' || cdn)
  if (JSON.stringify(core) !== JSON.stringify(expected))
    fail(
      `README.md H2 headings must be, in order: ${expected.join(' · ')}. Found: ${headings.join(' · ')}.`
    )
  if (release) {
    if (!readme.startsWith(`# ${project.npmName}\n`))
      fail(`README.md must start with "# ${project.npmName}".`)
    if (!/MIT — \[LICENSE\.md\]\(LICENSE\.md\)|\[LICENSE\.md\]\(LICENSE\.md\)/.test(readme))
      fail('README.md License section must link LICENSE.md.')
    if (!readme.includes(`skills/${project.skill}/SKILL.md`))
      fail(`README.md AI agent skill section must link skills/${project.skill}/SKILL.md.`)
  }

  // Root conventions shared by the sibling packages.
  if (release) {
    if (!(await exists(join(root, 'LICENSE.md')))) fail('Name the license file LICENSE.md.')
    if (await exists(join(root, 'LICENSE'))) fail('Rename LICENSE to LICENSE.md.')
    try {
      execFileSync('git', ['ls-files', '--error-unmatch', 'AGENTS.md'], {
        cwd: root,
        stdio: 'pipe',
      })
    } catch {
      fail('Commit AGENTS.md as the single project memory (it must not be git-ignored).')
    }
    const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
    if (!manifest.private) {
      if (!(await exists(join(root, 'SITE.md'))))
        fail('Add SITE.md describing the embedded website.')
      if (!manifest.scripts?.['test:package'])
        fail(
          'Add a test:package script that checks the npm pack manifest and runs the built bundles.'
        )
      if (!manifest.packageManager) fail('Declare packageManager in package.json.')
      if (/assets\.mjs/.test(manifest.scripts?.postinstall ?? ''))
        fail(
          'Remove the site postinstall from the published package; site commands run assets.mjs.'
        )
      if (!Array.isArray(manifest.files))
        fail('Keep a runtime-only files allowlist in package.json.')
    }
  }
  return problems
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const { project } = await import('../shared/lib/project.mjs')
  const root = fileURLToPath(new URL('../', import.meta.url))
  const audit = JSON.parse(await readFile(join(root, 'content-audit.json'), 'utf8'))
  const release = process.argv.includes('--release') || !project.template
  const problems = await checkContent({ root, project, release, audit })
  if (problems.length) {
    console.error(problems.map(problem => `✗ ${problem}`).join('\n'))
    process.exitCode = 1
  } else
    console.log(
      `Content checks passed in ${release ? 'release' : 'template'} mode: metadata, starter copy, icons, package skill, README and root conventions.`
    )
}
