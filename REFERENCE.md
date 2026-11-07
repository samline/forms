# Visual source of truth

This theme derives from [samline/ticker](https://github.com/samline/ticker), commit `8a30c9ca8486953fdc2801f0ceff8b17d0cb5615`. If the design or behavior is unclear, inspect the original before rebuilding it. The local sibling is `../ticker/` when both repositories are in Packages.

Home, Examples and Docs must retain the original shapes, color hierarchy, typography, borders/radii, layout, gaps, hover/focus/motion and responsive conventions. Neutralizing content does not authorize redesigning a section. Adapt actual runtime integrations and package data without replacing the presentation.

`design-reference.json` maps extracted components to immutable source paths and records their style fingerprints. `npm run check:design` catches unreviewed stylesheet drift. For intentional design changes requested by the user, review the source side by side, document the exception and update its fingerprint. Do not automatically bless a failing fingerprint.

Reference groups: Hero/Section/Box and Main for page geometry; SectionHeading/FeatureCard/StepCard/RuntimeItem/RecipeCard/FaqItem/CallToAction for sections and effects; Header/MobileMenu/Footer for navigation; DemoStudio/DemoPanel/DemoFooter for real shared previews; shared Heading/PageTitle, CodeFrame/CodeFiles/CopyButton/Tabs, Theme and DrawerStyles for primitives.

The neutral scenario catalog (plain string transforms) is scaffolding. It replaces the dependency-specific moving content inside the original demo frame, not the frame's design. Fonts retain their licenses and names. Package APIs, screenshots, claims and release history are not inherited from the source package.

The reference is the committed snapshot, not another agent's working tree. If Ticker has uncommitted changes, do not copy, modify or bless them as part of this theme. Consult the pinned commit with git show; review later committed improvements deliberately. The local font assets preserve Inter, Instrument Serif and JetBrains Mono, including their upstream licenses.

Accessibility-only deviations: Surface allows long placeholder copy to wrap; mobile footer columns adapt to their text size so 200% text does not overflow. Code blocks are named focusable groups, rather than repeated page landmarks. Default shapes, spacing and palette remain those of the pinned source.

The current reviewed revision supersedes c74ec91. UPSTREAM.md records all four reviewed commits, applicability and regression coverage. The gallery additionally colocates the original compact recipe frame styles around its neutral recipe; its presentation matches the updated source composition. Style fingerprints also cover Fonts and the shared mount/build policies.

Docs Header scopes its GitHub visibility under .header so shared Button style emission order cannot override the mobile hidden state when route CSS inlines. Computed intended visibility is unchanged. Font licenses are copied separately into font-licenses/; old TTF notices remain alongside the social inputs.

ThemeToggle likewise uses its root context for button geometry, preserving the original zero padding and icon size when Button CSS inlines later. The computed icon was 6 CSS pixels wide before this correction; the intended 1.125rem width/height is covered in all three routes.

## Adaptation review — Drawer lessons, 2026-10-19

Confirm a new package’s accent preference before branding when it was not supplied; inherited lavender is not approval. Record the source and both theme values in content-audit.json.themeReview. Release checks reject missing or mismatched theme review. Keep the full semantic accent family consistent; neutral backgrounds, typography, geometry and shared component ownership remain the Ticker reference.

A CSS fingerprint cannot validate markup, useful demos or content coverage. Preserve multi-scenario Home tabs, replace every neutral scenario and its controls, compose real previews through DemoStudio/Panel/Footer, and reuse those previews on all three destinations. Provide complete copied sources for each supported loading mode. Test the exact viewer output rather than synthesizing an ESM recipe from CDN during testing. Keep installation concise and link exhaustive preserved contracts separately. API navigation follows a useful learning order.

Development and production are separate checks: two Astro compilers cannot share ambiguous /src module URLs through an HTML-only proxy. Dev article links redirect to the Docs origin, while shared docs landingHref returns Home/Examples links to their own origin; production keeps the combined same-origin artifact. Review Home → Examples → Docs → Home in the browser and inspect for compilation overlays. Do not claim “all reviewed” from existing automated checks alone.

Reviewed accessibility exception: PageTitle now uses a minmax(0, 1fr) grid track and wraps long identifiers in its description. The complete Drawer article sweep exposed configureDrawer(options?) expanding its title children to about 434 CSS pixels at a 320 viewport with 200% root text. This fixes intrinsic sizing without clipping, smaller fonts or a new title scale. Only the PageTitle fingerprint was updated after source review; a browser regression exercises that input in both themes.

The same all-article sweep found the longer createDrawerController(options?) breadcrumb exceeding its mobile gutter at enlarged text. ArticleHeader now permits intrinsic wrapping on breadcrumb flex items and keeps API detail pages labeled as API material. The typography regression includes this breadcrumb; no clipping or font reduction was added.

## Documentation menu active-link correction

The human requested visible active links in the scrollable docs navigation.
The desktop layout, palette and typography remain unchanged. The mobile menu
now scrolls its native Drawer body independently, reserving 3rem below the
existing close control so it stays reachable when a deep active link is revealed.
This is a bounded mobile interaction correction; no protected style fingerprint
was replaced. The menu delegates focus and dismissal to Drawer as before.

## Header breakpoint and gallery columns — 2026-11-05

Reviewed responsive correction requested through the Formatter adaptation review. With the pinned 64rem breakpoint, the landing header's six navigation links plus theme, GitHub and Get started wrapped to a second row between 64rem and about 69rem (130 instead of 81 CSS pixels at 1024), and up to about 73rem with a long scoped name such as @samline/formatter; Drawer's built site reproduces it. Header now shows inline navigation and its GitHub/Get started actions from 80rem (xl), and MobileMenu's matchMedia and display rule move to 80rem with it. Shapes, spacing, palette and the menu itself are unchanged. Only the MobileMenu fingerprint changed (its media query); Header's change is utility classes outside the fingerprinted style.

ExamplesGallery navigation previously fixed four columns, leaving orphan rows for six items. It now reads --recipe-columns, derived from the scenario count (count up to four; otherwise three when divisible by three and not four, else four), with the original two- and one-column fallbacks. Only that grid-template-columns value changed; the ExamplesGallery fingerprint was updated after review. Logo (not fingerprinted) adds min-width: 0 and overflow-wrap: anywhere so long names wrap at 320 pixels and 200% text.

Forms adaptation, 2026-11-06: the 80rem header change above was only half applied in the template (Button.astro has no `.btn.xl\:inline-flex` override, so GitHub and Get started never appeared, and Tailwind's xl is 75rem). Forms reverted Header to `lg` and MobileMenu to 64rem, matching Ticker, Drawer, Notify and Formatter; the MobileMenu fingerprint is Drawer's again. The template session was asked to settle one breakpoint for every site. The template then settled the same fix (61cc0d8): GitHub is icon-only and the version badge hides between 64rem and 75rem through utilities, with no fingerprint change; Forms now uses those template files unchanged.
