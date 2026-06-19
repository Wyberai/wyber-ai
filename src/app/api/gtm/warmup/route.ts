import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDecryptedSecret } from '@/lib/get-decrypted-secret'

const SMARTLEAD_BASE = 'https://server.smartlead.ai/api/v1'

async function smartleadReq(apiKey: string, path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${SMARTLEAD_BASE}${path}?api_key=${apiKey}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`Smartlead ${path}: ${res.status}`)
  return res.json()
}

// GET — warmup status for all connected email accounts
export async function GET(_req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = await getDecryptedSecret(user.id, 'SMARTLEAD_API_KEY')
  if (!apiKey) {
    return NextResponse.json({
      connected: false,
      message: 'Add your SMARTLEAD_API_KEY secret in Settings → Secrets to enable email warmup.',
    })
  }

  try {
    const accounts = await smartleadReq(apiKey, '/email-accounts')
    return NextResponse.json({ connected: true, accounts: accounts ?? [] })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST — start or stop warmup for an email account
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    action: 'start' | 'stop' | 'add_account'
    email_account_id?: number
    email?: string
    smtp?: { host: string; port: number; username: string; password: string }
    imap?: { host: string; port: number; username: string; password: string }
    warmup_settings?: { daily_rampup?: number; max_limit?: number; reply_rate_percentage?: number }
  }

  const apiKey = await getDecryptedSecret(user.id, 'SMARTLEAD_API_KEY')
  if (!apiKey) return NextResponse.json({ error: 'SMARTLEAD_API_KEY not found' }, { status: 400 })

  try {
    if (body.action === 'add_account') {
      const result = await smartleadReq(apiKey, '/email-accounts', 'POST', {
        from_name: 'Wyber GTM',
        from_email: body.email,
        smtp_host: body.smtp?.host,
        smtp_port: body.smtp?.port,
        smtp_username: body.smtp?.username,
        smtp_password: body.smtp?.password,
        imap_host: body.imap?.host,
        imap_port: body.imap?.port,
        imap_username: body.imap?.username,
        imap_password: body.imap?.password,
        is_smtp_enabled: true,
        warmup_enabled: true,
        warmup_settings: {
          warmup_day_limit: body.warmup_settings?.daily_rampup ?? 30,
          total_warmup_per_day: body.warmup_settings?.max_limit ?? 40,
          daily_rampup: body.warmup_settings?.daily_rampup ?? 3,
          reply_rate_percentage: body.warmup_settings?.reply_rate_percentage ?? 45,
        },
      })
      return NextResponse.json({ ok: true, account: result })
    }

    if (body.action === 'start' || body.action === 'stop') {
      if (!body.email_account_id) return NextResponse.json({ error: 'email_account_id required' }, { status: 400 })
      await smartleadReq(apiKey, `/email-accounts/${body.email_account_id}/warmup-settings`, 'POST', {
        warmup_enabled: body.action === 'start',
      })
      return NextResponse.json({ ok: true, warmup_enabled: body.action === 'start' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
