import behaviorSource from './demo-behavior.js?raw'
import demo, {
  scenarios,
  loadingModes,
  type DemoMode,
  type DemoPreset,
  type Scenario,
  type ScenarioField,
} from '../i18n/translations/en/demo'
import { project } from './project.mjs'

export type { DemoMode }

const escape = (value: string) =>
  value.replace(
    /[&<>"]/g,
    character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]!
  )

const region = (name: string) => {
  const match = behaviorSource.match(
    new RegExp(`// #region ${name}\\n([\\s\\S]*?)// #endregion ${name}`)
  )
  if (!match) throw new Error(`demo-behavior.js has no #region ${name}`)
  return match[1].replace(/^export /m, '').trim()
}

/** The exact helper and behavior regions from demo-behavior.js, without `export`. */
export const behaviorFor = (preset: DemoPreset) => {
  const item: Scenario = scenarios[preset]
  return [...(item.helpers ?? []), item.behavior].map(region).join('\n\n')
}

/** Stable control id inside one document; previews add their own prefix. */
export const fieldId = (item: Scenario, field: ScenarioField, prefix = '') =>
  `${prefix}${item.id}-${field.name.replace(/[^a-z0-9]+/gi, '-').replace(/-$/, '')}`

const attributes = (values: Record<string, string | undefined>) =>
  Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => ` ${name}="${escape(value!)}"`)
    .join('')

const errorSlot = (id: string, field: ScenarioField) =>
  field.errors === false
    ? ''
    : `\n    <p class="error" id="${id}-error" data-error-for="${escape(field.name)}" aria-live="polite"></p>`

const fieldHtml = (item: Scenario, field: ScenarioField) => {
  const id = fieldId(item, field)
  const help = field.help ? `\n    <p class="help" id="${id}-help">${escape(field.help)}</p>` : ''
  const describedBy =
    [field.help ? `${id}-help` : '', field.errors === false ? '' : `${id}-error`]
      .filter(Boolean)
      .join(' ') || undefined
  if (field.type === 'checkboxes' || field.type === 'radios') {
    const kind = field.type === 'radios' ? 'radio' : 'checkbox'
    return `  <fieldset class="field"${attributes({ 'aria-describedby': describedBy })}>
    <legend>${escape(field.label)}</legend>
${field
  .options!.map(
    ([value, label]) =>
      `    <label class="check"><input type="${kind}" name="${escape(field.name)}" value="${escape(value)}"${value === field.value ? ' checked' : ''}> ${escape(label)}</label>`
  )
  .join('\n')}${errorSlot(id, field)}
  </fieldset>`
  }
  if (field.type === 'checkbox') {
    const [value, label] = field.options![0]!
    return `  <div class="field">
    <label class="check"><input type="checkbox" id="${id}" name="${escape(field.name)}" value="${escape(value)}"${attributes({ 'aria-describedby': describedBy })}> ${escape(label)}</label>${errorSlot(id, field)}
  </div>`
  }
  if (field.type === 'repeated')
    return `  <div class="guests" data-guests>
    <div class="field" data-guest>
      <label for="guest-1">${escape(field.label)}</label>
      <div class="row">
        <input id="guest-1" name="${escape(field.name)}"${attributes({ autocomplete: field.autocomplete })}>
        <button type="button" data-remove>${escape(demo.removeGuest)}</button>
      </div>
    </div>
  </div>`
  const common = attributes({
    id,
    name: field.name,
    autocomplete: field.autocomplete,
    inputmode: field.inputmode,
    placeholder: field.placeholder,
    'aria-describedby': describedBy,
  })
  const control =
    field.type === 'select' || field.type === 'multiselect'
      ? `<select${common}${field.type === 'multiselect' ? ` multiple size="${field.options!.length}"` : ''}>
${field.options!.map(([value, label]) => `      <option value="${escape(value)}">${escape(label)}</option>`).join('\n')}
    </select>`
      : field.type === 'textarea'
        ? `<textarea${common} rows="4"></textarea>`
        : `<input type="${field.type}"${common}${attributes({ value: field.value })}>`
  return `  <div class="field">
    <label for="${id}">${escape(field.label)}</label>
    ${control}${help}${errorSlot(id, field)}
  </div>`
}

