'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { SignalFrame } from '@/components/signal/SignalFrame'

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

  if (!ready) return <SignalFrame bare><div className="sg-wrap"><p className="sg-hint" style={{ padding: '120px 0' }}>Checking…</p></div></SignalFrame>

  const isRecovery = mode === 'recovery'
  const disabled = busy || (!isRecovery && code.length !== 6) || (isRecovery && !code)
  return (
    <SignalFrame bare>
      <div className="sg-wrap">
        <div className="sg-auth" style={{ gridTemplateColumns: 'minmax(0, 440px)', justifyContent: 'center' }}>
          <form className="sg-acard" onSubmit={e => { e.preventDefault(); if (!disabled) (isRecovery ? useRecovery() : verifyTotp()) }}>
            <span className="sg-mono sg-eyebrow">Two-step check</span>
            <h1 style={{ marginTop: 10 }}>Two-factor authentication</h1>
            <p className="sg-sub2">{isRecovery ? 'Enter one of your recovery codes. This turns off 2FA so you can sign in and set it up again.' : 'Enter the 6 digit code from your authenticator app.'}</p>
            <label className="sg-lb" htmlFor="sg-mfa">{isRecovery ? 'Recovery code' : 'Code'}</label>
            <input id="sg-mfa" className="sg-field" value={code} autoFocus autoComplete="one-time-code"
              onChange={e => setCode(isRecovery ? e.target.value : e.target.value.replace(/D/g, '').slice(0, 6))}
              placeholder={isRecovery ? 'xxxxx-xxxxx' : '000000'} inputMode={isRecovery ? 'text' : 'numeric'}
              style={{ textAlign: 'center', fontFamily: 'var(--font-mono, monospace)', letterSpacing: isRecovery ? '0.1em' : '0.4em', fontSize: isRecovery ? 17 : 24 }} />
            <p className="sg-ferr" role="alert">{error}</p>
            <button className="sg-btn" type="submit" style={{ width: '100%' }} disabled={disabled}>{busy ? 'Verifying…' : isRecovery ? 'Use recovery code' : 'Verify'}</button>
            <button type="button" className="sg-linkbtn" style={{ display: 'block', margin: '8px auto 0' }} onClick={() => { setMode(isRecovery ? 'totp' : 'recovery'); setCode(''); setError('') }}>
              {isRecovery ? 'Use authenticator code instead' : 'Lost your device? Use a recovery code'}
            </button>
          </form>
        </div>
      </div>
    </SignalFrame>
  )
}

export default function MfaPage() {
  return <Suspense fallback={null}><MfaChallenge /></Suspense>
}
