'use client'
import Link from 'next/link'
import { blocksFor } from '@/lib/intent/persona-blocks'
import type { ProjectTarget } from '@/lib/intent/persona'
import type { Door } from '@/lib/intent/types'

// The two blocks that make a chosen persona's page feel made for them: the four kinds of project (framed for
// their situation) and real examples of what people like them build. Tapping a project type takes the visitor
// to the prompt box with that type already selected.

const ICON: Record<ProjectTarget, string> = { app: '🖥', mobile: '📱', website: '🌐', saas: '🧩' }

export function PersonaBlocks({ door, lang, onPickProject }: { door: Door; lang: 'en' | 'hi' | 'gu'; onPickProject: (t: ProjectTarget) => void }) {
  const b = blocksFor(door, lang)
  if (!b) return null
  const card: React.CSSProperties = { border: '1px solid var(--brand-border-strong)', borderRadius: 16, padding: '20px 22px', background: 'rgba(255,255,255,0.03)', textAlign: 'left', fontFamily: 'inherit', color: 'inherit' }
  return (
    <>
      <section data-sec="projects" className="mk-section" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <h2 className="mk-display" style={{ fontSize: 'clamp(26px,4vw,40px)', marginBottom: 28 }}>{b.projectsTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {b.projects.map(p => (
              <button key={p.target} type="button" onClick={() => onPickProject(p.target)} style={{ ...card, cursor: 'pointer' }}>
                <div aria-hidden style={{ fontSize: 24, marginBottom: 10 }}>{ICON[p.target]}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-text)', marginBottom: 6 }}>{p.title}</div>
                <div style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--brand-text-dim)' }}>{p.line}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section data-sec="examples" className="mk-section" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <h2 className="mk-display" style={{ fontSize: 'clamp(26px,4vw,40px)', marginBottom: 28 }}>{b.examplesTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {b.examples.map(e => (
              <Link key={e.slug} href={`/build/${e.slug}`} style={{ ...card, textDecoration: 'none', display: 'block' }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand-text)', marginBottom: 6 }}>{e.title}</div>
                <div style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--brand-text-dim)' }}>{e.line}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
