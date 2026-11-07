import { manifest } from '../../../../../shared/lib/project.mjs'
export default {
  name: manifest.name,
  versionLabel: 'v{version}',
  docs: 'Documentation',
  examples: 'Working examples',
  examplesDescription: 'Try twelve live forms, then copy their HTML, CSS and JavaScript.',
  github: 'GitHub',
  skip: 'Skip to content',
  license: manifest.license,
  footer: 'Made for the web. Built with care.',
  changelog: {
    title: 'Changelog',
    description:
      'Every @samline/forms release, from 0.1.0 to today, with fixes, behavior changes and upgrade notes for each version.',
  },
  reading: 'Guide',
  apiReading: 'Reference',
}
