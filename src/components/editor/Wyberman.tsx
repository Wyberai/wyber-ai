'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useEditorStore, type FileNode } from '@/store/editor'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { creditCost } from '@/lib/credits'
import { useT } from '@/lib/i18n/useT'
import { COMMON_STRINGS } from '@/lib/i18n/dict/common'
import { EDITOR_CANVAS_STRINGS } from '@/lib/i18n/dict/editor-canvas'

interface Message { role: 'user' | 'assistant'; content: string }

interface DiffEntry {
  path: string
  removed: string[]
  removedMore: number
  added: string[]
  addedMore: number
  isNewFile: boolean
}

interface ProposedFix {
  files: Record<string, string>
  diffs: DiffEntry[]
}

const SECURITY_COST = creditCost('security-scan', 'default')
const LANG_MAP: Record<string, string> = { ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript', css: 'css', html: 'html', json: 'json' }
const SEVERITY_ICON: Record<string, string> = { critical: '\u{1F534}', high: '\u{1F7E0}', medium: '\u{1F7E1}', low: '\u{1F535}' }

function summarize(text: string, max = 220): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

// Support responses come back as light markdown (headings, bold, lists) —
// render the common cases instead of showing literal '#'/'**' characters.
function inlineFormat(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part)
      ? <strong key={i} style={{ color: 'var(--ide-text, #fafafa)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

function renderMarkdown(text: string): ReactNode[] {
  const blocks = text.split(/\n{2,}/)
  return blocks.map((block, bi) => {
    const lines = block.split('\n').filter(l => l.trim())
    if (lines.length === 0) return null
    if (lines.every(l => /^\d+\.\s/.test(l.trim()))) {
      return <ol key={bi} style={{ margin: '6px 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {lines.map((l, i) => <li key={i}>{inlineFormat(l.replace(/^\d+\.\s/, ''))}</li>)}
      </ol>
    }
    if (lines.every(l => /^[-*]\s/.test(l.trim()))) {
      return <ul key={bi} style={{ margin: '6px 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {lines.map((l, i) => <li key={i}>{inlineFormat(l.replace(/^[-*]\s/, ''))}</li>)}
      </ul>
    }
    return <p key={bi} style={{ margin: '4px 0' }}>
      {lines.map((l, i) => {
        const heading = l.trim().match(/^#{1,3}\s+(.*)/)
        return (
          <span key={i}>
            {heading ? <strong style={{ color: 'var(--ide-text, #fafafa)', fontWeight: 700 }}>{inlineFormat(heading[1])}</strong> : inlineFormat(l)}
            {i < lines.length - 1 && <br />}
          </span>
        )
      })}
    </p>
  })
}

// Cheap, safe-for-any-file-size diff: trims the matching prefix/suffix and shows
// only the changed middle span, capped. No LCS — avoids O(n*m) blowup on big files.
function computeLightDiff(path: string, oldStr: string, newStr: string): DiffEntry {
  const oldLines = oldStr.split('\n')
  const newLines = newStr.split('\n')
  let start = 0
  const minLen = Math.min(oldLines.length, newLines.length)
  while (start < minLen && oldLines[start] === newLines[start]) start++
  let oldEnd = oldLines.length
  let newEnd = newLines.length
  while (oldEnd > start && newEnd > start && oldLines[oldEnd - 1] === newLines[newEnd - 1]) { oldEnd--; newEnd-- }
  const removedAll = oldLines.slice(start, oldEnd)
  const addedAll = newLines.slice(start, newEnd)
  const CAP = 24
  return {
    path,
    removed: removedAll.slice(0, CAP),
    removedMore: Math.max(0, removedAll.length - CAP),
    added: addedAll.slice(0, CAP),
    addedMore: Math.max(0, addedAll.length - CAP),
    isNewFile: !oldStr,
  }
}

function WybermanIcon({ size = 24, mood = 'idle' }: { size?: number; mood?: 'idle' | 'alert' | 'happy' }) {
  const eyeColor = mood === 'alert' ? '#fca5a5' : '#fff'
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0EA5E9" />
      <path d="M7.5 15.5c0-3.3 2-5.8 4.7-5.8 2.3 0 4.1 1.9 4.3 4.4.2-2.5 2-4.4 4.3-4.4 2.7 0 4.7 2.5 4.7 5.8" stroke={eyeColor} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="12.2" cy="16.6" r="1.7" fill={eyeColor} />
      <circle cx="19.8" cy="16.6" r="1.7" fill={eyeColor} />
      {mood === 'happy' && <path d="M12 21c1.2 1 2.8 1.5 4 1.5s2.8-.5 4-1.5" stroke={eyeColor} strokeWidth="1.6" strokeLinecap="round" fill="none" />}
    </svg>
  )
}

function WybermanInner() {
  const previewError = useEditorStore(s => s.previewError)
  const previewHealFailed = useEditorStore(s => s.previewHealFailed)
  const isGenerating = useEditorStore(s => s.isGenerating)
  const files = useEditorStore(s => s.files)
  const setFiles = useEditorStore(s => s.setFiles)
  const pushCheckpoint = useEditorStore(s => s.pushCheckpoint)
  const framework = useEditorStore(s => s.framework)
  const selectionConsumer = useEditorStore(s => s.selectionConsumer)
  const askModeActive = selectionConsumer === 'wyberman'
  const t = useT(EDITOR_CANVAS_STRINGS)
  const tc = useT(COMMON_STRINGS)

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: t('wybGreeting') }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isNarrow, setIsNarrow] = useState(false)
  const [fixStatus, setFixStatus] = useState<'idle' | 'looking' | 'proposed' | 'applying' | 'applied' | 'none-found'>('idle')
  const [proposedFix, setProposedFix] = useState<ProposedFix | null>(null)
  const [secConfirm, setSecConfirm] = useState(false)
  const [secBusy, setSecBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const announcedError = useRef<string | null>(null)
  // The error string we just applied a fix for — suppresses the quick-action
  // buttons during the brief window before PreviewPanel's own rebuild clears
  // (or replaces) previewError, so "Fix it for me" doesn't flash back on.
  const lastAppliedError = useRef<string | null>(null)
  useEffect(() => { if (isGenerating) lastAppliedError.current = null }, [isGenerating])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 820px)')
    const apply = () => setIsNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, proposedFix])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
    // Closing the panel mid-pick would otherwise leave the preview stuck in
    // click-to-select mode with no visible way back to normal clicking.
    else if (askModeActive) window.dispatchEvent(new CustomEvent('wyber-request-edit-mode', { detail: { on: false, consumer: 'wyberman' } }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // When the panel is opened while a build/preview error is active, drop in one
  // contextual note per distinct error — never auto-opens the panel itself.
  useEffect(() => {
    if (!open || !previewError) return
    if (announcedError.current === previewError) return
    announcedError.current = previewError
    setMessages(m => [...m, {
      role: 'assistant',
      content: `${t('canSeePreviewErrorPrefix')}\n\n"${summarize(previewError)}"\n\n${t('wantExplainOrFixSuffix')}`,
    }])
    setFixStatus('idle')
    setProposedFix(null)
  }, [open, previewError])

  const send = async (overrideText?: string, extraContext?: Message[]) => {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return
    const visible = [...messages, { role: 'user' as const, content: text }]
    setMessages(visible)
    setInput('')
    setLoading(true)

    try {
      const errorContext: Message[] = previewError
        ? [
            { role: 'user', content: `Context — the app preview currently shows this error: "${summarize(previewError)}"${previewHealFailed ? ' (auto-fix already tried and gave up)' : ''}. Keep this in mind if it's relevant to my question.` },
            { role: 'assistant', content: 'Got it, I can see that.' },
          ]
        : []
      const contextPrefix = [...errorContext, ...(extraContext ?? [])]

      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...contextPrefix, ...visible] }),
      })

      if (!res.ok || !res.body) throw new Error(`Support request failed: ${res.status}`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let reply = ''
      setMessages(m => [...m, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += decoder.decode(value, { stream: true })
        setMessages(m => [...m.slice(0, -1), { role: 'assistant', content: reply }])
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: t('couldNotReachHelpMessage') }])
    }
    setLoading(false)
  }

  // "Point and ask" — reuses PreviewPanel's existing click-to-select channel via
  // a small event bridge (wyber-request-edit-mode / wyberman-element-selected)
  // instead of reaching into its iframe ref directly. PreviewPanel gates so only
  // one feature reacts to a given click (see selectionConsumer in the store).
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { selector: string; tag: string; text: string; classes: string } | undefined
      if (!detail) return
      window.dispatchEvent(new CustomEvent('wyber-request-edit-mode', { detail: { on: false, consumer: 'wyberman' } }))
      const shortLabel = `<${detail.tag}>${detail.text ? ` "${summarize(detail.text, 30)}"` : ''}`
      const desc = `<${detail.tag}${detail.classes ? ` class="${detail.classes}"` : ''}>${detail.text ? detail.text.slice(0, 120) : ''}</${detail.tag}>`
      setOpen(true)
      send(`${t('whatIsThisPrefix')} ${shortLabel}`, [
        { role: 'user', content: `Context — I clicked this exact UI element in my app's live preview: ${desc}\nExplain in plain English what it is and why it looks/behaves that way. I might not know how to code.` },
        { role: 'assistant', content: 'Got it, let me take a look.' },
      ])
    }
    window.addEventListener('wyberman-element-selected', handler)
    return () => window.removeEventListener('wyberman-element-selected', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  const toggleAskMode = () => {
    const turningOn = !askModeActive
    if (turningOn && Object.keys(files).length === 0) {
      setMessages(m => [...m, { role: 'assistant', content: t('noPreviewYetMessage') }])
      return
    }
    window.dispatchEvent(new CustomEvent('wyber-request-edit-mode', { detail: { on: turningOn, consumer: 'wyberman' } }))
    // On mobile the full panel would cover the preview it needs to see —
    // switch to the preview tab and collapse to a slim pill while picking.
    if (turningOn && isNarrow) window.dispatchEvent(new CustomEvent('wyber-request-mobile-view', { detail: 'preview' }))
  }
  const compactAsking = askModeActive && isNarrow

  // Free (0-credit) fix attempt — reuses the same auto-fix endpoint PreviewPanel's
  // own silent self-heal uses. Never applies anything without an explicit click.
  const runAutoFix = async (problem: string, fileNameHint?: string) => {
    if (isGenerating || fixStatus === 'looking') return
    setFixStatus('looking')
    setProposedFix(null)
    try {
      const fileMap: Record<string, string> = {}
      for (const [path, file] of Object.entries(files)) {
        const content = (file as { content?: string })?.content
        if (content) fileMap[path] = content
      }
      const res = await fetch('/api/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: problem.slice(0, 1000), files: fileMap, fileName: fileNameHint }),
      })
      const data = await res.json() as { fixed: boolean; files?: Record<string, string> }
      if (data.fixed && data.files && Object.keys(data.files).length > 0) {
        const diffs = Object.entries(data.files).map(([path, content]) =>
          computeLightDiff(path, (files[path] as { content?: string } | undefined)?.content ?? '', content)
        )
        setProposedFix({ files: data.files, diffs })
        setFixStatus('proposed')
      } else {
        setFixStatus('none-found')
        setMessages(m => [...m, { role: 'assistant', content: t('noAutoFixFoundMessage') }])
      }
    } catch {
      setFixStatus('none-found')
      setMessages(m => [...m, { role: 'assistant', content: t('couldNotReachFixerMessage') }])
    }
  }

  const applyProposedFix = () => {
    if (!proposedFix || isGenerating) return
    setFixStatus('applying')
    pushCheckpoint('Before Wyberman fix')
    const updated = { ...files }
    for (const [path, content] of Object.entries(proposedFix.files)) {
      const existing = updated[path] as FileNode | undefined
      const ext = path.split('.').pop() ?? ''
      updated[path] = { path, content, language: existing?.language ?? LANG_MAP[ext] ?? 'plaintext' }
    }
    setFiles(updated)
    lastAppliedError.current = previewError
    setFixStatus('applied')
    setMessages(m => [...m, { role: 'assistant', content: t('appliedFixMessage') }])
    setProposedFix(null)
  }

  const discardProposedFix = () => {
    setProposedFix(null)
    setFixStatus('idle')
  }

  const runSecurityCheck = async () => {
    if (isGenerating || secBusy) return
    if (Object.keys(files).length === 0) {
      setMessages(m => [...m, { role: 'assistant', content: t('noAppToScanMessage') }])
      return
    }
    if (!secConfirm) { setSecConfirm(true); return }
    setSecConfirm(false)
    setSecBusy(true)
    setMessages(m => [...m, { role: 'assistant', content: t('scanningAppMessage') }])
    try {
      const fileContext = Object.entries(files).slice(0, 20).map(([p, f]) => `<file path="${p}">\n${((f as { content?: string })?.content ?? '').slice(0, 2000)}\n</file>`).join('\n\n')
      const prompt = `You are a security auditor reviewing AI-generated code. Analyze these files for vulnerabilities.\n\n${fileContext}\n\nRespond ONLY with a JSON object, no markdown:\n{\n  "score": <0-100 security score>,\n  "vulnerabilities": [{ "severity": "critical|high|medium|low", "file": "path/to/file", "issue": "Description", "fix": "How to fix it in one sentence" }],\n  "passed": ["Check that passed", ...]\n}\n\nCheck for: hardcoded secrets/API keys, missing input validation, XSS, open CORS, missing auth checks, SQL injection risks, exposed sensitive data, insecure direct object references.`

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, framework, fileContext: '', history: [] }),
      })
      if (!res.ok || !res.body) throw new Error('scan failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
      }
      const clean = full.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean) as { score: number; vulnerabilities?: { severity: string; file: string; issue: string; fix: string }[] }
      const lines = [`${t('securityScoreLabel')} ${parsed.score}/100`, '']
      const vulns = parsed.vulnerabilities ?? []
      if (vulns.length === 0) {
        lines.push(t('noIssuesFoundMessage'))
      } else {
        for (const v of vulns.slice(0, 5)) {
          lines.push(`${SEVERITY_ICON[v.severity] ?? '•'} ${v.file}: ${v.issue}\n   ${t('fixLabel')} ${v.fix}`)
        }
        if (vulns.length > 5) lines.push(`\n+${vulns.length - 5} ${t('moreAskElaborateSuffix')}`)
      }
      setMessages(m => [...m.slice(0, -1), { role: 'assistant', content: lines.join('\n') }])
    } catch {
      setMessages(m => [...m.slice(0, -1), { role: 'assistant', content: t('couldNotCompleteScanMessage') }])
    }
    setSecBusy(false)
  }

  const statusColor = previewError ? (previewHealFailed ? 'var(--ide-red, #ef4444)' : 'var(--ide-amber, #f59e0b)') : 'var(--ide-green, #22c55e)'
  const statusLabel = previewError
    ? (previewHealFailed ? t('statusPreviewSnag') : (isGenerating ? t('statusBuildInProgress') : t('statusTryingSelfHeal')))
    : t('statusBuildHealthy')
  const mascotMood: 'idle' | 'alert' | 'happy' = previewError && previewHealFailed ? 'alert' : (!previewError ? 'happy' : 'idle')

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: isNarrow ? 72 : 24, right: 20, zIndex: 400,
          width: 50, height: 50, borderRadius: '50%',
          background: 'var(--bg-elevated, #18181F)', border: '1px solid var(--ide-border, #2A2A35)',
          cursor: 'pointer', boxShadow: previewError && previewHealFailed ? '0 0 0 4px rgba(239,68,68,0.15), 0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.15s, box-shadow 0.3s',
          animation: open ? 'none' : 'wyberman-bob 3.2s ease-in-out infinite',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
        title={open ? t('closeWybermanTooltip') : t('askWybermanTooltip')}
        aria-label={open ? t('closeWybermanTooltip') : t('askWybermanTooltip')}
        data-wyberman-toggle
      >
        {open ? (
          <span style={{ color: 'var(--ide-text, #EEEEF4)', fontSize: 16, fontWeight: 300 }}>✕</span>
        ) : (
          <>
            <WybermanIcon size={26} mood={mascotMood} />
            {previewError && (
              <span style={{
                position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: '50%',
                background: statusColor, border: '2px solid var(--bg-elevated, #18181F)',
              }} />
            )}
          </>
        )}
      </button>

      {compactAsking && (
        <div style={{
          position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 401,
          background: 'var(--bg-surface, #111116)', border: '1px solid var(--accent, #0EA5E9)',
          borderRadius: 999, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)', fontFamily: 'var(--font-display)', fontSize: 12,
          color: 'var(--ide-text, #EEEEF4)', maxWidth: 'calc(100vw - 40px)',
        }}>
          <span>{t('tapElementHint')}</span>
          <button onClick={toggleAskMode} style={{ background: 'transparent', border: 'none', color: 'var(--accent, #0EA5E9)', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0, flexShrink: 0 }}>{tc('cancel')}</button>
        </div>
      )}

      {open && !compactAsking && (
        <div style={{
          position: 'fixed', bottom: (isNarrow ? 72 : 24) + 62, right: 20, zIndex: 399,
          width: 360, maxWidth: 'calc(100vw - 40px)', height: 500, maxHeight: 'calc(100vh - 160px)',
          background: 'var(--bg-surface, #111116)', border: '1px solid var(--ide-border, #2A2A35)',
          borderRadius: 14, display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.55)', fontFamily: 'var(--font-display)',
          animation: 'wyberman-in 0.15s ease',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--ide-border, #2A2A35)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <WybermanIcon size={22} mood={mascotMood} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ide-text, #EEEEF4)' }}>Wyberman</div>
              <div style={{ fontSize: 11, color: 'var(--ide-text2, #7878A0)', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                {statusLabel}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
                {m.role === 'assistant' && (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                    <WybermanIcon size={14} mood="idle" />
                  </div>
                )}
                <div style={{
                  maxWidth: '80%', padding: '9px 12px', whiteSpace: m.role === 'user' ? 'pre-wrap' : 'normal',
                  borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: m.role === 'user' ? 'var(--accent, #0EA5E9)' : 'var(--bg-elevated, #18181F)',
                  color: m.role === 'user' ? '#fff' : 'var(--ide-text, #EEEEF4)',
                  fontSize: 13, lineHeight: 1.55,
                  border: m.role === 'assistant' ? '1px solid var(--ide-border, #2A2A35)' : 'none',
                }}>
                  {m.content ? (m.role === 'assistant' ? renderMarkdown(m.content) : m.content) : <span style={{ opacity: 0.4 }}>●●●</span>}
                </div>
              </div>
            ))}

            {fixStatus === 'looking' && (
              <div style={{ fontSize: 12, color: 'var(--ide-text2, #7878A0)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ animation: 'wyberman-spin 0.8s linear infinite', display: 'inline-block' }}>⟳</span> {t('lookingAtCodeMessage')}
              </div>
            )}

            {proposedFix && (
              <div style={{ border: '1px solid var(--ide-border, #2A2A35)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, color: 'var(--ide-text, #EEEEF4)', background: 'var(--bg-elevated, #18181F)' }}>
                  {t('proposedFixLabel')} {proposedFix.diffs.length} {proposedFix.diffs.length !== 1 ? t('filesUnit') : t('fileUnit')}
                </div>
                <div style={{ maxHeight: 200, overflow: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {proposedFix.diffs.map(d => (
                    <div key={d.path}>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ide-text2, #7878A0)', marginBottom: 3 }}>{d.path}{d.isNewFile ? ` ${t('newFileSuffix')}` : ''}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.5, borderRadius: 6, overflow: 'hidden' }}>
                        {d.removed.map((l, i) => (
                          <div key={'r' + i} style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', padding: '0 6px', whiteSpace: 'pre' }}>- {l}</div>
                        ))}
                        {d.removedMore > 0 && <div style={{ color: 'var(--ide-text3, #44445A)', padding: '0 6px' }}>… +{d.removedMore} {t('moreRemovedSuffix')}</div>}
                        {d.added.map((l, i) => (
                          <div key={'a' + i} style={{ background: 'rgba(34,197,94,0.12)', color: '#86efac', padding: '0 6px', whiteSpace: 'pre' }}>+ {l}</div>
                        ))}
                        {d.addedMore > 0 && <div style={{ color: 'var(--ide-text3, #44445A)', padding: '0 6px' }}>… +{d.addedMore} {t('moreAddedSuffix')}</div>}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, padding: '8px 10px', borderTop: '1px solid var(--ide-border, #2A2A35)' }}>
                  <button onClick={applyProposedFix} disabled={isGenerating} style={{ flex: 1, padding: '7px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'var(--accent, #0EA5E9)', color: '#fff', border: 'none', cursor: isGenerating ? 'default' : 'pointer', opacity: isGenerating ? 0.5 : 1 }}>{t('applyFixButton')}</button>
                  <button onClick={discardProposedFix} style={{ padding: '7px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'transparent', color: 'var(--ide-text2, #7878A0)', border: '1px solid var(--ide-border, #2A2A35)', cursor: 'pointer' }}>{t('discardButton')}</button>
                </div>
              </div>
            )}

            {secConfirm && (
              <div style={{ fontSize: 12, color: 'var(--ide-text, #EEEEF4)', border: '1px solid var(--ide-border, #2A2A35)', borderRadius: 8, padding: '8px 10px' }}>
                {t('securityConfirmMessage').replace('{cost}', String(SECURITY_COST))}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={runSecurityCheck} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'var(--accent, #0EA5E9)', color: '#fff', border: 'none', cursor: 'pointer' }}>{t('yesScanButton')}</button>
                  <button onClick={() => setSecConfirm(false)} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'transparent', color: 'var(--ide-text2, #7878A0)', border: '1px solid var(--ide-border, #2A2A35)', cursor: 'pointer' }}>{tc('cancel')}</button>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {previewError && previewError !== lastAppliedError.current && !proposedFix && fixStatus !== 'looking' && (
            <div style={{ padding: '0 14px 8px', display: 'flex', gap: 6 }}>
              <button
                onClick={() => send(t('whatDoesErrorMeanMessage'))}
                disabled={loading}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'var(--accent-dim, rgba(14,165,233,0.15))', color: 'var(--accent, #0EA5E9)', border: '1px solid var(--accent-glow, rgba(14,165,233,0.12))', cursor: loading ? 'default' : 'pointer' }}
              >
                {t('explainErrorButton')}
              </button>
              <button
                onClick={() => runAutoFix(previewError)}
                disabled={isGenerating}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'var(--accent, #0EA5E9)', color: '#fff', border: 'none', cursor: isGenerating ? 'default' : 'pointer', opacity: isGenerating ? 0.5 : 1 }}
              >
                {t('fixItForMeButton')}
              </button>
            </div>
          )}

          <div style={{ padding: '0 14px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={toggleAskMode}
                style={{
                  fontSize: 11, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                  color: askModeActive ? 'var(--accent, #0EA5E9)' : 'var(--ide-text2, #7878A0)',
                  textDecoration: 'underline', textUnderlineOffset: 2, fontWeight: askModeActive ? 700 : 400,
                }}
              >
                {askModeActive ? t('clickAnythingCancelLabel') : t('pointAtSomethingLabel')}
              </button>
              <button
                onClick={runSecurityCheck}
                disabled={isGenerating || secBusy}
                style={{ fontSize: 11, color: 'var(--ide-text2, #7878A0)', background: 'transparent', border: 'none', cursor: isGenerating || secBusy ? 'default' : 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}
              >
                {t('runSecurityCheckLabel')}
              </button>
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--ide-border, #2A2A35)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={t('askWybermanPlaceholder')}
              rows={1}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--ide-border, #2A2A35)', background: 'var(--bg-elevated, #18181F)', color: 'var(--ide-text, #EEEEF4)', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', maxHeight: 80, overflowY: 'auto' }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              aria-label={t('sendMessageAriaLabel')}
              style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: input.trim() && !loading ? 'var(--accent, #0EA5E9)' : 'var(--bg-elevated, #18181F)', color: '#fff', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}
            >
              {loading ? '●' : '↑'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes wyberman-in { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes wyberman-bob { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-3px) } }
        @keyframes wyberman-spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        @media (prefers-reduced-motion: reduce) {
          button[data-wyberman-toggle] { animation: none !important; }
        }
      `}</style>
    </>
  )
}

// Isolated from the rest of the editor: its own error boundary, its own local
// chat state (never touches the project's real chat/messages store), and it
// only ever *reads* preview state — never writes into PreviewPanel or the
// iframe. A crash in here can't take down the build preview. File writes
// (from "Fix it for me") only ever happen after an explicit user click, and
// always push a checkpoint first so they're one click to undo.
export function Wyberman() {
  return (
    <ErrorBoundary fallbackMessage="Wyberman had a hiccup">
      <WybermanInner />
    </ErrorBoundary>
  )
}
