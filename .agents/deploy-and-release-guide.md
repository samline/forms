# Deploy And Release Guide

1. Read `documentation.md` and complete every documentation surface.
2. Update version references (`package.json`, `project.config.json`, `content-audit.json`, CDN URLs, skill) and `CHANGELOG.md`.
3. Run `bun install --frozen-lockfile`, `bun run typecheck`, `bun run test:coverage`, `bun run build` and `bun run test:package`.
4. Run `npm pack --dry-run`, then `bun audit --production`.
5. Run `bun run site:verify` and `bun run site:check:release`.
6. Publish only from a clean worktree after CI passes. Never bypass lifecycle checks. Deploy the website (GitHub Pages, `deploy.yml`) after the npm release so CDN URLs resolve.
