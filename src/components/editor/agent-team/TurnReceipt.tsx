'use client'
// Post-turn receipt: one line per agent that worked this turn, the internal
// pass count, and the single charge. Renders under a done build message.

import type { ChatMessage } from '@/store/editor'
import { agentMeta } from '@/lib/agents/roster'
import { useT } from '@/lib/i18n/useT'
import { EDITOR_AGENTTEAM_STRINGS } from '@/lib/i18n/dict/editor-agentteam'

export function TurnReceipt({ report }: { report: NonNullable<ChatMessage['agentReport']> }) {
  const t = useT(EDITOR_AGENTTEAM_STRINGS)
  if (!report.agents.length) return null
  return (
    <div style={{
      marginTop: 7, padding: '7px 10px', borderRadius: 8,
      border: '1px solid var(--ide-border)', background: 'var(--bg-elevated, rgba(255,255,255,0.02))',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      {report.agents.map(a => {
        const meta = agentMeta(a.id)
        return (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color: 'var(--ide-text2)', flexShrink: 0 }}>{meta.name}</span>
            <span style={{ color: 'var(--ide-text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.summary}</span>
          </div>
        )
      })}
      <div style={{ fontSize: 10, color: 'var(--ide-text3)', marginTop: 1, display: 'flex', gap: 8 }}>
        {typeof report.passesUsed === 'number' && report.passesUsed > 0 && <span>{report.passesUsed + 1} {t('passesSuffix')}</span>}
        {typeof report.credits === 'number' && (
          <span>{report.credits} {report.credits === 1 ? t('creditSingular') : t('creditPlural')} {t('wholeTeamOneCharge')}</span>
        )}
      </div>
    </div>
  )
}
