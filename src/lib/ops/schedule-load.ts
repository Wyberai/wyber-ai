import { loadContacts } from '@/lib/crm/db'
import type { Contact } from '@/lib/crm/contact'
import type { Admin } from '@/lib/ops/ask/tools'
import { buildSchedule, istDay } from './schedule'

// The schedule payload, shared by the page (first paint) and the API (refresh).
export async function loadSchedule(admin: Admin, from?: string, days = 7) {
  let contacts: Contact[]
  try { contacts = await loadContacts(admin) } catch { contacts = [] }
  const pending = await admin.from('ops_agent_drafts').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  return { today: istDay(new Date()), days: buildSchedule(from ?? istDay(new Date()), days, contacts), pendingDrafts: pending.error ? null : (pending.count ?? 0) as number | null }
}
