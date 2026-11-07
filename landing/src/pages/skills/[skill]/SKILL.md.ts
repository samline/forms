import type { APIRoute } from 'astro'
import { project } from '../../../../../shared/lib/project.mjs'

// Serve the maintained package integration skill from skills/<name>/SKILL.md;
// never keep a second copy in the site. The glob resolves at build time.
const sources = import.meta.glob<string>('../../../../../skills/*/SKILL.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const path = `../../../../../skills/${project.skill}/SKILL.md`

export const getStaticPaths = () => {
  if (!sources[path])
    throw new Error(
      `Missing skills/${project.skill}/SKILL.md. Every package site ships its integration skill; run npm run configure or copy .agents/skills/package-site/references/package-skill-template.md.`
    )
  return [{ params: { skill: project.skill } }]
}

export const GET: APIRoute = () =>
  new Response(sources[path], { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
