import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { PLAN_FACTS, TOPUP_PACKS, LARGE_PLAN_CREDITS } from './plans'
import { subGrant } from './plan-grants'

/**
 * Paid-plan credits were tripled on 2026-11-09 at unchanged prices; the free plan stays at 30.
 * These tests pin the numbers and, more importantly, stop the copies drifting apart again (the Dodo webhook once granted
 * 50 for Spark while the site's PLAN_FACTS said 100).
 */
describe('plan credits after the 3x change', () => {
  it('pins the monthly credits', () => {
    expect(PLAN_FACTS.free.credits).toBe(30) // free is NOT tripled
    expect(PLAN_FACTS.spark.credits).toBe(150)
    expect(PLAN_FACTS.starter.credits).toBe(450)
    expect(PLAN_FACTS.builder.credits).toBe(1500)
    expect(PLAN_FACTS.pro.credits).toBe(4500)
    expect(LARGE_PLAN_CREDITS).toEqual({ growth: 12000, scale: 30000 })
  })

  it('keeps every price unchanged', () => {
    expect(PLAN_FACTS.starter.monthlyPrice).toBe(29)
    expect(PLAN_FACTS.builder.monthlyPrice).toBe(79)
    expect(PLAN_FACTS.pro.monthlyPrice).toBe(199)
    expect(PLAN_FACTS.spark.monthlyPriceINR).toBe(499)
    expect(TOPUP_PACKS.map(p => p.price)).toEqual([19, 49, 99])
    expect(TOPUP_PACKS.map(p => p.priceINR)).toEqual([399, 999, 1999])
  })

  it('triples the top-up packs', () => {
    expect(TOPUP_PACKS.map(p => p.credits)).toEqual([120, 300, 600])
  })

  it('gives bigger plans a lower price per credit (the ladder makes sense)', () => {
    const perCredit = [
      PLAN_FACTS.starter.monthlyPrice! / PLAN_FACTS.starter.credits,
      PLAN_FACTS.builder.monthlyPrice! / PLAN_FACTS.builder.credits,
      PLAN_FACTS.pro.monthlyPrice! / PLAN_FACTS.pro.credits,
      399 / LARGE_PLAN_CREDITS.growth,
      799 / LARGE_PLAN_CREDITS.scale,
    ]
    for (let i = 1; i < perCredit.length; i++) expect(perCredit[i]).toBeLessThan(perCredit[i - 1])
  })

  it("keeps India's Spark and its pack at the same rupees per credit", () => {
    const spark = PLAN_FACTS.spark.monthlyPriceINR! / PLAN_FACTS.spark.credits
    const boost = TOPUP_PACKS[0].priceINR / TOPUP_PACKS[0].credits
    expect(boost).toBeCloseTo(spark, 1)
  })

  it('grants the same credits on mobile as on the web (single source)', () => {
    expect(subGrant('starter').credits).toBe(450)
    expect(subGrant('pro').credits).toBe(4500)
  })
})

describe('no copy of the plan credits can drift', () => {
  const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

  it('the Dodo webhook reads plan credits from PLAN_FACTS, not literals', () => {
    const src = read('src/app/api/dodo/webhook/route.ts')
    for (const id of ['spark', 'starter', 'builder', 'pro']) expect(src).toContain(`credits: PLAN_FACTS.${id}.credits`)
    expect(src).toContain('LARGE_PLAN_CREDITS.growth')
    expect(src).toContain('TOPUP_PACKS[0].credits')
  })

  it('the pricing page reads plan credits from PLAN_FACTS', () => {
    const src = read('src/app/pricing/PricingClient.tsx')
    for (const id of ['spark', 'starter', 'builder', 'pro']) expect(src).toContain(`credits: PLAN_FACTS.${id}.credits`)
  })

  it('shows per-credit prices that match price / credits', () => {
    const src = read('src/app/pricing/PricingClient.tsx')
    const usd = (p: number, c: number) => '$' + (p / c).toFixed(2)
    expect(src).toContain(`perCredit: '${usd(29, 450)}'`)
    expect(src).toContain(`perCredit: '${usd(79, 1500)}'`)
    expect(src).toContain(`perCredit: '${usd(199, 4500)}'`)
  })

  it('the places that were found stale after the first pass stay fixed', () => {
    const mcp = read('src/app/api/mcp/route.ts')
    expect(mcp).not.toMatch(/(?<![\d,.])(150|500)cr\/mo/)
    expect(mcp).toContain('PLAN_FACTS.starter.credits')
    expect(read('src/lib/email/index.ts')).not.toContain('40 credits is')
    for (const f of ['src/app/vs/lovable/page.tsx', 'src/app/vs/bolt/page.tsx', 'src/lib/i18n/dict/vs-content/lovable.ts', 'src/lib/i18n/dict/vs-content/bolt.ts']) {
      expect(read(f)).not.toMatch(/Starter credits\/mo[^\n]{0,20}wyber: '150'/)
      expect(read(f)).not.toContain('$29/month for 150 fixed credits')
      expect(read(f)).not.toContain('~250') // the unsourced Lovable figure; Lovable Pro is 100 credits plus 5 a day
      expect(read(f)).not.toMatch(/wyber: '150'/)
    }
    // Free signup is 30 credits, not 50, on the public ad and demo pages.
    for (const f of ['public/ads/index.html', 'public/demo-intro.html', 'public/demo-intro-mobile.html']) expect(read(f)).not.toMatch(/50 credits (on signup|·)|Start free — 50 credits|Try it free — 50 credits/)
  })

  it('no source file still states the old plan allotments', () => {
    // (?<![\d,.]) keeps "1,500" and "4,500" from matching as "500". 150 is Spark's real number now, so only the
    // Starter-specific form is checked.
    const stale = [
      /Starter[^\n]{0,30}(?<![\d,.])150 credits/,
      /Builder[^\n]{0,30}(?<![\d,.])500 credits/,
      /(?<![\d,.])500 credits\/(mo|month)\b/,
      /Pro[^\n]{0,30}(?<![\d,.])1,500 credits(?!\/)/,
    ]
    const hits: string[] = []
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name)
        if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); continue }
        if (!/\.(ts|tsx)$/.test(e.name) || /\.test\./.test(e.name)) continue
        const txt = fs.readFileSync(p, 'utf8')
        for (const re of stale) if (re.test(txt)) hits.push(`${p.replace(process.cwd(), '')} :: ${re}`)
      }
    }
    walk(path.join(process.cwd(), 'src'))
    expect(hits).toEqual([])
  })
})
