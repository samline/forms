import test from 'node:test'
import assert from 'node:assert/strict'
import { accentPair } from '../site-tools/accent-pair.mjs'
import { contrast, accentTargets } from '../shared/lib/contrast.mjs'

test('derived accents reach 4.5:1 for text and primary buttons in both themes', () => {
  for (const base of ['#84cc16', '#14b8a6', '#f59e0b', '#69518d', '#ef4444']) {
    const pair = accentPair(base)
    for (const [theme, color] of [
      ['light', pair.accentLight],
      ['dark', pair.accentDark],
    ])
      for (const against of Object.values(accentTargets[theme]))
        assert.ok(contrast(color, against) >= 4.5, `${base} ${theme} ${color} vs ${against}`)
  }
})

test('a passing base is kept and invalid input is rejected', () => {
  assert.equal(accentPair('#84CC16').accentDark, '#84cc16')
  assert.throws(() => accentPair('lime'))
})
