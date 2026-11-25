import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// A guard on the wiring: the routes that act on a project must ask src/lib/project-access.ts, and the public client
// page must never put a project id on the wire (project ids appear in preview links, and the generate route used to
// trust one without checking who was asking).
const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

describe('project access wiring', () => {
  it('generate checks that the caller can edit the project before using it', () => {
    const src = read('src/app/api/generate/route.ts')
    const gate = src.indexOf('mayActOnProject(')
    expect(gate, 'generate must call mayActOnProject').toBeGreaterThan(0)
    // The gate sits in the POST handler, before the staged pipeline reads project memory or the Supabase connection.
    expect(gate).toBeLessThan(src.indexOf('await loadProjectMemory(') > 0 ? src.indexOf('await loadProjectMemory(') : Infinity)
  })

  for (const f of ['src/app/api/publish/route.ts', 'src/app/api/custom-domain/route.ts', 'src/app/api/export/route.ts', 'src/app/api/preview-comments/toggle/route.ts']) {
    it(`${f} uses the shared check and no longer requires the creator specifically`, () => {
      const src = read(f)
      expect(src).toContain('canEditProject')
      // A projects query that is filtered to the creator would lock out workspace teammates.
      const lines = src.split('\n')
      lines.forEach((line, i) => {
        if (line.includes(".from('projects')")) {
          const chain = lines.slice(i, i + 5).join('\n')
          expect(chain, `${f}:${i + 1} filters projects to the creator`).not.toContain(".eq('user_id', user.id)")
        }
      })
    })
  }

  it('the public client page does not expose project ids', () => {
    const src = read('src/app/client/[slug]/page.tsx')
    expect(src).not.toMatch(/projects\(id,/)
  })
})
