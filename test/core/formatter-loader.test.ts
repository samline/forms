import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

// Regression test for the bug filed from dinkbit on 2026-07-10:
// `loadFormatter()` previously used
//   await import(/* @vite-ignore */ '@samline/formatter')
// which told Rollup to leave the bare specifier as a literal in the production
// bundle. Browsers cannot resolve bare specifiers, so the dynamic import
// threw, the graceful-fallback caught it, and the formatter silently never
// ran in production. Validators kept working (they don't need the formatter),
// which masked the bug.
//
// The fix is to NOT use `/* @vite-ignore */` here and instead let tsup mark
// `@samline/formatter` as `external` for the ESM/CJS build so the consumer's
// bundler resolves the peer at the consumer's build time. This test asserts
// the source keeps the directive removed so the bug cannot silently come
// back via a future refactor.

const here = dirname(fileURLToPath(import.meta.url))
const sourcePath = resolve(here, '../../src/core/formatter-loader.ts')

describe('formatter-loader source', () => {
  const source = readFileSync(sourcePath, 'utf8')

  it('does not use /* @vite-ignore */ as a directive on the formatter dynamic import', () => {
    // Strip prose comments (// ... and /* ... */) so warning text like
    // "Do NOT re-add /* @vite-ignore */" in a JSDoc doesn't trip the test.
    // We only care about the directive as a hint inside the actual import().
    const stripped = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')

    const block = stripped.match(
      /loadFormatter[\s\S]*?export const __resetFormatterLoaderForTests/
    )

    expect(block, 'loadFormatter block should be present in source').not.toBeNull()
    expect(block?.[0]).not.toMatch(/@vite-ignore/)
  })

  it('still loads @samline/formatter via dynamic import', () => {
    expect(source).toMatch(/import\(\s*['"]@samline\/formatter['"]\s*\)/)
  })
})
