import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClient } from '@/lib/oauth/store'
import { WyberLogo } from '@/components/shared/WyberLogo'

export const dynamic = 'force-dynamic'

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

function ErrorScreen({ title, detail }: { title: string; detail: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F8FB', fontFamily: 'var(--font-sans)', padding: 24 }}>
      <div style={{ maxWidth: 420, width: '100%', background: '#fff', border: '1px solid #E5E9F0', borderRadius: 16, padding: 32, textAlign: 'center' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#0B1627' }}>{title}</h1>
        <p style={{ fontSize: 14, color: '#5A6472', margin: 0, lineHeight: 1.6 }}>{detail}</p>
      </div>
    </div>
  )
}

export default async function AuthorizePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const clientId = one(sp.client_id)
  const redirectUri = one(sp.redirect_uri)
  const responseType = one(sp.response_type)
  const codeChallenge = one(sp.code_challenge)
  const codeChallengeMethod = one(sp.code_challenge_method)
  const state = one(sp.state)
  const scope = one(sp.scope) || 'mcp'

  // ── Validate the request BEFORE showing anything ──
  if (responseType !== 'code') return <ErrorScreen title="Unsupported request" detail="Only the authorization code flow is supported." />
  if (!codeChallenge || codeChallengeMethod !== 'S256') return <ErrorScreen title="Security check failed" detail="This client must use PKCE with S256." />
  if (!clientId || !redirectUri) return <ErrorScreen title="Missing information" detail="The authorization request is missing a client or redirect URI." />

  const client = await getClient(clientId)
  if (!client) return <ErrorScreen title="Unknown application" detail="This application isn't registered. Try reconnecting from your MCP client." />
  if (!client.redirect_uris.includes(redirectUri)) {
    return <ErrorScreen title="Redirect mismatch" detail="The redirect URI doesn't match what this application registered." />
  }

  // ── Require a WyberAi login; bounce through /login and return here ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const qs = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: responseType, code_challenge: codeChallenge, code_challenge_method: codeChallengeMethod, scope, ...(state ? { state } : {}) })
    redirect(`/login?next=${encodeURIComponent(`/oauth/authorize?${qs.toString()}`)}`)
  }

  const appName = client.client_name || 'An MCP client'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F8FB', fontFamily: 'var(--font-sans)', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%', background: '#fff', border: '1px solid #E5E9F0', borderRadius: 16, padding: '36px 32px', boxShadow: '0 8px 40px rgba(11,22,39,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><WyberLogo /></div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#0B1627', textAlign: 'center', margin: '0 0 6px' }}>Connect to WyberAi</h1>
        <p style={{ fontSize: 14, color: '#5A6472', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.6 }}>
          <strong style={{ color: '#0B1627' }}>{appName}</strong> wants to build and manage apps in your WyberAi account.
        </p>

        <div style={{ background: '#F6F8FB', border: '1px solid #E5E9F0', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A94A6', marginBottom: 10 }}>This will allow it to</div>
          {['Create, build, and edit your projects', 'Read your project files and account credits', 'Publish projects and run security scans'].map(t => (
            <div key={t} style={{ display: 'flex', gap: 8, fontSize: 13.5, marginBottom: 7, alignItems: 'flex-start' }}>
              <span style={{ color: '#0EA5E9', fontWeight: 700 }}>✓</span><span style={{ color: '#2A3542' }}>{t}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12.5, color: '#8A94A6', textAlign: 'center', marginBottom: 20 }}>
          Signed in as <strong style={{ color: '#5A6472' }}>{user!.email}</strong>. Building apps consumes credits from your account.
        </div>

        <form method="POST" action="/api/oauth/authorize" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="redirect_uri" value={redirectUri} />
          <input type="hidden" name="code_challenge" value={codeChallenge} />
          <input type="hidden" name="scope" value={scope} />
          <input type="hidden" name="state" value={state} />
          <button type="submit" name="decision" value="approve"
            style={{ padding: '12px 16px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Authorize
          </button>
          <button type="submit" name="decision" value="deny"
            style={{ padding: '12px 16px', borderRadius: 10, background: '#fff', color: '#5A6472', fontWeight: 600, fontSize: 14, border: '1px solid #E5E9F0', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}
