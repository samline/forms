import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'

export interface CopiedFiles {
  html: string
  css: string
  javascript: string
  complete: string
}
export interface PackageBuilds {
  /** Published standalone script URL that documents request (delivery.cdnScript). */
  cdnScript: string | null
  /** Bare specifier that ESM files import (package.npmName). */
  npmName: string
  /** Built IIFE and ESM entry sources; null when the scenario needs no package. */
  iife: string | null
  esm: string | null
}

/** Read a local build path from e2e/demo-builds.ts, failing with a clear message. */
export const readBuild = async (path: string | null, what: 'iife' | 'esm') => {
  if (!path) throw new Error(`Point e2e/demo-builds.ts ${what} at the built package file.`)
  const file = new URL('../' + path, import.meta.url)
  if (what === 'iife') return readFile(file, 'utf8')
  // One self-contained module, as a consumer's bundler would produce.
  const { build } = await import('esbuild')
  const result = await build({
    entryPoints: [file.pathname],
    bundle: true,
    format: 'esm',
    write: false,
    logLevel: 'silent',
  })
  return result.outputFiles[0].text
}

/**
 * Serve copied files at https://example.test/ (index.html with style.css and
 * main.js, and the complete document at /complete/index.html). The CDN script
 * is answered with the local IIFE and the bare package import is mapped to the
 * local ESM build through an injected import map. Navigate to each document
 * (never setContent): classic scripts declare top-level consts that would
 * collide in one global scope.
 */
export async function routeExample(page: Page, files: CopiedFiles, builds: PackageBuilds) {
  if (builds.cdnScript)
    await page.route(builds.cdnScript, route => {
      if (builds.iife === null)
        throw new Error('A document requested the CDN script; set the local iife build.')
      return route.fulfill({ body: builds.iife, contentType: 'text/javascript' })
    })
  const importMap =
    builds.esm === null
      ? ''
      : `<script type="importmap">${JSON.stringify({ imports: { [builds.npmName]: 'https://example.test/__package__.js' } })}</script>`
  const withMap = (html: string) => html.replace('<head>', `<head>${importMap}`)
  await page.route('https://example.test/**', route => {
    const path = new URL(route.request().url()).pathname
    const [body, contentType] =
      path === '/__package__.js'
        ? [builds.esm ?? '', 'text/javascript']
        : path.endsWith('.js')
          ? [files.javascript, 'text/javascript']
          : path.endsWith('.css')
            ? [files.css, 'text/css']
            : path.startsWith('/complete/')
              ? [withMap(files.complete), 'text/html']
              : [withMap(files.html), 'text/html']
    return route.fulfill({ body, contentType })
  })
}
