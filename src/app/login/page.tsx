'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  const handleGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Wyber AI</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>Build apps from a prompt. Ship in minutes.</p>
        </div>

        {sent ? (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--green-dim)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📬</div>
            <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Check your email</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6 }}>We sent a login link to <strong>{email}</strong></p>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <button onClick={handleGoogle} className="btn" style={{ justifyContent: 'center', padding: '10px 16px', fontSize: 14 }}>
                <span>G</span> Continue with Google
              </button>
              <button onClick={handleGitHub} className="btn" style={{ justifyContent: 'center', padding: '10px 16px', fontSize: 14 }}>
                <span>⌥</span> Continue with GitHub
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>or email</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
              />
              {error && <p style={{ color: 'var(--red)', fontSize: 12, margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '10px 16px', fontSize: 14, justifyContent: 'center' }}>
                {loading ? 'Sending...' : 'Send magic link'}
              </button>
            </form>

            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20, marginBottom: 0 }}>
              No account? <Link href="/signup" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign up free</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
