// Shared guards for the intent API routes (server only).
import type { NextRequest } from 'next/server'
import { intentExperimentOn } from './experiment'

export function intentAvailable(req: NextRequest): boolean {
  if (!intentExperimentOn(process.env.NEXT_PUBLIC_INTENT_EXPERIMENT)) return false
  // India-only. Local dev has no Vercel geo header, so allow it outside production.
  if (process.env.NODE_ENV !== 'production') return true
  return (req.headers.get('x-vercel-ip-country') ?? '').toUpperCase() === 'IN'
}

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export const ANON_ID_RE = /^[a-zA-Z0-9-]{8,64}$/

// Anonymous events the experiment may record (see /api/intent/event).
export const INTENT_EVENT_KINDS = new Set([
  'impression', 'chip_tapped', 'door_changed', 'lang_changed',
  'readout_shown', 'readout_corrected', 'submitted',
])
