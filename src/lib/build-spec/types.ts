// Shared by every pillar (websites, web apps, SaaS, mobile, replace-your-SaaS). A pillar adds its own intents, scaffold and
// checks on top of this core; it does not re-solve facts, languages, copy safety, image hygiene or the model loop.

/** What the owner actually told us. Anything missing is left out of the product, never invented. */
export interface OwnerFacts {
  name?: string
  city?: string
  address?: string
  phone?: string
  whatsapp?: string
  email?: string
  hours?: string
}

/** Languages a product offers. English is always first; the rest are written by a translation step. */
export type LangId = 'en' | 'hi' | 'gu'

export interface ModelReply { text: string; inputTokens: number; outputTokens: number }
/** One non-streaming model call. In production this is Sonnet; tests inject a fake. */
export type ModelCall = (system: string, user: string) => Promise<ModelReply>
