import React from 'react'

const SKY = '#0EA5E9'
const TEXT = '#fafafa'
const TEXT2 = '#a1a1aa'
const TEXT3 = '#71717a'
const BORDER = 'rgba(255,255,255,0.06)'
const CARD = '#111118'

interface Requirement {
  label: string
  note?: string
}

interface DocsPageProps {
  section: string
  title: string
  intro: string
  requirements?: Requirement[]
  children: React.ReactNode
}

export function DocsPage({ section, title, intro, requirements, children }: DocsPageProps) {
  return (
    <article style={{ maxWidth: 720, paddingBottom: 80 }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: TEXT3, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: SKY }}>{section}</span>
        <span style={{ opacity: 0.3 }}>›</span>
        <span>{title}</span>
      </div>

      {/* Title */}
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', color: TEXT, margin: '0 0 16px', lineHeight: 1.15 }}>
        {title}
      </h1>

      {/* Intro */}
      <p style={{ fontSize: 16, color: TEXT2, lineHeight: 1.7, margin: '0 0 32px' }}>
        {intro}
      </p>

      {/* What you'll need */}
      {requirements && requirements.length > 0 && (
        <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: 10, padding: '14px 18px', marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: SKY, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>What you'll need</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {requirements.map((r, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: TEXT2 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                  <circle cx="8" cy="8" r="7" stroke={SKY} strokeWidth="1.4" opacity="0.5"/>
                  <path d="M5 8l2 2 4-4" stroke={SKY} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span><strong style={{ color: TEXT, fontWeight: 600 }}>{r.label}</strong>{r.note && <span style={{ color: TEXT3 }}> — {r.note}</span>}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content */}
      {children}
    </article>
  )
}

/* ─── Content primitives used inside DocsPage ──────────────────────────── */

export function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: TEXT, margin: '0 0 16px', paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <ol style={{ margin: '0 0 24px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {children}
    </ol>
  )
}

export function Step({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', gap: 16, paddingBottom: 28, position: 'relative' }}>
      {/* Connector line */}
      <div style={{ position: 'absolute', left: 15, top: 32, bottom: 0, width: 2, background: 'rgba(255,255,255,0.04)' }} />
      {/* Number bubble */}
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(14,165,233,0.12)', border: `1px solid rgba(14,165,233,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: SKY, zIndex: 1 }}>
        {n}
      </div>
      <div style={{ paddingTop: 6, flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: children ? 8 : 0 }}>{title}</div>
        {children && <div style={{ fontSize: 14, color: TEXT2, lineHeight: 1.65 }}>{children}</div>}
      </div>
    </li>
  )
}

export function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div style={{ background: CARD, border: `1px dashed rgba(255,255,255,0.12)`, borderRadius: 10, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '12px 0 24px', color: TEXT3, fontSize: 12 }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" opacity="0.4">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor"/>
        <path d="M3 17l4.5-4.5 3 3 3-3 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 11, opacity: 0.6 }}>Screenshot placeholder — to be added after testing</span>
    </div>
  )
}

export function TodoBlock({ note }: { note: string }) {
  return (
    <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '10px 14px', margin: '8px 0 16px', display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: '#a1a1aa' }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="8" cy="8" r="7" stroke="#f59e0b" strokeWidth="1.4"/>
        <path d="M8 5v4M8 11v.5" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
      <span><strong style={{ color: '#f59e0b' }}>TODO</strong> — {note}</span>
    </div>
  )
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 8, padding: '10px 14px', margin: '8px 0 16px', fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>
      <strong style={{ color: SKY }}>Note:</strong> {children}
    </div>
  )
}
