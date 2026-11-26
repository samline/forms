# @samline/forms

TypeScript-first, framework-free form controller with validation, reactive state, serialization, auto-submit, and input formatting.

Package memory: decisions and lessons specific to this package. Family rules are in the block below. `.agents/documentation.md` holds the documentation checklist for public API changes and releases.

## Package lessons

- Test published ESM, CJS, browser-module, and IIFE artifacts; source-level tests do not detect export-condition or global-name failures.
- Treat formatted visible inputs and hidden canonical mirrors as one state unit, including reset and destroy paths.
- HTML controls associated through `form="id"` belong to `form.elements` even when they are outside the form subtree.
- A single user action must enter the delegated pipeline once; use `input` consistently instead of combining `input` and `change`.
- Keep browser side-effect entrypoints listed in `package.json#sideEffects`.
- Validate release lockfiles with an empty package-manager cache; cached tarballs can hide dependencies withdrawn from the registry.
- Resolve cross-field validation dependencies as an iterative graph traversal with a visited set; do not create reciprocal watchers or recursively dispatch validation events.
- Keep public field errors serializable and stable; retain per-element ownership in controller state instead of exposing live DOM nodes through snapshots.
- Synchronize visual filled state independently from validation activation so `autoValidate: false` does not leave prefilled controls visually stale.
- Review related dependency updates as one compatibility set; action runtimes, documentation frameworks, Node engines, and custom theme selectors can require coordinated changes.
- A `MutationObserver` that reacts to every child mutation loops when a subscriber renders markup into the observed form; filter records to the mutations that actually touch form controls.
- `requestSubmit()` dispatches `submit` synchronously: a flag set around it tells the handler the submit was automatic, so it must not steal focus.
- The `reset` event fires before the browser restores defaults, and microtasks can run in between for user-initiated resets; defer the state pass to the next task.
- Destroyed controllers must ignore late calls: async submit handlers commonly settle after their owner is gone and would otherwise repaint a reused form.
- tsup's `globalName` assigns the entry module's namespace; an entry with `export default` leaks a `default` key into `window.Forms`. The IIFE uses its own named-export entry (`src/browser/iife.ts`).
- Compare the rendered header and footer with a published sibling at 1024 and 1440 pixels, not only the source: a template breakpoint change hid the header's GitHub and Get started actions while every check passed.
- Shared `Field` must apply `type` after spreading attributes; a duplicated `type` attribute keeps the first value, which showed passwords as text.
- Docs examples show each preview with its code (`<Playground preset showCode />`); never send readers to the landing to copy code.
- `validate()` does not notify subscribers: render messages from its returned `errors` when calling it outside a submit.
- npm rejects an override of a direct dependency unless its specifier matches the direct dependency exactly; keep both Vite ranges aligned and verify with test:package after changing tooling overrides.
- `<option>` / `<optgroup>` are not form controls, so the field-only `MutationObserver` filter ignored option-list changes and a select's value could change silently. Option mutations are tracked separately against a per-select selection snapshot; api methods that rewrite options call `commitOwnMutations` so the observer does not process them twice.
- A manual error may block submission only while the user can clear it by editing a control. 4.0.0 kept every manual error on submit, so a form-level key (`non_field_errors`), an unmatched server key or an error on a disabled, hidden or read-only field locked the form with nothing to focus; submit now drops those first.
- `aria-invalid` must follow the error's exposure to the user (edit, user submit, `validate()`, `setErrors()`), not its existence; `css-error` marks every error. `destroy()` must remove every attribute the controller wrote.
- Prettier only owns the paths listed in `site:format`. Never run it over `src/`, `test/` or `README.md`: it rewrites unrelated union types and signatures in the runtime source.

## Documentation must be in sync before pushing

Every code change that touches a public method, type, option, default or peer-aware behaviour **must** ship with up-to-date documentation in the same change. Out-of-date docs are a release blocker, not a follow-up.

Since 2.8.0 the package has one documentation surface plus its README:

