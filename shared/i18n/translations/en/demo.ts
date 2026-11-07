import { project } from '../../../lib/project.mjs'

/**
 * One typed catalog owns every demo scenario. Home tabs, the Examples gallery,
 * the Docs examples guide and the generated HTML / CDN and Package / ESM files
 * all render from these records, so the live preview and the copied code share
 * their fields, readouts and samples.
 *
 * Each record describes a real form task. Its `behavior` names a region of
 * shared/lib/demo-behavior.js that calls the public @samline/forms API; the
 * same region is copied verbatim into the generated main.js.
 */
export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'tel'
  | 'search'
  | 'textarea'
  | 'select'
  | 'checkboxes'
  | 'radios'
  | 'checkbox'
  | 'multiselect'
  | 'repeated'

export interface ScenarioField {
  readonly name: string
  readonly label: string
  readonly type: FieldType
  readonly value?: string
  readonly placeholder?: string
  readonly autocomplete?: string
  readonly inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email'
  /** Select options or checkbox values. */
  readonly options?: readonly (readonly [value: string, label: string])[]
  /** Short helper text under the control. */
  readonly help?: string
  /** False when the scenario never shows a message for this field. */
  readonly errors?: boolean
  /** Zero-based step for scenarios with `steps`. */
  readonly step?: number
}

export interface ScenarioSample {
  readonly label: string
  /** Values written through controller.setValue(name, value), in order. */
  readonly values: Readonly<Record<string, string | readonly string[]>>
  /** Press the submit button after writing the values. */
  readonly submit?: boolean
  /** Press the form button carrying this attribute instead (for example data-next). */
  readonly press?: string
}

export interface Scenario {
  /** Short tab and navigation label. */
  readonly tab: string
  /** The visitor's task, used as the Examples section heading. */
  readonly title: string
  readonly description: string
  /** One practical detail shown under the preview. */
  readonly hint: string
  /** The real API call shown inside the panel. */
  readonly call: string
  /** Exported function in shared/lib/demo-behavior.js. */
  readonly behavior:
    | 'signup'
    | 'checkout'
    | 'filters'
    | 'feedback'
    | 'username'
    | 'guests'
    | 'wizard'
    | 'delivery'
    | 'order'
    | 'preferences'
    | 'floating'
    | 'summary'
  /** Extra demo-behavior.js regions copied before the behavior. */
  readonly helpers?: readonly 'renderErrors'[]
  /** Base id; previews append a unique suffix, copied files use it as is. */
  readonly id: string
  readonly fields: readonly ScenarioField[]
  readonly submit: string
  /**
   * `filled` styles css-error only on controls that also carry css-filled,
   * for scenarios whose rules run on load (autoValidate: true).
   */
  readonly errorStyle?: 'filled'
  /** Step legends; fields declare their `step`. Steps after the first start hidden. */
  readonly steps?: readonly string[]
  /** Alternative presentation shipped with the copied CSS. */
  readonly variant?: 'floating'
  /** Extra buttons inside the form, rendered before submit. */
  readonly actions?: readonly { readonly label: string; readonly hook: string }[]
  /** Ordered outputs written by `show(id, text)`. */
  readonly readouts: readonly { readonly id: string; readonly label: string }[]
  readonly samples: readonly ScenarioSample[]
  /** Peer packages the Package / ESM files need besides @samline/forms. */
  readonly peers?: readonly string[]
}

const emailPattern = 'name@example.com'

