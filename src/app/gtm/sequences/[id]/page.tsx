import { notFound } from 'next/navigation'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { getTemplateById } from '@/lib/gtm-sequence-templates'

const s = {
  bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)',
  text: '#fafafa', muted: '#71717a', dim: '#52525b',
  orange: '#f97316', green: '#10b981', yellow: '#f59e0b', sky: '#0EA5E9', violet: '#8b5cf6',
}

const STEP_CONFIG: Record<string, { icon: string; color: string; label: string; pill: string }> = {
  email:    { icon: '✉️', color: s.green,   label: 'Email (automated)',    pill: 'Wyber sends' },
  call:     { icon: '📞', color: s.orange,  label: 'Call',                 pill: 'Your dialer' },
  linkedin: { icon: '💼', color: s.sky,     label: 'LinkedIn',             pill: 'Manual / Sales Nav' },
  wait:     { icon: '⏳', color: s.dim,     label: 'Wait',                 pill: '' },
  task:     { icon: '✅', color: s.muted,   label: 'Task',                 pill: 'Manual' },
}

const TOOL_LINKS: Record<string, string> = {
  'Smartlead': 'https://smartlead.ai',
  'Instantly': 'https://instantly.ai',
  'Apollo Dialer': 'https://app.apollo.io',
  'JustCall': 'https://justcall.io',
  'Aircall': 'https://aircall.io',
  'LinkedIn Sales Navigator': 'https://business.linkedin.com/sales-solutions',
  'Outreach.io': 'https://outreach.io',
  'Expandi': 'https://expandi.io',
  'Dripify': 'https://dripify.io',
}

