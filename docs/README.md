# Documentation

Astro content collections validate locale, title, optional explicit titleAccent, description and sidebar group/order. Markdown is appropriate for prose; MDX composes existing shared UI. UI shell copy lives in src/i18n/translations/en, while articles live in src/content/docs. The root changelog is loaded into the same collection without copying its body.

Navigation derives from entries, checks duplicate order positions and requires a localized label for every page. The shared metadata component provides per-article canonical/social data and breadcrumbs. No empty Edit this page action is included.

Pagefind indexes article content after build and loads lazily through the top Drawer. It remains a static site. Use npm run build && npm run preview from the root to test real indexed search. The Drawer owns dismissal/focus/scroll/gestures; the integration only owns search state and rendering. ToC geometry tracks the header plus 2.5rem anchor offset.

Article frames native Astro/Shiki fences with the shared CodeFrame and preserves token spans. data-ui components are excluded from prose styles. Tabs, cards, callouts and mixed code files use shared components, not a Markdown transform that reconstructs them.

Replace all instructional starter prose with the actual API and reconcile content-audit.json before release. Read ../ADAPTATION.md; run root npm run verify and check:release after adaptation.

Follow the root [PageSpeed performance contract](../AGENTS.md#pagespeed-performance-contract) for targets, asset/loading conventions, layout stability, measurement evidence and publication verification. Keep this policy linked when replicating the theme.

Drawer integration uses the published 5.1.2 root createDrawer API, native cloned content and owned-controller destruction. Native Drawer keeps focus, dismissal, gestures and locking; the site keeps its own ARIA state and lifecycle cleanup.

## Current page visibility in documentation navigation

Navigation.astro mounts docs/src/lib/navigation-scroll.ts through the existing
mountElements lifecycle. It reveals aria-current="page" within the nearest docs
scroll region on initial layout, viewport changes and navigation/font resizing.
Only the menu scrolls. The article stays in place, and this helper does not move
keyboard focus. On layout, the menu tries to place the active page toward the top using only
its scrollTop. The browser clamps that position to the natural scroll range;
last items may remain lower. Do not add padding, margins, spacers or generated
content to force alignment. Manual menu scrolling does not snap back. ResizeObservers disconnect on removal.

MobileNavigation lets Drawer focus the dialog itself (autoFocus:false), so
revealing a deep link does not leave focus on an offscreen first control. Drawer
continues to own modal isolation, focus trapping, Escape and trigger restoration.
The same mounted navigation handles recreated mobile content and responsive
changes; do not add another global scroll handler or focus trap.

The mobile dialog keeps its close control outside the scrolling native
[data-drawer-body]. The body uses the remaining flex height and reserves space
below the close control. Scroll that body, not the entire dialog, so a deep
current page cannot hide the close action. Regression coverage clicks the close
control after revealing the active link and repeats at 200% text.
