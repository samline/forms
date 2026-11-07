---
name: {{skill}}
description: Integrate {{npmName}} into an application. Replace this sentence with what the package does, the hosts it supports and when an agent should not use it.
metadata:
  package: '{{npmName}}'
  package-version: '{{version}}'
---

<!-- package-site:starter-skill — replace every section with verified package guidance, then delete this line. check:release fails while it remains. -->

# {{name}}

Build against the installed `{{npmName}}` version. This skill describes **{{version}}**. Check the dependency version before applying it, and preserve the host project's markup, components and design.

## The one contract

Show the smallest real create/use/cleanup flow with the actual public import.

## Choose a loading mode

- **Package / ESM:** the install command and the real import.
- **HTML / CDN:** only when a standalone build is published; pin the version and name the global it defines.

## Wire a first integration

A complete, runnable example taken from the package website's copied files.

## Options and behavior

Every option with its default, verified against source and tests.

## Frameworks and hosts

Only the hosts the website documents and tests (React, Vue, Svelte, Astro, Shopify, WordPress, server).

## Pitfalls

Real mistakes an agent should avoid, each verified against the built package.
