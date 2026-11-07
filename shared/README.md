# Shared website foundations

The single source for Box, Section, Heading/PageTitle, buttons/links/cards, Tabs/TabPanel, CodeFrame/CodeFiles/CopyButton, Theme, DrawerStyles, Installer, Select/Field form controls and Playground. Apps compile these sources directly; no published UI package or copied component tree is needed.

styles/theme.css owns palette/font/spacing/focus/motion/breakpoint tokens. SiteHead resolves configured accents and composes Fonts. Fonts serves the local Inter, Instrument Serif and JetBrains Mono WOFF2 faces with two heading preloads; TTF inputs remain separate for social rendering. lib/code-theme.mjs is the only Shiki theme. i18n owns shared control messages and neutral demo source. Namespace theme storage per configured project.

Components keep scoped CSS, processed scripts and lifecycle cleanup. DrawerStyles adapts vendor CSS inside native scope; Drawer owns actual gestures, animation, focus and locking. Reuse complete implementations rather than copies of their CSS.

Run the root npm run verify after shared changes. Read ../ADAPTATION.md before moving these foundations into a package.

Interactive roots register arrow functions through lib/mount-elements.ts and return cleanup; tags are DOM scopes, not custom elements. CopyButton reads live code from its frame; only command controls pass explicit text. lib/demo-files.ts formats split and complete files per scenario and loading mode once from the catalog; lib/demo-source.ts generates them and copies each behavior region of lib/demo-behavior.js verbatim, so the live preview and copied code share one source. Use Select (custom chevron, appearance none, pointer cursor) and the visible-label Field for every form control; TextField keeps its visually hidden label for compact search-style inputs. lib/site-build.mjs is the shared CSS inlining policy. See ../UPSTREAM.md for reviewed commits and ../AGENTS.md for lifecycle/loading contracts.

Follow the root [PageSpeed performance contract](../AGENTS.md#pagespeed-performance-contract) for targets, asset/loading conventions, layout stability, measurement evidence and publication verification. Keep this policy linked when replicating the theme.

Custom accents are resolved once by lib/accent-theme.mjs through SiteHead. Preserve reference defaults when unchanged; non-default colors must recolor the entire semantic accent hierarchy and survive later base stylesheet delivery. Development routes isolate the Docs compiler origin, and docs landingHref returns Home/Examples links to Landing. Production remains one combined static artifact. The maintainer's preference is recorded in content-audit.json.themeReview before release.
