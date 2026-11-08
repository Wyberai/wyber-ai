import { loadContacts } from '@/lib/crm/db'
import type { Admin } from '@/lib/ops/ask/tools'

// The quotes page's data, loaded together on the server so the page arrives with it instead of
// fetching three things after it has loaded. Shared by the page and the refresh API.

export async function loadQuotesList(admin: Admin, contactId?: string) {
  let q = admin.from('crm_quotes').select('*').order('created_at', { ascending: false }).limit(200)
  if (contactId) q = q.eq('contact_id', contactId)
  const { data, error } = await q
  if (error) return { tablesMissing: true as const, error: error.message as string }
  // Attach contact names for the list.
  const ids = [...new Set((data ?? []).map((x: { contact_id: string | null }) => x.contact_id).filter(Boolean))] as string[]
  const names = new Map<string, string>()
  if (ids.length) {
    const c = await admin.from('crm_contacts').select('id, name, company').in('id', ids)
    for (const r of (c.data ?? []) as { id: string; name: string; company: string | null }[]) names.set(r.id, r.company ? `${r.name} (${r.company})` : r.name)
  }
  return { quotes: (data ?? []).map((x: { contact_id: string | null }) => ({ ...x, contact_name: x.contact_id ? names.get(x.contact_id) ?? null : null })) }
}

export async function loadQuotesPage(admin: Admin) {
  const [list, contacts, drafts] = await Promise.all([
    loadQuotesList(admin),
    loadContacts(admin).catch(() => []),
    // Only the proposal agent's outlines, ready to drop into a quote's scope; not the whole agents state.
    admin.from('ops_agent_drafts').select('contact_id, body, status').eq('agent', 'proposal').in('status', ['pending', 'approved']),
  ])
  const outlines: Record<string, string> = {}
  for (const d of ((drafts.data ?? []) as { contact_id: string | null; body: string }[])) if (d.contact_id) outlines[d.contact_id] = d.body
  return {
    ...list,
    // Four fields per contact, not the whole record: this list only fills a dropdown.
    contacts: contacts.map(c => ({ id: c.id, name: c.name, company: c.company, phone: c.phone })),
    outlines,
  }
}
