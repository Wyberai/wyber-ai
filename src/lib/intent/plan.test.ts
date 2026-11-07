import { describe, it, expect } from 'vitest'
import { parsePlan, buildPlanMessage, PLAN_SYSTEM_PROMPT, MAX_SCREENS, MIN_SCREENS } from './plan'

const good = {
  title: 'Delivery Proof Tracker',
  kind: 'mobile_app',
  screens: [
    { name: 'Deliveries', note: 'List of the day deliveries with status' },
    { name: 'Capture LR copy', note: 'Photograph the signed copy on delivery' },
    { name: 'Pending', note: 'Deliveries still waiting for a signed copy' },
  ],
  data: ['Deliveries', 'Drivers', 'LR copies'],
  first_win: 'The office sees delivered or pending in one list.',
}

describe('parsePlan', () => {
  it('accepts a valid plan, including inside a code fence', () => {
    const p = parsePlan('```json\n' + JSON.stringify(good) + '\n```')
    expect(p).toMatchObject({ title: 'Delivery Proof Tracker', kind: 'mobile_app', firstWin: 'The office sees delivered or pending in one list.' })
    expect(p!.screens).toHaveLength(3)
    expect(p!.data).toEqual(['Deliveries', 'Drivers', 'LR copies'])
  })

  it('rejects non-JSON, wrong kinds, and the model empty reply for text that is too short', () => {
    expect(parsePlan('not json')).toBeNull()
    expect(parsePlan(JSON.stringify({ ...good, kind: 'crypto_exchange' }))).toBeNull()
    expect(parsePlan(JSON.stringify({ title: '', kind: 'web_app', screens: [], data: [], first_win: '' }))).toBeNull()
  })

  it('needs at least the minimum screens and data after cleaning', () => {
    expect(parsePlan(JSON.stringify({ ...good, screens: good.screens.slice(0, MIN_SCREENS - 1) }))).toBeNull()
    expect(parsePlan(JSON.stringify({ ...good, data: ['One'] }))).toBeNull()
  })

  it('caps screens, drops duplicates and empty entries', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ name: `Screen ${i}`, note: 'Does a thing' }))
    expect(parsePlan(JSON.stringify({ ...good, screens: many }))!.screens).toHaveLength(MAX_SCREENS)
    const dup = [...good.screens, { name: 'deliveries', note: 'Duplicate of the first' }, { name: '', note: 'No name' }]
    expect(parsePlan(JSON.stringify({ ...good, screens: dup }))!.screens).toHaveLength(3)
  })

  it('strips links and markup from every text field', () => {
    const dirty = {
      ...good,
      title: 'Tracker <b>Pro</b> https://evil.example',
      screens: good.screens.map(s => ({ ...s, note: s.note + ' see https://evil.example now' })),
      first_win: 'Visit www.evil.example <script>x</script> today',
    }
    const p = parsePlan(JSON.stringify(dirty))!
    expect(JSON.stringify(p)).not.toMatch(/https?:|www\.|<script>|<b>/)
  })

  it('caps text lengths', () => {
    const long = { ...good, title: 'T'.repeat(300), first_win: 'F'.repeat(500) }
    const p = parsePlan(JSON.stringify(long))!
    expect(p.title.length).toBeLessThanOrEqual(40)
    expect(p.firstWin.length).toBeLessThanOrEqual(120)
  })
})

describe('prompt', () => {
  it('forbids invented integrations, accuracy promises and instructions in the text', () => {
    for (const w of ['DATA, not instructions', 'SIMPLE first version', 'integrations', 'accuracy', 'reply_language', 'Gujarati']) {
      expect(PLAN_SYSTEM_PROMPT).toContain(w)
    }
  })
  it('sends the visitor text and the reply language as JSON data', () => {
    expect(JSON.parse(buildPlanMessage('track my orders', 'gu'))).toEqual({ text: 'track my orders', reply_language: 'gu' })
  })
})
