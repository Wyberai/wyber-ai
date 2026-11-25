import { randomUUID } from 'crypto'
import type { ManagedDomain, Order, OrderStore, WorkspaceSub } from './orders'

/** In-memory OrderStore for unit tests and the sandbox walkthrough. */
export function memoryStore() {
  const orders = new Map<string, Order>()
  const domains = new Map<string, ManagedDomain>()
  const workspaces = new Map<string, WorkspaceSub>()
  const resellers = new Map<string, { customerId: number | null; contactId: number | null }>()
  const linked: Record<string, string> = {}
  const store: OrderStore = {
    async insertOrder(o) {
      const row = { ...o, id: randomUUID(), status: 'awaiting_payment', error: null, rc_order_id: null, dodo_checkout_id: null } as Order
      orders.set(row.id, row)
      return row
    },
    async getOrder(id) { return orders.get(id) ?? null },
    async transition(id, from, to, patch) {
      const o = orders.get(id)
      if (!o || o.status !== from) return false
      orders.set(id, { ...o, ...patch, status: to })
      return true
    },
    async patchOrder(id, patch) { const o = orders.get(id); if (o) orders.set(id, { ...o, ...patch }) },
    async getReseller(u) { return resellers.get(u) ?? { customerId: null, contactId: null } },
    async saveReseller(u, c, k) { resellers.set(u, { customerId: c, contactId: k }) },
    async upsertDomain(d) { domains.set(d.domain, d) },
    async upsertWorkspace(w) { workspaces.set(w.domain, w) },
    async linkProject(p, d) { linked[p] = d },
    async getDomain(u, domain) { const d = domains.get(domain); return d && d.user_id === u ? d : null },
    async getWorkspace(u, domain) { const w = workspaces.get(domain); return w && w.user_id === u ? w : null },
    async latestContact(u, domain) { const rows = [...orders.values()].filter(o => o.user_id === u && o.domain === domain && (o.kind === 'domain' || o.kind === 'workspace')); return rows.length ? rows[rows.length - 1].contact : null },
    async setExpiry(kind, u, domain, expiresAt) {
      if (kind === 'domain') { const d = domains.get(domain); if (d && d.user_id === u) domains.set(domain, { ...d, expires_at: expiresAt }) }
      else { const w = workspaces.get(domain); if (w && w.user_id === u) workspaces.set(domain, { ...w, expires_at: expiresAt }) }
    },
  }
  return { store, orders, domains, workspaces, linked }
}
