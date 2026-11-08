import Link from 'next/link'
import { blocksFor } from '@/lib/intent/persona-blocks'
import type { Door } from '@/lib/intent/types'

// The two blocks that make a chosen persona's page feel like it was made for them: how it works for their
// kind of work, and real examples of what people like them build. Plain server-safe markup (no hooks).

export function PersonaBlocks({ door, lang }: { door: Door; lang: 'en' | 'hi' | 'gu' }) {
  const b = blocksFor(door, lang)
  const card: React.CSSProperties = { border: '1px solid var(--brand-border-strong)', borderRadius: 16, padding: '20px 22px', background: 'rgba(255,255,255,0.03)' }
  return (
    <>
      <section data-sec="how" className="mk-section" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <h2 className="mk-display" style={{ fontSize: 'clamp(26px,4vw,40px)', marginBottom: 28 }}>{b.stepsTitle}</h2>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {b.steps.map((s, i) => (
              <li key={s.title} style={card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-accent-hot)', marginBottom: 8 }}>{i + 1}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-text)', marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--brand-text-dim)' }}>{s.line}</div>
              </li>
            ))}
          </ol>
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
