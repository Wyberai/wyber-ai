import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/email/transport', () => ({ sendEmail: vi.fn(async () => ({ id: 'x' })) }))

import { sendEmail } from '@/lib/email/transport'
import { buildLeadEmail, notifyOwnerOfLead } from './lead-notify'

describe('buildLeadEmail', () => {
  it('lists the visitor\'s details with readable labels and escapes everything', () => {
    const { subject, html } = buildLeadEmail({
      projectName: 'Asha <b>Dental</b>', projectId: 'p1', table: 'public_contact_messages',
      data: { id: 5, created_at: 'now', _hp: 'x', full_name: 'Ravi <script>alert(1)</script>', phone: '99999 99999', message: 'Need a "cleaning" slot' },
    })
    expect(subject).toBe('New contact messages on Asha <b>Dental</b>')
    expect(html).toContain('Full name')
    expect(html).toContain('Phone')
    expect(html).toContain('99999 99999')
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toMatch(/>Id<|Created at|>_hp</)
  })

  it('truncates long values and shows at most 12 fields', () => {
    const data: Record<string, string> = {}
    for (let i = 0; i < 30; i++) data[`field_${i}`] = 'v'.repeat(900)
    const { html } = buildLeadEmail({ projectName: 'Site', projectId: 'p', table: 'public_leads', data })
    expect((html.match(/padding:8px 12px 8px 0/g) ?? []).length).toBe(12)
    expect(html).not.toContain('v'.repeat(401))
  })

  it('links to the project and never includes secrets', () => {
    const { html } = buildLeadEmail({ projectName: 'S', projectId: 'abc 123', table: 'public_orders', data: { a: '1' } })
    expect(html).toContain('/project/abc%20123')
    expect(html).not.toMatch(/service_role|SECRET|password/i)
  })
})

describe('notifyOwnerOfLead', () => {
  const fake = (project: any, owner: any) => ({
    from: (t: string) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: t === 'projects' ? project : owner }) }) }),
    }),
  })

  it('emails the owner and never throws', async () => {
    vi.mocked(sendEmail).mockClear()
    await notifyOwnerOfLead(fake({ name: 'Site', user_id: 'u1' }, { email: 'owner@example.com' }), 'proj-A', 'public_leads', { name: 'Ravi' })
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(vi.mocked(sendEmail).mock.calls[0][0].to).toBe('owner@example.com')
  })

  it('does nothing when the project or owner is unknown', async () => {
    vi.mocked(sendEmail).mockClear()
    await notifyOwnerOfLead(fake(null, null), 'proj-B', 'public_leads', { name: 'x' })
    await notifyOwnerOfLead(fake({ name: 'S', user_id: 'u' }, null), 'proj-C', 'public_leads', { name: 'x' })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('throttles to 10 emails an hour per project', async () => {
    vi.mocked(sendEmail).mockClear()
    for (let i = 0; i < 15; i++) await notifyOwnerOfLead(fake({ name: 'S', user_id: 'u' }, { email: 'o@example.com' }), 'proj-flood', 'public_leads', { n: i })
    expect(vi.mocked(sendEmail).mock.calls.length).toBe(10)
  })

  it('survives a send failure', async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('down'))
    await expect(notifyOwnerOfLead(fake({ name: 'S', user_id: 'u' }, { email: 'o@example.com' }), 'proj-D', 'public_leads', { a: 1 })).resolves.toBeUndefined()
  })
})
