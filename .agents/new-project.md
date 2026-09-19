# New Project Checklist

- Define package name, scope, runtime targets, module formats, browser-global name, and optional peers.
- Add strict TypeScript, Vitest with coverage thresholds, build configuration, conditional exports, and CI before feature work.
- Create `docs/` and the Starlight reference together, using the source types as the contract.
- Add release automation only after `npm pack --dry-run` and artifact smoke tests pass locally.
