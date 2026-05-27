'use client';
import { useState } from 'react';

interface Connector {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  keyLabel: string;
  keyPlaceholder: string;
  docsUrl: string;
  category: string;
}

const CONNECTORS: Connector[] = [
  { id: 'airtable', name: 'Airtable', description: 'Use Airtable bases as your app database', icon: '⬡', color: '#F59E0B', keyLabel: 'API Key', keyPlaceholder: 'patXXX...', docsUrl: 'https://airtable.com/create/tokens', category: 'Data' },
  { id: 'notion', name: 'Notion', description: 'Read and write Notion pages and databases', icon: '◈', color: '#000', keyLabel: 'Integration Token', keyPlaceholder: 'secret_XXX...', docsUrl: 'https://www.notion.so/profile/integrations', category: 'Data' },
  { id: 'hubspot', name: 'HubSpot', description: 'CRM contacts, deals, and pipelines', icon: '◎', color: '#FF7A59', keyLabel: 'Private App Token', keyPlaceholder: 'pat-na1-XXX...', docsUrl: 'https://developers.hubspot.com', category: 'CRM' },
  { id: 'slack', name: 'Slack', description: 'Send messages and read channels', icon: '⬢', color: '#4A154B', keyLabel: 'Bot Token', keyPlaceholder: 'xoxb-XXX...', docsUrl: 'https://api.slack.com/apps', category: 'Communication' },
  { id: 'resend', name: 'Resend', description: 'Send transactional emails from your app', icon: '✉', color: '#0EA5E9', keyLabel: 'API Key', keyPlaceholder: 're_XXX...', docsUrl: 'https://resend.com/api-keys', category: 'Communication' },
  { id: 'stripe', name: 'Stripe', description: 'Accept payments and subscriptions', icon: '💳', color: '#635BFF', keyLabel: 'Secret Key', keyPlaceholder: 'sk_live_XXX...', docsUrl: 'https://dashboard.stripe.com/apikeys', category: 'Payments' },
  { id: 'openai', name: 'OpenAI', description: 'Add AI features: chat, completions, embeddings', icon: '✦', color: '#10A37F', keyLabel: 'API Key', keyPlaceholder: 'sk-XXX...', docsUrl: 'https://platform.openai.com/api-keys', category: 'AI' },
  { id: 'supabase', name: 'Supabase', description: 'Full Postgres database, auth, storage', icon: '⚡', color: '#3ECF8E', keyLabel: 'Service Role Key', keyPlaceholder: 'eyJXXX...', docsUrl: 'https://supabase.com/dashboard', category: 'Data' },
  { id: 'google_maps', name: 'Google Maps', description: 'Maps, geocoding, places, routes', icon: '📍', color: '#4285F4', keyLabel: 'API Key', keyPlaceholder: 'AIzaXXX...', docsUrl: 'https://console.cloud.google.com', category: 'Location' },
  { id: 'mailgun', name: 'Mailgun', description: 'Transactional email with analytics', icon: '📬', color: '#F06B0E', keyLabel: 'API Key', keyPlaceholder: 'key-XXX...', docsUrl: 'https://app.mailgun.com', category: 'Communication' },
];

const CATEGORIES = ['All', 'Data', 'CRM', 'Communication', 'Payments', 'AI', 'Location'];

interface Props { projectId: string; }

export function ConnectorsPanel({ projectId }: Props) {
  const [category, setCategory] = useState('All');
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const filtered = category === 'All' ? CONNECTORS : CONNECTORS.filter(c => c.category === category);

  const connect = async (connector: Connector) => {
    const key = keys[connector.id];
    if (!key?.trim()) return;
    setSaving(connector.id);
    try {
      await fetch('/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, service: connector.id, apiKey: key }),
      });
      setConnected(prev => new Set([...prev, connector.id]));
      setConnecting(null);
    } catch {}
    setSaving(null);
  };

  const disconnect = async (id: string) => {
    await fetch('/api/connectors', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, service: id }) });
    setConnected(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>App Connectors</div>
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Connect external services. API keys are encrypted and stored securely.</div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, border: `1px solid ${category === c ? 'var(--sky)' : 'var(--border)'}`, background: category === c ? 'var(--sky)' : 'transparent', color: category === c ? 'white' : 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: category === c ? 600 : 400 }}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {filtered.map(c => (
          <div key={c.id}>
            <div onClick={() => setConnecting(connecting === c.id ? null : c.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: connecting === c.id ? '9px 9px 0 0' : 9, border: `1px solid ${connecting === c.id ? 'var(--sky)' : 'var(--border)'}`, background: 'var(--bg2)', cursor: 'pointer' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{c.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{c.description}</div>
              </div>
              {connected.has(c.id)
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399' }} /><span style={{ fontSize: 10, color: '#34D399', fontWeight: 600 }}>Connected</span></div>
                : <span style={{ fontSize: 10, color: 'var(--sky)', fontWeight: 500 }}>Connect →</span>}
            </div>
            {connecting === c.id && !connected.has(c.id) && (
              <div style={{ padding: '10px', background: 'var(--bg2)', borderRadius: '0 0 9px 9px', border: '1px solid var(--sky)', borderTop: 'none' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>{c.keyLabel} — <a href={c.docsUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--sky)' }}>Get your key ↗</a></div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={keys[c.id] || ''} onChange={e => setKeys(prev => ({ ...prev, [c.id]: e.target.value }))} placeholder={c.keyPlaceholder} type="password"
                    style={{ flex: 1, padding: '6px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 11, fontFamily: 'monospace', outline: 'none' }} />
                  <button onClick={() => connect(c)} disabled={saving === c.id || !keys[c.id]?.trim()}
                    style={{ padding: '6px 12px', borderRadius: 7, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: !keys[c.id]?.trim() ? 0.5 : 1 }}>
                    {saving === c.id ? '...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
            {connecting === c.id && connected.has(c.id) && (
              <div style={{ padding: '8px 10px', background: 'var(--bg2)', borderRadius: '0 0 9px 9px', border: '1px solid var(--border)', borderTop: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>Connected and ready to use</span>
                <button onClick={() => disconnect(c.id)} style={{ fontSize: 10, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Disconnect</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}