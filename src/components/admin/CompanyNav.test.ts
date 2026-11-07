import { describe, it, expect } from 'vitest'
import { COMPANY_LINKS, isActive } from './CompanyNav'

describe('CompanyNav', () => {
  it('links the three company tools and the admin home', () => {
    expect(COMPANY_LINKS.map(l => l.href)).toEqual(['/admin/crm', '/admin/quotes', '/admin/agents', '/admin'])
  })
  it('marks only the current section active; admin home does not light up on its children', () => {
    expect(isActive('/admin/crm', '/admin/crm')).toBe(true)
    expect(isActive('/admin/crm', '/admin')).toBe(false)
    expect(isActive('/admin', '/admin')).toBe(true)
    expect(isActive('/admin/quotes', '/admin/crm')).toBe(false)
    expect(isActive('/admin/crm/anything', '/admin/crm')).toBe(true)
  })
})
