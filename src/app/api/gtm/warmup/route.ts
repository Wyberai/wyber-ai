import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSendProvider } from '@/lib/gtm/provider'

// GET — connected mailboxes + warmup status, synced into gtm_provider_accounts
export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const provider = await getSendProvider(user.id)
  if (!provider) {
    return NextResponse.json({
      connected: false,
      message: 'Add your INSTANTLY_API_KEY secret in Settings → Secrets to connect your sending mailboxes.',
    })
  }

  try {
    const accounts = await provider.listAccounts()

    // Idempotent sync: replace this provider's rows with the live list
    await supabase.from('gtm_provider_accounts').delete().eq('user_id', user.id).eq('provider', provider.name)
    if (accounts.length > 0) {
      await supabase.from('gtm_provider_accounts').insert(accounts.map(a => ({
        user_id: user.id,
        provider: provider.name,
        account_label: a.email,
        status: a.warmupEnabled ? 'warming' : 'active',
        warmup_score: a.warmupScore,
        daily_limit: a.dailyLimit ?? 30,
        external_id: a.email,
      })))
    }

    return NextResponse.json({ connected: true, provider: provider.name, accounts })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST — toggle warmup for a mailbox
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { action: 'start' | 'stop'; account_email?: string }
  if ((body.action !== 'start' && body.action !== 'stop') || !body.account_email) {
    return NextResponse.json({ error: 'action (start|stop) and account_email required' }, { status: 400 })
  }

  const provider = await getSendProvider(user.id)
  if (!provider) return NextResponse.json({ error: 'No send provider connected (INSTANTLY_API_KEY)' }, { status: 400 })

  try {
    await provider.setWarmup(body.account_email, body.action === 'start')
    await supabase.from('gtm_provider_accounts')
      .update({ status: body.action === 'start' ? 'warming' : 'active' })
      .eq('user_id', user.id).eq('provider', provider.name).eq('account_label', body.account_email)
    return NextResponse.json({ ok: true, warmup_enabled: body.action === 'start' })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
