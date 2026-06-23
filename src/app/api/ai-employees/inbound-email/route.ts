import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { runEmployee, type AiEmployee } from '@/lib/ai-employees/run-engine'

// Inbound email webhook. Resend fires `email.received` with METADATA ONLY
// (email_id, from, to, subject) — the body and headers are NOT in the payload.
// We fetch the full email via the Received Emails API, match it to an employee
// by the recipient address, log it, and drive a run where the employee reads the
// message and replies from its own mailbox via WYBERAI_send_email.
//
// SECURITY: gated by a shared secret for now. TODO: replace with Resend's Svix
// signature verification once the inbound webhook is configured in the dashboard.

interface ReceivedEmail {
  to?: unknown
  from?: unknown
  cc?: unknown
  subject?: string
  text?: string
  html?: string
  message_id?: string
  headers?: Record<string, unknown>
}

// GET https://api.resend.com/emails/receiving/{id} — fetch the full inbound email.
async function fetchReceivedEmail(emailId: string): Promise<ReceivedEmail | null> {
  try {
    const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    })
    if (!res.ok) return null
    return await res.json() as ReceivedEmail
  } catch {
    return null
  }
}

function pickAddress(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return pickAddress(value[0])
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    return String(o.address ?? o.email ?? o.value ?? '')
  }
  return String(value)
}

// Strip a display name and extract the bare address: "Marcus <m@x.com>" → "m@x.com"
function bareAddress(raw: string): string {
  const m = raw.match(/<([^>]+)>/)
  return (m ? m[1] : raw).trim().toLowerCase()
}

export async function POST(req: NextRequest) {
  const secret = process.env.EMPLOYEE_INBOUND_SECRET
  if (secret) {
    const provided = req.headers.get('x-webhook-secret') ?? new URL(req.url).searchParams.get('secret')
    if (provided !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Resend fires `email.received` with metadata under `data`. Ignore other events.
  const evt = (payload.data ?? payload) as Record<string, unknown>
  const emailId = String(evt.email_id ?? evt.id ?? '')
  if (payload.type && payload.type !== 'email.received') {
    return NextResponse.json({ ok: true, ignored: String(payload.type) })
  }
  if (!emailId) return NextResponse.json({ error: 'No email_id in payload' }, { status: 400 })

  // Webhook carries metadata only — fetch the full email (body + headers).
  const full = await fetchReceivedEmail(emailId)
  const src: ReceivedEmail = full ?? (evt as ReceivedEmail)
  const headers = (src.headers ?? {}) as Record<string, unknown>

  const toAddr = bareAddress(pickAddress(src.to))
  const fromAddr = bareAddress(pickAddress(src.from))
  const subject = String(src.subject ?? '(no subject)')
  const bodyText = String(src.text ?? '')
  const bodyHtml = String(src.html ?? '')
  // Resend exposes the inbound Message-ID directly; fall back to the headers map.
  const messageId = String(src.message_id ?? headers['message-id'] ?? headers['Message-ID'] ?? '')
  const inReplyTo = String(headers['in-reply-to'] ?? headers['In-Reply-To'] ?? '')

  if (!toAddr) return NextResponse.json({ error: 'No recipient address' }, { status: 400 })

  const db = createServiceClient()

  // Match the employee by its provisioned address.
  const { data: employee } = await db
    .from('ai_employees')
    .select('id, user_id, name, role, emoji, instructions, tools, company_context, kpis, email_address, memory_summary, is_active')
    .ilike('email_address', toAddr)
    .single()

  if (!employee) {
    // Not addressed to a known employee — accept silently so the provider stops retrying.
    return NextResponse.json({ ok: true, matched: false })
  }

  // Log the inbound email.
  const { data: emailRow } = await db
    .from('employee_emails')
    .insert({
      employee_id: employee.id,
      user_id: employee.user_id,
      direction: 'inbound',
      from_address: fromAddr,
      to_address: toAddr,
      subject,
      body_text: bodyText,
      body_html: bodyHtml || null,
      message_id: messageId || null,
      in_reply_to: inReplyTo || null,
      status: 'processing',
    })
    .select('id')
    .single()

  if (employee.is_active === false) {
    if (emailRow) await db.from('employee_emails').update({ status: 'ignored' }).eq('id', emailRow.id)
    return NextResponse.json({ ok: true, matched: true, processed: false, reason: 'inactive' })
  }

  // Drive a run: the employee reads the email and decides how to respond.
  const task = `You just received an email in your inbox (${employee.email_address}).

FROM: ${fromAddr}
SUBJECT: ${subject}
${messageId ? `MESSAGE-ID: ${messageId}` : ''}

--- EMAIL BODY ---
${bodyText.slice(0, 6000)}
--- END EMAIL ---

Read it carefully and act on it as ${employee.name}, the ${employee.role}. If it asks you to do something within your role, do the work using your tools, then reply to the sender using WYBERAI_send_email${messageId ? ` (set in_reply_to to "${messageId}" so it threads correctly)` : ''}. If it needs the user's input or approval before you act, reply acknowledging and use WYBERAI_escalate. Keep your reply professional and in your voice. Always reply to ${fromAddr} unless it's clearly automated/no-reply.`

  try {
    const result = await runEmployee(employee as AiEmployee, 'email', task)
    if (emailRow) {
      await db.from('employee_emails')
        .update({ status: 'replied' })
        .eq('id', emailRow.id)
    }
    return NextResponse.json({ ok: true, matched: true, processed: true, summary: result.summary })
  } catch (e) {
    if (emailRow) {
      await db.from('employee_emails')
        .update({ status: 'error', error_message: String(e) })
        .eq('id', emailRow.id)
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
