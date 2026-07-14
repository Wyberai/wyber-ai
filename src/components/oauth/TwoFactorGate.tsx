'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Step-up challenge shown on the MCP connector consent screen when the user has
// 2FA enabled but the current session is only aal1. On success the session is
// upgraded to aal2 and we re-render the consent page (which then shows the
// Authorize button). Wrong/expired only affects THIS action — never app login.
export function TwoFactorGate({ appName }: { appName: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true); setError('')
    const { data: f } = await supabase.auth.mfa.listFactors()
    const factor = f?.totp?.[0]
    if (!factor) { setError('No authenticator found on this account.'); setBusy(false); return }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() })
    setBusy(false)
    if (error) { setError(error.message); return }
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F8FB', fontFamily: 'var(--font-sans)', padding: 24 }}>
      <div style={{ maxWidth: 400, width: '100%', background: '#fff', border: '1px solid #E5E9F0', borderRadius: 16, padding: '32px', textAlign: 'center', boxShadow: '0 8px 40px rgba(11,22,39,0.06)' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0B1627', margin: '0 0 6px' }}>Confirm it's you</h1>
        <p style={{ fontSize: 13.5, color: '#5A6472', margin: '0 0 20px', lineHeight: 1.6 }}>
          Enter the 6-digit code from your authenticator app to authorize <strong style={{ color: '#0B1627' }}>{appName}</strong>.
        </p>
        <input
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          inputMode="numeric"
          autoFocus
          onKeyDown={e => e.key === 'Enter' && code.length === 6 && submit()}
          style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #E5E9F0', background: '#F6F8FB', color: '#0B1627', fontSize: 22, letterSpacing: '0.4em', textAlign: 'center', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
        />
        {error && <div style={{ fontSize: 12.5, color: '#DC2626', marginBottom: 12 }}>{error}</div>}
        <button onClick={submit} disabled={busy || code.length !== 6}
          style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: busy || code.length !== 6 ? 'default' : 'pointer', opacity: busy || code.length !== 6 ? 0.5 : 1, fontFamily: 'inherit' }}>
          {busy ? 'Verifying…' : 'Verify'}
        </button>
      </div>
    </div>
  )
}
