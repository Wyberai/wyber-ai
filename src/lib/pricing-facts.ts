import { PLAN_FACTS, TOPUP_PACKS } from './plans'
import { creditCost } from './credits'

// The prices and credit costs that the AI assistants are told to quote to visitors and customers. They are built from the
// same tables the pricing page and the billing code read (plans.ts, credits.ts), so a price changed there changes here
// too. These lines used to be typed into three separate prompts and had drifted: a visitor asking the chat bubble "how
// much?" was told top-ups of 40, 100 and 200 credits, and "first build = 40 to 80 credits", none of which was true.

const n = (v: number) => v.toLocaleString('en-US')
const usd = (v: number) => `$${v}`

/** Builds are priced by size, known before they start. 'fast' is the tier real builds run on. */
export function buildCosts(): { small: number; medium: number; large: number; xl: number } {
  return {
    small: creditCost('web-build', 'fast', 'small'), medium: creditCost('web-build', 'fast', 'medium'),
    large: creditCost('web-build', 'fast', 'large'), xl: creditCost('web-build', 'fast', 'xl'),
  }
}

export const editCost = (): number => creditCost('small-edit', 'fast')
export const planCost = (): number => creditCost('plan', 'fast')
export const imageCost = (): number => creditCost('image-gen', 'fast')

/** What one credit costs in dollars on each paid plan and on a top-up, as a plain range for "roughly how much?" answers. */
export function perCreditRange(): { plan: [number, number]; topup: [number, number] } {
  const plans = (['starter', 'builder', 'pro'] as const).map(id => PLAN_FACTS[id].monthlyPrice! / PLAN_FACTS[id].credits)
  const tops = TOPUP_PACKS.map(t => t.price / t.credits)
  const r = (xs: number[]): [number, number] => [Math.round(Math.min(...xs) * 100) / 100, Math.round(Math.max(...xs) * 100) / 100]
  return { plan: r(plans), topup: r(tops) }
}

export function planLines(): string[] {
  const lines: string[] = [`- Free: ${n(PLAN_FACTS.free.credits)} credits when you sign up, no card needed. A small daily top-up keeps a free account from sitting at zero (it stops at ${n(PLAN_FACTS.free.credits)}).`]
  const spark = PLAN_FACTS.spark
  lines.push(`- Spark (India only): ₹${n(spark.monthlyPriceINR!)}/month, ${n(spark.credits)} credits a month`)
  for (const id of ['starter', 'builder', 'pro'] as const) {
    const p = PLAN_FACTS[id]
    lines.push(`- ${p.name}: ${usd(p.monthlyPrice!)}/month (${usd(p.annualPrice!)}/month if paid yearly), ${n(p.credits)} credits a month`)
  }
  return lines
}

export function topupLine(): string {
  return `- Top-ups: ${TOPUP_PACKS.map(t => `${n(t.credits)} credits for ${usd(t.price)}`).join(', ')}. Top-up credits never expire; unused plan credits roll over while the subscription is active.`
}

export function costLines(): string[] {
  const b = buildCosts()
  return [
    `- A build costs by size, shown before it starts: small ${b.small} credits, medium ${b.medium}, large ${b.large}, the biggest ${b.xl}.`,
    `- A small edit is about ${editCost()} credits. A build plan (Plan Mode) is ${planCost()}. An image is ${imageCost()}.`,
    `- Free to do: deploy, export the code, push to GitHub, and the automatic repair of build errors.`,
  ]
}

/** One block for the prompts that answer "what does it cost?". */
export function pricingFactsBlock(): string {
  const r = perCreditRange()
  return [
    'PRICING (current, from the product itself; quote these exactly and never invent others):',
    ...planLines(),
    topupLine(),
    'CREDIT COSTS:',
    ...costLines(),
    `- Roughly ${usd(r.plan[0])} to ${usd(r.plan[1])} per credit on a plan, and about ${usd(r.topup[0])} to ${usd(r.topup[1])} per credit on a top-up.`,
  ].join('\n')
}

/** For "roughly what would my idea cost to build?", the honest ranges by size. */
export function estimateRubric(): string {
  const b = buildCosts()
  return [
    `- A small build (a few screens, one simple database, such as a landing page, a portfolio or a single-tool app): about ${b.small} credits`,
    `- A medium build (sign-in, a database, several screens, such as a booking system or a small CRM): about ${b.medium} credits`,
    `- A large build (several roles, payments or many screens, such as a full SaaS or a marketplace): about ${b.large} to ${b.xl} credits`,
    `Add about ${editCost()} credits for each later change. The ${n(PLAN_FACTS.free.credits)} free credits cover one small build.`,
  ].join('\n')
}
