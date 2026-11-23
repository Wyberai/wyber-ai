'use client'
import { useCallback, useState } from 'react'
import { useT } from '@/lib/i18n/useT'
import { VOICE_STRINGS } from '@/lib/i18n/dict/voice'
import { track } from '@/lib/track'
import { VoiceBuildSheet, type VoiceBuildResult } from './VoiceBuildSheet'

interface Props {
  onConfirm: (r: VoiceBuildResult) => void
  surface: 'hero' | 'dashboard' | 'editor'
  disabled?: boolean
  size?: number
  showType?: boolean
}

/** Mic button that opens the speak, confirm and build-the-brief sheet. */
export function VoiceBuildButton({ onConfirm, surface, disabled, size = 30, showType = true }: Props) {
  const t = useT(VOICE_STRINGS)
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const icon = Math.round(size * 0.47)
  return (
    <>
      <button
        type="button" className="wy-tap" disabled={disabled}
        aria-haspopup="dialog" aria-expanded={open}
        aria-label={t('open')} title={t('open')}
        onClick={() => { track('voice_sheet_opened', { surface }); setOpen(true) }}
        style={{
          width: size, height: size, minWidth: size, borderRadius: '50%', border: 'none', flexShrink: 0,
          background: 'transparent', color: 'var(--ide-text3, currentColor)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
      >
        <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>
      {open && (
        <VoiceBuildSheet
          surface={surface} showType={showType} onClose={close}
          onConfirm={r => { setOpen(false); onConfirm(r) }}
        />
      )}
    </>
  )
}
