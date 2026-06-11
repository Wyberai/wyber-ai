'use client'
import { useEffect, Suspense } from 'react'
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
  const { hydrateProject, resetForProject, setCredits } = useEditorStore()

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
    ]).then(([msgData, kData]) => {
      hydrateProject({
        project,
        files: (initialProject.files && Object.keys(initialProject.files).length > 0) ? initialProject.files : undefined,
        messages: msgData.messages || [],
        knowledge: kData.knowledge || '',
      })
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
        <span style={{ fontSize: 12, color: '#a1a1aa', fontFamily: "'Space Grotesk', sans-serif" }}>{initialProject?.name || 'Mobile App'}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(14,165,233,0.12)', color: '#0EA5E9', letterSpacing: '0.04em' }}>MOBILE</span>
          {initialProfile && (
            <span style={{ fontSize: 11, color: '#52525b' }}>{initialProfile.credits} credits</span>
          )}
        </div>
      </div>

      {/* Main 3-panel layout */}
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
    </div>
  )
}
