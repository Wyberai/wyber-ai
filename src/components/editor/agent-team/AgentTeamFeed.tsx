'use client'
// The agent-team activity feed. Renders INSIDE the streaming assistant bubble,
// replacing the progressSteps checklist slot when agent events exist — it is
// the same canonical progress surface, upgraded in place, never a second one.
// Wrapped in its own error boundary (AgentFeedBoundary): a feed crash must
// never take down chat or preview (see feedback-preview-isolation).

import { Component, type ReactNode } from 'react'
import { useAgentTurnStore } from '@/store/agent-turn'
import { deriveAgentLanes, type AgentLane, type AgentLaneFinding } from '@/lib/agents/events'
import { agentMeta } from '@/lib/agents/roster'
import { useT } from '@/lib/i18n/useT'
import { EDITOR_AGENTTEAM_STRINGS } from '@/lib/i18n/dict/editor-agentteam'

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#eab308',
  low: '#64748b',
}

export function AgentAvatar({ id, working }: { id: string; working: boolean }) {
  const meta = agentMeta(id)
  return (
    <span
      title={`${meta.name} — ${meta.role}`}
      style={{
        width: 16, height: 16, borderRadius: 5, flexShrink: 0,
        background: `${meta.color}22`, border: `1px solid ${meta.color}55`,
        color: meta.color, fontSize: 9, fontWeight: 800,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        animation: working ? 'pulse 1.6s ease-in-out infinite' : undefined,
      }}
    >
      {meta.name.charAt(0)}
    </span>
  )
}

export function AgentFindingChip({ finding }: { finding: AgentLaneFinding }) {
  const t = useT(EDITOR_AGENTTEAM_STRINGS)
  const fixed = finding.resolution === 'fixed'
  const color = fixed ? 'var(--ide-green, #22C55E)' : SEVERITY_COLOR[finding.severity] || '#64748b'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, lineHeight: 1.4, padding: '2px 7px', borderRadius: 5,
      border: `1px solid ${fixed ? 'rgba(34,197,94,0.35)' : `${color}55`}`,
      background: fixed ? 'rgba(34,197,94,0.08)' : `${color}14`,
      color: fixed ? 'var(--ide-green, #22C55E)' : color,
      maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      <span style={{ flexShrink: 0 }}>{fixed ? '🛡' : '⚠'}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {fixed ? `${t('sentinelBlockedPrefix')} ${finding.detail}` : finding.detail}
      </span>
    </span>
  )
}

function LaneRow({ lane, statusOverride }: { lane: AgentLane; statusOverride?: string }) {
  const meta = agentMeta(lane.agent)
  const working = lane.state === 'working'
  const status = statusOverride || lane.lastStatus
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
        <AgentAvatar id={lane.agent} working={working} />
        <span style={{ fontWeight: 700, color: 'var(--ide-text2)', flexShrink: 0 }}>{meta.name}</span>
        <span style={{ color: 'var(--ide-text3)', fontSize: 10, flexShrink: 0 }}>{meta.role}</span>
        {working && (
          <span style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${meta.color}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 }} />
        )}
        {lane.state === 'done' && <span style={{ color: 'var(--ide-green, #22C55E)', fontSize: 10, flexShrink: 0 }}>✓</span>}
        {lane.state === 'blocked' && <span style={{ fontSize: 10, flexShrink: 0 }}>⚠</span>}
        {status && (
          <span style={{ color: working ? 'var(--ide-text2)' : 'var(--ide-text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
            {status}
          </span>
        )}
      </div>
      {lane.findings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingLeft: 22 }}>
          {lane.findings.map((f, i) => <AgentFindingChip key={f.findingId || i} finding={f} />)}
        </div>
      )}
    </div>
  )
}

export function AgentTeamFeed({ elapsed, progressSteps }: { elapsed: number; progressSteps: string[] }) {
  const t = useT(EDITOR_AGENTTEAM_STRINGS)
  const events = useAgentTurnStore(s => s.events)
  const passesUsed = useAgentTurnStore(s => s.passesUsed)
  const passesMax = useAgentTurnStore(s => s.passesMax)
  const autonomy = useAgentTurnStore(s => s.autonomy)
  const setAutonomy = useAgentTurnStore(s => s.setAutonomy)
  const lanes = deriveAgentLanes(events)
  if (lanes.length === 0) return null
  // The coder's live status is richer in the [progress:] stream ("Wrote
  // src/App.tsx") than in its own sparse agent events — prefer it while working.
  const lastProgress = progressSteps.length ? progressSteps[progressSteps.length - 1] : ''
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {lanes.map(lane => (
        <LaneRow
          key={lane.agent}
          lane={lane}
          statusOverride={lane.agent === 'coder' && lane.state === 'working' && lastProgress ? lastProgress : undefined}
        />
      ))}
      <span style={{ fontSize: 10, color: 'var(--ide-text3)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>
          {passesMax > 0 && `${t('passLabel')} ${Math.max(passesUsed, 1)}/${passesMax} · `}{elapsed > 0 && `${elapsed}s`}
        </span>
        <span style={{ flex: 1 }} />
        {/* Autonomy dial: whether optional fix passes run without asking. */}
        <button
          onClick={() => setAutonomy(autonomy === 'auto' ? 'ask' : 'auto')}
          title={autonomy === 'auto'
            ? t('autopilotTooltip')
            : t('askFirstTooltip')}
          style={{
            fontSize: 9.5, fontWeight: 700, padding: '1px 7px', borderRadius: 8,
            border: '1px solid var(--ide-border)', background: 'transparent',
            color: autonomy === 'auto' ? 'var(--ide-green, #22C55E)' : 'var(--ide-text3)',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          {autonomy === 'auto' ? t('autopilotLabel') : t('askFirstLabel')}
        </button>
      </span>
    </div>
  )
}

// Small function component so the (class-based) boundary below can still use
// the useT hook for its fallback label.
function AgentFeedErrorFallback() {
  const t = useT(EDITOR_AGENTTEAM_STRINGS)
  return <span style={{ fontSize: 11, color: 'var(--ide-text3)' }}>{t('feedErrorFallback')}</span>
}

/** Local error boundary: a feed crash degrades to a plain label; the build,
 * chat, and preview are unaffected. */
export class AgentFeedBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(err: unknown) { console.error('[agent-feed] render error', err) }
  render() {
    if (this.state.failed) {
      return <AgentFeedErrorFallback />
    }
    return this.props.children
  }
}
