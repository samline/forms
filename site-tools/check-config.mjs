import assert from 'node:assert/strict'
import { project } from '../shared/lib/project.mjs'
import { contrast, accentTargets } from '../shared/lib/contrast.mjs'
for (const [accent, background, on] of [
  [project.accentLight, accentTargets.light.background, accentTargets.light.buttonText],
  [project.accentDark, accentTargets.dark.background, accentTargets.dark.buttonText],
]) {
  assert.ok(
    contrast(accent, background) >= 4.5,
    `${accent} needs 4.5:1 contrast against ${background}`
  )
  assert.ok(contrast(accent, on) >= 4.5, `${accent} needs 4.5:1 contrast for button text`)
}
console.log(`Configuration valid: ${project.base}; both accent/text pairs meet 4.5:1 contrast.`)
