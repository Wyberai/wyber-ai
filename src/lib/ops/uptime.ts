/**
 * Uptime check for the email service. Continuum (api.continuumapi.com) sends every email WyberAi sends, including login links.
 * It was down from 2026-11-07 to 2026-11-09 and nobody knew for two days, because the only alarm was an email that travels
 * through Continuum. This check runs every 5 minutes and tells the founder once when it goes down, again every hour while
 * it stays down, and once when it recovers. The alert goes out through the email fallback (Resend), so it still arrives.
 */

export type UptimeState = { status: 'up' | 'down'; since: string; lastAlertAt: string | null }
export type UptimeAction = 'none' | 'alert-down' | 'alert-still-down' | 'alert-recovered'

export const REALERT_MINUTES = 60

/** Pure decision: given the previous state and what we just saw, what should happen and what is the new state? */
export function decideUptimeAction(prev: UptimeState | null, ok: boolean, now: Date): { action: UptimeAction; next: UptimeState } {
  const iso = now.toISOString()
  if (ok) {
    if (prev?.status === 'down') return { action: 'alert-recovered', next: { status: 'up', since: iso, lastAlertAt: prev.lastAlertAt } }
    return { action: 'none', next: { status: 'up', since: prev?.since ?? iso, lastAlertAt: prev?.lastAlertAt ?? null } }
  }
  if (!prev || prev.status === 'up') return { action: 'alert-down', next: { status: 'down', since: iso, lastAlertAt: iso } }
  const last = prev.lastAlertAt ? new Date(prev.lastAlertAt).getTime() : 0
  if (now.getTime() - last >= REALERT_MINUTES * 60_000) return { action: 'alert-still-down', next: { ...prev, lastAlertAt: iso } }
  return { action: 'none', next: prev }
}

/** Without stored state (table not created yet) we can only send a reminder-style alert once an hour while it is failing. */
export function statelessShouldAlert(ok: boolean, now: Date): boolean {
  return !ok && now.getUTCMinutes() < 5
}

export function minutesBetween(from: string, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - new Date(from).getTime()) / 60_000))
}

/** Two tries, a few seconds apart, so one slow request does not page anyone. */
export async function checkHealth(url: string, fetcher: typeof fetch = fetch, tries = 2, waitMs = 3000): Promise<{ ok: boolean; detail: string }> {
  let detail = ''
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetcher(url, { signal: AbortSignal.timeout(12_000), headers: { 'User-Agent': 'wyberai-uptime/1.0' } })
      if (res.ok) return { ok: true, detail: `HTTP ${res.status}` }
      detail = `HTTP ${res.status}`
    } catch (e) {
      detail = e instanceof Error ? e.message : String(e)
    }
    if (i < tries - 1) await new Promise(r => setTimeout(r, waitMs))
  }
  return { ok: false, detail }
}

export function alertText(action: Exclude<UptimeAction, 'none'>, args: { url: string; detail: string; downFor?: number }): { subject: string; text: string } {
  if (action === 'alert-recovered') {
    return {
      subject: 'Recovered: email service (Continuum) is back',
      text: `The email service answered again at ${args.url}.\nIt was down for about ${args.downFor ?? '?'} minutes.\nEmails sent in that time went through the Resend fallback if it was set up, otherwise they were not delivered.`,
    }
  }
  const still = action === 'alert-still-down'
  return {
    subject: still ? `STILL DOWN: email service (Continuum), ${args.downFor ?? '?'} min` : 'DOWN: email service (Continuum) is not answering',
    text: [
      `Continuum (the service that sends WyberAi email, including login links) did not answer a health check.`,
      `Address: ${args.url}`,
      `What we saw: ${args.detail}`,
      still ? `It has been down for about ${args.downFor} minutes.` : '',
      '',
      'What to do: open Railway, project "affectionate-celebration", service "web", and read the deploy logs.',
      'If the log says P3009, a Prisma migration record is marked failed; see docs/RUNBOOK-continuum.md.',
      'This message went out through the Resend fallback.',
    ].filter(Boolean).join('\n'),
  }
}
