import { createServiceClient } from '@/lib/supabase/server'

// Every limit in agency mode lives here. The older in-memory limiter only holds inside one serverless instance, so it
// cannot stop someone guessing a client passcode or spamming a freelancer's inbox from a public link. This one is
// counted in the database (the rate_limit_hit() function, atomic), so the bound holds across instances and restarts.
//
// failClosed: when the database cannot be reached, deny. Used for passcode attempts, where "limiter down" must never
// mean "unlimited guesses". Everything else fails open, because a limiter should not take a public page down.

export async function hit(key: string, max: number, windowMs: number, opts: { failClosed?: boolean } = {}): Promise<boolean> {
  try {
    const db = createServiceClient()
    const { data, error } = await db.rpc('rate_limit_hit', { p_key: key, p_window_ms: windowMs, p_max: max })
    if (error || !data || !data[0]) return !opts.failClosed
    return !!data[0].allowed
  } catch {
    return !opts.failClosed
  }
}

/** The named limits, so a number is never repeated across files. */
export const LIMITS = {
  unlockPerIp: { max: 8, windowMs: 10 * 60_000 },        // passcode tries from one address on one link
  unlockPerLink: { max: 60, windowMs: 60 * 60_000 },     // passcode tries on one link from anywhere
  reviewPerIp: { max: 20, windowMs: 10 * 60_000 },       // approve / comment actions
  reviewAlert: { max: 1, windowMs: 10 * 60_000 },        // emails to the freelancer about client activity, per client
  quotePerIp: { max: 12, windowMs: 10 * 60_000 },
  briefPerIp: { max: 10, windowMs: 60 * 60_000 },
  briefAlert: { max: 3, windowMs: 60 * 60_000 },
  emailPerClient: { max: 6, windowMs: 60 * 60_000 },     // emails a freelancer sends to one client
  emailPerOwner: { max: 25, windowMs: 24 * 60 * 60_000 }, // emails a freelancer sends to clients in a day, in total
} as const
