import sections from './sections'
import { footerCredit } from '../../../../../shared/lib/site-identity.mjs'
import common from '../../../../../shared/i18n/translations/en/common'
import controls from '../../../../../shared/i18n/translations/en/controls'
import { project } from '../../../../../shared/lib/project.mjs'
export default {
  sections,
  common,
  controls,
  navigation: {
    mainLabel: 'Main navigation',
    skipContent: 'Skip to content',
    mobile: {
      title: `Explore ${project.name}`,
      introduction: 'A live form to try, a working example, and every rule when you need it.',
      resources: 'Around the project',
      label: 'Mobile navigation',
      open: 'Open navigation menu',
      close: 'Close navigation menu',
    },
    footer: {
      description: project.description,
      label: 'Footer navigation',
      explore: 'Explore',
      project: 'Project',
      setup: 'Installation guide',
      examples: 'Working examples',
      skill: `${project.name} skill for AI agents`,
      changelog: 'Changelog',
      backToTop: 'Back to top',
      credit: footerCredit(project.credit),
    },
    items: [
      {
        href: '#features',
        label: 'Overview',
        description: 'What the controller does for a native form.',
      },
      {
        href: '#how',
        label: 'Get started',
        description: 'Choose your setup and follow the first steps.',
      },
      {
        href: '#recipes',
        label: 'Recipes',
        description: 'Messages, server errors and auto-submit.',
      },
      { href: '#faq', label: 'FAQ', description: 'Find the practical details.' },
      {
        page: 'examples',
        label: 'Examples',
        description: 'Try twelve live forms and copy their code.',
      },
      {
        docsRoute: 'overview',
        label: 'Docs',
        description: 'Read guides and the complete reference.',
      },
    ],
  },
  examples: {
    exploreAction: 'Try the example',
    installAction: 'Installation guide',
    eyebrow: 'Examples',
    title: `${project.name} examples.`,
    // Document metadata is separate from the display heading and its period.
    seoTitle: 'Examples',
    seoDescription:
      'Twelve live forms: validation, steps, conditional rules, formatting, auto-submit, state, server errors and more, each with copyable HTML, CSS and JavaScript.',
    accent: 'examples.',
    description:
      'Twelve real forms, each driven by the published API, with HTML / CDN and Package / ESM files you can copy. The same previews appear on Home and in Docs.',
    possibilities:
      'These examples show a few possibilities. The next ideas are yours: combine the package’s capabilities with your own content, design and interactions to create the experience your project needs.',
    guide: 'Read the example guide',
    navigation: 'Choose an example',
    accessibility:
      'Every preview is a labeled native form: invalid controls receive aria-invalid, messages are announced politely, and a failed submit moves focus to the first field to fix.',
    skill: `Download the ${project.name} skill for AI agents`,
  },
} as const
