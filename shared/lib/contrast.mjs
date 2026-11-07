/** WCAG relative luminance and contrast for six-digit hex colors. */
const channel = value => {
  const n = parseInt(value, 16) / 255
  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
}
/** @param {string} hex */
export const luminance = hex =>
  hex
    .slice(1)
    .match(/../g)
    .map(channel)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0)
/** @param {string} a @param {string} b */
export const contrast = (a, b) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}
/**
 * Each accent must reach 4.5:1 against its theme background and against the
 * primary-button text drawn on it. Values come from shared/styles/theme.css.
 */
export const accentTargets = {
  light: { background: '#faf9fc', buttonText: '#ffffff' },
  dark: { background: '#1d1c23', buttonText: '#101014' },
}