export const scenarios = {
  signup: {
    tab: 'Validation',
    title: 'Check a sign-up form before it is sent',
    description:
      'Rules for required fields, email format, password strength and a matching confirmation. Messages appear after the first submit and update as you correct each field.',
    hint: 'autoValidate: false keeps the form quiet until the first submit; after that every input revalidates, and focus moves to the first field that needs attention.',
    call: 'form(element, { autoValidate: false, validators })',
    behavior: 'signup',
    helpers: ['renderErrors'],
    id: 'signup',
    fields: [
      { name: 'name', label: 'Full name', type: 'text', autocomplete: 'name' },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        autocomplete: 'email',
        placeholder: emailPattern,
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        autocomplete: 'new-password',
        help: 'At least 8 characters, including a number.',
      },
      {
        name: 'password_confirmation',
        label: 'Confirm password',
        type: 'password',
        autocomplete: 'new-password',
      },
    ],
    submit: 'Create account',
    readouts: [
      { id: 'errors', label: 'Errors' },
      { id: 'attempts', label: 'Submit attempts' },
      { id: 'result', label: 'Submitted' },
    ],
    samples: [
      { label: 'Submit empty', values: {}, submit: true },
      {
        label: 'Passwords differ',
        values: {
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          password: 'engine1843',
          password_confirmation: 'engine1842',
        },
        submit: true,
      },
      {
        label: 'Valid details',
        values: {
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          password: 'engine1843',
          password_confirmation: 'engine1843',
        },
        submit: true,
      },
    ],
  },
  checkout: {
    tab: 'Formatting',
    title: 'Format phone, card and amount fields while sending clean values',
    description:
      'Type freely: each field formats as you go, and the submitted data keeps the digits your backend expects under the original field name.',
    hint: 'Formatting uses the optional peer @samline/formatter. The visible input is renamed to <name>_displayed and a hidden input keeps <name> with the raw value.',
    call: "form(element, { formats: { phone: { type: 'phone', field: 'phone' } } })",
    behavior: 'checkout',
    id: 'checkout',
    fields: [
      {
        name: 'phone',
        label: 'Phone (US)',
        type: 'tel',
        autocomplete: 'tel-national',
        inputmode: 'tel',
        placeholder: '(202) 555-0123',
        errors: false,
      },
      {
        name: 'card',
        label: 'Card number',
        type: 'text',
        autocomplete: 'cc-number',
        inputmode: 'numeric',
        placeholder: '4111 1111 1111 1111',
        errors: false,
      },
      {
        name: 'amount',
        label: 'Amount',
        type: 'text',
        inputmode: 'decimal',
        placeholder: '1,250.00',
        errors: false,
      },
    ],
    submit: 'Review payment',
    readouts: [
      { id: 'phone', label: 'phone sent' },
      { id: 'card', label: 'card sent' },
      { id: 'amount', label: 'amount sent' },
    ],
    samples: [
      {
        label: 'Type digits',
        values: { phone: '2025550123', card: '4111111111111111', amount: '1250.5' },
      },
      {
        label: 'Paste formatted',
        values: { phone: '(415) 555-2671', card: '3782 822463 10005', amount: '89,990' },
      },
    ],
    peers: ['@samline/formatter'],
  },
  filters: {
    tab: 'Auto-submit',
    title: 'Filter a catalog as soon as the visitor changes an option',
    description:
      'Search, a category and tag checkboxes submit themselves after a short pause. The handler receives FormData, so building the query string is one line.',
    hint: 'Repeated names such as tags[] arrive as arrays. prefill() restores the same filters from a shared link, for example ?category=decor&tags[]=sale.',
    call: 'form(element, { autoSubmit: { debounce: 250 } }).prefill()',
    behavior: 'filters',
    id: 'filters',
    fields: [
      {
        name: 'q',
        label: 'Search',
        type: 'search',
        placeholder: 'Lamp, table, vase…',
        autocomplete: 'off',
        errors: false,
      },
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        options: [
          ['', 'All categories'],
          ['lighting', 'Lighting'],
          ['furniture', 'Furniture'],
          ['decor', 'Decor'],
        ],
        errors: false,
      },
      {
        name: 'tags[]',
        label: 'Only show',
        type: 'checkboxes',
        options: [
          ['new', 'New arrivals'],
          ['sale', 'On sale'],
        ],
        errors: false,
      },
    ],
    submit: 'Apply filters',
    readouts: [
      { id: 'query', label: 'Query string' },
      { id: 'results', label: 'Results' },
    ],
    samples: [
      { label: 'Lighting', values: { category: 'lighting' } },
      { label: 'New and on sale', values: { 'tags[]': ['new', 'sale'] } },
      { label: 'Search “lamp”', values: { q: 'lamp' } },
    ],
  },
  feedback: {
    tab: 'Live state',
    title: 'Enable the send button only when the message is ready',
    description:
      'A subscriber receives every state change: it counts characters, lists the fields you filled and enables the button once every rule passes.',
    hint: 'Rules run on load, so errors exist from the start. The subscriber prints only those of filled fields (state.filledFields), and the CSS highlights [css-error][css-filled] controls.',
    call: 'controller.subscribe(state => (button.disabled = !state.isValid))',
    behavior: 'feedback',
    helpers: ['renderErrors'],
    errorStyle: 'filled',
    id: 'feedback',
    fields: [
      {
        name: 'email',
        label: 'Reply to',
        type: 'email',
        autocomplete: 'email',
        placeholder: emailPattern,
      },
      {
        name: 'message',
        label: 'Message',
        type: 'textarea',
        placeholder: 'What should we improve?',
      },
    ],
    submit: 'Send feedback',
    readouts: [
      { id: 'valid', label: 'Status' },
      { id: 'filled', label: 'Filled fields' },
      { id: 'characters', label: 'Characters' },
    ],
    samples: [
      { label: 'Too short', values: { email: 'lin@example.com', message: 'Great docs!' } },
      {
        label: 'Ready',
        values: {
          email: 'lin@example.com',
          message: 'The examples page helped me ship our checkout in an afternoon.',
        },
      },
    ],
  },
  username: {
    tab: 'Server errors',
    title: 'Show the server’s answer next to the field',
    description:
      'The submit handler awaits a simulated availability check, then attaches the rejection to the username field with setErrors().',
    hint: 'Local simulation: the “server” answers after 600 ms without any network request. Try admin, ada or support. A manual error clears as soon as the field changes.',
    call: "controller.setErrors({ username: ['That username is already taken.'] })",
    behavior: 'username',
    helpers: ['renderErrors'],
    id: 'username',
    fields: [
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        autocomplete: 'username',
        placeholder: 'ada_dev',
      },
    ],
    submit: 'Claim username',
    readouts: [{ id: 'request', label: 'Server' }],
    samples: [
      { label: 'Taken name', values: { username: 'ada' }, submit: true },
      { label: 'Free name', values: { username: 'ada_lovelace' }, submit: true },
    ],
  },
  guests: {
    tab: 'Repeated fields',
    title: 'Collect a guest list that grows one row at a time',
    description:
      'Add or remove rows freely; the controller notices new inputs, reads guests[] as a list and marks only the row that is still empty.',
    hint: 'Rules under each run once per input with the same name. addCleanup() removes the row buttons’ listener when the controller is destroyed.',
    call: "validators: { 'guests[]': { each: { required: true } } }",
    behavior: 'guests',
    id: 'guests',
    fields: [{ name: 'guests[]', label: 'Guest 1', type: 'repeated', autocomplete: 'off' }],
    actions: [{ label: 'Add guest', hook: 'data-add' }],
    submit: 'Send invitations',
    readouts: [
      { id: 'guests', label: 'Guests' },
      { id: 'errors', label: 'First error' },
    ],
    samples: [
      { label: 'Submit empty', values: {}, submit: true },
      { label: 'One guest', values: { 'guests[]': 'Grace Hopper' }, submit: true },
    ],
  },
  wizard: {
    tab: 'Steps',
    title: 'Check one step at a time before moving on',
    description:
      'A two-step sign-up validates only the visible step when you press Next, then the whole form on submit. Values from the first step stay in place while you go back and forth.',
    hint: 'validate([names]) checks a subset and returns { isValid, errors }. Rules for hidden steps still run on the final submit, so nothing is skipped.',
    call: "controller.validate(['email', 'password']).isValid",
    behavior: 'wizard',
    helpers: ['renderErrors'],
    id: 'wizard',
    steps: ['1 · Account', '2 · Profile'],
    fields: [
      { name: 'email', label: 'Email', type: 'email', autocomplete: 'email', step: 0 },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        autocomplete: 'new-password',
        help: 'At least 8 characters.',
        step: 0,
      },
      { name: 'company', label: 'Company', type: 'text', autocomplete: 'organization', step: 1 },
      {
        name: 'role',
        label: 'Role',
        type: 'select',
        options: [
          ['', 'Choose a role'],
          ['engineer', 'Engineer'],
          ['designer', 'Designer'],
          ['manager', 'Manager'],
        ],
        step: 1,
      },
    ],
    actions: [
      { label: 'Back', hook: 'data-back' },
      { label: 'Next', hook: 'data-next' },
    ],
    submit: 'Create workspace',
    readouts: [
      { id: 'step', label: 'Step' },
      { id: 'errors', label: 'Errors on this step' },
      { id: 'result', label: 'Result' },
    ],
    samples: [
      { label: 'Next with empty fields', values: {}, press: 'data-next' },
      {
        label: 'Continue to step 2',
        values: { email: 'grace@example.com', password: 'compiler1952' },
        press: 'data-next',
      },
    ],
  },
  delivery: {
    tab: 'Conditional rules',
    title: 'Require a date only when delivery is scheduled',
    description:
      'A custom validator reads another field. dependsOn tells the controller to re-run it when the delivery choice changes, so switching back to standard clears the error at once.',
    hint: 'validate receives { value, values, field }. Return a message to fail, or nothing to pass. The pattern rule still checks the date format when one is entered.',
    call: "date: { validate: ({ value, values }) => …, dependsOn: 'method' }",
    behavior: 'delivery',
    helpers: ['renderErrors'],
    id: 'delivery',
    fields: [
      {
        name: 'method',
        label: 'Delivery',
        type: 'radios',
        value: 'standard',
        options: [
          ['standard', 'Standard (2–4 days)'],
          ['scheduled', 'On a chosen date'],
        ],
        errors: false,
      },
      {
        name: 'date',
        label: 'Delivery date',
        type: 'text',
        placeholder: 'YYYY-MM-DD',
        inputmode: 'numeric',
        autocomplete: 'off',
      },
    ],
    submit: 'Confirm delivery',
    readouts: [
      { id: 'method', label: 'Method' },
      { id: 'result', label: 'Result' },
    ],
    samples: [
      { label: 'Scheduled, no date', values: { method: 'scheduled' }, submit: true },
      { label: 'Wrong format', values: { method: 'scheduled', date: '12/24' }, submit: true },
      { label: 'Valid date', values: { method: 'scheduled', date: '2026-12-24' }, submit: true },
    ],
  },
  order: {
    tab: 'Numbers',
    title: 'Keep a quantity in range and show the total as you type',
    description:
      'numeric, min and max reject text, decimals outside the range and empty values on submit, while observe() recalculates the total on every keystroke.',
    hint: 'Numeric rules accept strict decimal strings such as 3 or 2.5 and skip empty values; add required for a mandatory field. The price lives in the script, not in a hidden input.',
    call: 'quantity: { required: true, numeric: true, min: 1, max: 10 }',
    behavior: 'order',
    helpers: ['renderErrors'],
    id: 'order',
    errorStyle: 'filled',
    fields: [
      {
        name: 'quantity',
        label: 'Seats',
        type: 'text',
        inputmode: 'numeric',
        value: '2',
        autocomplete: 'off',
        help: '$24 per seat, up to 10 seats.',
      },
    ],
    submit: 'Buy seats',
    readouts: [
      { id: 'total', label: 'Total' },
      { id: 'status', label: 'Status' },
    ],
    samples: [
      { label: 'Five seats', values: { quantity: '5' } },
      { label: 'Too many', values: { quantity: '12' } },
      { label: 'Not a number', values: { quantity: 'two' } },
    ],
  },
  preferences: {
    tab: 'All controls',
    title: 'Read radios, checkbox groups, multiple selects and a consent box',
    description:
      'Every native control reports a predictable value: a radio group gives one string, a checkbox group and a multiple select give lists, and a single checkbox gives its value or an empty string.',
    hint: 'A bare checkbox group returns a string for one checked box and an array for several; name it topics[] to always get an array. minLength on a group counts selected items.',
    call: "controller.getValue('days') // ['mon', 'thu']",
    behavior: 'preferences',
    helpers: ['renderErrors'],
    id: 'preferences',
    fields: [
      {
        name: 'channel',
        label: 'Contact me by',
        type: 'radios',
        value: 'email',
        options: [
          ['email', 'Email'],
          ['sms', 'SMS'],
        ],
        errors: false,
      },
      {
        name: 'topics[]',
        label: 'Topics',
        type: 'checkboxes',
        options: [
          ['releases', 'Releases'],
          ['events', 'Events'],
          ['tips', 'Tips'],
        ],
      },
      {
        name: 'days',
        label: 'Best days',
        type: 'multiselect',
        options: [
          ['mon', 'Monday'],
          ['tue', 'Tuesday'],
          ['wed', 'Wednesday'],
          ['thu', 'Thursday'],
          ['fri', 'Friday'],
        ],
        errors: false,
      },
      {
        name: 'consent',
        label: 'I agree to receive these messages',
        type: 'checkbox',
        options: [['yes', 'I agree to receive these messages']],
      },
    ],
    submit: 'Save preferences',
    readouts: [
      { id: 'values', label: 'getState().values' },
      { id: 'result', label: 'Result' },
    ],
    samples: [
      { label: 'Submit without consent', values: { 'topics[]': ['releases'] }, submit: true },
      {
        label: 'Complete',
        values: {
          channel: 'sms',
          'topics[]': ['releases', 'tips'],
          days: ['mon', 'thu'],
          consent: 'yes',
        },
        submit: true,
      },
    ],
  },
  floating: {
    tab: 'Custom attributes',
    title: 'Float labels with your own attribute names',
    description:
      'The attributes option renames css-filled and css-error, so the form follows your design system. Labels rise when a field is filled, and invalid fields turn red only after you type.',
    hint: 'The controller only toggles attributes; all styling is CSS. Selectors such as .field:has([data-filled]) style the wrapper without extra JavaScript.',
    call: "form(element, { attributes: { filled: 'data-filled', error: 'data-invalid' } })",
    behavior: 'floating',
    id: 'floating',
    variant: 'floating',
    fields: [
      { name: 'name', label: 'Name', type: 'text', autocomplete: 'name', errors: false },
      { name: 'email', label: 'Email', type: 'email', autocomplete: 'email', errors: false },
    ],
    submit: 'Join the list',
    readouts: [
      { id: 'attributes', label: 'Email attributes' },
      { id: 'result', label: 'Result' },
    ],
    samples: [
      { label: 'Invalid email', values: { name: 'Lin', email: 'lin@' } },
      { label: 'Valid', values: { name: 'Lin', email: 'lin@example.com' }, submit: true },
    ],
  },
  summary: {
    tab: 'Error summary',
    title: 'List every problem at the top after a failed submit',
    description:
      'A subscriber notices each new submit attempt and inserts one summary with append(): every message links to its field, and the list disappears once the form is valid.',
    hint: 'append() replaces an earlier node with the same class, so the summary never duplicates. Rendering into the form no longer re-triggers validation (fixed in 2.8.0).',
    call: "controller.append({ tag: 'div', class: 'error-summary', content, atStart: true })",
    behavior: 'summary',
    id: 'summary',
    fields: [
      { name: 'title', label: 'Event title', type: 'text', autocomplete: 'off', errors: false },
      { name: 'venue', label: 'Venue', type: 'text', autocomplete: 'off', errors: false },
      {
        name: 'capacity',
        label: 'Capacity',
        type: 'text',
        inputmode: 'numeric',
        autocomplete: 'off',
        errors: false,
      },
    ],
    submit: 'Publish event',
    readouts: [
      { id: 'problems', label: 'Problems' },
      { id: 'result', label: 'Result' },
    ],
    samples: [
      { label: 'Submit empty', values: {}, submit: true },
      {
        label: 'One problem left',
        values: { title: 'Launch party', venue: 'Rooftop', capacity: 'many' },
        submit: true,
      },
      {
        label: 'Valid',
        values: { title: 'Launch party', venue: 'Rooftop', capacity: '80' },
        submit: true,
      },
    ],
  },
} as const satisfies Record<string, Scenario>