1. **The website** — `docs/src/content/docs/` (Astro collection: guides, reference and the per-method "API in detail" pages under `api/`), the scenario catalog in `shared/i18n/translations/en/demo.ts` with its behavior regions in `shared/lib/demo-behavior.js`, and the landing copy in `landing/src/i18n/translations/en/`. Published at `https://samline.github.io/forms`.
2. **`README.md`** and **`skills/forms/SKILL.md`** — the package guide and the agent integration skill.

The Markdown `docs/` folder that used to ship in the npm tarball and the Starlight app in `example/` were retired after migration (last revision `612ac51`); `docs/` is now the Astro docs app and is excluded from npm. The full checklist lives in `.agents/documentation.md` — read it before any release task.

## Website

`SITE.md` documents commands, ownership and verification for the embedded Landing, Examples and Docs (adapted from samline/package-landing-docs; Drawer is the embedded sibling, Ticker the visual reference). Website commands use the `site:` prefix and Node 22.12+; the runtime package keeps Node 20+. `shared/AGENTS.md`, `landing/AGENTS.md` and `docs/AGENTS.md` hold app-level rules.

- Previews import `@samline/forms` through Vite aliases and tsconfig paths to `src/index.ts`. Never copy runtime logic into the site.
- One scenario catalog drives Home tabs, Examples, the Docs examples guide and the generated HTML / CDN and Package / ESM files. Behavior regions in `shared/lib/demo-behavior.js` are copied verbatim into `main.js`; keep them plain JavaScript that receives `(element, show)` and returns the controller.
- `site-e2e/site.spec.ts` replays every sample against the built IIFE and an esbuild bundle of `dist/index.js`; run `bun run build` before the browser suite.
- Accent: sky blue chosen by the maintainer (`#0369a1` light, `#38bdf8` dark), recorded in `content-audit.json.themeReview`.
- Installs use pnpm (`pnpm-workspace.yaml` lists `landing`, `docs`, `shared`); scripts run with `bun run`, website scripts with `bun run --cwd <app>`. The overrides for `parse5@^8.1.0` (hast-util-raw), `@emnapi/runtime@1.11.3` (astro check) and the patched toolchain versions live in the `# Repository overrides` block of `pnpm-workspace.yaml`. Keep them until upstream resolves.
- Since 3.0.0 the standalone script is `dist/browser/forms.global.js` (`global.global.js` stays as an identical alias) and `@samline/forms/browser` has no default export.
- `scripts/check-size.mjs` treats peers as external, so the ESM budgets exclude `@samline/formatter`; the IIFE budget includes it because the standalone script bundles it.

## PageSpeed performance contract

