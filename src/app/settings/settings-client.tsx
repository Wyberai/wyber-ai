'use client'
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

function WyberLogo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  );
}

type Tab = 'profile' | 'billing' | 'api-keys' | 'secrets' | 'github' | 'notifications' | 'danger';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'profile',       label: 'Profile',             icon: '👤' },
  { id: 'billing',       label: 'Plans & Billing',      icon: '💳' },
  { id: 'api-keys',      label: 'API Keys',             icon: '🔑' },
  { id: 'secrets',       label: 'Secrets Vault',        icon: '🔐' },
  { id: 'github',        label: 'GitHub',               icon: '⌥' },
  { id: 'notifications', label: 'Notifications',        icon: '🔔' },
  { id: 'danger',        label: 'Danger Zone',          icon: '⚠️' },
];

const PLANS = [
  { id: 'free',    name: 'Free',    price: '$0',  credits: 50,    color: '#52525b', features: ['50 credits/month', '3 projects', 'Community support'] },
  { id: 'starter', name: 'Starter', price: '$15', credits: 500,   color: '#0EA5E9', features: ['500 credits/month', 'Unlimited projects', 'Email support', 'GitHub sync'] },
  { id: 'pro',     name: 'Pro',     price: '$39', credits: 2000,  color: '#8b5cf6', features: ['2000 credits/month', 'Everything in Starter', 'Priority support', 'Custom domains'] },
  { id: 'business', name: 'Business', price: '$49', credits: 500, color: '#f59e0b', features: ['500 monthly credits', 'Everything in Pro', 'Priority support', 'SSO & audit logs (Q3 2026)'] },
];

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [notifications, setNotifications] = useState({ email: true, credits: true, deploy: false });
  const [deleteConfirm, setDeleteConfirm] = useState('');
  // Secrets vault state
  const [secrets, setSecrets] = useState<{ id: string; name: string; preview: string; created_at: string }[]>([]);
  const [secretsLoaded, setSecretsLoaded] = useState(false);
  const [secretName, setSecretName] = useState('');
  const [secretValue, setSecretValue] = useState('');
  const [secretSaving, setSecretSaving] = useState(false);
  const [secretError, setSecretError] = useState('');
  const [secretSuccess, setSecretSuccess] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        setProfile({ ...data, email: user.email });
        setName(data?.full_name ?? user.email?.split('@')[0] ?? '');
        setLoading(false);
      });
      // Check GitHub connection
      supabase.from('github_connections').select('github_username').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setGithubConnected(true); });
      // Pre-load secrets so the tab feels instant
      fetch('/api/secrets').then(r => r.json()).then(d => { if (d.secrets) { setSecrets(d.secrets); setSecretsLoaded(true); } });
    });
    // Generate fake API key for display
    setApiKey('wai-' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10));
  }, []);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: name }).eq('id', profile.id);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const signOut = async () => { await supabase.auth.signOut(); router.push('/'); };

  const loadSecrets = async () => {
    const res = await fetch('/api/secrets');
    const data = await res.json();
    if (data.secrets) { setSecrets(data.secrets); setSecretsLoaded(true); }
  };

  const addSecret = async () => {
    if (!secretName.trim() || !secretValue.trim()) { setSecretError('Both name and value are required'); return; }
    setSecretSaving(true); setSecretError(''); setSecretSuccess('');
    const res = await fetch('/api/secrets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: secretName, value: secretValue }) });
    const data = await res.json();
    setSecretSaving(false);
    if (data.error) { setSecretError(data.error); return; }
    setSecretName(''); setSecretValue('');
    setSecretSuccess(`${data.name} saved`); setTimeout(() => setSecretSuccess(''), 2500);
    loadSecrets();
  };

  const deleteSecret = async (name: string) => {
    await fetch('/api/secrets', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    setSecrets(s => s.filter(x => x.name !== name));
  };

  const S = {
    page: { minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif", display: 'flex' as const },
    sidebar: { width: 220, borderRight: '1px solid rgba(255,255,255,0.07)', padding: '24px 12px', flexShrink: 0 as const, display: 'flex' as const, flexDirection: 'column' as const },
    main: { flex: 1, padding: '32px 48px', maxWidth: 680 },
    tabBtn: (active: boolean) => ({ display: 'flex' as const, alignItems: 'center' as const, gap: 10, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: active ? 'rgba(14,165,233,0.1)' : 'transparent', color: active ? '#0EA5E9' : '#a1a1aa', fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s', fontFamily: 'inherit', marginBottom: 2 }),
    card: { background: '#111113', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20, marginBottom: 16 },
    label: { fontSize: 11, fontWeight: 700, color: '#52525b', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6, display: 'block' as const },
    input: { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#18181b', color: '#fafafa', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const },
    btn: (color = '#0EA5E9') => ({ padding: '9px 20px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s' }),
    ghost: { padding: '9px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#a1a1aa', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
    h2: { fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 },
    sub: { fontSize: 13, color: '#71717a', marginBottom: 24, lineHeight: 1.5 },
    row: { display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  };

  if (loading) return <div style={{ ...S.page, alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#52525b' }}>Loading...</div>;

  return (
    <div style={S.page}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 32, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo size={24} />
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '-0.03em' }}>Wyber AI</span>
        </a>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '0 12px' }}>Settings</div>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.tabBtn(tab === t.id), color: t.id === 'danger' ? (tab === t.id ? '#ef4444' : '#71717a') : undefined }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span>{t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={signOut} style={{ ...S.ghost, width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>↩</span> Sign out
        </button>
      </div>

      {/* Main */}
      <div style={S.main}>

        {/* PROFILE */}
        {tab === 'profile' && <>
          <h1 style={S.h2}>Profile</h1>
          <p style={S.sub}>Manage your name, email, and account preferences.</p>

          <div style={S.card}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #0EA5E9, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(name || profile?.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{name || 'Your Name'}</div>
                <div style={{ fontSize: 13, color: '#71717a' }}>{profile?.email}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', color: '#0EA5E9' }}>
                  {(profile?.plan || 'free').toUpperCase()} PLAN · {profile?.credits ?? 0} credits left
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={S.label}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} style={S.input} placeholder="Your name" />
              </div>
              <div>
                <label style={S.label}>Email Address</label>
                <input value={profile?.email || ''} disabled style={{ ...S.input, opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
            </div>
            <button onClick={saveProfile} disabled={saving} style={S.btn()}>
              {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>

          <div style={S.card}>
            <div style={{ ...S.row, marginBottom: 0 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Appearance</div>
                <div style={{ fontSize: 12, color: '#71717a' }}>Choose your preferred theme</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Dark', 'Light', 'System'].map(t => (
                  <button key={t} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: t === 'Dark' ? 'rgba(255,255,255,0.08)' : 'transparent', color: t === 'Dark' ? '#fafafa' : '#71717a', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{t}</button>
                ))}
              </div>
            </div>
          </div>
        </>}

        {/* BILLING */}
        {tab === 'billing' && <>
          <h1 style={S.h2}>Plans & Billing</h1>
          <p style={S.sub}>Manage your subscription, credits, and payment method.</p>

          {/* Current plan */}
          <div style={{ ...S.card, border: '1px solid rgba(14,165,233,0.3)', background: 'rgba(14,165,233,0.04)', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Current Plan</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800 }}>{(profile?.plan || 'Free').charAt(0).toUpperCase() + (profile?.plan || 'free').slice(1)}</div>
                <div style={{ fontSize: 13, color: '#71717a', marginTop: 2 }}>
                  <span style={{ color: '#0EA5E9', fontWeight: 700 }}>{profile?.credits ?? 0} credits</span> remaining this month
                </div>
              </div>
              <a href="/pricing" style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>Upgrade plan</a>
            </div>
            {/* Credit bar */}
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#52525b', marginBottom: 5 }}>
                <span>Credits used this month</span>
                <span>{Math.max(0, (PLANS.find(p => p.id === (profile?.plan || 'free'))?.credits || 50) - (profile?.credits || 0))} / {PLANS.find(p => p.id === (profile?.plan || 'free'))?.credits || 50}</span>
              </div>
              <div style={{ height: 6, borderRadius: 9999, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ height: '100%', borderRadius: 9999, background: '#0EA5E9', width: Math.min(100, ((PLANS.find(p => p.id === (profile?.plan || 'free'))?.credits || 50) - (profile?.credits || 0)) / (PLANS.find(p => p.id === (profile?.plan || 'free'))?.credits || 50) * 100) + '%', transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: 11, color: '#52525b', marginTop: 4 }}>Resets on the 1st of every month</div>
            </div>
          </div>

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {PLANS.map(p => (
              <div key={p.id} style={{ padding: 16, borderRadius: 10, background: '#111113', border: `1px solid ${p.id === (profile?.plan || 'free') ? p.color + '50' : 'rgba(255,255,255,0.07)'}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  {p.id === (profile?.plan || 'free') && '✓ '}{p.name}
                </div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{p.price}<span style={{ fontSize: 11, fontWeight: 400, color: '#52525b' }}>/mo</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {p.features.map(f => <div key={f} style={{ fontSize: 11, color: '#71717a', display: 'flex', gap: 6 }}><span style={{ color: p.color }}>✓</span>{f}</div>)}
                </div>
                {p.id !== (profile?.plan || 'free') && (
                  <a href="/pricing" style={{ display: 'block', marginTop: 10, padding: '6px', borderRadius: 7, border: `1px solid ${p.color}40`, background: p.color + '12', color: p.color, fontSize: 12, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>Switch to {p.name}</a>
                )}
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={{ ...S.row }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Payment Method</div>
                <div style={{ fontSize: 12, color: '#71717a' }}>Manage your card and billing details</div>
              </div>
              <button style={S.ghost}>Manage billing ↗</button>
            </div>
          </div>

          <a href="/credits" style={{ fontSize: 13, color: '#0EA5E9', display: 'inline-block', marginTop: 4 }}>View full credits & pricing breakdown →</a>
        </>}

        {/* API KEYS */}
        {tab === 'api-keys' && <>
          <h1 style={S.h2}>API Keys</h1>
          <p style={S.sub}>Use the Wyber AI API to build on top of our platform. Keep your keys secret.</p>

          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Your API Key</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#18181b', fontSize: 13, fontFamily: 'monospace', color: '#0EA5E9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {showKey ? apiKey : '•'.repeat(32)}
              </div>
              <button onClick={() => setShowKey(v => !v)} style={S.ghost}>{showKey ? 'Hide' : 'Show'}</button>
              <button onClick={() => { navigator.clipboard.writeText(apiKey) }} style={S.btn()}>Copy</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setApiKey('wai-' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10))} style={{ ...S.ghost, fontSize: 12 }}>Regenerate key</button>
            </div>
            <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: '#f59e0b' }}>
              ⚠️ Never share your API key publicly or commit it to git. Treat it like a password.
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Usage this month</div>
            <div style={{ fontSize: 12, color: '#71717a', marginBottom: 12 }}>API calls count toward your credit balance at 1 credit per call.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[['API Calls', '0'], ['Credits Used', '0'], ['Errors', '0']].map(([l, v]) => (
                <div key={l} style={{ padding: '12px', background: '#18181b', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700 }}>{v}</div>
                  <div style={{ fontSize: 11, color: '#52525b', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </>}

        {/* GITHUB */}
        {tab === 'github' && <>
          <h1 style={S.h2}>GitHub</h1>
          <p style={S.sub}>Connect your GitHub account to sync and push generated code to your repositories.</p>

          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: githubConnected ? 16 : 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>⌥</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                  {githubConnected ? '✓ GitHub Connected' : 'Connect GitHub'}
                </div>
                <div style={{ fontSize: 12, color: '#71717a' }}>
                  {githubConnected ? 'Your account is linked. Projects sync automatically.' : 'Link your GitHub to push generated code and create repos automatically.'}
                </div>
              </div>
              {githubConnected
                ? <button style={{ ...S.ghost, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', fontSize: 12 }}>Disconnect</button>
                : <a href="/api/auth/github" style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#fafafa', color: '#000', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Connect GitHub</a>
              }
            </div>
            {githubConnected && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 12, color: '#22c55e' }}>
                ✓ GitHub is connected. Use the GitHub button in the editor to push your apps to any repository.
              </div>
            )}
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>What GitHub sync does</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Creates a new repo automatically named after your project', 'Pushes all generated files on every deploy', 'Keeps your code backed up and version controlled', 'Lets you clone and run locally with one command'].map(f => (
                <div key={f} style={{ fontSize: 13, color: '#a1a1aa', display: 'flex', gap: 8 }}><span style={{ color: '#0EA5E9' }}>✓</span>{f}</div>
              ))}
            </div>
          </div>
        </>}

        {/* NOTIFICATIONS */}
        {tab === 'notifications' && <>
          <h1 style={S.h2}>Notifications</h1>
          <p style={S.sub}>Choose what you want to be notified about.</p>

          <div style={S.card}>
            {[
              { id: 'email', label: 'Email notifications', desc: 'Receive updates about your account via email' },
              { id: 'credits', label: 'Low credit alerts', desc: 'Get notified when you have fewer than 20 credits left' },
              { id: 'deploy', label: 'Deploy notifications', desc: 'Get notified when your app deployments complete' },
            ].map(({ id, label, desc }) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#71717a' }}>{desc}</div>
                </div>
                <button
                  onClick={() => setNotifications(n => ({ ...n, [id]: !n[id as keyof typeof n] }))}
                  style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: notifications[id as keyof typeof notifications] ? '#0EA5E9' : '#27272a', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
                >
                  <div style={{ position: 'absolute', top: 2, left: notifications[id as keyof typeof notifications] ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </button>
              </div>
            ))}
          </div>
        </>}

        {/* SECRETS VAULT */}
        {tab === 'secrets' && <>
          <h1 style={S.h2}>Secrets Vault</h1>
          <p style={S.sub}>Store API keys and OAuth tokens your agents and workflows use at runtime. Values are AES-256-GCM encrypted at rest and never sent to the client in plaintext.</p>

          {/* Add secret form */}
          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e4e4e7', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Add a secret
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={S.label}>Name (e.g. OPENAI_API_KEY)</label>
                <input
                  value={secretName}
                  onChange={e => setSecretName(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  placeholder="MY_API_KEY"
                  style={{ ...S.input, fontFamily: 'monospace', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={S.label}>Value</label>
                <input
                  type="password"
                  value={secretValue}
                  onChange={e => setSecretValue(e.target.value)}
                  placeholder="sk-..."
                  style={{ ...S.input, fontFamily: 'monospace', fontSize: 13 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={addSecret}
                disabled={secretSaving}
                style={{ ...S.btn(), opacity: secretSaving ? 0.6 : 1 }}
              >
                {secretSaving ? 'Saving...' : 'Save secret'}
              </button>
              {secretError && <span style={{ fontSize: 12, color: '#ef4444' }}>{secretError}</span>}
              {secretSuccess && <span style={{ fontSize: 12, color: '#22c55e' }}>{secretSuccess}</span>}
            </div>
          </div>

          {/* Secrets list */}
          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e4e4e7', marginBottom: 14 }}>
              Stored secrets {secretsLoaded && <span style={{ fontSize: 11, fontWeight: 400, color: '#52525b', marginLeft: 6 }}>({secrets.length})</span>}
            </div>

            {!secretsLoaded && (
              <div style={{ fontSize: 13, color: '#52525b', padding: '8px 0' }}>Loading...</div>
            )}

            {secretsLoaded && secrets.length === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 10px' }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <div style={{ fontSize: 13, color: '#52525b' }}>No secrets yet. Add your first API key above.</div>
              </div>
            )}

            {secrets.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7', fontFamily: 'monospace' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#52525b', fontFamily: 'monospace', marginTop: 1 }}>{s.preview}</div>
                </div>
                <div style={{ fontSize: 11, color: '#3f3f46', flexShrink: 0 }}>
                  {new Date(s.created_at).toLocaleDateString()}
                </div>
                <button
                  onClick={() => deleteSecret(s.name)}
                  style={{ background: 'none', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', padding: '3px 8px', fontSize: 11, fontWeight: 600, flexShrink: 0 }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.12)', fontSize: 12, color: '#52525b', lineHeight: 1.6 }}>
            <span style={{ color: '#0EA5E9', fontWeight: 700 }}>How it works:</span> Values are encrypted with AES-256-GCM before storage. The API returns name and a masked preview only. Agent and workflow routes access plaintext server-side via <code style={{ fontFamily: 'monospace', color: '#a1a1aa' }}>getDecryptedSecret(userId, name)</code>.
          </div>
        </>}

        {/* DANGER ZONE */}
        {tab === 'danger' && <>
          <h1 style={{ ...S.h2, color: '#ef4444' }}>Danger Zone</h1>
          <p style={S.sub}>Irreversible actions. Please read carefully before proceeding.</p>

          <div style={{ ...S.card, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Delete all projects</div>
            <div style={{ fontSize: 13, color: '#71717a', marginBottom: 14 }}>Permanently delete all your projects and generated code. This cannot be undone.</div>
            <button style={{ ...S.btn('#ef4444'), fontSize: 12 }}>Delete all projects</button>
          </div>

          <div style={{ ...S.card, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Delete account</div>
            <div style={{ fontSize: 13, color: '#71717a', marginBottom: 14 }}>Permanently delete your Wyber AI account and all associated data. This cannot be undone.</div>
            <label style={S.label}>Type your email to confirm</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder={profile?.email || 'your@email.com'} style={{ ...S.input, flex: 1 }} />
              <button
                disabled={deleteConfirm !== profile?.email}
                style={{ ...S.btn('#ef4444'), opacity: deleteConfirm !== profile?.email ? 0.4 : 1, cursor: deleteConfirm !== profile?.email ? 'not-allowed' : 'pointer' }}
              >
                Delete account
              </button>
            </div>
          </div>
        </>}
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  );
}