export const htmlFor = (preset: DemoPreset) => {
  const item: Scenario = scenarios[preset]
  const actions = (item.actions ?? [])
    .map(action => `\n    <button type="button" ${action.hook}>${escape(action.label)}</button>`)
    .join('')
  const errorStyle = item.errorStyle ? ` data-errors="${item.errorStyle}"` : ''
  const variant = item.variant ? ` data-variant="${item.variant}"` : ''
  const fields = item.steps
    ? item.steps
        .map(
          (legend, step) => `  <fieldset class="step" data-step="${step}"${step ? ' hidden' : ''}>
    <legend>${escape(legend)}</legend>
${item.fields
  .filter(field => field.step === step)
  .map(field => fieldHtml(item, field).replace(/^/gm, '  '))
  .join('\n')}
  </fieldset>`
        )
        .join('\n')
    : item.fields.map(field => fieldHtml(item, field)).join('\n')
  return `<form id="${item.id}" class="demo-form"${errorStyle}${variant} novalidate aria-labelledby="${item.id}-heading">
  <h1 id="${item.id}-heading">${escape(item.title)}</h1>
${fields}
  <div class="actions">${actions}
    <button type="submit">${escape(item.submit)}</button>
  </div>
</form>
<dl class="readouts" aria-live="polite">
${item.readouts.map(readout => `  <dt>${escape(readout.label)}</dt>\n  <dd><output data-readout="${readout.id}">${demo.empty}</output></dd>`).join('\n')}
</dl>`
}

const error = '#b42318'

export const stylesFor = (_preset?: DemoPreset) => `main {
  display: grid;
  gap: 1.5rem;
  max-width: 32rem;
  margin: 2rem auto;
  padding: 0 1rem;
  font: 1rem/1.6 system-ui, sans-serif;
}
.demo-form {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
  border: 0.0625rem solid #c3ccd6;
  border-radius: 1rem;
}
.demo-form h1 {
  margin: 0;
  font-size: 1.25rem;
}
.field {
  display: grid;
  gap: 0.375rem;
  margin: 0;
  padding: 0;
  border: 0;
}
.field label,
.field legend {
  font-weight: 600;
}
.field input:not([type='checkbox']),
.field select,
.field textarea {
  padding: 0.75rem 0.875rem;
  border: 0.0625rem solid #7d8a99;
  border-radius: 0.5rem;
  font: inherit;
}
.field select,
.demo-form button {
  cursor: pointer;
}
.demo-form :focus-visible {
  outline: 0.125rem solid ${project.accentLight};
  outline-offset: 0.125rem;
}
/* @samline/forms marks fields with the css-error and css-filled attributes. */
.demo-form [css-error] {
  border-color: ${error};
}
[hidden] {
  display: none !important;
}
.step {
  display: grid;
  gap: 1rem;
  margin: 0;
  padding: 0;
  border: 0;
}
.step legend {
  margin-bottom: 0.5rem;
  font-weight: 700;
}
.error-summary {
  padding: 0.75rem 1rem;
  border: 0.0625rem solid ${error};
  border-radius: 0.5rem;
  color: ${error};
}
.error-summary p,
.error-summary ul {
  margin: 0;
}
.error-summary a {
  color: inherit;
}
/* Floating labels: the attributes option renamed css-filled and css-error. */
[data-variant='floating'] .field {
  position: relative;
}
[data-variant='floating'] .field label {
  position: absolute;
  top: 0.8rem;
  left: 0.9rem;
  font-weight: 400;
  color: #5b6672;
  pointer-events: none;
  transition: transform 0.15s, font-size 0.15s;
}
[data-variant='floating'] .field input {
  padding-top: 1.35rem;
  padding-bottom: 0.4rem;
}
[data-variant='floating'] .field:has(:focus, [data-filled]) label {
  transform: translateY(-0.6rem);
  font-size: 0.75rem;
}
[data-variant='floating'] [data-invalid][data-filled] {
  border-color: ${error};
}
/* Rules that run on load mark empty fields too: wait until they are filled. */
.demo-form[data-errors='filled'] [css-error]:not([css-filled]) {
  border-color: #7d8a99;
}
.help,
.error {
  margin: 0;
  font-size: 0.875rem;
}
.error {
  color: ${error};
}
.error:empty {
  display: none;
}
.check {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-weight: 400;
}
.row,
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.row input {
  flex: 1 1 12rem;
}
.demo-form button {
  padding: 0.625rem 1rem;
  border: 0.0625rem solid #7d8a99;
  border-radius: 0.5rem;
  background: #fff;
  font: inherit;
}
.demo-form button[type='submit'] {
  border-color: ${project.accentLight};
  background: ${project.accentLight};
  color: #fff;
}
.demo-form button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.readouts {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.25rem 1rem;
  margin: 0;
}
.readouts dd {
  margin: 0;
  font-family: ui-monospace, monospace;
  overflow-wrap: anywhere;
}`

export const javascriptFor = (preset: DemoPreset, mode: DemoMode = 'esm') => {
  const item: Scenario = scenarios[preset]
  const importLine = loadingModes[mode].importLine
  return [
    ...(importLine ? [importLine, ''] : []),
    behaviorFor(preset),
    '',
    `const element = document.querySelector('#${item.id}')`,
    'const show = (id, text) => {',
    '  document.querySelector(`[data-readout="${id}"]`).value = text',
    '}',
    `const controller = ${item.behavior}(element, show)`,
    '',
    '// A persisted pagehide (back/forward cache) keeps the form working;',
    '// a real departure removes every listener the controller added.',
    "window.addEventListener('pagehide', event => {",
    '  if (!event.persisted) controller.destroy()',
    '})',
  ].join('\n')
}
