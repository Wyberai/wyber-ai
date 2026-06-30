'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { WyberLogo } from '@/components/shared/WyberLogo';


export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const supabase = createClient();

  const [termsShake, setTermsShake] = useState(false);
  const nudgeTerms = () => { setError('Please agree to the Terms of Service first'); setTermsShake(true); setTimeout(() => setTermsShake(false), 600); };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { nudgeTerms(); return; }
    if (!email.trim()) { setError('Please enter your email address'); return; }
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
    if (!agreed) { nudgeTerms(); return; }
    setOauthLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F6F8FB', fontFamily: 'var(--font-sans)' }}>
      <style>{`*{box-sizing:border-box}@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}`}</style>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 24 }}>
              <WyberLogo markSize={36} showWordmark={false} />
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.05em', color: '#0B1627' }}>Wyber<span style={{ color: '#0EA5E9' }}>AI</span></span>
            </Link>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', color: '#0B1627', margin: '0 0 8px' }}>Start building for free</h1>
            <p style={{ fontSize: 14, color: '#7A9BBE', margin: 0 }}>50 free credits · No card required · Cancel anytime</p>
            {/* Social proof — reassure first-time signups (matches homepage stats) */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginTop: 18, padding: '8px 16px', background: '#fff', border: '1px solid #E4ECF6', borderRadius: 999, boxShadow: '0 1px 2px rgba(11,22,39,0.04)' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0B1627' }}>2,400+ <span style={{ color: '#7A9BBE', fontWeight: 500 }}>apps built</span></span>
              <span style={{ width: 1, height: 12, background: '#E4ECF6' }} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0B1627', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#F59E0B' }}>★</span>4.9<span style={{ color: '#7A9BBE', fontWeight: 500 }}>/5</span>
              </span>
            </div>
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

              {/* Terms checkbox — top, before anything */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20, padding: '12px 14px', background: termsShake ? '#FEF2F2' : '#F6F8FB', borderRadius: 10, border: `1px solid ${termsShake ? '#FCA5A5' : '#DCE4F0'}`, animation: termsShake ? 'shake 0.4s ease' : 'none', transition: 'background 0.3s, border-color 0.3s' }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, flexShrink: 0, accentColor: '#0EA5E9', width: 15, height: 15 }} />
                <span style={{ fontSize: 12, color: '#7A9BBE', lineHeight: 1.6 }}>
                  I agree to the{' '}
                  <a href="/terms" target="_blank" style={{ color: '#0EA5E9', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" style={{ color: '#0EA5E9', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>
                </span>
              </label>

              {/* OAuth buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                <button onClick={() => handleOAuth('google')} disabled={!!oauthLoading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '11px 16px', borderRadius: 10, border: '1.5px solid #DCE4F0', background: '#fff', color: '#0B1627', fontSize: 14, fontWeight: 600, cursor: oauthLoading ? 'not-allowed' : 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-sans)' }}>
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
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '11px 16px', borderRadius: 10, border: '1.5px solid #DCE4F0', background: '#fff', color: '#0B1627', fontSize: 14, fontWeight: 600, cursor: oauthLoading ? 'not-allowed' : 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-sans)' }}>
                  {oauthLoading === 'github' ? '...' : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0B1627">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  )}
                  Continue with GitHub
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1, height: 1, background: '#EDF1F8' }} />
                <span style={{ fontSize: 12, color: '#7A9BBE', fontWeight: 500 }}>or sign up with email</span>
                <div style={{ flex: 1, height: 1, background: '#EDF1F8' }} />
              </div>

              <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: '1.5px solid #DCE4F0', background: '#F6F8FB', color: '#0B1627', fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = '#0EA5E9'}
                  onBlur={e => e.target.style.borderColor = '#DCE4F0'}
                />
                {error && <p style={{ color: '#EF4444', fontSize: 12, margin: 0 }}>{error}</p>}
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '11px 16px', borderRadius: 9, background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em', transition: 'all 0.15s' }}>
                  {loading ? 'Creating account...' : 'Create account →'}
                </button>
              </form>

              <p style={{ textAlign: 'center', color: '#7A9BBE', fontSize: 13, marginTop: 20, marginBottom: 0 }}>
                Already have an account? <Link href="/login" style={{ color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
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