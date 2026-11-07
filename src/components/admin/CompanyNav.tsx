'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// One thin bar that ties the founder's company tools together: pipeline, quotes, agents, and the main admin.
export const COMPANY_LINKS = [
  { href: '/admin/ask', label: 'Ask' },
  { href: '/admin/crm', label: 'CRM' },
  { href: '/admin/quotes', label: 'Quotes' },
  { href: '/admin/agents', label: 'Agents' },
  { href: '/admin/booth', label: 'Booth' },
  { href: '/admin', label: 'Admin home' },
] as const

export const isActive = (path: string, href: string): boolean => (href === '/admin' ? path === '/admin' : path === href || path.startsWith(`${href}/`))

export default function CompanyNav() {
  const path = usePathname() ?? ''
  return (
    <nav aria-label="Company tools" style={{ background: '#07080d', borderBottom: '1px solid rgba(255,255,255,0.10)', padding: '10px clamp(16px,3vw,40px)', display: 'flex', gap: 6, flexWrap: 'wrap', fontFamily: 'system-ui, sans-serif' }}>
      {COMPANY_LINKS.map(l => {
        const on = isActive(path, l.href)
        return (
          <Link key={l.href} href={l.href} aria-current={on ? 'page' : undefined}
            style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', color: on ? '#fff' : '#8b94a7', background: on ? '#0EA5E9' : 'transparent' }}>
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
