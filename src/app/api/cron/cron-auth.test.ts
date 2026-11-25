import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Every cron route compares the Authorization header with `Bearer ${CRON_SECRET}`. If CRON_SECRET is unset that string is
// "Bearer undefined", which a caller can simply send. Every such comparison must refuse first when the secret is empty.
describe('cron routes fail closed when CRON_SECRET is not set', () => {
  const dir = __dirname
  const routes = fs.readdirSync(dir).map(d => path.join(dir, d, 'route.ts')).filter(p => fs.existsSync(p))

  it('finds the cron routes', () => { expect(routes.length).toBeGreaterThanOrEqual(15) })

  it('no route compares against the secret without checking it exists first', () => {
    const bad: string[] = []
    for (const p of routes) {
      const src = fs.readFileSync(p, 'utf8')
      for (const line of src.split('\n')) {
        if (line.includes('Bearer ${process.env.CRON_SECRET}') && line.includes('!==') && !line.includes('!process.env.CRON_SECRET')) bad.push(path.basename(path.dirname(p)))
      }
    }
    expect(bad).toEqual([])
  })
})
