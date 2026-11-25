import { hit, LIMITS } from './limits'
import { sendClientPortalEmail } from '@/lib/email'
import type { Db } from './access'
import { loadAgencyProfile } from './profile'

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'

const EMAIL_SHAPE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/

/**
 * Emails the client about their project, in the freelancer's name with replies going to the freelancer. Only goes to the
 * address the freelancer saved on that client, only for an active client, and at most 6 an hour per client so a loop
 * or a slip cannot spam anyone. Returns what happened so the dashboard can say so.
 */
export async function emailClient(
  db: Db,
  client: { id: string; owner_id: string; org_id?: string | null; name: string; slug: string; contact_email?: string | null; status: string },
  mail: { kind: 'update' | 'quote' | 'delivered' | 'brief'; message?: string | null; quoteTitle?: string; quoteTotal?: string; link?: string },
): Promise<{ sent: boolean; reason?: 'no_email' | 'inactive' | 'rate_limited' | 'no_sender' | 'failed' }> {
  const to = (client.contact_email ?? '').trim()
  if (!EMAIL_SHAPE.test(to)) return { sent: false, reason: 'no_email' }
  if (client.status !== 'active') return { sent: false, reason: 'inactive' }
  if (!(await hit(`client-email:${client.id}`, LIMITS.emailPerClient.max, LIMITS.emailPerClient.windowMs))) return { sent: false, reason: 'rate_limited' }
  // A daily ceiling across all of one freelancer's clients, so WyberAi cannot be used to mass-mail strangers.
  if (!(await hit(`client-email-owner:${client.owner_id}`, LIMITS.emailPerOwner.max, LIMITS.emailPerOwner.windowMs))) return { sent: false, reason: 'rate_limited' }
  try {
    const { data: owner } = await db.from('profiles').select('email, full_name').eq('id', client.owner_id).maybeSingle()
    // The email comes from the business the client knows (the workspace's or the freelancer's profile), and replies go to its support address.
    const profile = await loadAgencyProfile(db, { owner_id: client.owner_id, org_id: client.org_id ?? null })
    // The client must be able to tell who the email is from. Without a business name or a personal name it would arrive
    // from "Your developer" or an address fragment, which reads like spam, so it is not sent until one is set.
    const fromName = (profile?.business_name || owner?.full_name || '').trim()
    if (!fromName) return { sent: false, reason: 'no_sender' }
    await sendClientPortalEmail({
      to, fromName, replyTo: profile?.support_email || owner?.email || null,
      clientName: client.name, kind: mail.kind, message: mail.message ?? null, link: mail.link ?? `${APP}/client/${client.slug}`, quoteTitle: mail.quoteTitle, quoteTotal: mail.quoteTotal,
    })
    return { sent: true }
  } catch { return { sent: false, reason: 'failed' } }
}
