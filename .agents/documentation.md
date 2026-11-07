# Documentation in-sync rule

`@samline/forms` documents its public API on the website (Astro collection in `docs/src/content/docs/`, published at `https://samline.github.io/forms`) plus `README.md` and the agent skill `skills/forms/SKILL.md`. Since 2.8.0 there is no npm-bundled Markdown `docs/` folder and no Starlight `example/` app; both were migrated and retired at `612ac51`.

A change to the public API is **not done** until every surface below is updated in the same change.

## When to read this file

- Before any release / version bump.
- After any change to `src/index.ts`, `src/core/types.ts`, `src/browser/*` or a factory in `src/api/*.ts`.
- After any change to peer-dependent behaviour (`@samline/formatter`, `format`, `formatAll`, `formats`, `regex`).

## Sync checklist

### 1. Public surface

`src/index.ts`, `src/core/types.ts` and `dist/index.d.ts` are the contract. If the docs disagree with `dist/`, the docs are wrong.

### 2. Website reference

- [ ] `docs/src/content/docs/api/<method>.md` exists for every controller method and pure helper, with the current signature, behaviour list and edge cases. New pages need a `sidebar.group: api` order and a label in `docs/src/i18n/translations/en/navigation.ts`.
- [ ] `docs/src/content/docs/reference/api.mdx` lists the method in its task group and per-method summary.
- [ ] `reference/configuration.mdx` lists every `FormControllerOptions` field and default.
- [ ] `reference/typescript.mdx` lists every exported type.
- [ ] `reference/browser.mdx` and `reference/entrypoints.mdx` match the `/browser` subpath and the IIFE global (`form`, `newForm`, `destroyForm`, `available`).
- [ ] Guides (`validation`, `state-and-submission`, `formatting`, `controls`, `css-styling`, `accessibility`, `frameworks`, `recipes`) still describe real behaviour.
- [ ] `content-audit.json` maps new sources/exports to reviewed destinations (`npm run site:check:release`).

### 3. Examples and landing

- [ ] Scenario catalog (`shared/i18n/translations/en/demo.ts`) and behavior regions (`shared/lib/demo-behavior.js`) use the current API; the browser suite replays every sample against the built files.
- [ ] Landing snippets in `landing/src/i18n/translations/en/sections.ts` (setup, recipes, FAQ answers) still run.

### 4. Peer-aware surfaces

`@samline/formatter` is an optional peer. Every page that mentions `format` / `formatAll` / `formats` / `regex` keeps the "optional peer" caveat; the standalone IIFE bundles it.

### 5. Code ↔ doc consistency

Every behaviour claim must be verifiable in source and, where possible, covered by a test. Examples must run against the current build.

### 6. Version references

- [ ] `package.json`, `project.config.json` (`package.version`, `delivery.cdnScript`) and `content-audit.json.packageVersion`.
- [ ] CDN URLs in README, `getting-started.mdx`, `reference/browser.mdx`, `reference/entrypoints.mdx`, `guides/recipes.mdx`, `guides/frameworks.mdx` and `skills/forms/SKILL.md` (`grep -rn "@samline/forms@" README.md docs/src skills`).
- [ ] `skills/forms/SKILL.md` `package-version`.

### 7. CHANGELOG

Every release adds a `CHANGELOG.md` section (`Added` / `Fixed` / `Changed`, breaking changes labelled) and a compare link. The website loads it as `/docs/changelog/`.

### 8. Verify

`npm run build && npm test && npm run test:package`, then `npm run site:verify` and `npm run site:check:release`.

## Past post-mortems

These are real bugs caught by past sweeps. Keep this list updated when a new one is discovered.

- **2.3.x (2026-07-16):** `docs/typescript.md` and `docs/options.md` (both dated jun 30) did not document `format` / `formatAll` / `formats` / `FieldFormatConfig` / `FieldFormatConfigMap` / `FormatType` even though the code shipped them in 2.3.0. The Starlight site (`example/`) was up to date; the npm-bundled docs were not. Both surfaces must stay in sync.
- **2.3.x (2026-07-16):** `docs/api/set-value.md` documented `<select multiple>` as "treated like a checkbox group", but `src/core/dom.ts → writeFieldValue` only branches on `checkbox` / `radio` / `file`; the actual behaviour is `field.value = String(value)`. Documentation claimed a code path that did not exist.
- **2.3.x (2026-07-16):** `docs/api/form.md` linked `[createFormController](element.md)` to a page that documented the `element` / `f` / `options` getters, not `createFormController`. The correct target is `typescript.md#formcontroller`.
- **2.3.x (2026-07-16):** `docs/api/regex.md` did not exist. `regex` is exported by the optional peer `@samline/formatter` and was only mentioned tangentially in `getting-started.md` and `browser.md`. Consumers had no dedicated reference.
- **2.8.0 (2026-11-06):** the Starlight site described `reset()` as not invoking watchers and `prefill()` as writing repeated keys one by one; both were changed in the runtime and every page was updated in the same change. The migration also showed that MDX imports must be followed by a blank line, and that page title accents must be the trailing part of the title.
