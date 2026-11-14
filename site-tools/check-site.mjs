import { checkLinks } from '../shared/scripts/check-links.mjs'
import { project } from '../shared/lib/project.mjs'
const result = await checkLinks({
  directory: new URL('../landing/dist/', import.meta.url),
  site: new URL(project.url),
  // Sibling package sites share the github.io origin but are external to this deployment.
  externalPaths: [
    '/formatter/',
    '/formatter/docs/changelog/',
    '/formatter/docs/reference/configuration/',
    '/formatter/docs/reference/regex/',
  ],
})
console.log(`Verified ${result.links} links across ${result.pages} pages.`)
