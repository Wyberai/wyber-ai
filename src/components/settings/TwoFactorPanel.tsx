'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// TOTP two-factor via Supabase Auth MFA. Supabase manages the factor + secret;
// this component drives enroll → verify → unenroll. Enrolling is opt-in and does
// not change login on its own — the step-up is enforced where it matters (the
// MCP connector authorization screen). See src/components/oauth/TwoFactorGate.
interface Factor { id: string; friendly_name?: string; status: string; factor_type: string; created_at?: string }

export function TwoFactorPanel() {
  const supabase = createClient()
  const [factors, setFactors] = useState<Factor[]>([])
  const [loading, setLoading] = useState(true)
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [recovery, setRecovery] = useState<string[] | null>(null)

  const load = async () => {
    const { data } = await supabase.auth.mfa.listFactors()
    setFactors(((data?.all ?? []) as Factor[]).filter(f => f.factor_type === 'totp'))
    setLoading(false)
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [])

  const verified = factors.filter(f => f.status === 'verified')

  const startEnroll = async () => {
    setError(''); setBusy(true)
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Authenticator ${new Date().toISOString()}` })
    setBusy(false)
    if (error) { setError(error.message); return }
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret })
  }

  const confirmEnroll = async () => {
    if (!enroll) return
    setError(''); setBusy(true)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enroll.id, code: code.trim() })
    if (error) { setBusy(false); setError(error.message); return }
    // Hand the user single-use backup codes (shown once).
    try {
      const res = await fetch('/api/mfa/recovery', { method: 'POST' })
      const data = await res.json()
      if (data.codes) setRecovery(data.codes)
    } catch { /* codes can be regenerated later from the panel */ }
    setBusy(false)
    setEnroll(null); setCode(''); load()
  }

  const regenerate = async () => {
    setBusy(true); setError('')
    const res = await fetch('/api/mfa/recovery', { method: 'POST' })
    const data = await res.json()
    setBusy(false)
    if (data.codes) setRecovery(data.codes); else setError(data.error || 'Could not regenerate codes')
  }

  const cancelEnroll = async () => {
    if (enroll) await supabase.auth.mfa.unenroll({ factorId: enroll.id }).catch(() => {})
    setEnroll(null); setCode(''); setError('')
  }

  const remove = async (id: string) => {
    setBusy(true)
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id })
    if (error) { setBusy(false); setError(error.message); return }
    await fetch('/api/mfa/disable', { method: 'POST' }).catch(() => {})
    setBusy(false)
    setRecovery(null)
    load()
  }

  const copyCodes = () => { if (recovery) navigator.clipboard.writeText(recovery.join('\n')).catch(() => {}) }

  const S = {
    card: { background: '#111113', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20, marginBottom: 16 } as const,
    input: { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#18181b', color: '#fafafa', fontSize: 18, letterSpacing: '0.3em', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' as const, textAlign: 'center' as const },
    btn: (c = '#0EA5E9') => ({ padding: '9px 20px', borderRadius: 8, border: 'none', background: c, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }) as const,
    ghost: { padding: '9px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#a1a1aa', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' } as const,
  }

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Two-factor authentication</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24, lineHeight: 1.5 }}>
        Add an authenticator app (Google Authenticator, Authy, 1Password) as a second factor. When enabled, you'll confirm a 6-digit code before authorizing an MCP connector to act on your account.
      </p>

      {recovery && (
        <div style={{ ...S.card, border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginBottom: 6 }}>Save your recovery codes</div>
          <div style={{ fontSize: 12.5, color: '#a1a1aa', marginBottom: 14, lineHeight: 1.5 }}>
            Each code works once. Store them somewhere safe — if you lose your authenticator, a recovery code is the only way back in (and using one turns 2FA off so you can re-enroll). They won't be shown again.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
            {recovery.map(c => (
              <code key={c} style={{ fontFamily: 'monospace', fontSize: 13, color: '#fafafa', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '7px 10px', textAlign: 'center', letterSpacing: '0.06em' }}>{c}</code>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copyCodes} style={S.btn()}>Copy codes</button>
            <button onClick={() => setRecovery(null)} style={S.ghost}>I've saved them</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ fontSize: 13, color: '#52525b' }}>Loading…</div>
      ) : enroll ? (
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Scan this QR code</div>
          <div style={{ fontSize: 12, color: '#71717a', marginBottom: 14 }}>Open your authenticator app and scan, or enter the key manually. Then type the 6-digit code it shows.</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ background: '#fff', padding: 10, borderRadius: 10, width: 168, height: 168, display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: enroll.qr }} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Manual key</div>
              <code style={{ display: 'block', wordBreak: 'break-all', fontSize: 12, color: '#a1a1aa', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', marginBottom: 16 }}>{enroll.secret}</code>
              <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" inputMode="numeric" style={S.input} onKeyDown={e => e.key === 'Enter' && code.length === 6 && confirmEnroll()} />
              {error && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={confirmEnroll} disabled={busy || code.length !== 6} style={{ ...S.btn(), opacity: busy || code.length !== 6 ? 0.5 : 1 }}>{busy ? 'Verifying…' : 'Enable 2FA'}</button>
                <button onClick={cancelEnroll} style={S.ghost}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      ) : verified.length > 0 ? (
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>✓ ENABLED</span>
              <div style={{ fontSize: 13, color: '#a1a1aa' }}>Authenticator app is protecting your account.</div>
            </div>
            <button onClick={() => remove(verified[0].id)} disabled={busy} style={{ ...S.ghost, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', fontSize: 12 }}>{busy ? '…' : 'Remove'}</button>
          </div>
          <button onClick={regenerate} disabled={busy} style={{ marginTop: 12, fontSize: 12, color: '#0EA5E9', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>Regenerate recovery codes</button>
          {error && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 10 }}>{error}</div>}
        </div>
      ) : (
        <div style={S.card}>
          <div style={{ fontSize: 13, color: '#71717a', marginBottom: 14 }}>2FA is not enabled yet.</div>
          <button onClick={startEnroll} disabled={busy} style={S.btn()}>{busy ? 'Starting…' : 'Set up authenticator app'}</button>
          {error && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 10 }}>{error}</div>}
        </div>
      )}
    </>
  )
}
