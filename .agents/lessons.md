# Project Lessons

- Test published ESM, CJS, browser-module, and IIFE artifacts; source-level tests do not detect export-condition or global-name failures.
- Treat formatted visible inputs and hidden canonical mirrors as one state unit, including reset and destroy paths.
- HTML controls associated through `form="id"` belong to `form.elements` even when they are outside the form subtree.
- A single user action must enter the delegated pipeline once; use `input` consistently instead of combining `input` and `change`.
- Keep browser side-effect entrypoints listed in `package.json#sideEffects`.
