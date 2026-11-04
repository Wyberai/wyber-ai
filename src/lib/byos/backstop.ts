import type { ByosAnalysis } from './analyze'
import type { ModelFit, NeedKind } from './infra'

/**
 * Deterministic safety net for the model's `needs`. The model is inconsistent: on the same product it tagged
 * "Email tracking" as inbox sync but left "Two-way email sync" untagged. Where a feature's own wording makes
 * the outside service unmistakable, the service is added by rule. It only ever ADDS requirements.
 */
const RULES: [NeedKind, RegExp][] = [
  ['email-inbox-sync', /\b(email|inbox|mailbox|gmail|outlook)\b[^.]{0,24}\bsync|\bsync\b[^.]{0,30}\b(email|inbox|mailbox|gmail|outlook)\b/i],
  ['calendar-oauth', /\bcalendar\b[^.]{0,24}\bsync|\bsync\b[^.]{0,30}\bcalendars?\b|calendar connections?/i],
  ['sms-whatsapp', /\b(sms|whatsapp|text messag)/i],
  ['voice-telephony', /\b(dialer|click-to-call|call recording|voip|phone calls?|call tracking)\b/i],
  ['video-calls', /\b(video (calls?|meetings?|conferenc\w*)|huddles?)\b/i],
  ['email-sending', /\b(bulk email|email campaigns?|newsletters?|email marketing|cold email)\b/i],
]

const AUDIT_LOG = /\baudit (logs?|trail|logging)\b/i

export function backstopNeeds(name: string, description: string, needs: NeedKind[]): NeedKind[] {
  const text = `${name} ${description}`
  const out = new Set(needs)
  for (const [kind, re] of RULES) if (re.test(text)) out.add(kind)
  return [...out].slice(0, 4)
}

/**
 * A feature whose wording matches one of the services in our catalog is buildable ON that service, so the
 * model calling it "cant" contradicts what we tell visitors elsewhere. It becomes "simplified" with the
 * service attached. Genuine cants (networks, marketplaces, compliance, native apps) match no rule and stay.
 */
export function reconcileFit(name: string, description: string, fit: ModelFit, needs: NeedKind[]): { fit: ModelFit; needs: NeedKind[] } {
  const matched = backstopNeeds(name, description, [])
  // Audit logging is ordinary app code. Bundled with a certification (SOC 2 and similar) the model calls the whole
  // feature "cant", but only the certification is out of reach, so the feature is simplified, not impossible.
  if (fit === 'cant' && AUDIT_LOG.test(name)) return { fit: 'lite', needs: matched }
  if (fit === 'cant') return matched.length ? { fit: 'lite', needs: matched } : { fit, needs: [] }
  return { fit, needs: backstopNeeds(name, description, needs) }
}

export function applyNeedsBackstop(a: ByosAnalysis): ByosAnalysis {
  return {
    ...a,
    modules: a.modules.map(m => ({
      ...m,
      features: m.features.map(f => ({ ...f, ...reconcileFit(f.name, f.description, f.fit, f.needs) })),
    })),
  }
}
