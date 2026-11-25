import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/transport'
import { transferNoticeMail } from '@/lib/domains/notify'
import { context, notConfigured, requireUser, unauthorized } from '@/lib/domains/route-helpers'

// Moving a domain to another provider. The domain belongs to the customer, so this is theirs to do without writing to us.
//   POST { domain, action: 'unlock' }  switches the transfer lock off and returns the transfer code
//   POST { domain, action: 'lock' }    locks it again (changed their mind)
// Only the signed-in owner of the domain. Every change emails the registrant, in case it was not them. The provider
// itself refuses a transfer in the first 60 days after registration, so its own message is passed on if it does.
export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauthorized()
  const ctx = await context()
  if (!ctx) return notConfigured()
  // Moving a domain away is the one step that cannot be undone from here, so the sign-in must be recent (a stolen old session is not enough).
  const lastSignIn = Date.parse(user.last_sign_in_at ?? '')
  if (!Number.isFinite(lastSignIn) || Date.now() - lastSignIn > 15 * 60_000) return NextResponse.json({ error: 'For your safety, please sign in again before you move a domain. Then come back to this page.', reauth: true }, { status: 403 })
  const b = (await req.json().catch(() => ({}))) as { domain?: string; action?: string }
  const domain = String(b.domain ?? '').trim().toLowerCase()
  const action = b.action === 'lock' ? 'lock' : b.action === 'unlock' ? 'unlock' : null
  if (!action) return NextResponse.json({ error: 'Choose unlock or lock' }, { status: 400 })
  const d = await ctx.store.getDomain(user.id, domain)
  if (!d) return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
  try {
    if (action === 'unlock') await ctx.provider.setTransferLock(d.rc_order_id, false)
    else await ctx.provider.setTransferLock(d.rc_order_id, true)
    const info = await ctx.provider.getTransferInfo(d.rc_order_id)
    const contact = await ctx.store.latestContact(user.id, domain)
    if (contact?.email) {
      const m = transferNoticeMail(contact.email, domain, action === 'unlock' ? 'unlocked' : 'locked', process.env.NEXT_PUBLIC_APP_URL || 'https://wyberai.com')
      await sendEmail({ from: 'WyberAi <hello@wyberai.com>', to: m.to, subject: m.subject, text: m.text }).catch(e => console.error('[transfer-out] notice failed', e instanceof Error ? e.message : e))
    }
    // The code is only returned after an unlock, to the signed-in owner.
    return NextResponse.json({ locked: info.locked, authCode: action === 'unlock' ? info.authCode : null })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'The provider could not do that' }, { status: 502 })
  }
}
