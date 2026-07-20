'use client'
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { MODEL_META, MODEL_MULTIPLIERS, estimateCost, tierAllowedForPlan, type ModelTier } from '@/lib/credits';
import { WyberLogo } from '@/components/shared/WyberLogo';
import { PLAN_FACTS, creditsLine } from '@/lib/plans';
import { TwoFactorPanel } from '@/components/settings/TwoFactorPanel';
import { useT } from '@/lib/i18n/useT';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { COMMON_STRINGS } from '@/lib/i18n/dict/common';
import { SETTINGS_STRINGS } from '@/lib/i18n/dict/settings';
import { LOCALES, LOCALE_LABEL, isLocale, type Locale } from '@/lib/i18n/locales';
import { AutoTranslateNotice } from '@/components/shared/AutoTranslateNotice';

type Tab = 'profile' | 'billing' | 'models' | 'api-keys' | 'secrets' | 'integrations' | 'github' | 'notifications' | 'security' | 'danger';

const TAB_META: { id: Tab; labelKey: keyof typeof SETTINGS_STRINGS['en']; icon: string }[] = [
  { id: 'profile',       labelKey: 'profileTab',       icon: '👤' },
  { id: 'billing',       labelKey: 'billingTab',       icon: '💳' },
  { id: 'models',        labelKey: 'modelsTab',        icon: '⚡' },
  { id: 'api-keys',      labelKey: 'apiKeysTab',       icon: '🔑' },
  { id: 'secrets',       labelKey: 'secretsTab',       icon: '🔐' },
  { id: 'integrations',  labelKey: 'integrationsTab',  icon: '🔌' },
  { id: 'github',        labelKey: 'githubTab',        icon: '⌥' },
  { id: 'notifications', labelKey: 'notificationsTab', icon: '🔔' },
  { id: 'security',      labelKey: 'securityTab',      icon: '🛡️' },
  { id: 'danger',        labelKey: 'dangerTab',        icon: '⚠️' },
];

// Prices/credits/colors come from the canonical PLAN_FACTS (lib/plans.ts);
// only the marketing bullet KEYS are local to this page (translated at render).
const PLANS = ([
  ['free',    ['threeProjects', 'communitySupport']],
  ['starter', ['unlimitedProjects', 'communitySupport']],
  ['builder', ['supabaseCustomDomains', 'prioritySupport']],
  ['pro',     ['multiUserOrgs', 'prioritySupportSlack']],
] as const).map(([id, extraKeys]) => {
  const f = PLAN_FACTS[id];
  return {
    id: f.id, name: f.name,
    price: f.monthlyPrice === null ? '$0' : `$${f.monthlyPrice}`,
    credits: f.credits, color: f.color,
    extraKeys, creditsLine: creditsLine(f.id),
  };
});

interface Connection { id: string; toolkit: string; status: string; authScheme: string; connectedAt: string }

