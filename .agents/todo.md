# Project Todo

- Keep tests, typecheck, package build, documentation build, audits, and tarball checks green in CI.
- Update both `docs/` and `example/src/content/docs/reference/` with every public API change.
- Review dependency update pull requests and regenerate committed build artifacts before release.
- Evaluate syncing initial visual state independently from `autoValidate`; Easytrip currently self-assigns a prefilled select to force `css-filled`.
- Design explicit `dependsOn` metadata for custom cross-field validators before adding reactive validation beyond `sameAs`.
- Evaluate per-item collection validation and strict numeric/range rules against Easytrip's repeated signer emails and formatted amounts.
- Explore promise-aware submit state and a small `addCleanup()` lifecycle hook before attempting full third-party field adapters.
