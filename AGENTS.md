# AGENTS

## Main Instruction

Before starting any task in this repository, the AI must first read `.agents/agent-index.md`.

That file acts as the master index of the project's internal instructions and defines which other documents in `.agents/` should be reviewed based on the type of work.

## Mandatory Reading Rule

When starting a new conversation or a new task inside this repository, the AI must follow this order strictly:

1. **Graph Query (MCP):** Whenever the agent needs to see files, the directory structure, or any element of the project, it must first use the `codebase-memory-mcp` MCP to get the information from the graph.
2. Read `.agents/agent-index.md`.
3. Determine the type of task.
4. Read the additional internal documents that `.agents/agent-index.md` points to for that context.

---

## Available Internal Documents

The AI must use `.agents/agent-index.md` as the entry point to locate and review, when applicable:

1. `.agents/package-replication-guide.md`
2. `.agents/deploy-and-release-guide.md`
3. `.agents/todo.md`
4. `.agents/lessons.md`
5. `.agents/new-project.md`

---

## Interpretation Rule

The files inside `.agents/` are internal instructions for the AI, not public documentation of the package.

The AI must treat them as operational context of the project.

> **Critical Git Note (updated 2026-07-13):** `AGENTS.md` and `.agents/` **are versioned** and appear in git. They are only excluded from the published npm tarball via `.npmignore`. The old convention of keeping them out of Git is deprecated.

---

## Minimum Cases

### General task
1. Query the graph with `codebase-memory-mcp`.
2. Read `.agents/agent-index.md`.
3. If applicable, review `.agents/todo.md` and `.agents/lessons.md`.

### New package or new scaffold
1. Query the graph with `codebase-memory-mcp`.
2. Read `.agents/agent-index.md`, `.agents/package-replication-guide.md`, `.agents/new-project.md`, `.agents/todo.md` and `.agents/lessons.md`.

### Release, deploy, or publish
1. Query the graph with `codebase-memory-mcp`.
2. Read `.agents/agent-index.md`, `.agents/deploy-and-release-guide.md`, `.agents/todo.md` and `.agents/lessons.md`.

---

## Agent skills and memory location

Agents, Claude included, store and read project skills and memory in `.agents/`. Skills are created and edited only in `.agents/skills/`. `.claude/skills` is a tracked relative symlink to `../.agents/skills` because Claude Code loads project skills only from `.claude/skills/`; never keep a second copy there. On Windows, clone with `git config core.symlinks true`.

---

## Persistence Rule

If the user adds new internal rules, todos, or lessons, the AI must keep the corresponding documents inside `.agents/` updated.

If during a session the AI saves context in the chat session memory and that content corresponds to an internal rule, a todo, a lesson, or an operational preference of the project, it must also persist it in the appropriate file in `.agents/` to keep coherence if the session is cleared.

The AI must also preserve the current convention: `AGENTS.md` and `.agents/` are versioned in git but excluded from the published npm tarball.

---

---

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
- `site-e2e/site.spec.ts` replays every sample against the built IIFE and an esbuild bundle of `dist/index.js`; run `npm run build` before the browser suite.
- Accent: sky blue chosen by the maintainer (`#0369a1` light, `#38bdf8` dark), recorded in `content-audit.json.themeReview`.
- Bun resolution needs `overrides` for `parse5@^8.1.0` (hast-util-raw) and `@emnapi/runtime@1.11.3` (astro check). Keep them until upstream resolves.

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
