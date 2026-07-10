import { defineConfig } from 'tsup'

// `@samline/formatter` is an optional peer dependency. It is loaded via a
// dynamic `import('@samline/formatter')` inside `src/core/formatter-loader.ts`.
//
// The two build entries have opposite needs because of how their consumers
// load the package:
//
//   1. The ESM/CJS entry (`index`) is consumed by bundlers (Astro/Vite/webpack
//      /etc.). They resolve the declared peer dep on the consumer side and
//      chunk/bundle it together with `@samline/forms`. We mark the peer as
//      `external` so Rollup does not try to resolve it during the publisher's
//      build (the peer may not be installed in CI). Without `external`,
//      removing the previous `/* @vite-ignore */` would have made the
//      publisher's build try to resolve `@samline/formatter` and fail.
//
//   2. The IIFE entry (`browser/global`) is loaded standalone via a single
//      `<script>` tag. There is no consumer-side module resolver, so the
//      dynamic `import("@samline/formatter")` would leave a bare specifier
//      the browser cannot resolve. We therefore BUNDLE the formatter into
//      the IIFE. The publisher's build must have `@samline/formatter`
//      installed (it is listed in `devDependencies`) for the IIFE build to
//      succeed. The resulting IIFE is self-contained and does not require
//      the consumer to install the peer.
//
// Do NOT add a `/* @vite-ignore */` comment back to `formatter-loader.ts`:
// in the ESM/CJS build that hint tells Rollup to leave the bare specifier
// in the bundle, the consumer's bundler receives it as a literal, and the
// formatter silently never loads in production.

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts'
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2020',
    outDir: 'dist',
    // Consumer's bundler resolves the peer; we do not pre-bundle it here.
    external: ['@samline/formatter']
  },
  {
    entry: {
      'browser/global': 'src/browser/global.ts'
    },
    format: ['iife'],
    dts: true,
    sourcemap: true,
    clean: false,
    target: 'es2020',
    outDir: 'dist',
    globalName: 'Forms'
    // Intentionally NO `external`: the IIFE must self-contain the
    // formatter so it works when loaded from a CDN with `<script>`.
  }
])
