'use client'
import Link from 'next/link'
import { DOC_NAV } from './_nav'

const SKY = '#0EA5E9'
const TEXT = '#fafafa'
const TEXT2 = '#a1a1aa'
const TEXT3 = '#71717a'
const CARD = '#111118'
const BORDER = 'rgba(255,255,255,0.06)'

const SECTION_ICONS: Record<string, string> = {
  rocket: '🚀', monitor: '🖥', phone: '📱', agents: '🤖', flows: '⚡', settings: '💳',
}

export default function DocsIndexPage() {
  return (
    <div style={{ maxWidth: 800 }}>
      {/* Hero */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: SKY, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          Documentation
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, letterSpacing: '-0.03em', color: TEXT, margin: '0 0 14px', lineHeight: 1.15 }}>
          WyberAi Docs
        </h1>
        <p style={{ fontSize: 16, color: TEXT2, lineHeight: 1.7, maxWidth: 540, margin: 0 }}>
          Everything you need to build web apps, mobile apps, AI agents, and workflows — in plain English, no code required.
        </p>
      </div>

      {/* Section grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, marginBottom: 56 }}>
        {DOC_NAV.map(section => (
          <Link
            key={section.slug}
            href={section.links[0].href}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 18px', textDecoration: 'none', display: 'block', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{SECTION_ICONS[section.icon]}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 6, letterSpacing: '-0.01em' }}>{section.title}</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {section.links.map(link => (
                <li key={link.href} style={{ fontSize: 12, color: TEXT3 }}>{link.label}</li>
              ))}
            </ul>
          </Link>
        ))}
      </div>

      {/* Quick start CTA */}
      <div style={{ background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 12, padding: '28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 5 }}>New to WyberAi?</div>
          <div style={{ fontSize: 13, color: TEXT3 }}>Start with the getting-started guide — you'll have an app live in minutes.</div>
        </div>
        <Link href="/docs/getting-started/what-is-wyber" style={{ padding: '9px 20px', borderRadius: 8, background: SKY, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Get started →
        </Link>
      </div>
    </div>
  )
}
