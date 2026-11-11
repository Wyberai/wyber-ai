import { rateLimit } from '@/lib/rate-limit'
import { sendClientPortalEmail } from '@/lib/email'
import type { Db } from './access'

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'

const EMAIL_SHAPE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/

/**
 * Emails the client about their project, in the freelancer's name with replies going to the freelancer. Only goes to the
 * address the freelancer saved on that client, only for an active client, and at most 6 an hour per client so a loop
 * or a slip cannot spam anyone. Returns what happened so the dashboard can say so.
 */
export async function emailClient(
  db: Db,
  client: { id: string; owner_id: string; name: string; slug: string; contact_email?: string | null; status: string },
  mail: { kind: 'update' | 'quote' | 'delivered'; message?: string | null; quoteTitle?: string; quoteTotal?: string },
): Promise<{ sent: boolean; reason?: 'no_email' | 'inactive' | 'rate_limited' | 'failed' }> {
  const to = (client.contact_email ?? '').trim()
  if (!EMAIL_SHAPE.test(to)) return { sent: false, reason: 'no_email' }
  if (client.status !== 'active') return { sent: false, reason: 'inactive' }
  if (!rateLimit(`client-email:${client.id}`, 6, 60 * 60_000).allowed) return { sent: false, reason: 'rate_limited' }
  try {
    const { data: owner } = await db.from('profiles').select('email, full_name').eq('id', client.owner_id).maybeSingle()
    await sendClientPortalEmail({
      to, fromName: owner?.full_name || (owner?.email ? String(owner.email).split('@')[0] : 'Your developer'), replyTo: owner?.email ?? null,
      clientName: client.name, kind: mail.kind, message: mail.message ?? null, link: `${APP}/client/${client.slug}`, quoteTitle: mail.quoteTitle, quoteTotal: mail.quoteTotal,
    })
    return { sent: true }
  } catch { return { sent: false, reason: 'failed' } }
}
