import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { isReplacementBrief, hasReplacementChecklist } from './acceptance'
import { runQaChecks } from '../agents/qa-checks'

describe('Replace-your-SaaS is not held to the SaaS product contract (15 Nov)', () => {
  it('recognises the replacement hand-off brief and the checklist file', () => {
    expect(isReplacementBrief('Include a CSV import. Replacement checklist: add src/replacement-checklist.ts exporting FEATURES')).toBe(true)
    expect(isReplacementBrief('A billing app for my kirana store')).toBe(false)
    expect(hasReplacementChecklist({ 'src/replacement-checklist.ts': 'x' })).toBe(true)
    expect(hasReplacementChecklist({ 'src/App.tsx': 'x' })).toBe(false)
  })

  it('the generate route leaves out the plans/checkout/webhook contract for a replacement brief', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/app/api/generate/route.ts'), 'utf8')
    expect(src).toMatch(/isReplacementBrief\(prompt\) \? UNSLOP_WEBAPP_RULES : SAAS_LAUNCH_READY_CONTRACT/)
  })

  it('the editor does not summarise a replacement build against the SaaS check', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/components/editor/ChatPanel.tsx'), 'utf8')
    expect(src).toMatch(/isLaunchReadySaas\(projectType\) && !hasReplacementChecklist\(updatedFiles\)/)
  })

  it('qa checks add no SaaS findings for a project that has a replacement checklist', () => {
    const files = {
      'src/App.tsx': { content: 'export default function App(){return <div>hi</div>}' },
      'src/replacement-checklist.ts': { content: 'export const FEATURES = [{ name: "Booking links", status: "built", note: "" }]' },
    }
    const issues = runQaChecks(files as any, 'saas')
    expect(issues.some(i => /plans|checkout|webhook|billing/i.test(i.fixPrompt))).toBe(false)
  })

  it('publish turns any image token that survives sanitize into a gradient', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/app/api/publish/route.ts'), 'utf8')
    expect(src).toMatch(/image token survived sanitize/)
  })
})
