import { project } from '../../../../../shared/lib/project.mjs'
const text = (value: string) => [{ kind: 'text' as const, value }]
const heading = (prefix: string, accent: string) => [
  { kind: 'text' as const, value: prefix + ' ' },
  { kind: 'emphasis' as const, value: accent },
]
const code = (filename: string, source: string, language: 'html' | 'javascript' | 'bash') => ({
  filename,
  code: source,
  language,
})
const markupCode = `<form id="signup" novalidate>
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="email">
  <p data-error-for="email" aria-live="polite"></p>
  <button type="submit">Sign up</button>
</form>`
const moduleCode = `import { form } from '@samline/forms'

const signup = form('signup', {
  autoValidate: false,
  validators: {
    email: {
      required: { value: true, message: 'Enter your email.' },
      pattern: { value: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, message: 'Use a valid email.' },
    },
  },
})

signup.subscribe(state => {
  document.querySelector('[data-error-for="email"]').textContent =
    state.errors.email?.[0] ?? ''
})

signup.onSubmit(async (_element, data, formData) => {
  await fetch('/api/signup', { method: 'POST', body: formData })
  signup.reset()
})
// When the page or component goes away:
// signup.destroy()`
const messagesCode = `const controller = form('checkout', { autoValidate: false, validators })

controller.subscribe(state => {
  for (const slot of document.querySelectorAll('[data-error-for]')) {
    slot.textContent = state.errors[slot.dataset.errorFor]?.[0] ?? ''
  }
  submitButton.disabled = state.isSubmitting
})`
const serverCode = `controller.onSubmit(async (_element, _data, formData) => {
  const response = await fetch('/api/account', { method: 'POST', body: formData })
  if (response.status === 422) {
    // { "username": ["That username is already taken."] }
    controller.setErrors(await response.json())
  }
})`
const filtersCode = `const filters = form('filters', { autoSubmit: { debounce: 250 } })

filters.onSubmit((_element, _data, formData) => {
  const query = new URLSearchParams(formData)
  history.replaceState(null, '', \`?\${query}\`)
  renderProducts(query)
})

// ?category=decor&tags[]=sale restores the same filters.
filters.prefill()`
export default {
  hero: {
    // The document <title> for Home: a descriptive phrase, never the bare package name.
    seoTitle: `${project.name} — Validation and state for native HTML forms`,
    // 70–160 characters.
    seoDescription:
      'Validate, format, serialize and auto-submit native HTML forms with one typed, framework-free controller for JavaScript and TypeScript.',
    kicker: 'Native forms. Typed control.',
    title: project.name,
    titleAccent: 'Send only what’s right.',
    description: project.description,
    descriptionContinuation:
      'Check a sign-up, format a phone number, or filter a catalog as it changes.',
    footnotes: ['Native HTML forms', 'JavaScript & TypeScript', `${project.license} licensed`],
    compatibilityLabel: 'ONE CONTROLLER. RIGHT AT HOME IN YOUR STACK.',
    platforms: [
      'JavaScript',
      'TypeScript',
      'React',
      'Vue',
      'Svelte',
      'Astro',
      'Shopify',
      'WordPress',
    ],
  },
  features: {
    eyebrow: '01 / More than a submit handler',
    title: 'Your native form.',
    titleAccent: 'A controller that listens.',
    items: {
      dependencies: {
        title: 'Your markup. Your backend.',
        description: text(
          'Bind any <form> by id, element or ref. Fields keep their names, and the FormData your server reads stays the same.'
        ),
      },
      accessibility: {
        title: 'Errors people can find',
        description: text(
          'Invalid controls get aria-invalid, and a failed submit focuses the first one in document order. You write the messages and decide where they appear.'
        ),
      },
      lifecycle: {
        title: 'Create. Listen. Destroy.',
        description: text(
          'One controller owns its listeners, observer and timers. destroy() releases them, including the cleanups you register.'
        ),
      },
      entrypoints: {
        title: 'Rules instead of boilerplate',
        description: text(
          'Required, length, pattern and numeric bounds, matching fields, dependencies, per-row rules and custom validators that read every value.'
        ),
      },
      frameworks: {
        title: 'State you can subscribe to',
        description: text(
          'Values, errors, filled fields and submission status arrive in one snapshot, ready for any UI layer.'
        ),
      },
      markup: {
        title: 'Formatted for people, clean for servers',
        description: text(
          'Phones, cards, dates and amounts format as people type, while a hidden field submits the raw value under the original name.'
        ),
      },
    },
  },
  runtimes: {
    eyebrow: '02 / Fit it into your stack',
    heading: heading('Two ways in.', 'One form() call.'),
    description:
      'Import from npm or load one script tag. The controller is the same in both; only the standalone script and the /browser subpath set a Forms global.',
    items: {
      main: {
        label: 'Package / ESM',
        entrypoint: project.npmName,
        description:
          'form(), createFormController() and the DOM-free helpers parseFormData, validateValues and validateFieldValue, with TypeScript declarations. CommonJS is also exported.',
      },
      vanilla: {
        label: 'Registry helpers',
        entrypoint: `${project.npmName}/browser`,
        description:
          'newForm({ id }), destroyForm(id) and the available map keep one controller per form id. Importing this subpath also sets globalThis.Forms.',
      },
      global: {
        label: 'HTML / CDN',
        entrypoint: 'window.Forms',
        description:
          'The standalone script already contains @samline/formatter, so formatting works without a build step. Pin the version in production.',
      },
      browser: {
        label: 'Optional peer',
        entrypoint: '@samline/formatter',
        description:
          'Install it beside the package to use format(), formatAll() and the formats option. Without it those calls log one error and the form keeps working.',
      },
      core: {
        label: 'Types',
        entrypoint: 'FormController · ValidationSchema',
        description:
          'Every option, rule, snapshot and callback has an exported type. Use satisfies ValidationSchema for reusable rule sets.',
      },
      style: {
        label: 'Styles',
        entrypoint: 'css-filled · css-error',
        description:
          'No stylesheet to import. Style the attributes the controller toggles, or rename them with the attributes option.',
      },
    },
  },
  gettingStarted: {
    eyebrow: '03 / From install to a checked submit',
    heading: heading('One form.', 'One controller.'),
    integrationDescription:
      'Install the package, keep your form markup, then create a controller with the rules it should enforce. Copy a complete example when you want a setup without a bundler.',
    integrationLabel: 'Read the installation guide',
    steps: { install: 'Install', markup: 'Add a form', initialize: 'Create the controller' },
    installLabel: 'Installation method',
    installTabs: [],
    fullExampleLabel: 'Copy complete working files',
    markupDescription:
      'A native form with named fields. novalidate lets the controller’s rules and messages replace the browser’s bubbles.',
    examples: {
      markup: code('index.html', markupCode, 'html'),
      script: code('main.js', moduleCode, 'javascript'),
    },
    docs: {
      description: 'Every option, rule and default is in the configuration reference.',
      label: 'Explore the configuration reference',
    },
  },
  recipes: {
    eyebrow: '04 / After the first submit',
    title: 'After the first submit.',
    titleAccent: 'Keep every field in sync.',
    description:
      'Three patterns most forms need next. Each one uses the same controller you already created.',
    examplesLabel: 'Explore working examples',
    items: [
      {
        title: 'Print each message beside its field',
        context: 'Validation',
        docsRoute: 'validation' as const,
        docsLabel: 'Read the validation guide',
        description: text(
          'One subscriber receives every change. Render the first error of each field and disable the button while a submit is pending.'
        ),
        code: code('main.js', messagesCode, 'javascript'),
      },
      {
        title: 'Attach the server’s answer',
        context: 'Server errors',
        docsRoute: 'validation' as const,
        docsLabel: 'Read about manual errors',
        description: text(
          'Pass the field errors your API returns to setErrors(). They mark the fields like local rules and clear as soon as the visitor edits them.'
        ),
        code: code('main.js', serverCode, 'javascript'),
      },
      {
        title: 'Restore filters from a link',
        context: 'Auto-submit',
        docsRoute: 'state' as const,
        docsLabel: 'Read about state and submission',
        description: text(
          'Auto-submit after a short pause, keep the query string in the address bar, and prefill the same form when someone opens the link.'
        ),
        code: code('main.js', filtersCode, 'javascript'),
      },
    ],
  },
  faq: {
    eyebrow: '05 / Before you build',
    heading: heading('A few details.', 'Clearly answered.'),
    items: {
      native: {
        question: text('Why add novalidate to the form?'),
        answer: text(
          'Without it, the browser checks type="email", required and similar attributes before the submit event fires, shows its own bubble and stops the submit. novalidate makes the controller’s rules and your messages the single source of truth.'
        ),
      },
      data: {
        question: text('What does my server receive?'),
        answer: text(
          'The native form’s FormData, including the button that submitted it. Empty file inputs are skipped. A formatted field sends the raw value under its original name and the formatted text as <name>_displayed.'
        ),
      },
      messages: {
        question: text('Does the package render error messages?'),
        answer: text(
          'No. It sets css-error and aria-invalid on invalid controls and moves focus after a failed submit. Read state.errors in subscribe() and place each message where your design needs it, ideally linked with aria-describedby.'
        ),
      },
      frameworks: {
        question: text('Can I use it with React, Vue or Svelte?'),
        answer: text(
          'Yes, as a DOM controller: create it after the form mounts and call destroy() before it unmounts. Keep the form uncontrolled, or write values with setValue() so the controller hears the change. There are no framework adapters.'
        ),
      },
      cdn: {
        question: text('Can I use it without a bundler?'),
        answer: text(
          'Load dist/browser/global.global.js from a CDN or your own server. It defines window.Forms with form, newForm, destroyForm and available, and it already includes the formatter.'
        ),
      },
      formatter: {
        question: text('Do I need @samline/formatter?'),
        answer: text(
          'Only for format(), formatAll() and the formats option with npm installs. It is an optional peer: validation, state and serialization work without it.'
        ),
      },
      dynamic: {
        question: text('What happens when fields are added or removed?'),
        answer: text(
          'The controller observes the form and revalidates when controls are added, removed or renamed. Name repeated inputs with [] to read them as a list and use each rules to check every row.'
        ),
      },
      async: {
        question: text('How do I handle asynchronous submits?'),
        answer: text(
          'Return a promise from onSubmit(). state.isSubmitting stays true until every handler settles; a rejected handler is reported in the console. Use it to disable the button and prevent double submits.'
        ),
      },
      server: {
        question: text('Can I run the same rules on the server?'),
        answer: text(
          'validateValues() and validateFieldValue() are pure and DOM-free, so the same ValidationSchema runs in Node 20+. form() itself needs a browser DOM.'
        ),
      },
      changes: {
        question: text('How are changes documented?'),
        answer: text(
          'CHANGELOG.md is the single release history and labels behavior changes. Docs, examples and the agent skill are updated with each release.'
        ),
      },
    },
  },
  callToAction: {
    eyebrow: 'Native forms, checked before they leave',
    heading: heading('Make every submit', 'a valid one.'),
    description: 'Try a live form or follow the first steps.',
    docs: {
      description: 'Guides, the complete API and verified release notes, in one place.',
      label: 'Read the documentation',
    },
  },
} as const
