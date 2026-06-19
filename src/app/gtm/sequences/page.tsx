import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { SEQUENCE_TEMPLATES, TEMPLATE_CATEGORIES } from '@/lib/gtm-sequence-templates'

const s = {
  bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)',
  text: '#fafafa', muted: '#71717a', dim: '#52525b',
  orange: '#f97316', green: '#10b981', yellow: '#f59e0b', sky: '#0EA5E9', violet: '#8b5cf6',
}

const STEP_TYPE_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  email: { icon: '✉️', color: s.green, label: 'Email' },
  call: { icon: '📞', color: s.orange, label: 'Call' },
  linkedin: { icon: '💼', color: s.sky, label: 'LinkedIn' },
  wait: { icon: '⏳', color: s.dim, label: 'Wait' },
  task: { icon: '✓', color: s.muted, label: 'Task' },
}

export default function SequencesPage() {
  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/gtm" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/gtm/campaigns/new" style={{ padding: '7px 14px', borderRadius: 8, background: s.orange, color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Build on canvas →</Link>
          <Link href="/gtm" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>← GTM</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: s.orange, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Sequence Library</div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 }}>
            10 battle-tested sequences
          </h1>
          <p style={{ fontSize: 15, color: s.muted, maxWidth: 600 }}>
            Every sequence includes email, call, and LinkedIn steps with copy you can use today.
            Email steps run automatically — call and LinkedIn steps guide you through your existing tools.
          </p>
        </div>

        {/* Channel legend */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          {Object.entries(STEP_TYPE_ICONS).filter(([k]) => k !== 'wait' && k !== 'task').map(([type, meta]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ fontSize: 14 }}>{meta.icon}</span>
              <span style={{ color: meta.color, fontWeight: 700 }}>{meta.label}</span>
              <span style={{ color: s.dim }}>{type === 'email' ? '— automated via Smartlead/Instantly' : type === 'call' ? '— guided script via your dialer' : '— message copy for Sales Nav/manual'}</span>
            </div>
          ))}
        </div>

        {/* Template grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {SEQUENCE_TEMPLATES.map(template => {
            const stepCounts = template.steps.reduce((acc, step) => {
              acc[step.type] = (acc[step.type] || 0) + 1
              return acc
            }, {} as Record<string, number>)

            const totalDays = Math.max(...template.steps.map(s => s.day))

            return (
              <Link key={template.id} href={`/gtm/sequences/${template.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '20px', cursor: 'pointer', transition: 'border-color 0.15s', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                    <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{template.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: s.text, marginBottom: 3 }}>{template.name}</div>
                      <div style={{ fontSize: 11, color: s.green, fontWeight: 700 }}>
                        {template.avg_reply_rate} avg reply rate
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: 12, color: s.muted, lineHeight: 1.6, marginBottom: 14, flex: 1 }}>
                    {template.description}
                  </p>

                  {/* Step pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {Object.entries(stepCounts).filter(([k]) => k !== 'wait').map(([type, count]) => {
                      const meta = STEP_TYPE_ICONS[type]
                      if (!meta) return null
                      return (
                        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: meta.color + '12', border: `1px solid ${meta.color}25`, fontSize: 11, color: meta.color, fontWeight: 700 }}>
                          {meta.icon} {count} {meta.label}
                        </div>
                      )
                    })}
                    <div style={{ padding: '3px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.border}`, fontSize: 11, color: s.dim }}>
                      {totalDays} days
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {template.tags.map(tag => (
                      <span key={tag} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', color: s.dim, border: `1px solid ${s.border}` }}>#{tag}</span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${s.border}`, fontSize: 12, color: s.violet, fontWeight: 700 }}>
                    View steps & copy →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div style={{ marginTop: 48, background: `linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(139,92,246,0.08) 100%)`, border: `1px solid rgba(249,115,22,0.2)`, borderRadius: 16, padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Sora', sans-serif", marginBottom: 8 }}>Want a custom sequence?</div>
          <p style={{ fontSize: 14, color: s.muted, marginBottom: 20 }}>Describe your ICP and goal — our AI will generate a personalised multi-channel sequence in seconds.</p>
          <Link href="/gtm/campaigns/new" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: s.orange, color: '#fff', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
            ✦ Build on canvas →
          </Link>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap'); a div:hover { border-color: rgba(255,255,255,0.15) !important; }`}</style>
    </div>
  )
}
