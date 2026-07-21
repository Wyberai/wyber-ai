'use client'
// Sentinel's threat model in the Security tab: the static MAP of the app's
// attack surface, recomputed live from the project files (no storage — code
// is the source of truth). Complements the RLS scan below it, which PROBES
// the database from outside. Flag-gated by the caller (AGENT_TEAM_ENABLED).

import { useMemo, useState } from 'react'
import { useEditorStore } from '@/store/editor'
import { buildThreatModel, threatModelHasContent } from '@/lib/agents/threat-model'
import { agentMeta } from '@/lib/agents/roster'
import { useT } from '@/lib/i18n/useT'
import { EDITOR_AGENTTEAM_STRINGS } from '@/lib/i18n/dict/editor-agentteam'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 10.5, color: 'var(--ide-text3)', margin: '0 0 5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</p>
      {children}
    </div>
  )
}

function Chips({ items, color = 'var(--ide-text2)' }: { items: string[]; color?: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {items.map(x => (
        <span key={x} style={{ fontSize: 11, color, background: 'var(--bg-base, #0d0e12)', border: '1px solid var(--ide-border)', borderRadius: 5, padding: '2px 8px' }}>{x}</span>
      ))}
    </div>
  )
}

export function ThreatModelCard() {
  const t = useT(EDITOR_AGENTTEAM_STRINGS)
  const files = useEditorStore(s => s.files)
  const [open, setOpen] = useState(true)
  const tm = useMemo(() => buildThreatModel(files as Record<string, { content?: string }>), [files])
  const sentinel = agentMeta('security')
  if (!threatModelHasContent(tm)) return null

  const surfaceCount = tm.supabaseTables.length + tm.collections.length + tm.authSurfaces.length
    + tm.piiInputs.length + tm.localStorageKeys.length
    + tm.externalCalls.length + tm.sensitiveSinks.length + tm.secretFindings.length

  return (
    <div style={{ borderRadius: 10, border: '1px solid var(--ide-border)', background: 'var(--bg-surface, #16181d)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          width: 18, height: 18, borderRadius: 5, background: `${sentinel.color}22`,
          border: `1px solid ${sentinel.color}55`, color: sentinel.color, fontSize: 10, fontWeight: 800,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{sentinel.name.charAt(0)}</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ide-text)', flex: 1 }}>
          {t('threatModelTitle')} <span style={{ color: 'var(--ide-text3)', fontWeight: 400 }}>· {surfaceCount} {surfaceCount === 1 ? t('surfaceSingular') : t('surfacePlural')} {t('mappedByPrefix')} {sentinel.name}</span>
        </span>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: 'var(--ide-text3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div style={{ padding: '2px 12px 12px', display: 'flex', flexDirection: 'column', gap: 11 }}>
          <div style={{ fontSize: 11, color: 'var(--ide-text3)', lineHeight: 1.55 }}>
            {t('recomputedDesc')}
          </div>
          {tm.secretFindings.length > 0 && (
            <Section title={`${t('secretsInClientCode')} (${tm.secretFindings.length})`}>
              <Chips items={tm.secretFindings.map(s => `${s.name} — ${s.file}`)} color="#F0524B" />
            </Section>
          )}
          {tm.supabaseTables.length > 0 && (
            <Section title={`${t('databaseTablesTouched')} (${tm.supabaseTables.length})`}>
              <Chips items={tm.supabaseTables} />
            </Section>
          )}
          {tm.collections.length > 0 && (
            <Section title={`${t('dataCollections')} (${tm.collections.length})`}>
              <Chips items={tm.collections} />
            </Section>
          )}
          {tm.authSurfaces.length > 0 && (
            <Section title={t('authSurfaces')}>
              <Chips items={tm.authSurfaces} />
            </Section>
          )}
          {tm.piiInputs.length > 0 && (
            <Section title={t('personalDataCollected')}>
              <Chips items={tm.piiInputs} />
            </Section>
          )}
          {tm.externalCalls.length > 0 && (
            <Section title={`${t('externalServicesCalled')} (${tm.externalCalls.length})`}>
              <Chips items={tm.externalCalls.map(c => c.domain)} />
            </Section>
          )}
          {tm.sensitiveSinks.length > 0 && (
            <Section title={`${t('sinksWorthLook')} (${tm.sensitiveSinks.length})`}>
              <Chips items={[...new Set(tm.sensitiveSinks.map(s => `${s.kind} — ${s.file}`))]} color="#F5A623" />
            </Section>
          )}
          {tm.localStorageKeys.length > 0 && (
            <Section title={t('storedInBrowser')}>
              <Chips items={tm.localStorageKeys} />
            </Section>
          )}
        </div>
      )}
    </div>
  )
}
