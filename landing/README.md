# Landing and Examples

These are one product surface. src/layouts/Main.astro composes shared metadata/fonts/theme, Header and Footer. Complete blocks are in src/sections; the shared Playground appears on Home, Examples and a Docs article. Its neutral scenarios come from one catalog (shared/i18n/translations/en/demo.ts) and one behavior file (shared/lib/demo-behavior.js); they are infrastructure, not a claimed package API. Replace those owners with the target package integration. Main uses hero.seoTitle/seoDescription and Examples uses examples.seoTitle/seoDescription for metadata; the footer and Examples link the package skill at skills/<name>/SKILL.md, served by src/pages/skills/[skill]/SKILL.md.ts. Header shows inline navigation from 80rem; below that the mobile menu, so long scoped names never wrap the header.

Editable interface/content copy is in src/i18n/translations/en. The project config owns identity, version, URLs and accents. Section/Box own layout; never add competing gutters or maximum widths.

From the root: npm run dev for two-origin development; npm run build && npm run preview for the production artifact and indexed Docs. Shared primitives live in ../shared; do not duplicate them here.

The combined build assembles Docs, local fonts, social artwork, robots and the merged sitemap into dist. CI validates the resulting site before Pages deployment. Read ../AGENTS.md and ../ADAPTATION.md for coverage and publication rules.

Follow the root [PageSpeed performance contract](../AGENTS.md#pagespeed-performance-contract) for targets, asset/loading conventions, layout stability, measurement evidence and publication verification. Keep this policy linked when replicating the theme.

Drawer integration uses the published 5.1.2 root createDrawer API, native cloned content and owned-controller destruction. Native Drawer keeps focus, dismissal, gestures and locking; the site keeps its own ARIA state and lifecycle cleanup.