Performance is a shared site requirement for Home, Examples and Docs. Preserve readable content, the approved design, accessibility, keyboard controls and package behavior while optimizing. Use this section as the cross-site policy; app/shared contracts describe implementation ownership, and [README.md](README.md#performance-validation) records dated measurements and limitations.

### Goals and evidence

- For the adapted production site, aim for at least 95 mobile performance and 100 desktop, and 100 accessibility, best practices and SEO in PageSpeed. Template mode intentionally has noindex; do not remove it to chase SEO scores before adaptation is complete. These are engineering targets, not guaranteed scores or evidence of complete accessibility. Investigate metric regressions even when the overall score stays green; do not change the design merely to chase a perfect score.
- Track FCP, LCP, TBT, CLS and Speed Index separately. Aim for near-zero initialization CLS and TBT; prioritize visible content and responsiveness over diagnostic counts. Lighthouse TBT is not field INP. Missing field data means unknown real-user performance, not a Core Web Vitals pass.

### Loading and asset conventions

- Keep static content and syntax highlighting in generated HTML. Reuse Astro's processed, deduplicated scripts and existing shared components; avoid client hydration, third-party scripts and duplicate runtimes unless a concrete requirement justifies their loading cost. Keep Pagefind lazy and package animation/viewport behavior in the package owner.
- Fonts must come through shared Fonts: three local Latin WOFF2 faces, currently 96.4 KiB total, with `font-display: swap`. Preload only Inter and Instrument Serif for initial headings; do not preload every font or restore Google/Bunny stylesheets. Keep weights, character coverage, hashes, versions and licenses in shared/assets/fonts/README.md. Preserve the separate social-image TTF inputs. Recheck coverage when adding locales or weights.
- Both Astro configs use shared/lib/site-build.mjs. The current policy inlines CSS strictly below 40 KiB of uncompressed content and preserves Vite defaults for other assets. Inspect the emitted routes: a template's smaller Docs stylesheet may inline while a fully adapted documentation site needs larger cacheable CSS. Before changing the threshold, compare compressed HTML plus CSS transfer, blocking requests, cold mobile LCP and repeat/cross-route caching. Neither blanket inlining nor eliminating every external stylesheet is a goal.
- Emit highlighted code once. CopyButton reads live rendered source unless a command explicitly overrides it; never duplicate complete snippets in clipboard attributes, hidden markup or client state. Keep Shiki at build time, exact copying, final newlines and execution of complete/split examples.
- Keep hashed assets and valid base paths. Inspect actual response headers before diagnosing cache warnings. Cache TTLs are hosting observations, not application guarantees; verify the actual deployment. Do not add a service worker, caching proxy or hosting migration just to silence that audit without a separate requirement and evidence.

### Layout, initialization and motion

- Reserve control geometry before scripts run using inert plus visibility:hidden, as CopyButton and Tabs already do. Keep unavailable actions outside focus/accessibility until ready. Do not replace this with display:none or override native hidden on inactive panels. Preserve readable no-JavaScript content and test delayed-script dimensions after initialization changes.
- Finish initial tab and fragment selection before releasing inert. Initial selection must not animate. Limit interactive feedback to explicit color/background-color transitions on hover/focus, rather than the background shorthand; respect reduced motion.
- Use observer-provided geometry and batch layout reads before writes. Do not measure every Reveal block synchronously during mount or add per-item scroll listeners. Reveal uses the first IntersectionObserver snapshot, arms only offscreen blocks, anticipates entry by 64 CSS pixels and retains the 600ms fade. Initial viewport content must remain visible immediately; disconnect observers on reveal/removal.
- Prefer opacity/transform for entrance motion, with cleanup and reduced-motion alternatives. Avoid layout-property animation, blanket transition:all, persistent will-change on every item and new independent animation systems. The approved HeroBackdrop entrance lasts 4.8 seconds; if Speed Index is slow, inspect the filmstrip and trace before attributing the delay or changing that visual contract. Do not hide meaningful content to improve a score.
- Avoid unnecessary DOM and repeated generated content, while preserving readable originals, dependency-owned generated content, all examples and public fragments. Investigate long tasks and expensive measurements at their owner rather than bypassing runtime behavior. Preserve image dimensions/aspect ratios when adding media, and defer offscreen media rather than the initial LCP content.

### Measurement and completion workflow

1. Record the commit and dirty state, route, date, tool/browser versions, device, throttling and cache conditions. Build the production artifact; do not benchmark a dev server. Capture a baseline before editing. Measure Home, Examples and a representative Docs article separately when shared loading changes; Home's score cannot stand in for the gallery or docs.
2. Compare at least three cold mobile runs per before/after configuration using the same environment and median metrics. Avoid concurrent builds/tests during timing. Report compressed HTML/CSS/JS/font sizes and request changes alongside metrics; also inspect repeat navigation if caching changes. Keep raw reports locally, record reproducible conditions and summarized evidence in the owning README, and do not commit generated reports or machine-specific temporary paths as tooling.
3. Change a bounded cause, compare the result and retain it only with a justified tradeoff. Local HTTP Lighthouse and deployed HTTPS PageSpeed use different environments; never compare their scores as a controlled experiment. Label simulated and observed timings, lab and field data, single runs and medians. Report failed diagnostics as unverified, not passed. An upstream Lighthouse animation diagnostic failed internally; do not mark failed diagnostics as verified on a new project. Browser regressions and trace diagnostics are different evidence.
4. Review Home beside Examples and Docs. Run affected app checks and formatting, npm run verify, including both app checks, the combined build/link audit, adaptation builds and browser suites. Preserve e2e/upstream.spec.ts, e2e/reveal.spec.ts and related responsive, theme, enlarged-text, keyboard, no-JavaScript, copy and lifecycle coverage. Documentation-only edits need formatting/link review, not a new performance benchmark or full browser run.
5. After an authorized commit/push, confirm the deployment's exact head and successful publication, then verify the live artifact/assets before re-running PageSpeed mobile and desktop. A queued workflow or a local green build is not a published improvement. Check job logs, environment approvals, concurrency and GitHub Status when publication stalls; do not change application code or repeatedly restart workflows without evidence.

Ticker measurements belong to the upstream repository and are not a score for this template or another package. Preserve this contract when embedding the theme, merge it with project instructions and link the app/shared contracts to one policy. Record fresh evidence per adapted project; do not copy benchmark numbers or claim an untested deployment.

## Lessons that prevent repeat failures

- Reuse full implementations, not a toolbar with unhighlighted content. CodeFrame and native Markdown share one Shiki theme; CopyButton alone owns exact clipboard text, fallback and feedback reset. Check computed colors in both themes and complete copied text, including terminal newlines.
- CodeFiles composes the existing tabs and code frames. Independently copyable HTML/CSS/JS must run together; Complete file must run alone. Do not invent another tab/highlighting/clipboard controller. Preserve data-panel hooks, instance independence, keyboard selection and no-JS labels.
- Heading separates semantic level from controlled visual scale. PageTitle composes title/eyebrow/description. Choose explicit translated accents, never a last-word heuristic or arbitrary API identifier split. Verify compiled whitespace and metadata/search text.
- Examples is part of Landing. Use the exact Home preview and controls in Examples and related guides. Iframes introduce foreign typography, controls and theme plumbing; do not add them without a new user requirement.
- Keep runtime behavior in its owning dependency. Drawer owns gestures, focus trapping, Escape/backdrop, animation and scroll locking; CopyButton owns clipboard state. Add only the app integration and return explicit cleanup.
- Namespace app hooks instead of selecting a package's data attributes as controls. Query native buttons for button-only ARIA. If a moving demo has Pause, show Play when paused and the matching accessible name. Do not mix changing action labels with stable-label aria-pressed semantics.
- Dividers stay straight/visible, hover surfaces remain between them with equal vertical inset, and active navigation changes background without an extra border. Actions need a recognizable resting state. Docs stays last in the main menu.
- Headings land 2.5rem below the measured sticky header. Do not combine global scroll padding with target margins or add manual scroll restoration to compensate for drawer behavior. Test open/close scroll stability and focus restoration.
- Test the complete page at 320–1440 and back, both themes and 200% root text. Shared text buttons use min-height and wrap; grid copy uses minmax(0,1fr) and long identifiers can wrap. Never hide page overflow to conceal defects.
- Search uses local Pagefind and the native top Drawer: compact initial height, CSS growth with results, fixed close/input/intro, separately scrolling results and native upward handle. Debounce 300ms, retain old results while typing/loading, discard stale requests and clear immediately on empty input. Do not add height measurement, gestures or a second focus trap.
- The ToC tracks one current heading across nested headings, clicks, initial fragments, upward scroll and document end. Keep desktop/mobile instances synchronized without stealing focus or rewriting history on scroll.
- Preserve source documentation until a semantic audit establishes its new destination. Export-name checks, automated axe and screenshots are useful evidence, not proof of complete API docs or accessibility. Execute copied code and review actual package behavior.

## Identity convention — 2026-11-06

README structure follows the canonical template proposal, including TOC/resource
roles, installation blocks, API/guide tables, entrypoints and skill source/download.
Shared site-identity.mjs composes `<subject> — <npm name>` once for document and
social titles. Footer display credit is explicitly samline, independent of npm
author metadata. Keep the identity check in verify/release/CI, and test the real
configured header name before a substituted sibling. The maintained policy is
https://github.com/samline/package-landing-docs/blob/main/.agents/identity.md;
package-specific API content and runtime publication remain separate.

<!-- samline:family:start -->

## Family conventions (@samline)

This block is synced from the template that owns the family conventions ([package-landing-docs](https://github.com/samline/package-landing-docs) `family/AGENTS.md`, `node family/scripts/sync.mjs`). Do not edit it here; change the template and re-sync. The skill `.agents/skills/samline-package/SKILL.md` carries the full rules for a repository cloned on its own.

- One package per repository. Framework-agnostic core in JS/CSS/HTML; adapters only when idiomatic, as optional peers.
- No DOM access at import time; without a DOM, calls are no-ops. Respect `prefers-reduced-motion`; content stays visible without JavaScript.
- Arrow functions and closures, no classes or `this`. `destroy()` is idempotent and restores markup.
- Zero runtime dependencies: shared primitives (`@samline/internal`, `@samline/is-visible`, `@samline/debounce`) are devDependencies bundled with `noExternal`.
- Install with pnpm, run with Bun: `pnpm install` / `pnpm add -D` (only `pnpm-lock.yaml` is committed), `bun run <script>` for everything else. Never `bun install`, `bun add`, `npm install` or `yarn`.
- Packages talk through npm only: install the published version of any sibling package. Never link or import a local checkout (`bun link`, `link:`, `file:`, path aliases, `../other-package/src`).
- Layout: `src/core`, `src/vanilla`, `src/browser/global.ts` (`window.<PascalName>`, or a plain non-colliding name such as `Strings` when that is a built-in, never a `Samline` prefix; `dist/browser/<name>.global.js`), side-effect-free `src/index.ts`. Every public entry has a gzip budget in `package.json` → `size`.
- `bun run check` must pass: format, typecheck, unit tests with coverage thresholds, build, size budgets, e2e in Chromium, Firefox and WebKit.
- README is the package guide and the site's source of truth; public text in English. Any public API change updates tests, README, docs, examples and `skills/<name>/SKILL.md` together.
- Releases: Keep a Changelog entry for every user-facing change, semver, pinned CDN URLs bumped before release. Publishing is manual (`bun run release` by the maintainer); CI never publishes; no `--provenance`.
- Public repository: no dated reports, handoff notes, transcripts or client names; private notes go in the ignored `.local/`. Site examples with state offer Reset; icons are SVG, never Unicode glyphs.
- Work skills: `npx autoskills -y -a universal`, tracked with `skills-lock.json`, minus the `bun` skill (it contradicts pnpm installs), plus `modern-web-guidance`, consulted before HTML, CSS or client-side JavaScript work.
- Graph first, Grep last: before exploring, check `codebase-memory-mcp` `index_status` and run `index_repository` if this repository is not indexed. Then explore through the graph (`search_graph`, `trace_path`, `get_code_snippet`, `search_code`); Grep, Glob and whole-file reads are the last resort, for literals, configuration and coverage gaps, because they waste tokens.
- Delegation: the main session leads (plans, decides, owns quality and security) and delegates on its own judgment; the maintainer authorizes these subagents in advance, so never wait to be asked. Search and reading go to `Explore` (Haiku), planned implementation to `implementer` (Sonnet), review of every non-trivial diff to `reviewer` (Sonnet), always by model alias so each resolves to the newest version, defined in `.agents/agents/` (`.claude/agents` points there). Skip delegation only for questions and one-line edits. The lead steps in when an agent loops or is blocked, and verifies every agent report before calling work done.
- Never add AI attribution to commits, tags or pull requests.

<!-- samline:family:end -->
