import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { AGENT_IDS } from './agents/types'
import { JOBS } from './schedule'

// The runbook is how the founder runs the company. If a job, an agent or a kill switch is added and the
// runbook is not updated, this fails, so the document can never quietly go out of date.

const doc = readFileSync(resolve(process.cwd(), 'docs/AUTOMATION-RUNBOOK.md'), 'utf8')

describe('docs/AUTOMATION-RUNBOOK.md', () => {
  it('mentions every scheduled job', () => {
    for (const j of JOBS) expect(doc, `${j.path} is not in the runbook`).toContain(j.path)
  })

  it('mentions every company agent by id', () => {
    for (const id of AGENT_IDS) expect(doc, `agent ${id} is not in the runbook`).toContain('`' + id + '`')
  })

  it('documents every kill switch the code reads', () => {
    const src = [
      'src/lib/ops/agents/run.ts', 'src/app/api/cron/ops-agents/route.ts', 'src/app/api/cron/crm-brief/route.ts',
      'src/app/api/cron/watchdog/route.ts', 'src/app/api/cron/weekly-report/route.ts', 'src/lib/ops/health-load.ts', 'src/app/api/admin/ask/act/route.ts',
    ].map(f => { try { return readFileSync(resolve(process.cwd(), f), 'utf8') } catch { return '' } }).join('\n')
    const switches = new Set(src.match(/[A-Z_]+_DISABLED/g) ?? [])
    expect(switches.size).toBeGreaterThan(0)
    for (const s of switches) expect(doc, `${s} is not in the runbook`).toContain(s)
  })

  it('lists every migration the automation needs, in order', () => {
    const files = ['20261109000000_internal_crm', '20261109010000_ops_agents', '20261109020000_crm_quotes', '20261109030000_ops_agents_more', '20261109040000_collections', '20261109050000_research_agent']
    let at = -1
    for (const f of files) {
      const i = doc.indexOf(f)
      expect(i, f).toBeGreaterThan(at)
      at = i
    }
  })

  it('says plainly that nothing is sent without a person', () => {
    expect(doc).toContain('Nothing is ever sent without you')
    expect(doc).toContain('Sending any message. A person always sends.')
  })
})
