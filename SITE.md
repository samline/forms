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

The [PageSpeed performance contract](AGENTS.md#pagespeed-performance-contract) governs Home, Examples and Docs: 95+ mobile performance, 100 desktop and 100 accessibility, best practices and SEO are goals, not measured results. The first measured baseline is recorded below; targets and observations remain separate.

### Deployed baseline — 2026-11-06

Measured the HTTPS production site after Pages successfully published
`e049d4cc209aadd53b8aa4c91ae30d8658ad145d`; the local checkout was clean.
The published npm 2.8.0 distribution matches all 19 local dist files byte for
byte. Home, Examples and Docs returned HTTP 200 and their live headers were
checked at 1024px before measurement.

These are **local Lighthouse 13.6.0 measurements of the deployed HTTPS site**,
not Google-hosted PageSpeed results. The PageSpeed API returned HTTP 429 with
an exhausted/zero daily quota, so no Google-hosted score is claimed. Node
26.13.0, macOS 26.5.2 arm64 and Chromium 151.0.7922.34 were used. Runs were
sequential without local builds/tests competing for resources. Each run used
a new Chrome process with the default storage/cache reset. Reports include
all four requested categories and contain no audit errors or run warnings.

Mobile uses Lighthouse's default 412×823, DPR 1.75 phone emulation and simulated
throttling: 150ms RTT, 1,638.4 Kbit/s throughput and 4× CPU slowdown. The table
shows the median of three cold runs per route. A/BP/SEO means accessibility,
best practices and SEO; automated accessibility scores do not establish
complete accessibility.

| Route                                         | Performance | A/BP/SEO    |   FCP |   LCP |    TBT |   CLS | Speed Index |
| --------------------------------------------- | ----------: | ----------- | ----: | ----: | -----: | ----: | ----------: |
| Home (`/forms/`)                              |         100 | 100/100/100 | 0.94s | 0.94s | 13.5ms | 0.000 |       1.18s |
| Examples (`/forms/examples/`)                 |          95 | 100/100/100 | 2.30s | 2.30s |   69ms | 0.000 |       2.30s |
| Docs (`/forms/docs/reference/configuration/`) |         100 | 100/100/100 | 0.93s | 1.50s |    9ms | 0.001 |       0.93s |

Desktop uses the built-in desktop preset (40ms simulated RTT, 10,240 Kbit/s,
1× CPU). These are single cold runs per route, not medians: all three returned
100 performance and 100 accessibility/best-practices/SEO. Home FCP/LCP were
0.34/0.34s, TBT 0ms, CLS 0 and Speed Index 0.69s; Examples 0.56/0.56s, 0ms,
0 and 0.79s; Docs 0.52/0.52s, 0ms, 0.006 and 0.63s.

Observed mobile network transfer, median KiB including response headers
(compressed where the server compresses the response):

| Route    |  HTML |  CSS | JavaScript | Fonts | Requests |
| -------- | ----: | ---: | ---------: | ----: | -------: |
| Home     |  19.7 | 11.7 |       76.9 |  96.9 |       16 |
| Examples | 289.2 | 11.6 |       77.0 |  96.9 |       16 |
| Docs     |  25.1 |  0.0 |       21.8 |  96.9 |       15 |

Docs CSS is included in its HTML. This is a first baseline, without a controlled
before/after comparison or changes to caching. Examples has the largest HTML
transfer because it retains twelve live scenarios and their complete/split
CDN/ESM code; that is an observation, not a proposal to remove content. Raw
JSON/HTML reports are retained locally outside Git as
`<route>-<mobile|desktop>-<run>.report.{json,html}`. There is no field INP or
real-user Core Web Vitals evidence; Lighthouse TBT is a lab metric. A future
Google-hosted PageSpeed run remains dependent on service availability.
