import { spawn } from 'node:child_process'
import { project } from '../shared/lib/project.mjs'
// Ports come from project.config.json so embedded package sites never collide.
const children = [
  ['landing', String(project.dev.landingPort)],
  ['docs', String(project.dev.docsPort)],
].map(([workspace, port]) =>
  spawn(
    'npm',
    [
      'run',
      'dev',
      '--workspace',
      workspace,
      '--',
      '--host',
      '127.0.0.1',
      '--port',
      port,
      '--ignore-lock',
    ],
    { stdio: 'inherit' }
  )
)
let stopping = false
const stop = () => {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill('SIGTERM')
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, stop)
for (const child of children)
  child.on('exit', code => {
    if (!stopping) {
      process.exitCode = code ?? 1
      stop()
    }
  })
