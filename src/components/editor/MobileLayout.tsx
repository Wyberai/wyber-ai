'use client'
import { useEffect, useState, Suspense } from 'react'
import { useEditorStore } from '@/store/editor'
import { ChatPanel } from './ChatPanel'
import { MobilePreviewPanel } from './MobilePreviewPanel'
import { MobileRightPanel } from './MobileRightPanel'
import { WyberLogo } from '@/components/shared/WyberLogo'

interface Props {
  initialProject?: { id: string; name: string; files?: any; project_type?: string; user_id?: string }
  initialProfile?: { credits: number; plan: string; email: string; id?: string }
}

export function MobileLayout({ initialProject, initialProfile }: Props) {
  const { hydrateProject, resetForProject, setCredits, setConnectors } = useEditorStore()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [displayName, setDisplayName] = useState(initialProject?.name || 'Mobile App')

  // Narrow-screen handling: the 3-column layout (chat + preview + store) overflows
  // a phone, leaving only the chat reachable. Below the breakpoint show one panel
  // at a time with a bottom tab bar so the preview is always reachable.
  const [isNarrow, setIsNarrow] = useState(false)
  const [mobileView, setMobileView] = useState<'preview' | 'chat' | 'store'>('chat')
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 820px)')
    const apply = () => setIsNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const saveRename = async () => {
    const newName = nameInput.trim()
    setEditingName(false)
    if (!newName || newName === displayName || !initialProject?.id) return
    setDisplayName(newName)
    document.title = `${newName} — WyberAi`
    try { await fetch('/api/projects/rename', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: initialProject.id, name: newName }) }) } catch {}
  }

  useEffect(() => {
    if (!initialProject?.id) return
    resetForProject()

    const project = {
      id: initialProject.id,
      name: initialProject.name ?? 'Untitled',
      framework: 'react-native' as any,
      createdAt: Date.now(),
      userId: initialProject.user_id ?? '',
    }

    if (initialProfile?.credits !== undefined) setCredits(initialProfile.credits)

    Promise.all([
      fetch(`/api/projects/messages?projectId=${initialProject.id}`).then(r => r.json()).catch(() => ({ messages: [] })),
      fetch(`/api/projects/knowledge?projectId=${initialProject.id}`).then(r => r.json()).catch(() => ({ knowledge: '' })),
      fetch(`/api/connectors?projectId=${initialProject.id}`).then(r => r.ok ? r.json() : { connectors: [] }).catch(() => ({ connectors: [] })),
    ]).then(([msgData, kData, cData]) => {
      hydrateProject({
        project,
        files: (initialProject.files && Object.keys(initialProject.files).length > 0) ? initialProject.files : undefined,
        messages: msgData.messages || [],
        knowledge: kData.knowledge || '',
      })
      if (cData.connectors?.length) setConnectors(cData.connectors)
    })
  }, [initialProject?.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#09090b', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#10121a', flexShrink: 0 }}>
        <a href="/dashboard" style={{ textDecoration: 'none' }}>
          <WyberLogo markSize={22} wordmarkSize={13} />
        </a>
        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)' }} />
        {editingName ? (
          <input
            autoFocus
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={saveRename}
            onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditingName(false); }}
            style={{ fontSize: 12, color: '#fafafa', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5, padding: '1px 6px', outline: 'none', fontFamily: "'Space Grotesk', sans-serif" }}
          />
        ) : (
          <span
            onClick={() => { setNameInput(displayName); setEditingName(true); }}
            title="Click to rename"
            style={{ fontSize: 12, color: '#a1a1aa', fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer', padding: '1px 4px', borderRadius: 4 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >{displayName}</span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(14,165,233,0.12)', color: '#0EA5E9', letterSpacing: '0.04em' }}>MOBILE</span>
          {initialProfile && (
            <span style={{ fontSize: 11, color: '#52525b' }}>{initialProfile.credits} credits</span>
          )}
        </div>
      </div>

      {/* Main layout — 3 columns on desktop, one-panel-at-a-time on narrow screens */}
      {isNarrow ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: mobileView === 'chat' ? 'flex' : 'none', flexDirection: 'column' }}>
            <Suspense fallback={<div style={{ flex: 1 }} />}>
              <ChatPanel projectId={initialProject?.id} userId={initialProfile?.id} projectType="mobile" />
            </Suspense>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: mobileView === 'preview' ? 'block' : 'none' }}>
            <MobilePreviewPanel />
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: mobileView === 'store' ? 'block' : 'none' }}>
            <MobileRightPanel projectId={initialProject?.id} projectName={initialProject?.name} />
          </div>
          <div style={{ display: 'flex', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)', background: '#10121a' }}>
            {([['chat', 'Chat'], ['preview', 'Preview'], ['store', 'Store']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMobileView(key)}
                style={{
                  flex: 1, padding: '12px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: mobileView === key ? 'rgba(14,165,233,0.10)' : 'transparent',
                  color: mobileView === key ? '#0EA5E9' : '#71717a',
                  borderTop: mobileView === key ? '2px solid #0EA5E9' : '2px solid transparent',
                }}
              >{label}</button>
            ))}
          </div>
        </div>
      ) : (
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left: Chat */}
        <div style={{ width: 380, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Suspense fallback={<div style={{ flex: 1 }} />}>
            <ChatPanel
              projectId={initialProject?.id}
              userId={initialProfile?.id}
              projectType="mobile"
            />
          </Suspense>
        </div>

        {/* Center: Preview */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <MobilePreviewPanel />
        </div>

        {/* Right: Store Listing + Publish Guide */}
        <div style={{ width: 340, flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <MobileRightPanel
            projectId={initialProject?.id}
            projectName={initialProject?.name}
          />
        </div>
      </div>
      )}
    </div>
  )
}
