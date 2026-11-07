import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { contrast, accentTargets } from '../shared/lib/contrast.mjs'

/**
 * Derive accessible light/dark accents from one base color (the maintainer's
 * "lime green", "teal"…, as a hex value). The light accent darkens toward
 * black and the dark accent brightens toward white, in 1% steps, until both
 * the theme background and the primary-button text reach 4.5:1. A base that
 * already passes is kept unchanged.
 */
const mix = (hex, target, amount) =>
  '#' +
  [1, 3, 5]
    .map(i => {
      const from = parseInt(hex.slice(i, i + 2), 16)
      const to = parseInt(target.slice(i, i + 2), 16)
      return Math.round(from + (to - from) * amount)
        .toString(16)
        .padStart(2, '0')
    })
    .join('')
const passes = (color, { background, buttonText }) =>
  contrast(color, background) >= 4.5 && contrast(color, buttonText) >= 4.5

/** @param {string} base six-digit hex */
export function accentPair(base) {
  if (!/^#[0-9a-f]{6}$/i.test(base)) throw new Error('Pass a six-digit hex color, e.g. #84cc16')
  const color = base.toLowerCase()
  const find = (theme, target) => {
    for (let step = 0; step <= 100; step++) {
      const candidate = mix(color, target, step / 100)
      if (passes(candidate, accentTargets[theme])) return candidate
    }
    throw new Error(`No accessible ${theme} accent derives from ${base}; choose another hue.`)
  }
  return { accentLight: find('light', '#000000'), accentDark: find('dark', '#ffffff') }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  try {
    const pair = accentPair(process.argv[2] ?? '')
    const ratio = (theme, color) =>
      Object.entries(accentTargets[theme])
        .map(([name, against]) => `${name} ${contrast(color, against).toFixed(2)}:1`)
        .join(', ')
    console.log(`Light accent ${pair.accentLight} (${ratio('light', pair.accentLight)})`)
    console.log(`Dark accent  ${pair.accentDark} (${ratio('dark', pair.accentDark)})`)
    console.log(`--accent-light '${pair.accentLight}' --accent-dark '${pair.accentDark}'`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
