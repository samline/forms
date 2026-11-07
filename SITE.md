# Forms website

Landing, Examples and Docs for `@samline/forms` 2.8.0. The package's runtime, exports, Node 20+ requirement, README, license and release history remain the package contract. Website tooling requires Node **22.12+**.

## Run locally

```sh
bun install --frozen-lockfile
bun run site:dev
```

Open <http://127.0.0.1:4360/forms/>. Docs runs on 4361 and owns its development module origin; Landing redirects article links there. Ports come from `project.config.json` `dev` (Drawer uses 4340, Formatter 4350). To exercise generated search and the complete production artifact:

```sh
bun run build
bun run site:build
bun run site:preview
```

- Home: <http://127.0.0.1:4360/forms/>
- Examples: <http://127.0.0.1:4360/forms/examples/>
- Docs: <http://127.0.0.1:4360/forms/docs/>

The combined Pages artifact is `landing/dist/`, including Pagefind search, fonts, redirects and both sitemaps. No backend is required.

## Maintain

- `project.config.json` owns site identity, public URL, namespace, sky-blue accent pair, CDN script and package version. Keep it aligned with `package.json`; the CDN script is pinned to the same version.
- Landing copy lives in `landing/src/i18n/translations/en/`; article prose in `docs/src/content/docs/`; shared UI copy and the scenario catalog in `shared/i18n/translations/en/`.
- Scenarios: `shared/i18n/translations/en/demo.ts` declares twelve forms (fields, readouts, samples). `shared/lib/demo-behavior.js` holds their behavior as plain regions that call the real `form()` API; `shared/lib/demo-source.ts` copies those regions verbatim into the generated `main.js`, and `shared/components/DemoForm.astro` renders the live form with the shared Field/Select/Button controls. Previews import `@samline/forms` through Vite aliases to `src/index.ts`; never duplicate runtime logic in the site.
- `shared/lib/framework-files.ts` owns the React, Vue and Svelte components shown in the frameworks guide.
- `content-audit.json` maps every retired source, public export, method and option to a reviewed destination. `site-tools/doc-migration.json` records the Starlight page mapping and the redirects that `assemble.mjs` emits for old URLs.
- `CHANGELOG.md` is the single release history, loaded into the docs collection.
- `skills/forms/SKILL.md` is the package integration skill. It is served at `/skills/forms/SKILL.md` and linked from the footer, the end of Examples and the README.
- Website commands use the `site:` prefix. Runtime `build`, `test`, `typecheck`, `test:package` and `prepublishOnly` keep their roles. The npm `files: ["dist", "CHANGELOG.md"]` allowlist excludes the website; `test:package` asserts the real `npm pack` manifest.

## Retired documentation

The npm-bundled Markdown `docs/` folder and the Starlight application in `example/` were retired in 2.8.0 after migration. Their last revision is `612ac51`. Starlight pages were converted with `site:migrate:starlight`; the per-method `docs/api/*.md` pages became the "API in detail" group under `docs/src/content/docs/api/`. Old routes such as `/forms/reference/controls/` redirect with their fragments.

## Verification

```sh
bun run build
bun run typecheck
bun run test
bun run test:package
bun run site:verify
bun run site:check:release
```

`site:verify` covers both Astro checks, protected design fingerprints, formatting, tooling tests, alternate-base adaptation builds, the combined link audit, content checks and the browser suite. The browser suite executes every scenario's copied HTML / CDN and Package / ESM files against the local builds (`site-e2e/demo-builds.ts`).

Framework compiler check, 2026-11-06: the exact generated React JSX was bundled against this checkout’s distribution, Vue compiled with 3.5.44 and Svelte compiled with 5.57.2, using externally installed tooling. All three passed. Shopify and WordPress snippets are not exercised in real hosted installations. The maintainer published 2.8.0; all 19 published distribution files match this checkout byte for byte.

## Theme provenance

Adapted from <https://github.com/samline/package-landing-docs.git> at `6b3209e436a3f935713b0e833245954711c2dc42`. Header, Logo, Field, mount-elements and the identity browser test were later synchronized with template `61cc0d8`. The visual reference is Ticker at the revision recorded in REFERENCE.md and design-reference.json. Sky blue was requested by the maintainer (light `#0369a1`, dark `#38bdf8`). [SITE-LICENSE.md](SITE-LICENSE.md) covers the imported theme; font licenses live under `shared/assets/fonts/`.

## Performance validation

The [PageSpeed performance contract](AGENTS.md#pagespeed-performance-contract) governs Home, Examples and Docs: 95+ mobile performance, 100 desktop and 100 accessibility, best practices and SEO are goals, not measured results. No Lighthouse or PageSpeed run has been recorded for this site yet; measure the deployed artifact before reporting scores.
