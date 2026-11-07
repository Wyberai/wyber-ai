import type { IntentCopy } from '@/lib/intent/copy'
import type { PlanSketch } from '@/lib/intent/plan'

// "What we'd build first": the sketch shown under the visitor-intent readout.
// Pure and presentational (no state, no effects) so it can be rendered and
// tested on its own. All text comes from validated, length-capped fields, and
// React escapes it; nothing here uses dangerouslySetInnerHTML.
export function IntentPlanCard({ plan, c }: { plan: PlanSketch; c: IntentCopy }) {
  return (
    <div
      data-intent-plan
      style={{ borderRadius: 12, border: '1px solid rgba(14,165,233,0.35)', background: 'rgba(14,165,233,0.06)', padding: '12px 14px', display: 'grid', gap: 8 }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--brand-accent-hot)' }}>{c.planTitle}</span>
        <span style={{ fontSize: 11.5, color: 'var(--brand-text-faint)' }}>{c.planKinds[plan.kind]}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-text)' }}>{plan.title}</div>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--brand-text-dim)', marginBottom: 3 }}>{c.planScreens}</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.55, color: 'var(--brand-text-dim)' }}>
          {plan.screens.map(s => (
            <li key={s.name}><strong style={{ color: 'var(--brand-text)' }}>{s.name}</strong>: {s.note}</li>
          ))}
        </ul>
      </div>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--brand-text-dim)', marginBottom: 4 }}>{c.planData}</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {plan.data.map(d => (
            <span key={d} style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 999, border: '1px solid var(--brand-border-strong)', color: 'var(--brand-text-dim)' }}>{d}</span>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--brand-text)' }}>
        <strong>{c.planFirstWin}:</strong> {plan.firstWin}
      </div>
      <div style={{ fontSize: 11, color: 'var(--brand-text-faint)' }}>{c.planNote}</div>
    </div>
  )
}
