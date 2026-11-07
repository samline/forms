/**
 * Local package builds that the copied-file test substitutes for published
 * assets, so copied examples run against this checkout instead of npm/CDN:
 *
 * - `iife`: the built standalone script, served when a document requests
 *   project.config.json `delivery.cdnScript`, executed as a classic script.
 * - `esm`: the built ESM entry. demo-routing.ts bundles it with esbuild into
 *   one module (the dist entry imports chunks and the optional
 *   @samline/formatter peer), mapped from the bare `@samline/forms` import.
 *
 * Paths are relative to the project root. Run `npm run build` first.
 */
export const localBuilds = {
  iife: 'dist/browser/global.global.js' as string | null,
  esm: 'dist/index.js' as string | null,
}
