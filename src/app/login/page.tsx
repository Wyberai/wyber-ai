'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { WyberLogo } from '@/components/shared/WyberLogo';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F6F8FB', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}`}</style>

      {/* Left panel — branding */}
      <div style={{ display: 'none', flex: 1, background: '#0B1627', padding: '48px', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100vh' }} className="login-left">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <WyberLogo markSize={36} showWordmark={false} />
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.05em', color: '#EDF4FF' }}>Wyber<span style={{ color: '#38BDF8' }}>AI</span></span>
        </Link>
        <div>
          <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: '#EDF4FF', lineHeight: 1.3, marginBottom: 16 }}>
            "I built my first SaaS dashboard in 4 minutes. No code. Just described what I wanted."
          </p>
          <p style={{ fontSize: 14, color: '#334E6A' }}>— Early Wyber AI user</p>
        </div>
        <p style={{ fontSize: 12, color: '#1E2D44' }}>A product by SignalPulse Technologies · Wyoming, USA · © 2026</p>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Logo for mobile */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 24 }}>
              <WyberLogo markSize={36} showWordmark={false} />
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.05em', color: '#0B1627' }}>Wyber<span style={{ color: '#0EA5E9' }}>AI</span></span>
            </Link>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', color: '#0B1627', margin: '0 0 8px' }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: '#7A9BBE', margin: 0 }}>Sign in to continue building</p>
          </div>

          {sent ? (
            <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 14, padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#065F46', marginBottom: 8 }}>Check your email</p>
              <p style={{ fontSize: 14, color: '#059669', margin: 0 }}>We sent a sign-in link to <strong>{email}</strong></p>
              <p style={{ fontSize: 12, color: '#6EE7B7', marginTop: 16 }}>The link expires in 10 minutes</p>
            </div>
          ) : (
            <div style={{ background: '#FFFFFF', border: '1px solid #DCE4F0', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(11,22,39,0.06)' }}>

              {/* OAuth buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                <button onClick={() => handleOAuth('google')} disabled={!!oauthLoading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '11px 16px', borderRadius: 10, border: '1.5px solid #DCE4F0', background: '#fff', color: '#0B1627', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif" }}>
                  {oauthLoading === 'google' ? '...' : (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Continue with Google
                </button>

                <button onClick={() => handleOAuth('github')} disabled={!!oauthLoading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '11px 16px', borderRadius: 10, border: '1.5px solid #DCE4F0', background: '#fff', color: '#0B1627', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif" }}>
                  {oauthLoading === 'github' ? '...' : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0B1627">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  )}
                  Continue with GitHub
                </button>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1, height: 1, background: '#EDF1F8' }} />
                <span style={{ fontSize: 12, color: '#7A9BBE', fontWeight: 500 }}>or sign in with email</span>
                <div style={{ flex: 1, height: 1, background: '#EDF1F8' }} />
              </div>

              {/* Magic link form */}
              <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: '1.5px solid #DCE4F0', background: '#F6F8FB', color: '#0B1627', fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = '#0EA5E9'}
                  onBlur={e => e.target.style.borderColor = '#DCE4F0'}
                />
                {error && <p style={{ color: '#EF4444', fontSize: 12, margin: 0 }}>{error}</p>}
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '11px 16px', borderRadius: 9, background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: loading ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em', transition: 'all 0.15s' }}>
                  {loading ? 'Sending link...' : 'Send magic link →'}
                </button>
              </form>

              <p style={{ textAlign: 'center', color: '#7A9BBE', fontSize: 13, marginTop: 20, marginBottom: 0 }}>
                No account? <Link href="/signup" style={{ color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Start free — 50 credits</Link>
              </p>
            </div>
          )}

          <p style={{ textAlign: 'center', fontSize: 12, color: '#C8D6E8', marginTop: 32 }}>
            A product by <a href="https://signalpulsehq.com" target="_blank" rel="noreferrer" style={{ color: '#7A9BBE' }}>SignalPulse Technologies</a> · Wyoming, USA · © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
