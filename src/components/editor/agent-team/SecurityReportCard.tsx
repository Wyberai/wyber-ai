'use client'
// Per-build security snapshot: what Sentinel caught (and fixed) during THIS
// build, collapsed to one line. Deep-links to the Security tab's live RLS
// scanner (the source of truth) via the wyber-open-panel-tab CustomEvent.

import { useState } from 'react'
import type { ChatMessage } from '@/store/editor'
import { useT } from '@/lib/i18n/useT'
import { EDITOR_AGENTTEAM_STRINGS } from '@/lib/i18n/dict/editor-agentteam'

const SEVERITY_DOT: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#eab308',
  low: '#64748b',
}

export function SecurityReportCard({ report }: { report: NonNullable<ChatMessage['agentReport']> }) {
  const t = useT(EDITOR_AGENTTEAM_STRINGS)
  const [open, setOpen] = useState(false)
  const findings = report.findings
  const fixed = findings.filter(f => f.status === 'fixed').length
  const flagged = findings.filter(f => f.status === 'flagged').length
  const summary = findings.length === 0
    ? `${t('sentinelPrefix')} ${t('noSecurityIssuesFound')}`
    : `${t('sentinelPrefix')} ${fixed} ${t('fixedBeforeLanding')}${flagged ? `, ${flagged} ${t('flaggedSuffix')}` : ''}`
  return (
    <div style={{
      marginTop: 6, borderRadius: 8, border: '1px solid rgba(34,197,94,0.25)',
      background: 'rgba(34,197,94,0.05)', overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', background: 'transparent', border: 'none',
          cursor: 'pointer', fontSize: 10.5, fontWeight: 600,
          color: 'var(--ide-green, #22C55E)', textAlign: 'left',
        }}
      >
        <span>🛡</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary}</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div style={{ padding: '0 10px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {findings.length === 0 && (
            <span style={{ fontSize: 10.5, color: 'var(--ide-text3)' }}>
              {t('everyFileReviewedDesc')}
            </span>
          )}
          {findings.map((f, i) => (
            <div key={f.findingId || i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: SEVERITY_DOT[f.severity] || '#64748b', flexShrink: 0 }} />
              <span style={{ color: 'var(--ide-text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{f.title}</span>
              {f.status === 'flagged' && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('wyber-fill-input', {
                    detail: `Fix this security issue Sentinel flagged: ${f.title}`,
                  }))}
                  title={t('fillsFixRequestTooltip')}
                  style={{
                    fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                    border: '1px solid var(--ide-border)', background: 'transparent',
                    color: 'var(--ide-text2)', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {t('askToFix')}
                </button>
              )}
              <span style={{ fontSize: 9.5, fontWeight: 700, color: f.status === 'fixed' ? 'var(--ide-green, #22C55E)' : 'var(--ide-text3)', flexShrink: 0 }}>
                {f.status === 'fixed' ? t('fixedBadge') : t('flaggedBadge')}
              </span>
            </div>
          ))}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('wyber-open-panel-tab', { detail: 'security' }))}
            style={{
              alignSelf: 'flex-start', marginTop: 2, fontSize: 10, fontWeight: 600,
              padding: '3px 9px', borderRadius: 6, border: '1px solid var(--ide-border)',
              background: 'transparent', color: 'var(--ide-text2)', cursor: 'pointer',
            }}
          >
            {t('openFullSecurityScan')}
          </button>
        </div>
      )}
    </div>
  )
}
