# Project Todo

## Handoff — 2026-11-06

The cancelled verification from the earlier session has been completed. Runtime 2.8.0, the embedded Landing/Examples/Docs migration and template 61cc0d8 fixes are verified together. The maintainer published @samline/forms@2.8.0 on npm during this session; all 19 published dist files match this checkout byte for byte, including after the tooling dependency updates.

Completed locally:

- Build, TypeScript, all 124 runtime tests with coverage and package smoke tests (ESM, CJS, browser module, standalone IIFE and the 23-file npm manifest).
- Full site:verify: both Astro apps, protected styles, formatting, 34 tooling tests, root/nested adaptation builds, 6,013 links across 60 pages, content checks and 34/34 Chromium tests. The copied twelve scenarios run in separate/complete CDN and ESM forms; the header and duplicate-id fixes now pass together.
- site:check:release, frozen Bun install and bun audit --production. Vite, undici and source-map-js overrides were updated to remove the audit blockers; direct Vite and its override share the same specifier so npm pack accepts them. No runtime output changed.
- The exact generated Newsletter.jsx was bundled against dist; Newsletter.vue was compiled with Vue 3.5.44, and Newsletter.svelte with Svelte 5.57.2. Dependencies were installed externally for this optional check. This is compiler evidence, not real hosted CMS validation.

Remaining closure steps:

1. Commit and push main now that the npm release is available; confirm CI, the exact Pages head and live artifact.
2. Record the first deployed performance baseline for Home, Examples and a representative Docs article under the PageSpeed contract in AGENTS.md.

Cross-repo closure authorized by the maintainer in this session:

- Template: local main is clean at 61cc0d8, with the original fixes already committed.
- Ticker, Drawer, Notify and Formatter: port the compact landing header (icon-only GitHub and hidden version badge from 64rem to 75rem) and its regression to each main. Formatter's checks and 30 browser tests passed; CI and Pages for ba167b2 passed. Ticker passed 100 Landing tests and 35 Docs tests, plus its five optional framework/CMS cases separately. Notify passed its full 78-test browser suite and release evidence. Drawer is finishing its full suite; its five optional framework/CMS cases passed separately.
- Notify also includes the earlier in-Docs example/source change and refreshed review hash for docs/recipes.md.
- Only Forms needed npm publication for this work; the four siblings' changes are website-only.

Maintenance:

- When the template changes again, compare ../package-landing-docs with landing/, docs/, shared/, site-tools/ and site-e2e/. Preserve the intentional Forms scenario model, framework files, form-specific browser tests and Bun compatibility overrides.

## Ongoing

- Keep tests, typecheck, package build, test:package, site:verify, site:check:release and dependency audit green in CI.
- Update the website reference, README and skills/forms/SKILL.md with every public API change (see documentation.md).
