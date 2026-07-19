# Changelog

All notable changes to `@samline/forms` are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0] - 2026-07-19

### Fixed

- `applyFormat` phase 2 and the capture-phase input handler now override `interpretInputAs` to `'auto'` for the initial value pass and for input events whose source is the hidden raw mirror, so a server pre-fill of the canonical raw (e.g. a Blade re-render with `value="{{ old('birthday') }}"` carrying `"19901212"` for a `d/m/Y` display + `Ymd` raw combo) is correctly converted to the display form on mount. Without the override, `@samline/formatter` v1.2.0+ — which changed `interpretInputAs` to default to `'display'` — mis-segmented the raw digits and the visible ended up showing the scrambled value (e.g. `"19/09/1212"`) instead of `"12/12/1990"`. As of `@samline/formatter@2.0.0`, the default is `'auto'` (which handles the same case via the formatter's own heuristic), so the override is now a defensive explicit declaration of intent rather than strictly required. It still serves two purposes: (1) it documents the controller's context awareness in code, and (2) it protects against a future formatter change that flips the default again. Live keystrokes on the visible input keep the formatter's default because what the user types is in display order. An explicit `interpretInputAs` in `config.options` is always respected, never overridden — pass `'display'` if you pre-render the visible in display order from the server, or `'raw'` if you want the legacy pre-1.2.0 round-trip semantics for the initial pass.

### Added

- Five regression tests under `test/api/format.test.ts`: the easytrip / Blade `old()` case (raw initial value → display form on mount), the live keystroke path (no `interpretInputAs` override applied to user typing), `setValue('field', raw)` writes the canonical raw with the `'auto'` interpretation forced, the explicit `interpretInputAs: 'display'` opt-in is preserved, and the re-bind path forwards the caller's options verbatim.

### Changed

- `docs/api/format.md` adds an "Initial value interpretation (server pre-fill)" section that documents the override and the four contexts (initial pass, mirror-source events, live keystrokes, re-bind) with the explicit opt-in caveat. With the formatter v2.0.0 default flip, the prose now notes that the override is defensive rather than strictly required.
- `example/src/content/docs/reference/api.md` (Starlight mirror) gains a "Server pre-fill" note in the `format()` summary so the npm-bundled docs and the live site stay in sync.
- `example/src/content/docs/reference/typescript.md` notes the `interpretInputAs` override in the `FieldFormatConfig` prose so consumers reading the type signature know the initial pass is the special case.
- The peer dependency `@samline/formatter` is now `^2.0.0` (was `^1.0.1`). The `^1.x` range no longer receives the v2.0.0 fix, so consumers on the previous major must pin explicitly or upgrade.

## [2.3.4] - 2026-07-16

### Fixed

- `readFieldValue` and `writeFieldValue` now respect the `name="foo[]"` convention for multi-value inputs. Previously, `getValue` returned only the first matching input's value and `setValue` wrote the same string to every matching input, breaking custom validators that check `Array.isArray(value)` on fields like `docusign_email[]`. The `[]` suffix is the de facto HTML pattern for array inputs (PHP, Rails, Express, Spring); the controller now treats it as the explicit signal for "collect all values as an array".

### Added

- Eleven regression tests under `test/api/array-syntax.test.ts` covering `getValue` / `setValue` with `name="foo[]"` for text, email, checkbox, and file inputs (the last via a hand-built `FileList`), plus guards that `name="foo"` (no brackets) keeps the original first-value / broadcast semantics and that custom validators keyed on the bracketed name now receive the full array.

### Changed

- `docs/api/get-value.md` and `docs/api/set-value.md` document the `name="foo[]"` behaviour in the per-field-type tables, with a new example for each direction and a dedicated edge-case bullet describing the explicit opt-in. `example/src/content/docs/reference/api.md` mirrors the note in the Starlight reference so the npm-bundled docs and the live site stay in sync.

## [2.3.3] - 2026-07-16

### Fixed

- `syncVisualState` was routing `css-filled` and `css-error` to the **visible** input only on the user-typing path (`handleDelegatedEvent`). Every other path — `validate()`, `revalidate()`, `setErrors()`, `clearErrors()` with a name list, the initial mount, and the `MutationObserver`-driven re-sync — still wrote the attribute to the hidden raw mirror. For formatted fields the project label never matched `:has([css-error])` and the error indicator was invisible. The fix centralises the canonical→display name resolution inside `syncVisualState` itself, so all five call sites are fixed at once and the visual attribute contract documented in `api/format.ts` is honoured by every public entrypoint.

### Added

- Seven regression tests under `test/api/format.test.ts`: `validate()` (no-arg and with an explicit name list), `revalidate()`, `setErrors()` (array and map form), `clearErrors()` with a name list, and the initial-mount path with a pre-populated hidden mirror.

### Changed

- `docs/css-styling.md` adds a callout after the `:has()` recipe explaining that the hidden mirror created by `format()` lives outside any label and that the controller always targets the visible.
- `docs/recipes.md` adds a one-liner to the mirror-convention section cross-referencing the styling page.

## [2.3.2] - 2026-07-16

### Fixed

- `css-filled` and `css-error` were being written to the hidden raw mirror for fields wired through `format()`, so the `:has([css-filled])` selector on the project label parent never matched and the label text stayed invisible. `handleDelegatedEvent` now resolves the event target to the display name and calls `syncVisualState([displayName])` so visual attributes land on the element the user sees. The data path (validation, errors, raw mirror) is unchanged.

### Added

- Three regression tests for the user-typing path: `css-filled` on the visible after a keystroke, `css-filled` on the visible when `setValue` writes the canonical, and a guard for non-formatted fields.

## [2.3.1] - 2026-07-15

### Fixed

- When `format()` was called multiple times in the same tick (e.g. `format(phone)` + `format(date)` + `format(general)` at form init), the first `applyFormat` to resume from `await loadFormatter()` would bind every entry in the bucket with the first call's config; the subsequent calls short-circuited on the "already bound" check. The easytrip registration form hit this: phone formatter ran for all three fields, so date and tag_number output was phone-style instead of date / general. Phase 2 of `applyFormat` is now scoped to the entries the current call touched (via a local `phase1Entries` array) instead of iterating the whole bucket.

### Added

- Regression test covers the three-sequential-`format()` case end-to-end.

## [2.3.0] - 2026-07-15

### Changed

- **`format()` mirror convention inverted.** The canonical name (`<field>`) now carries the raw value on a hidden input appended to the form; the visible input is renamed to `<field>_displayed` (or whatever `displayField` resolves to). Both names are first-class in the controller's API: `getValue('phone')` returns the raw, `getValue('phone_displayed')` returns the formatted, `watch('phone', cb)` fires with the raw, etc. `rawField` config renamed to `displayField`.
- `format()` runs in two phases: phase 1 (sync) renames the visible and creates/reuses the hidden mirror; phase 2 (async) loads the formatter peer and binds the input listener. The sync phase rolls back on a missing peer so the DOM is left exactly as the developer authored it.
- `state.listeners` tracks `capture?` to match `addEventListener` (`exactOptionalPropertyTypes: true`).
- `destroy()` restores the visible's name to the canonical form and detaches every capture-phase listener added by `format()`.

### Notes

- No peer changes — options are still forwarded to `@samline/formatter` as before, so `datePattern`, `dateRawPattern`, `rawPrefix`, `rawSuffix`, `prefixMode`, `suffixMode`, etc. all keep working identically.

## [2.2.3] - 2026-07-14

### Fixed

- Cursor jumped past digits when backspacing adjacent to a delimiter. `applyFormattedValue` ignored `InputEvent.inputType` and `computeCursorPosition` counted non-format characters to the left of the caret without ever pulling the cursor back past a re-inserted delimiter. After a `deleteContentBackward` / `deleteWordBackward` the caret could land with a format character immediately on its left, so the next backspace removed the delimiter instead of the digit the user expected to delete.
- `applyFormattedValue` now threads `InputEvent.inputType` from `buildHandler` and applies cleave.js' `postDelimiterBackspace` scan in **both** branches of the function (early-return and full `computeCursorPosition`), so the contract holds whether or not the formatter rewrites the visible value.

### Added

- Four vitest cases under `test/api/format.test.ts` covering the `postDelimiterBackspace` contract for `deleteContentBackward` adjacent to a delimiter, deletion of a delimiter itself, `deleteWordBackward` in the middle of a formatted value, and a DD/MM/YYYY date field with the caret parked after the first slash.

## [2.2.2] - 2026-07-10

### Fixed

- `@samline/formatter` peer was being silently left as a bare specifier in the IIFE bundle, so `format()` / `formatAll()` did not run in Vite / Rollup production builds. The dynamic import carried a `/* @vite-ignore */` hint, which told Rollup to leave the literal `'@samline/formatter'` in the bundle.
- The IIFE build now bundles the peer; ESM and CJS still externalize it. Consumers that need to ship the formatter separately can do so via a bundler-level externals configuration.

## [2.2.1] - 2026-06-30

### Changed

- Documentation references aligned to 2.2.1 (CDN URLs in `README.md` and `docs/browser.md`).

## [2.2.0] - 2026-06-30

### Added

- `browser` singleton export for bundler usage — the same `{ form, newForm, destroyForm, available }` surface as the IIFE, but as a module-level singleton, so bundler consumers can use the registry helpers without opting into the IIFE `globalThis` side-effect.

### Fixed

- `format()` integration tests: raw mirror handling on `setValue` writing the display name (the visible's `.value` was being clobbered by the canonical write path).

## [2.1.0] - 2026-06-30

> Not tagged at the time. The version was bumped and published; this entry is reconstructed from the commit log between v1.0.3 and v2.2.0.

### Added

- `@samline/formatter` peer dependency. The controller reads the peer at runtime via a dynamic import; a missing peer is non-fatal — a single `console.error` is logged and `format()` becomes a no-op so the rest of the form keeps working.
- `format()` / `formatAll()` / `format` options API: `type`, `field` (string or `string[]`), `options` forwarded to the peer, `displayField` for the visible's name.
- `onSubmit`, `watch`, `observe`, `unwatch`, `subscribe`, `prefill`, `append`, `setErrors`, `clearErrors`, `setValue`, `getValue`, `getField`, `getData`, `getState`, `reset`, `autoSubmit`, `disableAutoSubmit`, `validate`, `revalidate`, `destroy` — the per-method api/ factories.

### Changed

- **Package focus narrowed to vanilla JS and direct browser usage.** Framework-specific variants and docs were removed (`refactor: remove framework-specific variants and docs, simplify package structure`). The README was rewritten to reflect the new focus.
- Browser global renamed to `Forms` and a registry helper added: `Forms.newForm({ id, options })` stores the controller under `Forms.available[id]`, `Forms.destroyForm(id)` calls `destroy()` and removes the entry.
- `watch()` and `observe()` callbacks now receive the field element(s) as an additional argument, so consumers can read attributes (`css-filled`, `css-error`, `aria-*`, …) without doing their own DOM lookup.
- "API at a glance" section added to the README and browser usage clarified.
- Installation instructions updated to use `bun`.
- Deployment branch for the GitHub Pages docs site changed to `v2`.
- Accessibility skill and patterns documented.

## [1.0.3] - 2026-05-31

### Fixed

- Manual errors were not cleared when the affected field changed. The controller now deletes the entry from `state.manualErrors[canonical]` on the next `input` / `change` event of the affected field, unless `clearManualErrorsOnChange: false` is passed via `FormControllerOptions`.

## [1.0.2] - 2026-03-24

### Fixed

- `npm publish` workflow was failing in CI; auth check fixed.

## [1.0.1] - 2026-03-24

### Fixed

- First stable patch on the 1.x line (release plumbing).

## [1.0.0] - 2026-03-24

### Fixed

- `npm publish` workflow: npm auth check on the publish job.

## [0.1.0] - 2026-03-24

### Added

- Initial release of `@samline/forms`. Vanilla JS form controller with framework-specific variants (React, Vue, Svelte) initially included; bundled `.local/` agent docs at the repo root.

[Unreleased]: https://github.com/samline/forms/compare/v2.4.0...HEAD
[2.4.0]: https://github.com/samline/forms/compare/v2.3.4...v2.4.0
[2.3.4]: https://github.com/samline/forms/compare/v2.3.3...v2.3.4
[2.3.3]: https://github.com/samline/forms/compare/v2.3.2...v2.3.3
[2.3.2]: https://github.com/samline/forms/compare/v2.3.1...v2.3.2
[2.3.1]: https://github.com/samline/forms/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/samline/forms/compare/v2.2.3...v2.3.0
[2.2.3]: https://github.com/samline/forms/compare/v2.2.2...v2.2.3
[2.2.2]: https://github.com/samline/forms/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/samline/forms/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/samline/forms/compare/v1.0.3...v2.2.0
[1.0.3]: https://github.com/samline/forms/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/samline/forms/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/samline/forms/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/samline/forms/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/samline/forms/releases/tag/v0.1.0
