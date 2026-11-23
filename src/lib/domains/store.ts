import type { Order, OrderStatus, OrderStore } from './orders'

// Supabase-backed OrderStore. Uses the service-role client: rows are written only by server code after auth checks.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any

export function supabaseStore(admin: Admin): OrderStore {
  return {
    async insertOrder(o) {
      const { data, error } = await admin.from('commerce_orders').insert({ ...o, status: 'awaiting_payment' }).select().single()
      if (error || !data) throw new Error(`Could not create the order: ${error?.message}`)
      return data as Order
    },
    async getOrder(id) {
      const { data } = await admin.from('commerce_orders').select('*').eq('id', id).maybeSingle()
      return (data as Order) ?? null
    },
    async transition(id, from: OrderStatus, to: OrderStatus, patch = {}) {
      const { data } = await admin.from('commerce_orders').update({ ...patch, status: to, updated_at: new Date().toISOString() }).eq('id', id).eq('status', from).select('id')
      return Array.isArray(data) && data.length === 1
    },
    async patchOrder(id, patch) {
      await admin.from('commerce_orders').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
    },
    async getReseller(userId) {
      const { data } = await admin.from('reseller_customers').select('rc_customer_id, rc_contact_id').eq('user_id', userId).maybeSingle()
      return { customerId: data?.rc_customer_id ?? null, contactId: data?.rc_contact_id ?? null }
    },
    async saveReseller(userId, customerId, contactId) {
      await admin.from('reseller_customers').upsert({ user_id: userId, rc_customer_id: customerId, rc_contact_id: contactId })
    },
    async upsertDomain(d) { await admin.from('managed_domains').upsert({ ...d }, { onConflict: 'domain' }) },
    async upsertWorkspace(w) { await admin.from('workspace_subscriptions').upsert({ ...w }, { onConflict: 'domain' }) },
    async linkProject(projectId, domain) {
      await admin.from('projects').update({ custom_domain: domain, updated_at: new Date().toISOString() }).eq('id', projectId)
    },
  }
}
