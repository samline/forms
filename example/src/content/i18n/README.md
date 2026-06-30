# i18n (internationalization)

This directory is optional. Add one JSON file per supported locale
here and Starlight will use them to translate the UI strings it owns.

Example (`en.json`):

```json
{ "skipLink.label": "Skip to content" }
```

See <https://starlight.astro.build/guides/i18n/\> for the full list
of supported keys.

To enable a second language, add the locale to `site.config.mjs`:

```js
locales: {
  root: { label: 'English', lang: 'en' },
  es:    { label: 'Español', lang: 'es' },
},
```

and mirror your docs under `src/content/docs/es/`.
