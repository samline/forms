---
title: Reference
description: Authoritative documentation for every public symbol in @samline/forms.
template: doc
sidebar:
  order: 1
---

This section documents the complete public surface of `@samline/forms`. Pages are grouped by concept — configuration, API, types, browser usage, styling, and examples — so you can scan to what you need without diving into the source.

:::note
If you add a new page under `src/content/docs/reference/`, declare its `slug` inside the `sidebar` array in `site.config.mjs` to control its position.
:::

## Sections in this reference

- [Configuration](/forms/reference/configuration/) — every `FormControllerOptions` field, with defaults and rationale.
- [API](/forms/reference/api/) — method-by-method signatures, parameters, return shapes, and behaviour tables.
- [TypeScript](/forms/reference/typescript/) — every exported type, callback signature, and helper return shape.
- [Browser global](/forms/reference/browser/) — the `window.Forms` IIFE for no-bundler setups (Shopify, WordPress, classic templates).
- [CSS styling](/forms/reference/css-styling/) — recipes for the `css-filled` and `css-error` attributes.
- [Examples](/forms/reference/examples/) — end-to-end recipes for common real-world scenarios.