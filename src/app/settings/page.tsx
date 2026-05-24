'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';

function WyberLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  );
}

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState('');
  const [tab, setTab] = useState<'account' | 'billing' | 'api'>('account');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        setProfile({ ...data, email: user.email });
        setName(data?.full_name ?? '');
        setLoading(false);
      });
    });
  }, []);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: name }).eq('id', profile.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const signOut = async () => { await supabase.auth.signOut(); router.push('/login'); };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)' }}>
      <div style={{ color: 'var(--text3)', fontSize: 14 }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)', padding: '0 clamp(16px,4vw,32px)', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <WyberLogo size={26} />
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.04em', color: 'var(--text)' }}>
            Wyber<span style={{ color: 'var(--sky)' }}>AI</span>
          </span>
        </Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={toggle} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none', padding: '6px 12px' }}>← Dashboard</Link>
          <button onClick={signOut} style={{ fontSize: 13, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Sign out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(32px,5vw,56px) clamp(16px,4vw,32px)' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', margin: '0 0 6px' }}>Settings</h1>
        <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 32 }}>{profile?.email}</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
          {(['account', 'billing', 'api'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: tab === t ? 'var(--sky)' : 'var(--text3)', borderBottom: `2px solid ${tab === t ? 'var(--sky)' : 'transparent'}`, marginBottom: -1, transition: 'all 0.15s', fontFamily: 'var(--font-sans)', textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, boxShadow: 'var(--shadow)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 20px', letterSpacing: '-0.03em' }}>Profile</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Display name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                    style={{ width: '100%', padding: '10px 13px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--sky)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Email</label>
                  <input value={profile?.email} disabled
                    style={{ width: '100%', padding: '10px 13px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text3)', fontSize: 14, fontFamily: 'var(--font-sans)', cursor: 'not-allowed' }} />
                </div>
                <button onClick={saveProfile} disabled={saving}
                  style={{ alignSelf: 'flex-start', padding: '9px 22px', borderRadius: 9, background: saved ? 'var(--green)' : 'var(--sky)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-sans)', transition: 'all 0.2s' }}>
                  {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save changes'}
                </button>
              </div>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, boxShadow: 'var(--shadow)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.03em' }}>Credits & Plan</h2>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Your current plan and credit balance</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plan</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--sky)', textTransform: 'capitalize' }}>{profile?.plan ?? 'free'}</div>
                </div>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Credits</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>{profile?.credits ?? 0}</div>
                </div>
              </div>
              <Link href="/pricing" style={{ display: 'inline-block', padding: '9px 20px', borderRadius: 9, background: 'var(--sky)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14, boxShadow: '0 2px 10px var(--sky-glow)' }}>
                Upgrade plan →
              </Link>
            </div>

            <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--red)', margin: '0 0 6px', letterSpacing: '-0.03em' }}>Danger zone</h2>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Irreversible actions — proceed with caution</p>
              <button onClick={signOut}
                style={{ padding: '9px 20px', borderRadius: 9, background: 'transparent', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-sans)' }}>
                Sign out of all devices
              </button>
            </div>
          </div>
        )}

        {tab === 'billing' && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 32, boxShadow: 'var(--shadow)', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>💳</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.03em' }}>Billing coming soon</h2>
            <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 24, lineHeight: 1.65 }}>
              Stripe integration is being finalized. In the meantime, contact us to upgrade your plan.
            </p>
            <a href="mailto:hello@wyberai.com?subject=Upgrade my Wyber AI plan"
              style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 9, background: 'var(--sky)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              Contact to upgrade →
            </a>
          </div>
        )}

        {tab === 'api' && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 32, boxShadow: 'var(--shadow)', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔑</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.03em' }}>API access coming soon</h2>
            <p style={{ color: 'var(--text3)', fontSize: 14, lineHeight: 1.65 }}>
              API keys for programmatic access will be available on Pro and Teams plans.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
