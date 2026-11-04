import { describe, it, expect } from 'vitest'
import { GO_LIVE_SERVICES, KIND_TO_SERVICES, planGoLive, serverEnvNames, settingsForNeeds } from './go-live'
import { INFRA_KINDS } from './byos/infra'
import { composeBuildPrompt, PROMPT_LIMIT } from './byos/quote'

const api = (c: string) => ({ content: c })

describe('go-live catalog', () => {
  it('maps every needs kind to catalog entries that exist', () => {
    const ids = new Set(GO_LIVE_SERVICES.map(s => s.id))
    for (const k of INFRA_KINDS) for (const id of KIND_TO_SERVICES[k]) expect(ids.has(id)).toBe(true)
  })
  it('has unique setting names per service and no duplicates across ids', () => {
    expect(new Set(GO_LIVE_SERVICES.map(s => s.id)).size).toBe(GO_LIVE_SERVICES.length)
    for (const s of GO_LIVE_SERVICES) expect(new Set(s.vars.map(v => v.name)).size).toBe(s.vars.length)
  })
  it('gives the builder exact names for the services a pick needs', () => {
    expect(settingsForNeeds(['email-sending', 'sms-whatsapp'])).toEqual([
      { label: 'Amazon SES', names: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'SES_FROM_EMAIL'] },
      { label: 'Twilio', names: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM'] },
    ])
    expect(settingsForNeeds(['voice-telephony', 'sms-whatsapp'])).toHaveLength(1)
  })
})

describe('serverEnvNames', () => {
  it('reads only api/ functions, both access styles, ignoring platform vars', () => {
    const files = {
      'api/status.ts': api("export default (q,r)=>r.json({a: !!process.env.TWILIO_AUTH_TOKEN, b: process.env['AWS_REGION'], n: process.env.NODE_ENV, v: process.env.VERCEL_URL, m: process.env.ANTHROPIC_MODEL})"),
      'src/App.tsx': api('const x = process.env.SHOULD_NOT_APPEAR'),
      '/api/ai.js': api('process.env.ANTHROPIC_API_KEY'),
    }
    expect(serverEnvNames(files)).toEqual(['TWILIO_AUTH_TOKEN', 'AWS_REGION', 'ANTHROPIC_API_KEY'])
  })
})

describe('planGoLive', () => {
  const files = {
    'api/ses.ts': api('process.env.AWS_ACCESS_KEY_ID; process.env.AWS_SECRET_ACCESS_KEY; process.env.AWS_REGION; process.env.SES_FROM_EMAIL'),
    'api/ai.ts': api('process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY'),
    'api/x.ts': api('process.env.MY_CUSTOM_HOOK'),
  }
  it('lists what is missing and what is connected', () => {
    const p = planGoLive(files, new Set(['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'OPENAI_API_KEY']))
    const ses = p.items.find(i => i.service.id === 'ses')!
    expect(ses.connected).toBe(false)
    expect(ses.missing.map(v => v.name)).toEqual(['AWS_REGION', 'SES_FROM_EMAIL'])
    expect(p.items.find(i => i.service.id === 'ai')!.connected).toBe(true)
    expect(p.other).toEqual(['MY_CUSTOM_HOOK'])
    expect(p.serverFiles).toBe(3)
  })
  it('is empty for an app with no server code', () => {
    expect(planGoLive({ 'src/App.tsx': api('x') }, new Set())).toEqual({ items: [], other: [], serverFiles: 0 })
  })
})

describe('build prompt', () => {
  it('names the exact settings and forbids a separate server, within the limit', () => {
    const f = [
      { module: 'Email', name: 'Bulk email campaigns', description: 'Send campaigns', fit: 'lite' as const, needs: ['email-sending' as const] },
      { module: 'AI', name: 'AI writer', description: 'Writes emails', fit: 'build' as const, needs: ['ai-model' as const] },
    ]
    const p = composeBuildPrompt({ product: 'Pipedrive', category: 'CRM', features: f, connectLive: [], connectPlaceholder: [], importCsv: false })
    expect(p).toContain('AWS_ACCESS_KEY_ID')
    expect(p).toContain('ANTHROPIC_API_KEY')
    expect(p).toMatch(/under api\//)
    expect(p).toMatch(/Never ask the owner to host a separate server/)
    expect(p.length).toBeLessThanOrEqual(PROMPT_LIMIT)
  })
})
