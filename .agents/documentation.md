# Documentation in-sync rule

`@samline/forms` ships two documentation surfaces that must reflect the current public API at all times:

1. **`docs/`** — bundled with the npm tarball. Read by consumers directly on disk and via the GitHub repo.
2. **`example/src/content/docs/reference/`** — the Starlight site served at `https://samline.github.io/forms`.

A change to the public API is **not done** until both surfaces are updated. This file is the checklist.

## When to read this file

- Before any release / version bump (e.g. `2.3.3` → `2.4.0`).
- After any change to `src/index.ts` (the public surface) or `src/core/types.ts` (the public types).
- After any change to a per-method factory in `src/api/*.ts` (signature, behaviour, return shape).
- After any change to peer-dependent behaviour (`@samline/formatter` integration, `regex`, `formats`).

## Sync checklist

Run these checks in order. Mark each as ✅ / ❌ before merging.

### 1. Public surface

```bash
cat src/index.ts
cat src/core/types.ts
```

These two files are the source of truth. Any signature change here must propagate to every doc.

### 2. `dist/` snapshot

```bash
cat dist/index.d.ts
```

The bundled `.d.ts` is what consumers actually import from. It must match `src/index.ts` and `src/core/types.ts` exactly — if the docs disagree with `dist/`, the docs are wrong (the build is the canonical export).

### 3. `docs/` (the npm-bundled reference)

For every public symbol listed in `src/index.ts` / `src/core/types.ts`:

- [ ] `docs/api/<method>.md` exists for every method and reflects the current signature, parameters, return shape, and behaviour table.
- [ ] `docs/api/index.md` lists the new / removed / renamed method.
- [ ] `docs/options.md` lists every field of `FormControllerOptions` (including the new `formats?: FieldFormatConfigMap`).
- [ ] `docs/typescript.md` lists every exported type (including `FieldFormatConfig`, `FieldFormatConfigMap`, `FormatType`, `FieldValidator`, etc.).
- [ ] `docs/recipes.md` has a recipe if the feature warrants one (e.g. `format` → "13. Format inputs with `@samline/formatter`").
- [ ] `docs/api/element.md` example shows the new option in `options`.

### 4. `example/src/content/docs/reference/` (the Starlight site)

Same checks, against the Starlight mirror:

- [ ] `example/src/content/docs/reference/api.md` lists the new / removed / renamed method in both the TOC and the per-method summaries.
- [ ] `example/src/content/docs/reference/typescript.md` lists the new types.
- [ ] `example/src/content/docs/reference/configuration.md` lists the new options.
- [ ] `example/site.config.mjs` adds the new page to the `sidebar` array (e.g. `regex`, new per-method page).
- [ ] Cross-links use Starlight absolute paths (`/forms/reference/...`) — not relative paths like `../api/...`.

### 5. Peer-aware surfaces

`@samline/formatter` is an **optional peer dependency**. Anything sourced from it must be documented as such, with the warning that the import throws when the peer is missing:

- [ ] `regex` (peer) — `docs/api/regex.md` and `example/.../regex.md`. Callout at the top: "importing this without the peer throws a module-not-found error".
- [ ] `format` / `formatAll` / `formats` (peer) — every page that mentions them must include the "optional peer" caveat.
- [ ] The shim in `src/types/formatter.d.ts` matches what `docs/typescript.md` declares.

### 6. Code ↔ doc consistency

The doc is a contract, not a wish. Every code-path claim in a doc page must be verifiable in the source. Specifically:

- [ ] The "Behaviour" table in every per-method page matches the actual `if` / `switch` branches in the source. (Concrete past bug: `docs/api/set-value.md` claimed `<select multiple>` is treated as a checkbox group; the code only has branches for `checkbox` / `radio` / `file`, so the documented behaviour was wrong.)
- [ ] The signature in every doc page matches the export in `src/index.ts` or the type in `src/core/types.ts`.
- [ ] Examples in the docs actually run with the current build. If a doc example would throw on the current API, fix the example.
- [ ] Cross-links (`[label](path.md#anchor)`) point to an existing page and an existing heading. (Concrete past bug: `docs/api/form.md` linked `[createFormController](element.md)` but `element.md` documents `element` / `f` / `options`, not `createFormController`. The right target is `typescript.md#formcontroller`.)

### 7. Version references

A version bump needs a separate sweep — see the agent memory entry "Barrido completo de versiones antes de commitear un bump". The short version:

- [ ] `package.json` bumped.
- [ ] `README.md` CDN URLs bumped (`@samline/forms@<x.y.z>`).
- [ ] `docs/browser.md` CDN URL bumped.
- [ ] `example/src/content/docs/reference/browser.md` CDN URL bumped.
- [ ] `example/src/content/docs/getting-started.mdx` and `examples.mdx` CDN URL bumped.
- [ ] `CHANGELOG.md` has a new entry with a "compare" link at the bottom.
- [ ] Any prose mention of "the latest version is X" in `docs/getting-started.md`, `example/.../index.mdx`, etc.

### 8. CHANGELOG

A release is a release when it has a CHANGELOG entry. Every release adds one section in `CHANGELOG.md` with `### Added` / `### Fixed` / ### Changed bullets and a compare link at the bottom (`[X.Y.Z]: https://github.com/.../compare/vPREV...vX.Y.Z`).

## Past post-mortems

These are real bugs caught by past sweeps. Keep this list updated when a new one is discovered.

- **2.3.x (2026-07-16):** `docs/typescript.md` and `docs/options.md` (both dated jun 30) did not document `format` / `formatAll` / `formats` / `FieldFormatConfig` / `FieldFormatConfigMap` / `FormatType` even though the code shipped them in 2.3.0. The Starlight site (`example/`) was up to date; the npm-bundled docs were not. Both surfaces must stay in sync.
- **2.3.x (2026-07-16):** `docs/api/set-value.md` documented `<select multiple>` as "treated like a checkbox group", but `src/core/dom.ts → writeFieldValue` only branches on `checkbox` / `radio` / `file`; the actual behaviour is `field.value = String(value)`. Documentation claimed a code path that did not exist.
- **2.3.x (2026-07-16):** `docs/api/form.md` linked `[createFormController](element.md)` to a page that documented the `element` / `f` / `options` getters, not `createFormController`. The correct target is `typescript.md#formcontroller`.
- **2.3.x (2026-07-16):** `docs/api/regex.md` did not exist. `regex` is exported by the optional peer `@samline/formatter` and was only mentioned tangentially in `getting-started.md` and `browser.md`. Consumers had no dedicated reference.
