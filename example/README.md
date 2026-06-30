# Starlight Documentation Template for the Packages Monorepo

A copy-paste-ready [Astro](https://astro.build/) +
[Starlight](https://starlight.astro.build/) template, designed to live
inside each package of the `Packages` monorepo and deploy automatically
to **GitHub Pages** (e.g. `https://<owner>.github.io/<package>/`).

## Why this exists

Every package in this monorepo needs public documentation. Instead of
bootstrapping the same Starlight project by hand every time, this
template gives every package a head start:

- A single file (`site.config.mjs`) the maintainer (or an AI agent)
  edits to set identity, repo links and the GitHub Pages base path.
- A pre-wired GitHub Actions workflow that deploys to Pages on every
  push to `main` — zero additional CI setup.
- An `AGENTS.md` that any AI agent can read to know exactly how to
  populate the template with package-specific content.

---

## Quick start

### 1. Clone or copy this template

```bash
# Either: copy the directory tree into your package's docs folder
cp -R ../docs-template ./docs

# Or: in a fresh repo, use as a starting point
# ...
cd your-package
mkdir docs
cp -R ../docs-template/. docs/
```

### 2. Configure the site

Open `site.config.mjs` and replace the four placeholders at the top:

```js
title: 'Your Package',                                 // site title
description: 'One-sentence description of the package', // meta description
site: 'https://YOUR_GITHUB_USERNAME.github.io',         // owner only
base: '/YOUR_PACKAGE_NAME',                             // repo name as /repo
editLinkBaseUrl: 'https://github.com/OWNER/REPO/edit/main/',
```

Also update the GitHub link in `src/content/docs/index.md`.

### 3. Add the homepage and feature pages

Replace the placeholder content inside `src/content/docs/`. See
`AGENTS.md` for the recommended file layout and frontmatter rules.

### 4. Preview locally

```bash
npm install
npm run dev
# → http://localhost:4321
```

Type-check frontmatter and any custom components:

```bash
npm run check
```

### 5. Deploy

Push to `main` — the bundled GitHub Actions workflow
(`.github/workflows/deploy.yml`) builds and publishes the site to
GitHub Pages.

One-off repo setting: **Settings → Pages → Build and deployment →
Source: GitHub Actions**.

After the action finishes (≈30 s), the site is live at:

```
https://YOUR_GITHUB_USERNAME.github.io/YOUR_PACKAGE_NAME/
```

---

## File-by-file tour

| Path                                       | What it is                                                  |
| ------------------------------------------ | ----------------------------------------------------------- |
| `site.config.mjs`                          | ⭐ The only per-package config. **Edit this.**                |
| `site.schema.mjs`                          | Runtime validator for `site.config.mjs`.                    |
| `astro.config.mjs`                         | Astro + Starlight glue. Reads everything from above.        |
| `src/content.config.ts`                    | Frontmatter schema for the docs content collection.         |
| `src/content/docs/`                        | The documentation content. Add `.md`/`.mdx` here.           |
| `public/`                                  | Static assets served as-is (favicon, screenshots).          |
| `src/assets/`                              | Images imported by MDX components (optimised by Astro).     |
| `.github/workflows/deploy.yml`             | Auto-deploys `dist/` to GitHub Pages on every push to main. |
| `AGENTS.md`                                | AI-agent instructions (use this if you delegate to Copilot).|
| `README.md`                                | The file you are reading right now.                         |

---

## NPM scripts

| Script           | What it does                                           |
| ---------------- | ------------------------------------------------------ |
| `npm run dev`    | Start the dev server with HMR at `http://localhost:4321`. |
| `npm run build`  | Build the production site to `./dist/`.                |
| `npm run preview`| Preview the built site locally.                        |
| `npm run check`  | Type-check frontmatter and TS sources.                 |
| `npm run astro`  | Pass-through to the `astro` CLI.                       |

---

## Updating the template

This template is a regular Git repo. To pull template improvements
into existing package docs:

```bash
# From the package repo:
git remote add template /path/to/docs-template       # local path or git URL
git fetch template
git merge template/main --allow-unrelated-histories  # resolve per file as needed
```

If you'd rather rebase on the latest template periodically, keep the
template as a remote branch and merge with a manual conflict strategy.

---

## License

MIT — see [LICENSE](LICENSE).
