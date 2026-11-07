import { spawn } from 'node:child_process'
import { project } from '../shared/lib/project.mjs'
// Preview the combined production artifact on the configured landing port.
const child = spawn(
  'npm',
  [
    'run',
    'preview',
    '--workspace',
    'landing',
    '--',
    '--host',
    '127.0.0.1',
    '--port',
    String(project.dev.landingPort),
  ],
  { stdio: 'inherit' }
)
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
child.on('exit', code => {
  process.exitCode = code ?? 1
})
