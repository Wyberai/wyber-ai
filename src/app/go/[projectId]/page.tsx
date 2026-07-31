'use client'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'

// Universal-link fallback for a shared mobile preview (copied from the
// companion app's "Share preview link" button — see wyberai-mobile
// preview/[id].tsx onCopyPreviewLink). If WyberAi is installed, the OS
// intercepts this URL before it ever renders; this page only ever shows to
// someone without the app, so it just points them at getting it. The actual
// deep link + credit gate (2cr/5cr per viewer/day) live in the app itself via
// wyberai://project/:id → /api/preview-access — this page never previews the
// project unauthenticated in-browser, which would bypass that gate entirely.
export default function GoToProjectPage() {
  const params = useParams<{ projectId: string }>()
  const deepLink = `wyberai://project/${params.projectId}`

  useEffect(() => {
    // Give the OS a chance to intercept as a universal link before falling
    // through to this page's own content.
    window.location.replace(deepLink)
  }, [deepLink])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 16, padding: 24, background: '#09090b', color: '#f4f4f5',
      textAlign: 'center', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>Opening in WyberAi…</div>
      <div style={{ fontSize: 14, color: '#a1a1aa', maxWidth: 320, lineHeight: 1.6 }}>
        If nothing happens, you probably don&apos;t have the app installed yet.
      </div>
      <a
        href="https://wyberai.com"
        style={{
          marginTop: 8, textDecoration: 'none', background: '#0EA5E9', color: '#fff',
          fontWeight: 700, fontSize: 14, padding: '10px 20px', borderRadius: 10,
        }}
      >
        Get WyberAi
      </a>
    </div>
  )
}
