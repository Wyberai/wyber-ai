import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { checkEnv } from './env'

const CRITICAL = [
  'ANTHROPIC_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

describe('checkEnv', () => {
  let saved: Record<string, string | undefined>

  beforeEach(() => {
    saved = {}
    for (const k of [...CRITICAL, 'SECRETS_ENCRYPTION_KEY', 'NEXT_PUBLIC_APP_URL', 'CRON_SECRET']) {
      saved[k] = process.env[k]
    }
  })
  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  })

  it('reports ok when all critical vars are present', () => {
    for (const k of CRITICAL) process.env[k] = 'x'
    expect(checkEnv().ok).toBe(true)
    expect(checkEnv().missingCritical).toEqual([])
  })

  it('flags a missing critical var', () => {
    for (const k of CRITICAL) process.env[k] = 'x'
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const report = checkEnv()
    expect(report.ok).toBe(false)
    expect(report.missingCritical).toContain('SUPABASE_SERVICE_ROLE_KEY')
  })

  it('treats an empty string as missing', () => {
    for (const k of CRITICAL) process.env[k] = 'x'
    process.env.ANTHROPIC_API_KEY = '   '
    const report = checkEnv()
    expect(report.ok).toBe(false)
    expect(report.missingCritical).toContain('ANTHROPIC_API_KEY')
  })
})
