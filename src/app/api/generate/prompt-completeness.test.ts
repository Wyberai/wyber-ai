import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// The four system-prompt builders aren't exported, so slice the source between
// their function declarations and guard that each motion keeps its
// first-build completeness rules (see docs/first-build-verification-plan.md).
const src = readFileSync(join(__dirname, 'route.ts'), 'utf8')

function section(from: string, to: string): string {
  const a = src.indexOf(`function ${from}(`)
  const b = src.indexOf(`function ${to}(`)
  expect(a, `${from} not found`).toBeGreaterThan(-1)
  expect(b, `${to} not found`).toBeGreaterThan(a)
  return src.slice(a, b)
}

const mobile = section('buildMobileSystemPrompt', 'buildWebsiteSystemPrompt')
const website = section('buildWebsiteSystemPrompt', 'buildSaasSystemPrompt')
const saas = section('buildSaasSystemPrompt', 'buildSystemPrompt')
const webapp = src.slice(src.indexOf('function buildSystemPrompt('))

describe('first-build completeness rules stay in every motion prompt', () => {
  it('mobile: states, destructive actions, brand moment, identity, account deletion, a11y', () => {
    expect(mobile).toContain('FIRST-BUILD COMPLETENESS — MOBILE')
    for (const k of ['FOUR STATES ON EVERY DATA SCREEN', 'DESTRUCTIVE ACTIONS', 'BRAND MOMENT', 'APP IDENTITY', 'Delete my account', 'accessibilityLabel']) {
      expect(mobile, k).toContain(k)
    }
  })

  it('website: brand mark + favicon, legal links, forms, not-found, empty content', () => {
    expect(website).toContain('FIRST-BUILD COMPLETENESS — WEBSITE')
    for (const k of ['BRAND MARK', 'rel="icon"', 'FOOTER BASICS', 'Privacy and Terms', 'UNKNOWN ROUTES', 'EMPTY CONTENT']) {
      expect(website, k).toContain(k)
    }
  })

  it('saas: states, error boundary kept out of context, confirm dialogs, roles, brand, legal', () => {
    expect(saas).toContain('FIRST-BUILD COMPLETENESS — SAAS')
    for (const k of ['FOUR STATES ON EVERY DATA SCREEN', 'ErrorBoundary', 'NOT a context', 'ConfirmDialog', 'ROLE-AWARE UI', 'BRAND MARK', 'LEGAL LINKS']) {
      expect(saas, k).toContain(k)
    }
  })

  it('webapp: four states, forms + destructive rules, stubs never for named features', () => {
    expect(webapp).toContain('RULE #4b — EVERY SCREEN HAS FOUR STATES')
    expect(webapp).toContain('RULE #4c — FORMS AND DESTRUCTIVE ACTIONS')
    expect(webapp).toContain('NEVER acceptable for a feature the user named')
  })

  it('rules do not leak into the wrong motion', () => {
    expect(website).not.toContain('Alert.alert')
    expect(saas).not.toContain('Delete my account')
    expect(mobile).not.toContain('rel="icon"')
  })
})
