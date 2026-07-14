'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function MfaChallenge() {
  const supabase = createClient()
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/dashboard'

  const [ready, setReady] = useState(false)
  const [mode, setMode] = useState<'totp' | 'recovery'>('totp')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace(`/login?next=${encodeURIComponent(next)}`); return }
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      // Already stepped up, or no factor to step up with → nothing to do here.
      if (!aal || aal.currentLevel === 'aal2' || aal.nextLevel !== 'aal2') { router.replace(next); return }
      setReady(true)
    })()
    /* eslint-disable-next-line */
  }, [])

  const verifyTotp = async () => {
    setBusy(true); setError('')
    const { data: f } = await supabase.auth.mfa.listFactors()
    const factor = f?.totp?.[0]
    if (!factor) { setError('No authenticator on this account.'); setBusy(false); return }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() })
    setBusy(false)
    if (error) { setError(error.message); return }
    router.replace(next)
  }

  const useRecovery = async () => {
    setBusy(true); setError('')
    const res = await fetch('/api/mfa/recovery/consume', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code.trim() }) })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) { setError(data.error || 'Invalid recovery code'); return }
    // Factor removed → session no longer needs step-up. Refresh so middleware
    // stops redirecting here, then continue.
    router.replace(next)
    router.refresh()
  }

  const box = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F8FB', fontFamily: 'var(--font-sans)', padding: 24 } as const
  if (!ready) return <div style={{ ...box, color: '#5A6472', fontSize: 14 }}>Checking…</div>

  const isRecovery = mode === 'recovery'
  return (
    <div style={box}>
      <div style={{ maxWidth: 400, width: '100%', background: '#fff', border: '1px solid #E5E9F0', borderRadius: 16, padding: 32, textAlign: 'center', boxShadow: '0 8px 40px rgba(11,22,39,0.06)' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
        <h1 style={{ fontSize: 19, fontWeight: 700, color: '#0B1627', margin: '0 0 6px' }}>Two-factor authentication</h1>
        <p style={{ fontSize: 13.5, color: '#5A6472', margin: '0 0 20px', lineHeight: 1.6 }}>
          {isRecovery ? 'Enter one of your recovery codes. This will turn off 2FA so you can sign in and re-enroll.' : 'Enter the 6-digit code from your authenticator app.'}
        </p>
        <input
          value={code}
          onChange={e => setCode(isRecovery ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder={isRecovery ? 'xxxxx-xxxxx' : '000000'}
          inputMode={isRecovery ? 'text' : 'numeric'}
          autoFocus
          onKeyDown={e => e.key === 'Enter' && (isRecovery ? useRecovery() : (code.length === 6 && verifyTotp()))}
          style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #E5E9F0', background: '#F6F8FB', color: '#0B1627', fontSize: isRecovery ? 16 : 22, letterSpacing: isRecovery ? '0.1em' : '0.4em', textAlign: 'center', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
        />
        {error && <div style={{ fontSize: 12.5, color: '#DC2626', marginBottom: 12 }}>{error}</div>}
        <button onClick={isRecovery ? useRecovery : verifyTotp} disabled={busy || (!isRecovery && code.length !== 6) || (isRecovery && !code)}
          style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: busy || (!isRecovery && code.length !== 6) || (isRecovery && !code) ? 0.5 : 1, fontFamily: 'inherit' }}>
          {busy ? 'Verifying…' : isRecovery ? 'Use recovery code' : 'Verify'}
        </button>
        <button onClick={() => { setMode(isRecovery ? 'totp' : 'recovery'); setCode(''); setError('') }}
          style={{ marginTop: 14, fontSize: 12.5, color: '#5A6472', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
          {isRecovery ? 'Use authenticator code instead' : 'Lost your device? Use a recovery code'}
        </button>
      </div>
    </div>
  )
}

export default function MfaPage() {
  return <Suspense fallback={null}><MfaChallenge /></Suspense>
}
