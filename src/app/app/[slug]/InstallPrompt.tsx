'use client'
import { useEffect, useState } from 'react'

// Install pill for published apps viewed through the main-domain shell
// (wyberai.com/app/{slug}). The app HTML's own injected install runtime is
// deliberately inert inside the iframe (window.top check), so the shell — the
// actual top-level document whose manifest Chrome reads — owns the install UX
// here. Mirrors the injected runtime's behavior on the raw origin.
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null)
  const [isIos, setIsIos] = useState(false)
  const [dismissed, setDismissed] = useState(true) // start hidden until checks pass
  const [showIosSheet, setShowIosSheet] = useState(false)

  useEffect(() => {
    try {
      if (window.matchMedia('(display-mode: standalone)').matches) return
      if ((navigator as any).standalone === true) return
      if (localStorage.getItem('wyber:pwa-dismissed')) return
      setDismissed(false)
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
      setIsIos(ios)
      const onPrompt = (e: Event) => {
        e.preventDefault()
        setDeferred(e)
      }
      const onInstalled = () => setDismissed(true)
      window.addEventListener('beforeinstallprompt', onPrompt)
      window.addEventListener('appinstalled', onInstalled)
      return () => {
        window.removeEventListener('beforeinstallprompt', onPrompt)
        window.removeEventListener('appinstalled', onInstalled)
      }
    } catch {
      /* never break the published page */
    }
  }, [])

  if (dismissed || (!deferred && !isIos)) return null

  const install = () => {
    if (deferred) {
      deferred.prompt()
      deferred.userChoice?.then?.(() => setDismissed(true))
    } else if (isIos) {
      setShowIosSheet(true)
    }
  }

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    try { localStorage.setItem('wyber:pwa-dismissed', '1') } catch { /* private mode */ }
    setDismissed(true)
  }

  return (
    <>
      <button
        onClick={install}
        aria-label="Install this app"
        style={{
          position: 'fixed', bottom: 14, left: 14, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 14px', borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
          background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(8px)',
          color: '#fff', font: '600 13px system-ui, sans-serif',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Install app</span>
        <span onClick={dismiss} role="button" aria-label="Dismiss" style={{ marginLeft: 4, opacity: 0.55, fontSize: 15, lineHeight: 1 }}>×</span>
      </button>

      {showIosSheet && (
        <div
          onClick={() => setShowIosSheet(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div style={{ background: '#18181b', color: '#fff', borderRadius: '16px 16px 0 0', padding: '22px 20px 30px', maxWidth: 420, width: '100%', font: '400 14px system-ui, sans-serif', lineHeight: 1.55 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Install this app</div>
            <div style={{ marginBottom: 6 }}>1. Tap the <b>Share</b> button <span style={{ opacity: 0.7 }}>(the square with an arrow)</span></div>
            <div>2. Choose <b>Add to Home Screen</b></div>
          </div>
        </div>
      )}
    </>
  )
}
