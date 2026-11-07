import type { Contact } from '@/lib/crm/contact'

export const AGENT_IDS = ['outreach', 'followup', 'meeting_prep', 'proposal', 'weekly_coach', 'onboarding', 'reengage', 'content'] as const
export type AgentId = (typeof AGENT_IDS)[number]

export const CHANNELS = ['whatsapp', 'email', 'note', 'doc'] as const
export type Channel = (typeof CHANNELS)[number]

export type Lang = 'en' | 'hi' | 'gu'

export interface ActivityLite { kind: string; summary: string; created_at: string }

/** One piece of work an agent will do: a contact (or none, for global agents) and why now. */
export interface Candidate {
  contact: Contact | null
  /** Dedupe key: the same agent never drafts the same key twice for the same contact. */
  key: string
  reason: string
  activities: ActivityLite[]
}

export interface AgentDef {
  id: AgentId
  name: string
  job: string
  /** Which model tier: cheap = Haiku 5.5, code = Sonnet 5.5. */
  model: 'cheap' | 'code'
  channels: Channel[]
  maxPerRun: number
  /** Output budget; a one-page brief needs far more room than a WhatsApp reply. */
  maxTokens: number
  /** Whether a draft may contain a price (only true if a rate card exists and the agent is allowed to quote). */
  mayQuotePrice: boolean
}

export interface DraftOut { channel: Channel; lang: Lang; title: string | null; body: string }

export const MAX_PENDING_PER_AGENT = 40
