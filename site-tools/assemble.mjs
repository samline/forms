import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { project } from '../shared/lib/project.mjs'
await cp(
  new URL('../docs/dist/', import.meta.url),
  new URL('../landing/dist/docs/', import.meta.url),
  { recursive: true }
)
const index = new URL('../landing/dist/sitemap-index.xml', import.meta.url)
const [landing, docs] = await Promise.all([
  readFile(index, 'utf8'),
  readFile(new URL('../docs/dist/sitemap-index.xml', import.meta.url), 'utf8'),
])
await writeFile(
  index,
  landing.replace(
    '</sitemapindex>',
    (docs.match(/<sitemap>.*?<\/sitemap>/g) ?? []).join('') + '</sitemapindex>'
  )
)
await writeFile(new URL('../landing/dist/.nojekyll', import.meta.url), '')
// Retired documentation routes (for example a former Starlight site) keep working,
// including fragments: site-tools/doc-migration.json maps each old route, relative
// to the site root, to its new docs route.
const { redirects = {} } = JSON.parse(
  await readFile(new URL('./doc-migration.json', import.meta.url), 'utf8')
)
for (const [old, route] of Object.entries(redirects)) {
  const target = project.docsBase + (route === 'index' ? '' : route.replace(/\/?$/, '/'))
  const directory = new URL('../landing/dist/' + old.replace(/^\/|\/$/g, '') + '/', import.meta.url)
  await mkdir(directory, { recursive: true })
  await writeFile(
    new URL('index.html', directory),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${project.name} documentation</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${target}"><link rel="canonical" href="${new URL(target, project.origin)}"></head><body><p>Continue to <a href="${target}">${project.name} documentation</a>.</p><script>location.replace(${JSON.stringify(target)} + location.hash)</script></body></html>`
  )
}
console.log('Combined landing, examples, docs, search, fonts and sitemap into landing/dist.')
