# Deploy And Release Guide

1. Read `documentation.md` and complete both documentation surfaces.
2. Update version references and `CHANGELOG.md`.
3. Run `bun install --frozen-lockfile`, `bun run typecheck`, `bun run test:coverage`, and `bun run build`.
4. Run `npm pack --dry-run`, verify ESM/CJS/browser/IIFE entrypoints, and run `bun audit --production`.
5. In `example/`, run `npm ci`, `npm run check`, `npm run build`, and `npm audit`.
6. Publish only from a clean worktree after CI passes. Never bypass lifecycle checks.
