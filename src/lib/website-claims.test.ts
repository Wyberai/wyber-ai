import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// A generated website must never be told to state a certification, legal status, support promise or customer count the owner did not give.
// The generator prompt and the website skeleton are what every new site starts from, so they are checked here.

const root = process.cwd()
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8')

const BANNED = /SOC ?2( Type II)? (certified|compliant)|SOC 2 compliant|ISO ?27001 certified|GDPR[- ]compliant|HIPAA[- ]compliant|AES-256|24\/7 support|money-back guarantee/i

describe('website generator never invents compliance or guarantees', () => {
  it('the website skeleton contains no certification or guarantee claim', () => {
    const lines = read('src/lib/skeletons/website.ts').split('\n').filter(l => BANNED.test(l))
    expect(lines).toEqual([])
  })

  it('the website prompt only mentions those claims to forbid them', () => {
    const src = read('src/app/api/generate/route.ts')
    const start = src.indexOf('function buildWebsiteSystemPrompt')
    const end = src.indexOf('function buildSaasSystemPrompt')
    expect(start).toBeGreaterThan(0)
    const websitePrompt = src.slice(start, end)
    const offenders = websitePrompt.split('\n').filter(l => BANNED.test(l) && !/NEVER|never|no "SOC 2"|Never state/.test(l))
    expect(offenders).toEqual([])
  })

  it('the trust-signal rule says to use only facts the owner gave', () => {
    const src = read('src/app/api/generate/route.ts')
    expect(src).toMatch(/using ONLY facts the owner gave you/)
    expect(src).toMatch(/If the owner gave no facts, show no trust band/)
  })
})
