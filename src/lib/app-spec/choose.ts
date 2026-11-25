import { askForJson } from '../build-spec/ask'
import type { ModelCall, ModelReply } from '../build-spec/types'
import { APP_BLUEPRINTS, APP_LIMITS, buildIntentPrompt, classifyAppIntent, validateIntentChoice, type AppIntentBrief, type AppIntentChoice } from './intents'
import type { OwnerFacts } from './types'

/** What a SaaS product built here cannot do (it has plans, a team page and a demo, but no real back end for customers' own customers). */
export const SAAS_LIMITS = [
  'outside people (the owner\'s own clients) opening a link to upload files, fill a form or sign in',
  'sending emails, SMS or WhatsApp messages by itself, such as automatic reminders (it can open a ready message for the person to send)',
  'real sign-in with different permissions per team member (the team page lists people, the data stays in the browser)',
  'collecting real payments or issuing GST invoices for the subscription',
  'data shared live between several devices',
]

/**
 * The shape of a product is chosen by the model reading the WHOLE brief (a keyword count let "invoice" and "GST" outweigh "job cards" and
 * dropped the core). It also names what the brief asks for that this kind of product cannot do, so the owner is told. The keyword result is
 * the fallback when the call fails or answers badly.
 */
export async function chooseShape(prompt: string, call: ModelCall, onUsage: (r: ModelReply) => void, limits: string[] = APP_LIMITS, facts: OwnerFacts = {}): Promise<{ brief: AppIntentBrief; chosen: boolean }> {
  const fallback = classifyAppIntent(prompt, facts)
  const ip = buildIntentPrompt(prompt, limits)
  const choice = await askForJson<AppIntentChoice>({ call, system: ip.system, user: ip.user, attempts: 1, timeoutMs: 25000, onUsage, validate: validateIntentChoice })
  if (!choice.ok) return { brief: fallback, chosen: false }
  return {
    brief: { ...fallback, intent: choice.value.primary, secondary: choice.value.secondary ?? undefined, notBuilt: choice.value.notBuilt, note: undefined },
    chosen: true,
  }
}

export { APP_BLUEPRINTS }
