Cross-site UI owns presentation and behavior exactly once. Read ../AGENTS.md and README.md. Forward native/scope attributes; use typed catalogs. Tokens and branded font/assets are shared; page content stays in its owner. Every shared change requires Home, Examples and Docs validation.

Visual reference: samline/ticker at 8a30c9ca8486953fdc2801f0ceff8b17d0cb5615, local sibling ../ticker. Read REFERENCE.md and design-reference.json at this repository root. Preserve the original design, not merely similar colors. Before changing a shape, spacing, type scale, animation or component composition, consult the mapped original source; do not simplify or redesign while substituting package content.

Follow the root upstream synchronization contract: arrow setup/mountElements cleanup, live code copying, WOFF2 Fonts, shared CSS-loading policy and delayed-control/reveal regressions. Do not restore custom-element classes, copied runtime CSS or duplicate source strings.

Follow the root [PageSpeed performance contract](../AGENTS.md#pagespeed-performance-contract) for targets, asset/loading conventions, layout stability, measurement evidence and publication verification. Keep this policy linked when replicating the theme.
