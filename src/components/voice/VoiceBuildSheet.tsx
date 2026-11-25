'use client'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useT } from '@/lib/i18n/useT'
import { VOICE_STRINGS } from '@/lib/i18n/dict/voice'
import { fallbackBrief, initialVoiceFlow, mergeAnswers, voiceFlowReducer, type ProjectKind, type VoiceBrief } from '@/lib/voice/brief'
import {
  findVoiceLanguage, pickDefaultVoiceLanguage, VOICE_LANGUAGES, VOICE_LANG_STORAGE_KEY,
} from '@/lib/voice/languages'
import type { CaptureProblem } from '@/lib/voice/capture'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { track } from '@/lib/track'
import { useSpeechCapture } from './useSpeechCapture'

export interface VoiceBuildResult { prompt: string; type: ProjectKind }

interface Props {
  onClose: () => void
  onConfirm: (r: VoiceBuildResult) => void
  /** Hide the project-type chips (used inside an existing project, where the type is already fixed). */
  showType?: boolean
  surface: 'hero' | 'dashboard' | 'editor'
}

const SERVER_STT = process.env.NEXT_PUBLIC_VOICE_SERVER_STT === 'on'
const TYPE_KEYS: Record<ProjectKind, string> = { website: 'typeWebsite', app: 'typeApp', saas: 'typeSaas', mobile: 'typeMobile' }
const PROBLEM_KEYS: Record<CaptureProblem, string> = {
  denied: 'pDenied', 'no-mic': 'pNoMic', 'no-speech': 'pNoSpeech', network: 'pNetwork',
  language: 'pLanguage', unsupported: 'pUnsupported', generic: 'pGeneric',
}

function MicIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

