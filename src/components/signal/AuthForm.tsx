'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { readCtx, briefBelongsTo, type SignalCtx } from '@/lib/signal/handoff'

/**
 * Sign-up and sign-in in the Signal design. The auth logic is the same as before: Google and GitHub OAuth, an email
 * code verified in this tab (then /api/auth/complete-otp for the welcome email, referral and student bonus), the
 * ?next= and ?ref= hand-offs, and the ?error=auth message. What changed: six code boxes with paste and auto-verify,
 * and a card that reminds a visitor what they were about to build.
 */
export function AuthForm({ mode }: { mode: 'signup' | 'login' }) {
  const signup = mode === 'signup'
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [oauth, setOauth] = useState<'google' | 'github' | null>(null)
  const [sent, setSent] = useState(false)
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [bad, setBad] = useState(false)
  const [other, setOther] = useState('')
  const [ref, setRef] = useState('')
  const [ctx, setCtx] = useState<SignalCtx | null>(null)
  // Where this sign-in is headed. A saved brief only belongs to a sign-in that is going to the builder.
  const [dest, setDest] = useState<string | null>(null)
  const boxes = useRef<(HTMLInputElement | null)[]>([])
  const supabase = createClient()

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const next = q.get('next')
    setOther(`${signup ? '/login' : '/signup'}${next ? `?next=${encodeURIComponent(next)}` : ''}`)
    if (signup) {
      const r = q.get('ref')
      if (r) {
        const clean = r.trim().toUpperCase().slice(0, 32)
        setRef(clean)
        document.cookie = `wyber_ref=${encodeURIComponent(clean)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
      }
    } else if (q.get('error') === 'auth') {
      setError("That sign-in link didn't work. It may have expired, already been used, or been opened in a different browser than the one you asked from. Try again in this browser.")
    }
    setDest(next)
    setCtx(readCtx())
  }, [signup])

  const callbackUrl = () => {
    const p = new URLSearchParams()
    if (signup && ref) p.set('ref', ref)
    const next = new URLSearchParams(window.location.search).get('next')
    if (next) p.set('next', next)
    const qs = p.toString()
    return `${location.origin}/auth/callback${qs ? `?${qs}` : ''}`
  }

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address'); return }
    setSending(true); setError('')
    const { error: err } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callbackUrl() } })
    if (err) setError(err.message)
    else { setSent(true); setTimeout(() => boxes.current[0]?.focus(), 50) }
    setSending(false)
  }

  const verify = useCallback(async (code: string) => {
    setVerifying(true); setError(''); setBad(false)
    const { error: err } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    if (err) {
      setError(err.message); setBad(true); setVerifying(false)
      setDigits(['', '', '', '', '', '']); boxes.current[0]?.focus()
      return
    }
    const next = new URLSearchParams(window.location.search).get('next') || '/dashboard'
    try {
      const res = await fetch('/api/auth/complete-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signup ? { ref, next } : { next }),
      })
      const json = await res.json()
      window.location.href = json.next || next
    } catch { window.location.href = next }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, ref, signup])

  const setAt = (i: number, v: string) => {
    const d = v.replace(/\D/g, '')
    if (!d) { setDigits(a => a.map((x, k) => (k === i ? '' : x))); return }
    const next = [...digits]
    // A paste or an autofill lands many digits in one box: spread them across the rest.
    d.slice(0, 6 - i).split('').forEach((c, k) => { next[i + k] = c })
    setDigits(next)
    const last = Math.min(i + d.length, 5)
    boxes.current[last]?.focus()
    if (next.every(Boolean)) verify(next.join(''))
  }
  const key = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) boxes.current[i - 1]?.focus()
    if (e.key === 'ArrowLeft' && i > 0) boxes.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < 5) boxes.current[i + 1]?.focus()
  }

  const social = async (provider: 'google' | 'github') => {
    setOauth(provider)
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: callbackUrl() } })
  }

  return (
    <div className="sg-auth">
      <div className="sg-actx">
        <span className="sg-mono sg-eyebrow">{signup ? 'Create your account' : 'Welcome back'}</span>
        {dest?.startsWith('/clients') ? (
          <>
            <h2>Your client desk is <span className="sg-em">waiting.</span></h2>
            <p className="sg-sub2">{signup ? 'Create your account to add your first client. 30 free credits to start, no card needed.' : 'Sign in to pick up your clients, quotes and handovers.'}</p>
          </>
        ) : ctx && briefBelongsTo(dest) ? (
          <>
            <h2>Your {ctx.kindLabel.toLowerCase()} is <span className="sg-em">waiting.</span></h2>
            <div className="sg-ctxcard">
              <span className="sg-mono sg-lbl">You were about to build</span>
              <h3>{ctx.title}</h3>
              {ctx.chips.length > 0 && <ul aria-label="First screens">{ctx.chips.map(c => <li key={c}>{c}</li>)}</ul>}
              <p>Sign in and the build starts from this brief.</p>
            </div>
          </>
        ) : (
          <>
            <h2>{signup ? <>Describe it. Watch it. <span className="sg-em">Own it.</span></> : <>Pick up where you <span className="sg-em">left off.</span></>}</h2>
            <p className="sg-sub2">{signup ? '30 free credits to start. No card needed.' : 'Your projects are where you left them.'}</p>
          </>
        )}
      </div>

      <div className="sg-acard">
        {sent ? (
          <form onSubmit={e => { e.preventDefault(); const c = digits.join(''); if (c.length === 6) verify(c) }}>
            <h1>Enter your code</h1>
            <p className="sg-sub2">We sent a 6 digit code to <b>{email}</b>.</p>
            <div className="sg-otps" role="group" aria-label="6 digit code">
              {digits.map((d, i) => (
                <input key={i} ref={el => { boxes.current[i] = el }} className={'sg-otp' + (bad ? ' sg-bad' : '')} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={i === 0 ? 6 : 1} value={d} aria-label={`Digit ${i + 1}`} disabled={verifying}
                  onChange={e => setAt(i, e.target.value)} onKeyDown={e => key(i, e)} onFocus={e => e.target.select()} />
              ))}
            </div>
            <p className="sg-ferr" role="alert">{error}</p>
            <button className="sg-btn" type="submit" style={{ width: '100%' }} disabled={verifying || digits.some(x => !x)}>{verifying ? 'Checking…' : signup ? 'Verify and create account' : 'Verify and sign in'}</button>
            <p className="sg-hint">Nothing after a minute? Check spam, or <button type="button" className="sg-linkbtn" onClick={() => { setSent(false); setDigits(['', '', '', '', '', '']); setError('') }}>use a different email</button>.</p>
          </form>
        ) : (
          <>
            <h1>{signup ? 'Start building for free' : 'Sign in'}</h1>
            <p className="sg-sub2">{signup ? '30 free credits · no card needed' : 'Use the way you signed up.'}</p>
            <div className="sg-oauthrow">
              <button type="button" className="sg-oauth" onClick={() => social('google')} disabled={!!oauth}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                {oauth === 'google' ? 'Opening Google…' : 'Continue with Google'}
              </button>
              <button type="button" className="sg-oauth" onClick={() => social('github')} disabled={!!oauth}>
                <svg viewBox="0 0 24 24" className="sg-gh" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
                {oauth === 'github' ? 'Opening GitHub…' : 'Continue with GitHub'}
              </button>
            </div>
            <div className="sg-or"><i />or with email<i /></div>
            <form onSubmit={sendCode} noValidate>
              <label className="sg-lb" htmlFor="sg-email" style={{ marginTop: 0 }}>Email</label>
              <input id="sg-email" className="sg-field" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              <p className="sg-ferr" role="alert">{error}</p>
              <button className="sg-btn" type="submit" style={{ width: '100%' }} disabled={sending}>{sending ? 'Sending…' : signup ? 'Send sign-up code' : 'Send sign-in code'}</button>
            </form>
            <p className="sg-legal">By continuing you agree to our <a href="/terms" target="_blank" rel="noreferrer">Terms</a> and <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</p>
            <p className="sg-swap">{signup ? 'Already have an account? ' : 'New here? '}<Link href={other || (signup ? '/login' : '/signup')}>{signup ? 'Sign in' : 'Create an account'}</Link></p>
          </>
        )}
      </div>
    </div>
  )
}