function CreditHistory() {
  const t = useT(SETTINGS_STRINGS);
  const tc = useT(COMMON_STRINGS);
  const [history, setHistory] = useState<{ id: string; amount: number; reason: string; credits_before: number; credits_after: number; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/credits/deduct')
      .then(r => r.json())
      .then(d => {
        if (d.history) setHistory(d.history)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const reasonLabels: Record<string, string> = {
    'web-build': t('reasonWebBuild'),
    'mobile-build': t('reasonMobileBuild'),
    'small-edit': t('reasonSmallEdit'),
    'agent-run': t('reasonAgentRun'),
    'ai-employee-run': t('reasonAiEmployeeRun'),
    'agent-execution': t('reasonAgentExecution'),
    'canvas-execution': t('reasonCanvasExecution'),
    'execution': t('reasonExecution'),
    'employee-run': t('reasonEmployeeRun'),
    'image-gen': t('reasonImageGen'),
    'gtm-icp-sequence': t('reasonGtmIcpSequence'),
    'gtm-lead-enrich': t('reasonGtmLeadEnrich'),
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{t('creditHistoryTitle')}</div>
      {loading ? (
        <div style={{ fontSize: 12, color: '#52525b' }}>{tc('loading')}</div>
      ) : history.length === 0 ? (
        <div style={{ fontSize: 12, color: '#52525b', padding: '16px 0' }}>{t('noCreditUsageYet')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {history.slice(0, 20).map((h, i) => (
            <div key={h.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#111113', borderRadius: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{reasonLabels[h.reason] || h.reason}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>-{h.amount}</span>
                <span style={{ color: '#52525b', fontSize: 10 }}>{new Date(h.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function IntegrationsTab() {
  const t = useT(SETTINGS_STRINGS);
  const tc = useT(COMMON_STRINGS);
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/composio/connections')
      .then(r => r.json())
      .then(d => { setConnections(d.connections ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'composio_oauth_result' && e.data.success) load()
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const handleConnect = async (toolkit: string) => {
    setConnecting(toolkit)
    try {
      const res = await fetch(`/api/composio/connect?toolkit=${toolkit.toLowerCase()}`)
      const data = await res.json()
      if (!data.redirectUrl) { setConnecting(null); return }
      const popup = window.open(data.redirectUrl, 'composio_oauth', 'width=600,height=700,scrollbars=yes,resizable=yes')
      const check = setInterval(() => {
        if (popup?.closed) { clearInterval(check); setConnecting(null); setTimeout(load, 1500) }
      }, 500)
    } catch { setConnecting(null) }
  }

  const handleDisconnect = async (accountId: string) => {
    setDisconnecting(accountId)
    try {
      await fetch(`/api/composio/connections?accountId=${accountId}`, { method: 'DELETE' })
      setConnections(c => c.filter(x => x.id !== accountId))
    } catch {}
    setDisconnecting(null)
  }

  const POPULAR = ['gmail', 'slack', 'googlesheets', 'googledrive', 'notion', 'googlecalendar', 'github', 'hubspot', 'airtable', 'linear', 'jira', 'stripe']
  const DISPLAY_NAMES: Record<string, string> = {
    gmail: 'Gmail', slack: 'Slack', github: 'GitHub', notion: 'Notion',
    googlecalendar: 'Google Calendar', hubspot: 'HubSpot', airtable: 'Airtable',
    linear: 'Linear', jira: 'Jira', stripe: 'Stripe',
    googlesheets: 'Google Sheets', googledrive: 'Google Drive',
  }
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ slug: string; name: string }[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const t = setTimeout(() => {
      setSearching(true)
      fetch('/api/composio/toolkits?search=' + encodeURIComponent(searchQuery))
        .then(r => r.json())
        .then(d => { setSearchResults((d.toolkits ?? []).slice(0, 20).map((tk: { slug: string; name: string }) => ({ slug: tk.slug, name: tk.name }))); setSearching(false) })
        .catch(() => setSearching(false))
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const connectedSlugs = new Set(connections.filter(c => c.status === 'ACTIVE').map(c => c.toolkit))
  const suggestedUnconnected = POPULAR.filter(t => !connectedSlugs.has(t))

  const S = {
    row: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 6 } as const,
    badge: (active: boolean) => ({ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: active ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', color: active ? '#22c55e' : '#71717a', border: `1px solid ${active ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}` }) as const,
    btnSm: (danger?: boolean) => ({ padding: '5px 12px', borderRadius: 7, border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(14,165,233,0.3)'}`, background: danger ? 'rgba(239,68,68,0.05)' : 'rgba(14,165,233,0.08)', color: danger ? '#ef4444' : '#0EA5E9', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }) as const,
  }

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 4px' }}>{t('integrationsTitle')}</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>{t('integrationsSub')}</p>

      {/* Connected accounts */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{t('connectedCountLabel')} ({connections.filter(c => c.status === 'ACTIVE').length})</div>
        {loading ? (
          <div style={{ fontSize: 13, color: '#52525b' }}>{tc('loading')}</div>
        ) : connections.length === 0 ? (
          <div style={{ fontSize: 13, color: '#52525b', padding: '20px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>
            {t('noIntegrationsYet')}
          </div>
        ) : (
          connections.map(c => (
            <div key={c.id} style={S.row}>
              <img src={`https://img.logo.dev/${c.toolkit.replace('google', 'google')}.com?token=pk_X8nwEg6fR3yDYrGEOFKpkA`} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} style={{ width: 24, height: 24, borderRadius: 5, objectFit: 'contain' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>{DISPLAY_NAMES[c.toolkit] ?? c.toolkit}</div>
                <div style={{ fontSize: 11, color: '#52525b' }}>{c.authScheme} · Connected {new Date(c.connectedAt).toLocaleDateString()}</div>
              </div>
              <span style={S.badge(c.status === 'ACTIVE')}>{c.status}</span>
              <button
                onClick={() => handleDisconnect(c.id)}
                disabled={disconnecting === c.id}
                style={S.btnSm(true)}
              >{disconnecting === c.id ? t('disconnectingBtn') : t('disconnectBtn')}</button>
            </div>
          ))
        )}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('searchIntegrationsPlaceholder')}
          style={{ width: '100%', background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '10px 14px', color: '#f0f0f5', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>

      {searchQuery.trim() ? (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            {searching ? t('searchingLabel') : `${t('resultsCountLabel')} (${searchResults.length})`}
          </div>
          {searchResults.map(tk => (
            <div key={tk.slug} style={S.row}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>{tk.name}</div>
                <div style={{ fontSize: 11, color: '#52525b' }}>{connectedSlugs.has(tk.slug) ? `✓ ${t('connectedCountLabel')}` : t('notConnectedLabel')}</div>
              </div>
              {connectedSlugs.has(tk.slug)
                ? <span style={S.badge(true)}>ACTIVE</span>
                : <button onClick={() => handleConnect(tk.slug)} disabled={connecting === tk.slug} style={S.btnSm()}>{connecting === tk.slug ? t('connectingBtn') : t('connectBtn')}</button>
              }
            </div>
          ))}
          {!searching && searchResults.length === 0 && <div style={{ fontSize: 13, color: '#52525b', textAlign: 'center', padding: 20 }}>{t('noResultsForPrefix')} "{searchQuery}"</div>}
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{t('popularIntegrationsLabel')}</div>
          {suggestedUnconnected.map(slug => (
            <div key={slug} style={S.row}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>{DISPLAY_NAMES[slug] ?? slug}</div>
                <div style={{ fontSize: 11, color: '#52525b' }}>{t('notConnectedLabel')}</div>
              </div>
              <button
                onClick={() => handleConnect(slug)}
                disabled={connecting === slug}
                style={S.btnSm()}
              >{connecting === slug ? t('connectingBtn') : t('connectBtn')}</button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default function SettingsPage({ isIndia }: { isIndia?: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const t = useT(SETTINGS_STRINGS);
  const tc = useT(COMMON_STRINGS);
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab') as Tab | null
      if (p && ['profile','billing','models','api-keys','secrets','integrations','github','notifications','security','danger'].includes(p)) return p
    }
    return 'profile'
  });
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
  const [recentSpend, setRecentSpend] = useState<{ reason: string; amount: number; created_at: string }[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        setProfile({ ...data, email: user.email });
        setName(data?.full_name ?? user.email?.split('@')[0] ?? '');
        setLoading(false);
        // profiles.preferred_locale is the cross-device source of truth for a
        // logged-in user — reconcile it into the shared context/cookie once
        // it loads (a no-op if it already matches what the cookie resolved).
        if (data?.preferred_locale && isLocale(data.preferred_locale) && data.preferred_locale !== locale) {
          setLocale(data.preferred_locale);
        }
      });
      // Check GitHub connection
      supabase.from('github_connections').select('github_username').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setGithubConnected(true); });
      // Pre-load secrets so the tab feels instant
      fetch('/api/secrets').then(r => r.json()).then(d => { if (d.secrets) { setSecrets(d.secrets); setSecretsLoaded(true); } });
      // Load recent credit spend
      supabase.from('credit_usage').select('reason, amount, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
        .then(({ data }) => { if (data) setRecentSpend(data); });
    });
    // Generate fake API key for display
    setApiKey('wai-' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: name }).eq('id', profile.id);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const changeLocale = async (l: Locale) => {
    setLocale(l);
    if (profile?.id) await supabase.from('profiles').update({ preferred_locale: l }).eq('id', profile.id);
  };

  const signOut = async () => { await supabase.auth.signOut(); router.push('/'); };

  const loadSecrets = async () => {
    const res = await fetch('/api/secrets');
    const data = await res.json();
    if (data.secrets) { setSecrets(data.secrets); setSecretsLoaded(true); }
  };

  const addSecret = async () => {
    if (!secretName.trim() || !secretValue.trim()) { setSecretError(t('secretsBothRequired')); return; }
    setSecretSaving(true); setSecretError(''); setSecretSuccess('');
    const res = await fetch('/api/secrets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: secretName, value: secretValue }) });
    const data = await res.json();
    setSecretSaving(false);
    if (data.error) { setSecretError(data.error); return; }
    setSecretName(''); setSecretValue('');
    setSecretSuccess(`${data.name} ${t('secretSavedSuffix')}`); setTimeout(() => setSecretSuccess(''), 2500);
    loadSecrets();
  };

  const deleteSecret = async (name: string) => {
    await fetch('/api/secrets', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    setSecrets(s => s.filter(x => x.name !== name));
  };

  const S = {
    page: { minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: 'var(--font-display)', display: 'flex' as const },
    sidebar: { width: 220, borderRight: '1px solid rgba(255,255,255,0.07)', padding: '24px 12px', flexShrink: 0 as const, display: 'flex' as const, flexDirection: 'column' as const },
    main: { flex: 1, padding: '32px 48px', maxWidth: 680 },
    tabBtn: (active: boolean) => ({ display: 'flex' as const, alignItems: 'center' as const, gap: 10, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: active ? 'rgba(14,165,233,0.1)' : 'transparent', color: active ? '#0EA5E9' : '#a1a1aa', fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s', fontFamily: 'inherit', marginBottom: 2 }),
    card: { background: '#111113', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20, marginBottom: 16 },
    label: { fontSize: 11, fontWeight: 700, color: '#52525b', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6, display: 'block' as const },
    input: { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#18181b', color: '#fafafa', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const },
    btn: (color = '#0EA5E9') => ({ padding: '9px 20px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s' }),
    ghost: { padding: '9px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#a1a1aa', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
    h2: { fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 },
    sub: { fontSize: 13, color: '#71717a', marginBottom: 24, lineHeight: 1.5 },
    row: { display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  };

  if (loading) return <div style={{ ...S.page, alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#52525b' }}>{tc('loading')}</div>;

  return (
    <div style={S.page}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 32, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={24} wordmarkSize={14} />
        </a>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '0 12px' }}>{tc('settings')}</div>
        {TAB_META.map(tm => (
          <button key={tm.id} onClick={() => setTab(tm.id)} style={{ ...S.tabBtn(tab === tm.id), color: tm.id === 'danger' ? (tab === tm.id ? '#ef4444' : '#71717a') : undefined }}>
            <span style={{ fontSize: 14 }}>{tm.icon}</span>{t(tm.labelKey)}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={signOut} style={{ ...S.ghost, width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>↩</span> {tc('signOut')}
        </button>
      </div>

      {/* Main */}
      <div style={S.main}>

        {/* PROFILE */}
        {tab === 'profile' && <>
          <h1 style={S.h2}>{t('profileTitle')}</h1>
          <p style={S.sub}>{t('profileSub')}</p>

          <div style={S.card}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #0EA5E9, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(name || profile?.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{name || t('profileNameFallback')}</div>
                <div style={{ fontSize: 13, color: '#71717a' }}>{profile?.email}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', color: '#0EA5E9' }}>
                  {(profile?.plan || 'free').toUpperCase()} {t('planWord')} · {profile?.credits ?? 0} {t('creditsLeftSuffix')}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={S.label}>{t('fullNameLabel')}</label>
                <input value={name} onChange={e => setName(e.target.value)} style={S.input} placeholder={t('fullNameInputPlaceholder')} />
              </div>
              <div>
                <label style={S.label}>{t('emailAddressLabel')}</label>
                <input value={profile?.email || ''} disabled style={{ ...S.input, opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
            </div>
            <button onClick={saveProfile} disabled={saving} style={S.btn()}>
              {saved ? `✓ ${tc('saved')}` : saving ? tc('saving') : tc('saveChanges')}
            </button>
          </div>

          <div style={S.card}>
            <div style={{ ...S.row, marginBottom: 0 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{t('appearanceTitle')}</div>
                <div style={{ fontSize: 12, color: '#71717a' }}>{t('appearanceDesc')}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#fafafa', fontSize: 12, fontFamily: 'inherit' }}>{t('appearanceDarkPill')}</span>
              </div>
            </div>
          </div>

          {/* Language — gated to India/INR users, same signal the homepage toggle uses */}
          {isIndia && (
            <div style={S.card}>
              <div style={{ ...S.row, marginBottom: 0 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{t('languageTitle')}</div>
                  <div style={{ fontSize: 12, color: '#71717a' }}>{t('languageDesc')}</div>
                </div>
                <select
                  value={locale}
                  onChange={e => changeLocale(e.target.value as Locale)}
                  style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: '#18181b', color: '#fafafa', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                >
                  {LOCALES.map(l => <option key={l} value={l}>{LOCALE_LABEL[l]}</option>)}
                </select>
              </div>
              <AutoTranslateNotice style={{ marginTop: 12 }} />
            </div>
          )}
        </>}

        {/* BILLING */}
        {tab === 'billing' && <>
          <h1 style={S.h2}>{t('billingTitle')}</h1>
          <p style={S.sub}>{t('billingSub')}</p>

          {/* Current plan */}
          <div style={{ ...S.card, border: '1px solid rgba(14,165,233,0.3)', background: 'rgba(14,165,233,0.04)', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{t('currentPlanLabel')}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>{PLANS.find(p => p.id === (profile?.plan || 'free'))?.name || 'Free'}</div>
                <div style={{ fontSize: 13, color: '#71717a', marginTop: 2 }}>
                  <span style={{ color: '#0EA5E9', fontWeight: 700 }}>{profile?.credits ?? 0} {t('creditsWord')}</span> {t('remainingThisMonth')}
                </div>
              </div>
              <a href="/pricing" style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>{t('upgradePlanBtn')}</a>
            </div>
            {/* Credit bar */}
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#52525b', marginBottom: 5 }}>
                <span>{t('creditsUsedThisMonth')}</span>
                <span>{Math.max(0, (PLANS.find(p => p.id === (profile?.plan || 'free'))?.credits || 50) - (profile?.credits || 0))} / {PLANS.find(p => p.id === (profile?.plan || 'free'))?.credits || 50}</span>
              </div>
              <div style={{ height: 6, borderRadius: 9999, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ height: '100%', borderRadius: 9999, background: '#0EA5E9', width: Math.min(100, ((PLANS.find(p => p.id === (profile?.plan || 'free'))?.credits || 50) - (profile?.credits || 0)) / (PLANS.find(p => p.id === (profile?.plan || 'free'))?.credits || 50) * 100) + '%', transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: 11, color: '#52525b', marginTop: 4 }}>{t('resetsOnFirst')}</div>
            </div>
          </div>

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {PLANS.map(p => (
              <div key={p.id} style={{ padding: 16, borderRadius: 10, background: '#111113', border: `1px solid ${p.id === (profile?.plan || 'free') ? p.color + '50' : 'rgba(255,255,255,0.07)'}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  {p.id === (profile?.plan || 'free') && '✓ '}{p.name}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{p.price}<span style={{ fontSize: 11, fontWeight: 400, color: '#52525b' }}>/mo</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 11, color: '#71717a', display: 'flex', gap: 6 }}><span style={{ color: p.color }}>✓</span>{p.creditsLine}</div>
                  {p.extraKeys.map(k => <div key={k} style={{ fontSize: 11, color: '#71717a', display: 'flex', gap: 6 }}><span style={{ color: p.color }}>✓</span>{t(k)}</div>)}
                </div>
                {p.id !== (profile?.plan || 'free') && (
                  <a href="/pricing" style={{ display: 'block', marginTop: 10, padding: '6px', borderRadius: 7, border: `1px solid ${p.color}40`, background: p.color + '12', color: p.color, fontSize: 12, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>{t('switchToPrefix')} {p.name}</a>
                )}
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={{ ...S.row }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{t('paymentMethodTitle')}</div>
                <div style={{ fontSize: 12, color: '#71717a' }}>{t('paymentMethodDesc')}</div>
              </div>
              <button style={S.ghost}>{t('manageBillingBtn')}</button>
            </div>
          </div>

          <a href="/credits" style={{ fontSize: 13, color: '#0EA5E9', display: 'inline-block', marginTop: 4, marginBottom: 20 }}>{t('viewFullCreditsLink')}</a>

          {/* Credit usage history */}
          <CreditHistory />
        </>}

        {/* MODELS & CREDITS */}
        {tab === 'models' && (() => {
          const plan = profile?.plan ?? 'free'
          const balance = profile?.credits ?? 0
          const tiers: ModelTier[] = ['fast', 'default', 'premium', 'fable']
          const POWER_BARS: Record<ModelTier, number> = { fast: 1, default: 2, premium: 3, fable: 4 }
          const ACTION_ROWS: { labelKey: keyof typeof SETTINGS_STRINGS['en']; hint: Parameters<typeof estimateCost>[1] }[] = [
            { labelKey: 'actionQuickEdit', hint: 'edit' },
            { labelKey: 'actionComponentBuild', hint: 'component' },
            { labelKey: 'actionFullWebBuild', hint: 'build' },
            { labelKey: 'actionMobileBuild', hint: 'mobile' },
            { labelKey: 'actionImageGen', hint: 'image' },
            { labelKey: 'actionCanvasExecution', hint: 'run' },
          ]
          return <>
            <h1 style={S.h2}>{t('modelsTitle')}</h1>
            <p style={S.sub}>{t('modelsSub')}</p>

            {/* Balance card */}
            <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t('currentBalanceLabel')}</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: balance < 10 ? '#ef4444' : '#0EA5E9', letterSpacing: '-0.03em', lineHeight: 1 }}>{balance}</div>
                <div style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>{t('creditsRemainingWord')}</div>
              </div>
              <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 24 }}>
                <div style={{ fontSize: 12, color: '#71717a', marginBottom: 6 }}>{t('recentSpendLabel')}</div>
                {recentSpend.length === 0
                  ? <div style={{ fontSize: 12, color: '#3f3f46' }}>{t('noRecentActivity')}</div>
                  : recentSpend.map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#a1a1aa', marginBottom: 3 }}>
                      <span style={{ textTransform: 'capitalize' }}>{row.reason.replace(/-/g, ' ')}</span>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>−{row.amount} cr</span>
                    </div>
                  ))
                }
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 24 }}>
                <div style={{ fontSize: 12, color: '#71717a', marginBottom: 6 }}>{t('planLabelWord')}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa', textTransform: 'capitalize' }}>{plan}</div>
                <a href="/pricing" style={{ fontSize: 11, color: '#0EA5E9', display: 'block', marginTop: 4, textDecoration: 'none' }}>{t('upgradeArrow')}</a>
              </div>
            </div>

            {/* Model cards */}
            <div style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 12 }}>{t('availableModelsLabel')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 28 }}>
              {tiers.map(tier => {
                const meta = MODEL_META[tier]
                const allowed = tierAllowedForPlan(tier, plan)
                const bars = POWER_BARS[tier]
                return (
                  <div key={tier} style={{ background: '#111113', border: `1px solid ${allowed ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: '16px', opacity: allowed ? 1 : 0.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: allowed ? '#fafafa' : '#71717a' }}>{meta.label}</div>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {[1,2,3,4].map(b => (
                          <div key={b} style={{ width: 5, height: 14, borderRadius: 2, background: b <= bars ? (allowed ? '#0EA5E9' : '#3f3f46') : 'rgba(255,255,255,0.06)' }} />
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#71717a', marginBottom: 10, lineHeight: 1.4 }}>{meta.tagline}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8, display: 'inline-block',
                      background: allowed ? 'rgba(14,165,233,0.1)' : 'rgba(255,255,255,0.04)',
                      color: allowed ? '#0EA5E9' : '#52525b',
                      border: `1px solid ${allowed ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                      {allowed ? `×${MODEL_MULTIPLIERS[tier]} ${t('multiplierWord')}` : `${meta.minPlan} ${t('planRequiredSuffix')}`}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Credit cost table */}
            <div style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 12 }}>{t('estimatedCreditCostsLabel')}</div>
            <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#52525b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <div>{t('actionColumnHeader')}</div>
                <div style={{ textAlign: 'center' }}>{t('tierFast')}</div>
                <div style={{ textAlign: 'center' }}>{t('tierStandard')}</div>
                <div style={{ textAlign: 'center' }}>{t('tierPremium')}</div>
                <div style={{ textAlign: 'center' }}>{t('tierFable')}</div>
              </div>
              {ACTION_ROWS.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 16px', borderBottom: i < ACTION_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', fontSize: 12 }}>
                  <div style={{ color: '#a1a1aa' }}>{t(row.labelKey)}</div>
                  {tiers.map(tier => (
                    <div key={tier} style={{ textAlign: 'center', color: tierAllowedForPlan(tier, plan) ? '#fafafa' : '#3f3f46', fontWeight: 500 }}>
                      {estimateCost(tier, row.hint)} cr
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: '#52525b' }}>
              {t('creditsFootnote')}
            </div>
          </>
        })()}

        {/* API KEYS */}
        {tab === 'api-keys' && <>
          <h1 style={S.h2}>{t('apiKeysTitle')}</h1>
          <p style={S.sub}>{t('apiKeysSub')}</p>

          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{t('yourApiKeyLabel')}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#18181b', fontSize: 13, fontFamily: 'monospace', color: '#0EA5E9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {showKey ? apiKey : '•'.repeat(32)}
              </div>
              <button onClick={() => setShowKey(v => !v)} style={S.ghost}>{showKey ? t('hideLabel') : t('showLabel')}</button>
              <button onClick={() => { navigator.clipboard.writeText(apiKey) }} style={S.btn()}>{tc('copy')}</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setApiKey('wai-' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10))} style={{ ...S.ghost, fontSize: 12 }}>{t('regenerateKeyBtn')}</button>
            </div>
            <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: '#f59e0b' }}>
              {t('apiKeyWarning')}
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t('usageThisMonthTitle')}</div>
            <div style={{ fontSize: 12, color: '#71717a', marginBottom: 12 }}>{t('usageThisMonthDesc')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[[t('apiCallsLabel'), '0'], [t('creditsUsedLabel'), '0'], [t('errorsLabel'), '0']].map(([l, v]) => (
                <div key={l} style={{ padding: '12px', background: '#18181b', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>{v}</div>
                  <div style={{ fontSize: 11, color: '#52525b', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </>}

        {/* GITHUB */}
        {tab === 'github' && <>
          <h1 style={S.h2}>{t('githubTitle')}</h1>
          <p style={S.sub}>{t('githubSub')}</p>

          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: githubConnected ? 16 : 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>⌥</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                  {githubConnected ? t('githubConnectedTitle') : t('githubConnectTitle')}
                </div>
                <div style={{ fontSize: 12, color: '#71717a' }}>
                  {githubConnected ? t('githubConnectedDesc') : t('githubNotConnectedDesc')}
                </div>
              </div>
              {githubConnected
                ? <button style={{ ...S.ghost, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', fontSize: 12 }}>{t('disconnectBtn')}</button>
                : <a href="/api/auth/github" style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#fafafa', color: '#000', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>{t('connectGithubBtn')}</a>
              }
            </div>
            {githubConnected && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 12, color: '#22c55e' }}>
                {t('githubConnectedBanner')}
              </div>
            )}
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{t('githubSyncFeaturesTitle')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {([t('githubFeature1'), t('githubFeature2'), t('githubFeature3'), t('githubFeature4')]).map(f => (
                <div key={f} style={{ fontSize: 13, color: '#a1a1aa', display: 'flex', gap: 8 }}><span style={{ color: '#0EA5E9' }}>✓</span>{f}</div>
              ))}
            </div>
          </div>
        </>}

        {/* NOTIFICATIONS */}
        {tab === 'notifications' && <>
          <h1 style={S.h2}>{t('notificationsTitle')}</h1>
          <p style={S.sub}>{t('notificationsSub')}</p>

          <div style={S.card}>
            {[
              { id: 'email', label: t('notifyEmailLabel'), desc: t('notifyEmailDesc') },
              { id: 'credits', label: t('notifyCreditsLabel'), desc: t('notifyCreditsDesc') },
              { id: 'deploy', label: t('notifyDeployLabel'), desc: t('notifyDeployDesc') },
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
          <h1 style={S.h2}>{t('secretsTitle')}</h1>
          <p style={S.sub}>{t('secretsSub')}</p>

          {/* Add secret form */}
          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e4e4e7', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              {t('addSecretTitle')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={S.label}>{t('secretNameLabel')}</label>
                <input
                  value={secretName}
                  onChange={e => setSecretName(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  placeholder="MY_API_KEY"
                  style={{ ...S.input, fontFamily: 'monospace', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={S.label}>{t('secretValueLabel')}</label>
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
                {secretSaving ? tc('saving') : t('saveSecretBtn')}
              </button>
              {secretError && <span style={{ fontSize: 12, color: '#ef4444' }}>{secretError}</span>}
              {secretSuccess && <span style={{ fontSize: 12, color: '#22c55e' }}>{secretSuccess}</span>}
            </div>
          </div>

          {/* Secrets list */}
          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e4e4e7', marginBottom: 14 }}>
              {t('storedSecretsTitle')} {secretsLoaded && <span style={{ fontSize: 11, fontWeight: 400, color: '#52525b', marginLeft: 6 }}>({secrets.length})</span>}
            </div>

            {!secretsLoaded && (
              <div style={{ fontSize: 13, color: '#52525b', padding: '8px 0' }}>{tc('loading')}</div>
            )}

            {secretsLoaded && secrets.length === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 10px' }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <div style={{ fontSize: 13, color: '#52525b' }}>{t('noSecretsYet')}</div>
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
                  {tc('delete')}
                </button>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.12)', fontSize: 12, color: '#52525b', lineHeight: 1.6 }}>
            <span style={{ color: '#0EA5E9', fontWeight: 700 }}>{t('secretsHowItWorksLabel')}</span> {t('secretsHowItWorksDesc')} <code style={{ fontFamily: 'monospace', color: '#a1a1aa' }}>getDecryptedSecret(userId, name)</code>.
          </div>
        </>}

        {/* INTEGRATIONS */}
        {tab === 'integrations' && <IntegrationsTab />}

        {/* SECURITY */}
        {tab === 'security' && <TwoFactorPanel />}

        {/* DANGER ZONE */}
        {tab === 'danger' && <>
          <h1 style={{ ...S.h2, color: '#ef4444' }}>{t('dangerTitle')}</h1>
          <p style={S.sub}>{t('dangerSub')}</p>

          <div style={{ ...S.card, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t('deleteAllProjectsTitle')}</div>
            <div style={{ fontSize: 13, color: '#71717a', marginBottom: 14 }}>{t('deleteAllProjectsDesc')}</div>
            <button style={{ ...S.btn('#ef4444'), fontSize: 12 }}>{t('deleteAllProjectsBtn')}</button>
          </div>

          <div style={{ ...S.card, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t('deleteAccountTitle')}</div>
            <div style={{ fontSize: 13, color: '#71717a', marginBottom: 14 }}>{t('deleteAccountDesc')}</div>
            <label style={S.label}>{t('typeEmailToConfirm')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder={profile?.email || 'your@email.com'} style={{ ...S.input, flex: 1 }} />
              <button
                disabled={deleteConfirm !== profile?.email}
                style={{ ...S.btn('#ef4444'), opacity: deleteConfirm !== profile?.email ? 0.4 : 1, cursor: deleteConfirm !== profile?.email ? 'not-allowed' : 'pointer' }}
              >
                {t('deleteAccountBtn')}
              </button>
            </div>
          </div>
        </>}
      </div>

    </div>
  );
}
