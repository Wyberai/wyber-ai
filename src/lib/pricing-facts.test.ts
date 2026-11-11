import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { PLAN_FACTS, TOPUP_PACKS } from './plans'
import { creditCost } from './credits'
import { pricingFactsBlock, estimateRubric, buildCosts, editCost, planCost, perCreditRange } from './pricing-facts'

// What the chat bubble tells a visitor about price must be what the product charges. These facts come from the plan and
// cost tables, and the prompts that use them must not carry hand-typed numbers that can go stale.
const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

describe('pricing facts for the assistants', () => {
  const block = pricingFactsBlock()

  it('quotes every paid plan exactly as the plan table has it', () => {
    for (const id of ['starter', 'builder', 'pro'] as const) {
      const p = PLAN_FACTS[id]
      expect(block).toContain(`${p.name}: $${p.monthlyPrice}/month`)
      expect(block).toContain(`${p.credits.toLocaleString('en-US')} credits a month`)
      expect(block).toContain(`$${p.annualPrice}/month if paid yearly`)
    }
    expect(block).toContain(`₹${PLAN_FACTS.spark.monthlyPriceINR!.toLocaleString('en-US')}/month`)
  })

  it('quotes every top-up pack as the pack table has it', () => {
    for (const t of TOPUP_PACKS) expect(block).toContain(`${t.credits.toLocaleString('en-US')} credits for $${t.price}`)
  })

  it('costs come from the billing code, not from typed numbers', () => {
    const b = buildCosts()
    expect(b.small).toBe(creditCost('web-build', 'fast', 'small'))
    expect(b.xl).toBe(creditCost('web-build', 'fast', 'xl'))
    expect(editCost()).toBe(creditCost('small-edit', 'fast'))
    expect(planCost()).toBe(creditCost('plan', 'fast'))
    expect(block).toContain(`small ${b.small} credits`)
    expect(block).toContain(`about ${editCost()} credits`)
  })

  it('builds get dearer with size, and the free credits cover exactly one small build', () => {
    const b = buildCosts()
    expect(b.small).toBeLessThan(b.medium); expect(b.medium).toBeLessThan(b.large); expect(b.large).toBeLessThan(b.xl)
    expect(PLAN_FACTS.free.credits).toBeGreaterThanOrEqual(b.small)
    expect(estimateRubric()).toContain(`The ${PLAN_FACTS.free.credits} free credits cover one small build`)
  })

  it('says top-ups never expire, and that plan credits roll over only while subscribed', () => {
    expect(block).toContain('Top-up credits never expire')
    expect(block).toContain('roll over while the subscription is active')
    // "never expire" is only ever said about top-ups, never about credits in general.
    for (const m of block.matchAll(/never expire/gi)) expect(block.slice(Math.max(0, m.index! - 15), m.index!), 'an unqualified never-expire claim').toMatch(/Top-up credits $/)
  })

  it('gives a believable dollars-per-credit range: a plan is cheaper per credit than a top-up', () => {
    const r = perCreditRange()
    expect(r.plan[0]).toBeGreaterThan(0.02); expect(r.plan[1]).toBeLessThan(0.1)
    expect(r.topup[0]).toBeGreaterThan(r.plan[1])
  })
})

describe('the prompts that quote prices read them from the facts, and carry no stale numbers', () => {
  const STALE = ['40cr/$19', '100cr/$49', '200cr/$19', '600cr/$49', '2000cr/$99', '40–80cr', 'plan mode 13cr', '15–130 credits', '15-25 credits', '$0.15-0.20', '48 built-in', '27 integrations']
  for (const file of ['src/app/api/chat/route.ts', 'src/app/api/support/route.ts', 'src/app/api/generate/route.ts']) {
    it(`${file} has no stale price or cost`, () => {
      const src = read(file)
      for (const bad of STALE) expect(src, `${file} still says "${bad}"`).not.toContain(bad)
    })
  }
  it('chat and support build their price block from pricingFactsBlock()', () => {
    expect(read('src/app/api/chat/route.ts')).toContain('${PRICING_BLOCK}')
    expect(read('src/app/api/support/route.ts')).toContain('${PRICING_BLOCK}')
    expect(read('src/app/api/generate/route.ts')).toContain('buildCosts()')
  })
})
