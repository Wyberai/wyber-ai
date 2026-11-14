// When a visitor submits a form on a published site (a row lands in a public_* table through /api/public/cloud-insert), the owner is
// emailed the details. Without this the lead sits in a table the owner may never open. Sent through the shared transport (Continuum with
// the Resend fallback). Throttled per project so a spam burst cannot flood the owner's inbox.

import { sendEmail } from '@/lib/email/transport'
import { checkRateLimit } from '@/lib/cloud/rate-limit'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'
const MAX_FIELDS_SHOWN = 12
const MAX_VALUE_SHOWN = 400

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function pretty(key: string): string {
  return key.replace(/^public_/, '').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())
}

export function buildLeadEmail(opts: { projectName: string; projectId: string; table: string; data: Record<string, unknown> }): { subject: string; html: string } {
  const name = (opts.projectName || 'your site').slice(0, 60)
  const rows = Object.entries(opts.data)
    .filter(([k]) => !/^(id|created_at|_.*)$/i.test(k))
    .slice(0, MAX_FIELDS_SHOWN)
    .map(([k, v]) => {
      const val = v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v)
      return `<tr><td style="padding:8px 12px 8px 0;color:#6B7280;font-size:13px;vertical-align:top;white-space:nowrap">${esc(pretty(k))}</td><td style="padding:8px 0;color:#111827;font-size:14px">${esc(val.slice(0, MAX_VALUE_SHOWN)) || '<span style="color:#9CA3AF">empty</span>'}</td></tr>`
    })
    .join('')
  const link = `${APP_URL}/project/${encodeURIComponent(opts.projectId)}`
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:24px;background:#F4F4F5;font-family:Inter,-apple-system,'Segoe UI',Roboto,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px"><tr><td style="padding:28px">
<p style="margin:0 0 6px;font-size:12px;color:#6B7280">${esc(name)}</p>
<h1 style="margin:0 0 16px;font-size:20px;color:#0A0A0A">New ${esc(pretty(opts.table).toLowerCase())}</h1>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #E5E7EB">${rows}</table>
<p style="margin:20px 0 0;font-size:13px;color:#374151">Reply to the person directly. You can see every entry in your project: <a href="${link}" style="color:#0369A1">open ${esc(name)}</a>, then the database Query tab.</p>
<p style="margin:16px 0 0;font-size:12px;color:#9CA3AF">Sent by WyberAi because someone filled in a form on your published site.</p>
</td></tr></table></body></html>`
  return { subject: `New ${pretty(opts.table).toLowerCase()} on ${name}`, html }
}

/** Best-effort: never throws, never blocks the visitor's submission. */
export async function notifyOwnerOfLead(
  admin: { from: (t: string) => any },
  projectId: string, table: string, data: Record<string, unknown>,
): Promise<void> {
  try {
    const rl = checkRateLimit({ route: '/api/public/cloud-insert:notify', userId: projectId, limit: 10, windowSeconds: 3600 })
    if (!rl.allowed) return
    const { data: project } = await admin.from('projects').select('name, user_id').eq('id', projectId).maybeSingle()
    if (!project?.user_id) return
    const { data: owner } = await admin.from('profiles').select('email, email_opt_out').eq('id', project.user_id).maybeSingle()
    if (!owner?.email) return
    const { subject, html } = buildLeadEmail({ projectName: project.name ?? '', projectId, table, data })
    await sendEmail({ from: 'WyberAi <hello@wyberai.com>', to: owner.email, subject, html })
  } catch (err) {
    console.error('[lead-notify] failed:', String(err).slice(0, 200))
  }
}