export function VoiceBuildSheet({ onClose, onConfirm, showType = true, surface }: Props) {
  const t = useT(VOICE_STRINGS)
  const { locale } = useLocale()
  const [flow, dispatch] = useReducer(voiceFlowReducer, initialVoiceFlow)
  const [langCode, setLangCode] = useState('en-IN')
  const [typed, setTyped] = useState('')
  const [degraded, setDegraded] = useState(false)
  const [busyClip, setBusyClip] = useState(false)
  const [recording, setRecording] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef(flow.stage)
  stageRef.current = flow.stage
  const flowRef = useRef(flow)
  flowRef.current = flow
  const recorderRef = useRef<{ rec: MediaRecorder; stream: MediaStream; chunks: Blob[] } | null>(null)

  // Language: saved choice, else site language, else browser language.
  useEffect(() => {
    let saved: string | null = null
    try { saved = localStorage.getItem(VOICE_LANG_STORAGE_KEY) } catch { /* private mode */ }
    setLangCode(pickDefaultVoiceLanguage({ saved, siteLocale: locale, browserLanguages: navigator.languages ?? [navigator.language] }).code)
  }, [locale])

  const onHeard = useCallback((text: string) => {
    if (stageRef.current === 'followup') dispatch({ type: 'answered', answer: text })
    else dispatch({ type: 'heard', transcript: text })
  }, [])
  const cap = useSpeechCapture({ lang: langCode, onDone: onHeard })

  // Focus management: focus the dialog on open, restore focus on close, Esc closes, Tab stays inside.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), select, textarea, input, [tabindex="0"]'))
      if (!items.length) return
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    const scroll = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = scroll; prev?.focus?.() }
  }, [onClose])

  // Ask for a brief whenever speech lands (first time, and after each follow-up answer).
  useEffect(() => {
    if (flow.stage !== 'working') return
    let cancelled = false
    const transcript = mergeAnswers(flow.transcript, flow.answers)
    ;(async () => {
      try {
        const res = await fetch('/api/voice/brief', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, lang: langCode, canAsk: flow.answers.length < 2 }),
        })
        if (!res.ok) throw new Error('brief')
        const json = await res.json()
        if (cancelled) return
        if (json.degraded) setDegraded(true)
        dispatch({ type: 'brief', brief: json.brief as VoiceBrief })
      } catch {
        if (cancelled) return
        setDegraded(true)
        dispatch({ type: 'brief', brief: { ...fallbackBrief(transcript), questions: [] } })
      }
    })()
    return () => { cancelled = true }
  }, [flow.stage, flow.transcript, flow.answers, langCode])

  // Auto-start listening when the sheet opens and again for each follow-up (best effort: needs a recent tap).
  const autoStarted = useRef<string>('')
  useEffect(() => {
    if (cap.supported !== true) return
    const key = flow.stage === 'followup' ? `f${flow.answers.length}` : flow.stage === 'capture' ? 'c' : ''
    if (!key || autoStarted.current === key || cap.status !== 'idle') return
    autoStarted.current = key
    cap.start()
  }, [cap, flow.stage, flow.answers.length])

  const chooseLang = (code: string) => {
    setLangCode(code)
    try { localStorage.setItem(VOICE_LANG_STORAGE_KEY, code) } catch { /* private mode */ }
    if (cap.status === 'listening') cap.reset()
  }

  const submitTyped = () => {
    const text = typed.trim()
    if (!text) return
    setTyped('')
    onHeard(text)
  }

  // Optional server transcription (flag off by default).
  const transcribeBlob = async (blob: Blob) => {
    setBusyClip(true)
    try {
      const form = new FormData()
      form.append('audio', blob, 'speech')
      form.append('lang', langCode)
      const res = await fetch('/api/voice/transcribe', { method: 'POST', body: form })
      const json = res.ok ? await res.json() : null
      if (json?.transcript) onHeard(String(json.transcript))
      else cap.reset()
    } catch { cap.reset() } finally { setBusyClip(false) }
  }
  const toggleClip = async () => {
    if (recording && recorderRef.current) { recorderRef.current.rec.stop(); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      const chunks: Blob[] = []
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data) }
      rec.onstop = () => {
        stream.getTracks().forEach(tr => tr.stop())
        recorderRef.current = null
        setRecording(false)
        void transcribeBlob(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }))
      }
      recorderRef.current = { rec, stream, chunks }
      rec.start()
      setRecording(true)
    } catch { cap.reset() }
  }
  useEffect(() => () => { recorderRef.current?.stream.getTracks().forEach(tr => tr.stop()) }, [])

  const confirm = () => {
    const b = flowRef.current.brief
    if (!b || flowRef.current.confirmed) return
    dispatch({ type: 'confirm' })
    track('voice_brief_confirmed', { surface, type: b.type, lang: langCode, followups: flowRef.current.answers.length })
    onConfirm({ prompt: b.brief, type: b.type })
  }

  const listening = cap.status === 'listening'
  const noSpeechApi = cap.supported === false
  const problemKey = cap.problem ? PROBLEM_KEYS[cap.problem] : null
  const brief = flow.brief
  const showCapture = flow.stage === 'capture' || flow.stage === 'followup'
  const question = flow.stage === 'followup' ? brief?.questions[0] : null

  const css = `
    .vbs-over{position:fixed;inset:0;z-index:1000;display:flex;align-items:flex-end;justify-content:center;background:rgba(3,8,14,.72)}
    @media(min-width:640px){.vbs-over{align-items:center}}
    .vbs-card{width:100%;max-width:520px;max-height:92vh;overflow:auto;background:#0e1520;color:#e8eef6;border:1px solid #243246;border-radius:18px 18px 0 0;padding:20px 18px 22px;font-family:inherit;outline:none}
    @media(min-width:640px){.vbs-card{border-radius:18px}}
    .vbs-h{font-size:17px;font-weight:700;margin:0 0 4px;letter-spacing:-.01em}
    .vbs-p{font-size:13.5px;line-height:1.55;color:#9fb0c4;margin:0 0 12px}
    .vbs-mic{width:84px;height:84px;border-radius:50%;border:2px solid #2b6fff;background:#12233f;color:#cfe0ff;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;margin:6px auto}
    .vbs-mic[aria-pressed=true]{background:#3a1520;border-color:#ef4444;color:#fecaca}
    .vbs-mic:focus-visible,.vbs-btn:focus-visible,.vbs-chip:focus-visible,.vbs-sel:focus-visible,.vbs-x:focus-visible{outline:3px solid #7aa7ff;outline-offset:2px}
    .vbs-ring{position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(239,68,68,.55);transform:scale(var(--lv,0));opacity:.8;pointer-events:none}
    .vbs-live{min-height:64px;border:1px solid #243246;border-radius:12px;padding:10px 12px;font-size:15px;line-height:1.5;margin:8px 0;background:#0a111b}
    .vbs-int{color:#8aa0ba}
    .vbs-btn{padding:10px 16px;border-radius:10px;border:1px solid #2b3d57;background:transparent;color:#e8eef6;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
    .vbs-btn.pri{background:#2b6fff;border-color:#2b6fff;color:#fff}
    .vbs-btn:disabled{opacity:.5;cursor:default}
    .vbs-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .vbs-chip{padding:7px 12px;border-radius:999px;border:1px solid #2b3d57;background:transparent;color:#cdd9e8;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
    .vbs-chip[aria-pressed=true]{background:#17305e;border-color:#2b6fff;color:#fff}
    .vbs-sel,.vbs-ta{background:#0a111b;color:#e8eef6;border:1px solid #2b3d57;border-radius:10px;padding:9px 10px;font-size:14px;font-family:inherit;width:100%}
    .vbs-ta{resize:vertical;min-height:84px;line-height:1.5}
    .vbs-x{position:absolute;top:10px;right:12px;background:none;border:none;color:#9fb0c4;font-size:22px;cursor:pointer;padding:4px 8px;line-height:1}
    .vbs-small{font-size:12px;color:#8aa0ba;line-height:1.5}
    .vbs-err{font-size:13.5px;color:#fbbf77;margin:8px 0}
    .vbs-spin{width:16px;height:16px;border:2px solid #2b3d57;border-top-color:#7aa7ff;border-radius:50%;animation:vbsSpin .9s linear infinite;display:inline-block;vertical-align:-3px;margin-right:8px}
    @keyframes vbsSpin{to{transform:rotate(360deg)}}
    @media (prefers-reduced-motion: reduce){.vbs-spin{animation:none}.vbs-ring{transform:none!important;opacity:var(--lvo,0)}}
  `

  return (
    <div className="vbs-over" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <style>{css}</style>
      <div ref={dialogRef} className="vbs-card" role="dialog" aria-modal="true" aria-labelledby="vbs-title" tabIndex={-1} style={{ position: 'relative' }}>
        <button type="button" className="vbs-x" onClick={onClose} aria-label={t('close')}>×</button>
        <h2 id="vbs-title" className="vbs-h">{flow.stage === 'confirm' ? t('confirmTitle') : flow.stage === 'followup' ? t('followupTitle') : t('title')}</h2>

        {showCapture && (
          <>
            {flow.stage === 'capture' && <p className="vbs-p">{t('tapToSpeak')}</p>}
            {question && <p className="vbs-p" style={{ color: '#e8eef6', fontSize: 15 }}>{question}</p>}

            {flow.stage === 'capture' && (
              <label className="vbs-small" style={{ display: 'block', marginBottom: 10 }}>
                {t('language')}
                <select className="vbs-sel" style={{ marginTop: 4 }} value={langCode} onChange={e => chooseLang(e.target.value)}>
                  {VOICE_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </label>
            )}

            {!noSpeechApi && (
              <>
                <button type="button" className="vbs-mic" aria-pressed={listening}
                  aria-label={listening ? t('stop') : t('start')} title={listening ? t('stop') : t('start')}
                  onClick={() => (listening ? cap.stop() : cap.start())}>
                  {listening && <span className="vbs-ring" style={{ ['--lv' as any]: 1 + cap.level * 0.5, ['--lvo' as any]: 0.3 + cap.level * 0.7 }} aria-hidden="true" />}
                  <MicIcon size={30} />
                </button>
                <div role="meter" aria-label={t('level')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(cap.level * 100)}
                  style={{ height: 4, borderRadius: 4, background: '#1a2536', margin: '6px auto 0', maxWidth: 220, overflow: 'hidden', opacity: listening ? 1 : 0.35 }}>
                  <div style={{ height: '100%', width: `${Math.round(cap.level * 100)}%`, background: '#ef4444' }} />
                </div>
                <p className="vbs-small" style={{ textAlign: 'center', margin: '8px 0 0' }} role="status" aria-live="polite">
                  {listening ? t('listening') : ''}
                </p>
              </>
            )}

            {(listening || cap.finalText || cap.interim) && (
              <div className="vbs-live" aria-label="Transcript">
                {cap.finalText}{cap.interim && <span className="vbs-int"> {cap.interim}</span>}
              </div>
            )}

            {problemKey && <p className="vbs-err" role="alert">{t(problemKey)}</p>}
            {busyClip && <p className="vbs-p"><span className="vbs-spin" aria-hidden="true" />{t('transcribing')}</p>}

            {(noSpeechApi || problemKey) && SERVER_STT && (
              <div className="vbs-row" style={{ margin: '8px 0' }}>
                <button type="button" className="vbs-btn" onClick={toggleClip} disabled={busyClip}>{recording ? t('stopClip') : t('recordClip')}</button>
                <label className="vbs-btn" style={{ cursor: 'pointer' }}>
                  {t('upload')}
                  <input type="file" accept="audio/*" style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
                    onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void transcribeBlob(f) }} />
                </label>
              </div>
            )}

            <div style={{ marginTop: 10 }}>
              <label className="vbs-small" htmlFor="vbs-type">{flow.stage === 'followup' ? t('typeAnswer') : t('typeInstead')}</label>
              <textarea id="vbs-type" className="vbs-ta" style={{ marginTop: 4 }} value={typed} onChange={e => setTyped(e.target.value)}
                placeholder={flow.stage === 'followup' ? '' : t('typePlaceholder')}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submitTyped() } }} />
              <div className="vbs-row" style={{ marginTop: 8 }}>
                <button type="button" className="vbs-btn pri" onClick={submitTyped} disabled={!typed.trim()}>
                  {flow.stage === 'followup' ? t('send') : t('submitTyped')}
                </button>
                {flow.stage === 'followup' && <button type="button" className="vbs-btn" onClick={() => { cap.reset(); dispatch({ type: 'skip' }) }}>{t('skip')}</button>}
              </div>
            </div>
            <p className="vbs-small" style={{ marginTop: 12 }}>{t('privacy')}</p>
          </>
        )}

        {flow.stage === 'working' && (
          <p className="vbs-p" role="status" aria-live="polite"><span className="vbs-spin" aria-hidden="true" />{t('working')}</p>
        )}

        {(flow.stage === 'confirm' || flow.stage === 'done') && brief && (
          <>
            <p className="vbs-p">{t('editHint')}</p>
            {degraded || brief.fellBack ? <p className="vbs-err">{degraded ? t('briefDegraded') : t('briefFallback')}</p> : null}
            {brief.business && <p className="vbs-small" style={{ margin: '0 0 6px' }}>{t('businessLabel')}: <strong style={{ color: '#e8eef6' }}>{brief.business}</strong></p>}
            <textarea className="vbs-ta" aria-label={t('confirmTitle')} value={brief.brief} style={{ minHeight: 120 }}
              onChange={e => dispatch({ type: 'edit', brief: e.target.value })} />
            {showType && (
              <div style={{ margin: '12px 0 4px' }}>
                <div className="vbs-small" id="vbs-type-label">{t('typeLabel')}</div>
                <div className="vbs-row" role="group" aria-labelledby="vbs-type-label" style={{ marginTop: 6 }}>
                  {(Object.keys(TYPE_KEYS) as ProjectKind[]).map(k => (
                    <button key={k} type="button" className="vbs-chip" aria-pressed={brief.type === k} onClick={() => dispatch({ type: 'retype', kind: k })}>{t(TYPE_KEYS[k])}</button>
                  ))}
                </div>
              </div>
            )}
            {brief.missing.length > 0 && <p className="vbs-small" style={{ margin: '10px 0 0' }}>{t('notSaid')} {brief.missing.join(', ')}</p>}
            <p className="vbs-small" style={{ margin: '10px 0 0' }}>{t('noCredits')}</p>
            <div className="vbs-row" style={{ marginTop: 14 }}>
              <button type="button" className="vbs-btn pri" onClick={confirm} disabled={flow.confirmed || !brief.brief.trim()}>{showType ? t('confirm') : t('confirmEdit')}</button>
              <button type="button" className="vbs-btn" onClick={() => { cap.reset(); autoStarted.current = ''; setDegraded(false); dispatch({ type: 'reset' }) }}>{t('again')}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