export default async function SequenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const template = getTemplateById(id)
  if (!template) notFound()

  const emailSteps = template.steps.filter(s => s.type === 'email')
  const callSteps  = template.steps.filter(s => s.type === 'call')
  const liSteps    = template.steps.filter(s => s.type === 'linkedin')

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/gtm" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/gtm/campaigns/new" style={{ padding: '7px 14px', borderRadius: 8, background: s.orange, color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Use on canvas →</Link>
          <Link href="/gtm/sequences" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>← Sequences</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 840, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 14, lineHeight: 1 }}>{template.emoji}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>{template.name}</h1>
          <p style={{ fontSize: 15, color: s.muted, marginBottom: 16, lineHeight: 1.6 }}>{template.description}</p>

          {/* Meta pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 12, color: s.green, fontWeight: 700 }}>
              📈 {template.avg_reply_rate} avg reply rate
            </div>
            <div style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.border}`, fontSize: 12, color: s.muted }}>
              🎯 Goal: {template.goal}
            </div>
            <div style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.border}`, fontSize: 12, color: s.muted }}>
              {template.steps.length} touches · {Math.max(...template.steps.map(s => s.day))} days
            </div>
          </div>
        </div>

        {/* Ideal for */}
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: s.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Ideal for</div>
          <ul style={{ margin: 0, padding: '0 0 0 18px', listStyle: 'disc' }}>
            {template.ideal_for.map(item => (
              <li key={item} style={{ fontSize: 13, color: s.muted, marginBottom: 4 }}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Tools needed */}
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: s.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Tools needed</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {template.tools_needed.map(tool => {
              const toolName = Object.keys(TOOL_LINKS).find(k => tool.includes(k))
              const url = toolName ? TOOL_LINKS[toolName] : null
              return url ? (
                <a key={tool} href={url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 12, color: s.sky, textDecoration: 'none', fontWeight: 600 }}>
                  {tool} ↗
                </a>
              ) : (
                <span key={tool} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.border}`, fontSize: 12, color: s.muted }}>
                  {tool}
                </span>
              )
            })}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: s.dim }}>
            Connect these tools in <Link href="/gtm/settings" style={{ color: s.orange, textDecoration: 'none' }}>GTM Settings</Link> to automate email steps. Call and LinkedIn steps include scripts to use in your chosen tool.
          </div>
        </div>

        {/* Step-by-step */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 20 }}>The sequence</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {template.steps.map((step, idx) => {
            const cfg = STEP_CONFIG[step.type]
            if (!cfg) return null
            const isNonNative = !step.native

            return (
              <div key={idx} style={{ display: 'flex', gap: 0 }}>
                {/* Timeline line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: cfg.color + '18', border: `1.5px solid ${cfg.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, zIndex: 1 }}>
                    {cfg.icon}
                  </div>
                  {idx < template.steps.length - 1 && (
                    <div style={{ width: 1.5, flex: 1, background: `linear-gradient(to bottom, ${cfg.color}30, ${s.border})`, minHeight: 20 }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, paddingLeft: 14, paddingBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                    <span style={{ fontSize: 11, color: s.dim }}>Day {step.day}</span>
                    {cfg.pill && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: isNonNative ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${isNonNative ? 'rgba(249,115,22,0.25)' : 'rgba(16,185,129,0.25)'}`, color: isNonNative ? s.orange : s.green, fontWeight: 700 }}>
                        {isNonNative ? '🔧 ' : '✦ '}{cfg.pill}
                      </span>
                    )}
                  </div>

                  <div style={{ background: s.card, border: `1px solid ${isNonNative ? cfg.color + '20' : s.border}`, borderRadius: 10, padding: '14px 16px' }}>
                    {/* Email step */}
                    {step.type === 'email' && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: s.muted, marginBottom: 4 }}>Subject</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: s.text, marginBottom: 12, fontStyle: 'italic' }}>{step.subject}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: s.muted, marginBottom: 4 }}>Body</div>
                        <pre style={{ margin: 0, fontSize: 12, color: '#d4d4d8', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-display)' }}>{step.body}</pre>
                      </>
                    )}

                    {/* Call step */}
                    {step.type === 'call' && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: s.muted, marginBottom: 4 }}>Call script</div>
                        <pre style={{ margin: 0, fontSize: 12, color: '#d4d4d8', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-display)', marginBottom: step.note ? 12 : 0 }}>{step.script}</pre>
                        {step.duration_min && (
                          <div style={{ fontSize: 11, color: s.muted, marginTop: 8 }}>⏱ Target: {step.duration_min} min call</div>
                        )}
                      </>
                    )}

                    {/* LinkedIn step */}
                    {step.type === 'linkedin' && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: s.muted, marginBottom: 4 }}>Message copy</div>
                        <pre style={{ margin: 0, fontSize: 12, color: '#d4d4d8', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-display)' }}>{step.message}</pre>
                      </>
                    )}

                    {/* Guidance note for non-native steps */}
                    {step.note && (
                      <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', fontSize: 11, color: '#fdba74', lineHeight: 1.6 }}>
                        <span style={{ fontWeight: 700 }}>💡 How to execute: </span>{step.note}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTAs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div style={{ background: s.card, border: `1px solid rgba(249,115,22,0.2)`, borderRadius: 12, padding: '20px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Automate on canvas</div>
            <p style={{ fontSize: 12, color: s.muted, marginBottom: 14, lineHeight: 1.5 }}>Drag these steps onto the visual canvas and connect them to your outreach tools.</p>
            <Link href="/gtm/campaigns/new" style={{ display: 'block', padding: '9px 16px', borderRadius: 8, background: s.orange, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
              Open canvas →
            </Link>
          </div>
          <div style={{ background: s.card, border: `1px solid rgba(14,165,233,0.2)`, borderRadius: 12, padding: '20px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Connect your tools</div>
            <p style={{ fontSize: 12, color: s.muted, marginBottom: 14, lineHeight: 1.5 }}>Connect Smartlead/Instantly for email, JustCall for calls, and Sales Nav for LinkedIn.</p>
            <Link href="/gtm/settings" style={{ display: 'block', padding: '9px 16px', borderRadius: 8, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: s.sky, fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
              Connect tools →
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