export type DemoPreset = keyof typeof scenarios
export const presetIds = Object.keys(scenarios) as DemoPreset[]
/** Home tabs: one representative scenario per distinct task. */
export const homePresets = [
  'signup',
  'checkout',
  'filters',
] as const satisfies readonly DemoPreset[]

/**
 * Loading modes for copied files. `importLine` provides the `form` identifier
 * the behavior regions use. HTML / CDN loads the standalone build, which
 * already contains @samline/formatter; Package / ESM imports from npm.
 */
export const loadingModes = {
  cdn: {
    label: 'HTML / CDN',
    importLine: 'const { form } = window.Forms' as string | null,
    note: 'Save these files in one folder and open index.html. The CDN script defines window.Forms before main.js runs; it already includes the formatter, so no build step is needed.',
  },
  esm: {
    label: 'Package / ESM',
    importLine: `import { form } from '${project.npmName}'` as string | null,
    note: `Install ${project.npmName} and serve these files with your bundler or dev server. The package import replaces the CDN script.`,
  },
}
export type DemoMode = keyof typeof loadingModes
export const demoModes: readonly DemoMode[] = project.delivery.cdnScript ? ['cdn', 'esm'] : ['esm']

export default {
  label: `${project.name} studio`,
  previewTagline: 'Live preview',
  tabs: homePresets.map(id => ({ id, label: scenarios[id].tab })),
  empty: '—',
  samplesLabel: 'Try it',
  reset: 'Reset',
  removeGuest: 'Remove',
  noscript:
    'Enable JavaScript to try the form. Its source files remain readable in the code viewer.',
  openCode: 'Explore the code',
  modeLabel: 'Loading mode',
  copyComplete: 'Copy the complete example',
  back: 'Back',
  peerNote: (peers: readonly string[]) =>
    ` This scenario also needs ${peers.join(', ')}: install it beside ${project.npmName}.`,
} as const
