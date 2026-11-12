# Project Todo

## Handoff — 2026-11-12 (2.9.0 prepared, not published)

2.9.0 adds `setOptions()` (#13, PR #28) and array support in `watch()` / `observe()` / `unwatch()` (#10, PR #29), plus the fix for option-list mutations being ignored by the observer. Both PRs are squash-merged and pushed to main; their branches are deleted and both issues are closed.

The release commit (`release: v2.9.0`: version references, CDN URLs, CHANGELOG section) is on local main only. It is deliberately not pushed: pushing main deploys the website, whose CDN URLs would point at a 2.9.0 that npm does not have yet.

Verified locally on the release commit: frozen Bun install, typecheck, 146 tests with coverage, build, test:package (23 files), npm pack --dry-run, bun audit --production, site:verify (35 browser tests) and site:check:release.

Remaining, maintainer only:

1. `npm publish` from the clean worktree (prepublishOnly re-runs the checks).
2. `git push origin main` after npm serves 2.9.0, then confirm CI and the Pages deployment.
3. Optional: tag `v2.9.0`. No `v2.8.0` tag exists locally although the CHANGELOG compare links reference it.

## Handoff — 2026-11-06

The cancelled verification from the earlier session has been completed. Runtime 2.8.0, the embedded Landing/Examples/Docs migration and template 61cc0d8 fixes are verified together. The maintainer published @samline/forms@2.8.0 on npm during this session; all 19 published dist files match this checkout byte for byte, including after the tooling dependency updates.

Completed locally:

- Build, TypeScript, all 124 runtime tests with coverage and package smoke tests (ESM, CJS, browser module, standalone IIFE and the 23-file npm manifest).
- Full site:verify: both Astro apps, protected styles, formatting, 34 tooling tests, root/nested adaptation builds, 6,013 links across 60 pages, content checks and 34/34 Chromium tests. The copied twelve scenarios run in separate/complete CDN and ESM forms; the header and duplicate-id fixes now pass together.
- site:check:release, frozen Bun install and bun audit --production. Vite, undici and source-map-js overrides were updated to remove the audit blockers; direct Vite and its override share the same specifier so npm pack accepts them. No runtime output changed.
- The exact generated Newsletter.jsx was bundled against dist; Newsletter.vue was compiled with Vue 3.5.44, and Newsletter.svelte with Svelte 5.57.2. Dependencies were installed externally for this optional check. This is compiler evidence, not real hosted CMS validation.

Release and deployment closure:

- main was pushed only after npm 2.8.0 became available. Runtime/site migration commit e049d4c passed CI and Pages; the live Home, Examples and Docs returned HTTP 200 and their 1024px headers were verified.
- The first production HTTPS Lighthouse baseline is recorded in SITE.md: three cold mobile runs per route (medians 100 Home, 95 Examples, 100 Docs) and one desktop run per route (all 100). Accessibility, best practices and SEO scored 100 throughout. Conditions, FCP/LCP/TBT/CLS/Speed Index, network transfers and limitations are recorded there; raw reports stay outside Git.
- Google-hosted PageSpeed was attempted but returned HTTP 429 with zero/exhausted daily quota. The Lighthouse results are explicitly local measurements of the deployed site, not Google-hosted scores or field Core Web Vitals evidence. A Google-hosted measurement can be repeated when the service has quota; no package publication is outstanding.

Cross-repo closure authorized by the maintainer in this session:

- Template: local main is clean at 61cc0d8, with the original fixes already committed.
- Compact landing headers (icon-only GitHub and hidden version badge from 64rem to 75rem) and their regressions were committed and pushed on all four sibling main branches: Ticker 3f1a1e8, Drawer dbb74bd, Notify 291c05d and Formatter ba167b2. Ticker passed 100 Landing tests and 35 Docs tests plus its five optional framework/CMS cases separately. Drawer passed 60 broad cases plus its five optional integration cases separately. Notify passed all 78 browser tests and release evidence. Formatter passed all 30 browser tests and release evidence. Deployment/CI follow-ups are recorded in each owning repository; Notify's pre-existing pointer-reset flake has its own test follow-up.
- Notify also includes the earlier in-Docs example/source change and refreshed review hash for docs/recipes.md.
- Only Forms needed npm publication for this work; the four siblings' changes are website-only.

Maintenance:

- When the template changes again, compare ../package-landing-docs with landing/, docs/, shared/, site-tools/ and site-e2e/. Preserve the intentional Forms scenario model, framework files, form-specific browser tests and Bun compatibility overrides.

## Ongoing

- Keep tests, typecheck, package build, test:package, site:verify, site:check:release and dependency audit green in CI.
- Update the website reference, README and skills/forms/SKILL.md with every public API change (see documentation.md).
