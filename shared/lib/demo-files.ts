import { format, resolveConfig } from 'prettier'
import { scenarios, homePresets, demoModes, type DemoPreset } from '../i18n/translations/en/demo'
import controls from '../i18n/translations/en/controls'
import { htmlFor, javascriptFor, stylesFor, type DemoMode } from './demo-source'
import { project } from './project.mjs'

export type { DemoMode }

// Read formatting options once at build time. Every consumer shares the same files.
const options = await resolveConfig(process.cwd())

const scriptTag = (mode: DemoMode, separate: boolean, preset: DemoPreset) => {
  const type = mode === 'esm' ? ' type="module"' : ''
  if (separate) return `<script${type} src="./main.js"${mode === 'esm' ? '' : ' defer'}></script>`
  return `<script${type}>\n${javascriptFor(preset, mode)}\n</script>`
}

const documentFor = (separate: boolean, preset: DemoPreset, mode: DemoMode) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${scenarios[preset].title}</title>
${separate ? '<link rel="stylesheet" href="./style.css">' : `<style>\n${stylesFor(preset)}\n</style>`}
</head>

<body>
<main>
${htmlFor(preset)}
</main>

${mode === 'cdn' && project.delivery.cdnScript ? `<script src="${project.delivery.cdnScript}"></script>\n` : ''}${scriptTag(mode, separate, preset)}
</body>
</html>`

const build = async (preset: DemoPreset, mode: DemoMode) => ({
  files: [
    {
      id: 'html',
      label: controls.codeFiles.html,
      filename: 'index.html',
      language: 'html' as const,
      code: await format(documentFor(true, preset, mode), { ...options, parser: 'html' }),
    },
    {
      id: 'css',
      label: controls.codeFiles.css,
      filename: 'style.css',
      language: 'css' as const,
      code: await format(stylesFor(preset), { ...options, parser: 'css' }),
    },
    {
      id: 'javascript',
      label: controls.codeFiles.javascript,
      filename: 'main.js',
      language: 'javascript' as const,
      code: await format(javascriptFor(preset, mode), { ...options, parser: 'babel' }),
    },
  ],
  complete: {
    code: await format(documentFor(false, preset, mode), { ...options, parser: 'html' }),
  },
  markup: await format(htmlFor(preset), { ...options, parser: 'html' }),
})

const cache = new Map<string, ReturnType<typeof build>>()
/** Formatted files for one scenario and loading mode, generated once per build. */
export const createDemoFiles = (preset: DemoPreset = homePresets[0], mode: DemoMode = 'esm') => {
  const key = `${preset}:${mode}`
  if (!cache.has(key)) cache.set(key, build(preset, mode))
  return cache.get(key)!
}

/** The first Home scenario in its first loading mode, used by Getting started and Recipes. */
export const demoFiles = createDemoFiles(homePresets[0], demoModes[0])
