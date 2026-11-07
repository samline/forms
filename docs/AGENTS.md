Use validated Markdown/MDX collection entries and localized shell catalogs. Read ../AGENTS.md and README.md. Navigation derives from the collection; add translated labels, unique sidebar positions and meaningful links for new pages. CHANGELOG.md at the root is the release source. Search/ToC/Article preserve shared UI and accessibility; broad prose selectors must exclude data-ui subtrees. Preserve prior content/fragments during adaptation and record semantic coverage.

Visual reference: samline/ticker at 8a30c9ca8486953fdc2801f0ceff8b17d0cb5615, local sibling ../ticker. Read REFERENCE.md and design-reference.json at this repository root. Preserve the original design, not merely similar colors. Before changing a shape, spacing, type scale, animation or component composition, consult the mapped original source; do not simplify or redesign while substituting package content.

Follow the root upstream synchronization contract: arrow setup/mountElements cleanup, live code copying, WOFF2 Fonts, shared CSS-loading policy and delayed-control/reveal regressions. Do not restore custom-element classes, copied runtime CSS or duplicate source strings.

Follow the root [PageSpeed performance contract](../AGENTS.md#pagespeed-performance-contract) for targets, asset/loading conventions, layout stability, measurement evidence and publication verification. Keep this policy linked when replicating the theme.

## Documentation navigation visibility — 2026-10-26

The human reported that deep active sidebar links were hidden below the menu
viewport in Astro, Ticker, Drawer and the package landing/docs template. Keep the
current page visible within the menu on mounting/navigation/resize, without
scrolling the article or stealing focus. Preserve manual menu exploration and
clean up observers through mountElements. Mobile menus let Drawer focus their
dialog rather than an offscreen first link. Regression tests cover direct deep
URLs, actual navigation, resize, same-batch remount and repeated mobile opening.
Validation: both app checks, protected design checks and formatting passed;
eight source tests passed, the combined build verified 333 links across ten
pages and all 27 final Chromium tests passed. The two navigation regressions
cover deep links, actual navigation, viewport changes, remount, mobile reopen,
200% text, reachable close and focus restoration.

The human clarified active-page placement: try to bring it toward the top
using the menu's natural scroll range. Do not add margins, padding, pseudo
spacers or any artificial blank space to force final items upward. Native
scrollTop clamping is intentional. Preserve the article position, manual menu
scrolling and the reachable mobile close control. The temporary spacer approach
was rejected and removed from all four projects.

Natural-scroll correction validated: both targeted browser regressions pass in
each of the four projects (eight total). All combined artifacts rebuilt and
passed their link audits. The SEO preview was inspected: article scroll remains
0, the sidebar has no generated ::after content and no trailing-space variable.
