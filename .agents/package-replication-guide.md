# Package Replication Guide

1. Copy source, tests, build configuration, documentation surfaces, and `.agents/` instructions.
2. Replace package identity, repository URLs, CDN URLs, and documentation-site configuration.
3. Preserve conditional ESM/CJS exports and isolate global IIFE exports under a dedicated subpath.
4. Run tests, typecheck, build, package dry-run, both dependency audits, and the documentation check/build.
5. Inspect the tarball to ensure `dist/`, `docs/`, README, license, and package metadata are present.
