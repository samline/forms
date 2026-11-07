// Standalone IIFE entry (`dist/browser/global.global.js`).
// tsup assigns this module's named exports to `window.Forms` through
// `globalName`, so the global has exactly the documented shape, with no
// `default` key: { form, newForm, destroyForm, available }.

import { browser } from './registry'

export const { form, newForm, destroyForm, available } = browser
