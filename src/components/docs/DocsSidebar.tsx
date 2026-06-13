'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DOC_NAV } from '@/app/docs/_nav'

const SKY = '#0EA5E9'
const BG = '#09090b'
const SIDEBAR_BG = '#0d0d0f'
const BORDER = 'rgba(255,255,255,0.06)'
const TEXT = '#fafafa'
const MUTED = '#71717a'
const ACTIVE_BG = 'rgba(14,165,233,0.10)'

function SectionIcon({ icon }: { icon: string }) {
  const props = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none' }
  if (icon === 'rocket') return (
    <svg {...props}><path d="M12 2C8 2 4 6 4 10c0 5 8 12 8 12s8-7 8-12c0-4-4-8-8-8z" stroke={SKY} strokeWidth="1.6" strokeLinecap="round"/><circle cx="12" cy="10" r="2.5" fill={SKY} opacity="0.7"/></svg>
  )
  if (icon === 'monitor') return (
    <svg {...props}><rect x="2" y="4" width="20" height="13" rx="2" stroke={SKY} strokeWidth="1.6"/><path d="M8 21h8M12 17v4" stroke={SKY} strokeWidth="1.6" strokeLinecap="round"/></svg>
  )
  if (icon === 'phone') return (
    <svg {...props}><rect x="6" y="2" width="12" height="20" rx="3" stroke={SKY} strokeWidth="1.6"/><circle cx="12" cy="18" r="1" fill={SKY}/></svg>
  )
  if (icon === 'agents') return (
    <svg {...props}><circle cx="12" cy="8" r="3.5" stroke={SKY} strokeWidth="1.6"/><path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke={SKY} strokeWidth="1.6" strokeLinecap="round"/><circle cx="19" cy="5" r="2" fill={SKY} opacity="0.5"/></svg>
  )
  if (icon === 'flows') return (
    <svg {...props}><rect x="1" y="9" width="6" height="6" rx="1.5" fill={SKY} opacity="0.8"/><rect x="17" y="9" width="6" height="6" rx="1.5" fill={SKY} opacity="0.8"/><rect x="9" y="3" width="6" height="6" rx="1.5" fill={SKY} opacity="0.5"/><rect x="9" y="15" width="6" height="6" rx="1.5" fill={SKY} opacity="0.5"/><path d="M7 12h2M15 6v3M15 15v3M15 12h2" stroke={SKY} strokeWidth="1.4" strokeLinecap="round"/></svg>
  )
  if (icon === 'settings') return (
    <svg {...props}><circle cx="12" cy="12" r="3" stroke={SKY} strokeWidth="1.6"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={SKY} strokeWidth="1.6" strokeLinecap="round"/></svg>
  )
  return null
}

export function DocsSidebar({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname()

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 40 }}>
      {DOC_NAV.map(section => (
        <div key={section.slug} style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px 5px', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <SectionIcon icon={section.icon} />
            {section.title}
          </div>
          {section.links.map(link => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNav}
                style={{
                  display: 'block',
                  padding: '6px 10px 6px 31px',
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? SKY : '#a1a1aa',
                  background: active ? ACTIVE_BG : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.12s',
                  borderLeft: active ? `2px solid ${SKY}` : '2px solid transparent',
                  marginLeft: 2,
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = TEXT }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#a1a1aa' }}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
