// site.config.mjs
//
// THIS IS THE ONLY FILE YOU (OR THE AGENT) NEED TO EDIT.
//
// Every Starlight/Astro setting that varies per package — site URL,
// base path, title, description, repo links, sidebar structure —
// lives here. `astro.config.mjs` reads from this file and passes
// the values to the Starlight integration.
//
// After cloning this template into a new package, edit the values
// below, then run `npm run dev` to preview the docs locally.

import { defineSiteConfig } from './site.schema.mjs';
/** @typedef {import('./site.schema.mjs').SiteConfig} SiteConfig */

/** @type {SiteConfig} */
const siteConfig = defineSiteConfig({
	// ---- Identity ----------------------------------------------------------
	// Visible in the browser tab, page metadata and the sidebar header.
	title: 'Forms',

	// Used in <meta name="description"> and social share cards.
	description:
		'@samline/forms — TypeScript-first form validation, reactive state, serialization, auto-submit, and optional formatting without a UI framework.',

	// ---- GitHub Pages deployment -----------------------------------------
	// GitHub Pages serves this site at:
	//   https://<GITHUB_OWNER>.github.io/<GITHUB_REPO>/
	//
	// Examples:
	//   Project site  →  https://acme.github.io/cleave-zen/
	//   Org site      →  https://acme.github.io/docs/
	//
	// ⚠️  Do NOT include a trailing slash on `site`.
	// ⚠️  `base` MUST start with a slash and MUST NOT end with a slash.
	site: 'https://samline.github.io',
	base: '/forms',

	// Where the source content lives on GitHub — used for the
	// "Edit this page" link that Starlight adds to every page.
	editLinkBaseUrl:
		'https://github.com/samline/forms/edit/main/',

	// ---- Sidebar -----------------------------------------------------------
	// Explicit navigation tree so the order is stable across builds.
	sidebar: [
		{
			label: 'Guide',
			items: [
				{ slug: 'getting-started' },
				{ slug: 'guides/validation-and-errors' },
				{ slug: 'guides/formatting' },
				{ slug: 'reference/examples' },
			],
		},
		{
			label: 'Reference',
			items: [
				{ slug: 'reference' },
				{ slug: 'reference/configuration' },
				{ slug: 'reference/api' },
				{ slug: 'reference/controls' },
				{ slug: 'reference/typescript' },
				{ slug: 'reference/entrypoints' },
				{ slug: 'reference/regex' },
				{ slug: 'reference/browser' },
				{ slug: 'reference/css-styling' },
			],
		},
	],

	// ---- Social links (optional) -----------------------------------------
	// Icon names must match the icons listed at:
	// https://starlight.astro.build/reference/icons/
	social: [
		{ icon: 'github', label: 'GitHub', href: 'https://github.com/samline/forms' },
	],

	// ---- Locale (optional) -----------------------------------------------
	// Set `defaultLocale` to 'en' or another BCP-47 tag, and add an entry
	// to `locales` for each language you want to support.
	defaultLocale: 'en',
	locales: {
		root: { label: 'English', lang: 'en' },
	},
});

export default siteConfig;
