import { describe, expect, it } from 'vitest'
import { FakeDomainsProvider } from './fake-provider'
import { memoryStore } from './memory-store'
import { createDomainOrder, fulfilOrder } from './orders'
import { createWorkspaceOrder } from './checkout'
import { searchDomains, workspaceQuoteFor, resetCostCache } from './search'
import { recordsAsText } from './dns'
import { remindersDue, reminderMail } from './reminders'
import { policyLines } from './policy'

// Sandbox walkthrough: the whole journey against the fake provider. Run with
//   npx vitest run src/lib/domains/walkthrough.test.ts --reporter=verbose
// and read the printed steps. Nothing is charged or registered.
const contact = { name: 'Asha Rao', company: 'Asha Bakery', email: 'asha@example.com', address1: '1 MG Road', city: 'Pune', state: 'MH', zip: '411001', country: 'IN', phoneCc: '91', phone: '9876543210' }

describe('sandbox walkthrough', () => {
  it('search, price, confirm, mock purchase, DNS records, Workspace, reminder', async () => {
    resetCostCache()
    const log: string[] = []
    const provider = new FakeDomainsProvider()
    const mem = memoryStore()

    const { results } = await searchDomains(provider, 'Asha Bakery')
    for (const r of results) log.push(`1 search  ${r.domain.padEnd(18)} ${r.status.padEnd(12)} ${r.quote ? `registry $${(r.quote.registryCents / 100).toFixed(2)} + $1 = $${(r.quote.totalCents / 100).toFixed(2)}` : '-'}`)
    const com = results.find(r => r.tld === 'com')!
    expect(com.quote!.totalCents - com.quote!.registryCents).toBe(100)

    log.push(`2 confirm ${policyLines('com').join(' | ')}`)
    const order = await createDomainOrder({ provider, store: mem.store }, { userId: 'u1', domain: com.domain, years: 1, projectId: 'p1', contact, confirmedTotalCents: com.quote!.totalCents, acknowledged: true })
    log.push(`3 order   ${order.id.slice(0, 8)} ${order.domain} total $${(order.total_cents / 100).toFixed(2)} status ${order.status}`)

    const done = await fulfilOrder({ provider, store: mem.store, attach: async () => ({ attached: true, verified: false }) }, order.id)
    log.push(`4 paid    fulfilment -> ${done.status}`)
    log.push(`5 dns     written at registrar:\n${recordsAsText(com.domain, provider.state.dns.get(com.domain)!)}`)
    log.push(`6 site    project p1 now serves ${mem.linked.p1}`)

    resetCostCache()
    const q = (await workspaceQuoteFor(provider, 'in', 3, 12, undefined, {}))!
    const ws = await createWorkspaceOrder({ provider, store: mem.store }, { userId: 'u1', domain: com.domain, seats: 3, months: 12, contact, confirmedTotalCents: q.totalCents, acknowledged: true })
    await fulfilOrder({ provider, store: mem.store }, ws.id)
    log.push(`7 workspace 3 seats $${(q.totalCents / 100).toFixed(2)} (cost $${(q.registryCents / 100).toFixed(2)} + $${(q.marginCents / 100).toFixed(2)}); mail records:\n${recordsAsText(com.domain, provider.state.dns.get(com.domain)!.filter(r => r.type === 'MX' || r.type === 'TXT'))}`)

    const soon = new Date(mem.domains.get(com.domain)!.expires_at!)
    soon.setUTCDate(soon.getUTCDate() - 7)
    const due = remindersDue([{ id: 'x', domain: com.domain, expires_at: mem.domains.get(com.domain)!.expires_at, reminders_sent: [30, 14], email: contact.email }], soon)
    log.push(`8 reminder ${due[0].threshold}-day: ${reminderMail('domain', com.domain, due[0].daysLeft, 'https://wyberai.com').subject}`)
    console.log('\n' + log.join('\n'))
    expect(done.ok).toBe(true)
    expect(due[0].threshold).toBe(7)
  })
})
