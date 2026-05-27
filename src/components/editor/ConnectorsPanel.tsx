'use client';
import { useState } from 'react';

interface Connector {
  id: string; name: string; description: string; icon: string;
  color: string; keyLabel: string; keyPlaceholder: string; docsUrl: string; category: string;
}

const CONNECTORS: Connector[] = [
  { id: 'airtable', name: 'Airtable', description: 'Use Airtable bases as your app database', icon: '⬡', color: '#F59E0B', keyLabel: 'API Key', keyPlaceholder: 'patXXX...', docsUrl: 'https://airtable.com/create/tokens', category: 'Data' },
  { id: 'notion', name: 'Notion', description: 'Read and write Notion pages and databases', icon: '◈', color: '#000', keyLabel: 'Integration Token', keyPlaceholder: 'secret_XXX...', docsUrl: 'https://www.notion.so/profile/integrations', category: 'Data' },
  { id: 'supabase', name: 'Supabase', description: 'Full Postgres database, auth, storage', icon: '⚡', color: '#3ECF8E', keyLabel: 'Service Role Key', keyPlaceholder: 'eyJXXX...', docsUrl: 'https://supabase.com/dashboard', category: 'Data' },
  { id: 'bigquery', name: 'BigQuery', description: 'Query Google BigQuery datasets', icon: '◉', color: '#4285F4', keyLabel: 'Service Account JSON', keyPlaceholder: '{"type":"service_account"...}', docsUrl: 'https://console.cloud.google.com', category: 'Data' },
  { id: 'snowflake', name: 'Snowflake', description: 'Connect to Snowflake data warehouse', icon: '❄', color: '#29B5E8', keyLabel: 'Account Identifier', keyPlaceholder: 'org.snowflakecomputing.com', docsUrl: 'https://docs.snowflake.com', category: 'Data' },
  { id: 'mongodb', name: 'MongoDB', description: 'Connect to MongoDB Atlas collections', icon: '🍃', color: '#00ED64', keyLabel: 'Connection String', keyPlaceholder: 'mongodb+srv://...', docsUrl: 'https://www.mongodb.com/atlas', category: 'Data' },
  { id: 'contentful', name: 'Contentful', description: 'Fetch content from Contentful CMS', icon: '◫', color: '#2478CC', keyLabel: 'Delivery API Token', keyPlaceholder: 'XXX...', docsUrl: 'https://app.contentful.com', category: 'CMS' },
  { id: 'storyblok', name: 'Storyblok', description: 'Headless CMS stories and components', icon: '◧', color: '#00B3B0', keyLabel: 'Access Token', keyPlaceholder: 'XXX...', docsUrl: 'https://app.storyblok.com', category: 'CMS' },
  { id: 'sanity', name: 'Sanity', description: 'Structured content from Sanity Studio', icon: '◨', color: '#F03E2F', keyLabel: 'API Token', keyPlaceholder: 'skXXX...', docsUrl: 'https://sanity.io/manage', category: 'CMS' },
  { id: 'hubspot', name: 'HubSpot', description: 'CRM contacts, deals, and pipelines', icon: '◎', color: '#FF7A59', keyLabel: 'Private App Token', keyPlaceholder: 'pat-na1-XXX...', docsUrl: 'https://developers.hubspot.com', category: 'CRM' },
  { id: 'salesforce', name: 'Salesforce', description: 'CRM leads, opportunities, accounts', icon: '☁', color: '#00A1E0', keyLabel: 'Access Token', keyPlaceholder: 'XXX...', docsUrl: 'https://developer.salesforce.com', category: 'CRM' },
  { id: 'pipedrive', name: 'Pipedrive', description: 'Sales pipeline and deal management', icon: '◑', color: '#1A73E8', keyLabel: 'API Token', keyPlaceholder: 'XXX...', docsUrl: 'https://pipedrive.readme.io', category: 'CRM' },
  { id: 'slack', name: 'Slack', description: 'Send messages and read channels', icon: '⬢', color: '#4A154B', keyLabel: 'Bot Token', keyPlaceholder: 'xoxb-XXX...', docsUrl: 'https://api.slack.com/apps', category: 'Communication' },
  { id: 'resend', name: 'Resend', description: 'Send transactional emails', icon: '✉', color: '#0EA5E9', keyLabel: 'API Key', keyPlaceholder: 're_XXX...', docsUrl: 'https://resend.com/api-keys', category: 'Communication' },
  { id: 'mailgun', name: 'Mailgun', description: 'Transactional email with analytics', icon: '📬', color: '#F06B0E', keyLabel: 'API Key', keyPlaceholder: 'key-XXX...', docsUrl: 'https://app.mailgun.com', category: 'Communication' },
  { id: 'brevo', name: 'Brevo', description: 'Email marketing and SMS campaigns', icon: '◆', color: '#0092FF', keyLabel: 'API Key', keyPlaceholder: 'xkeysib-XXX...', docsUrl: 'https://app.brevo.com', category: 'Communication' },
  { id: 'twilio', name: 'Twilio', description: 'SMS, voice, and WhatsApp messaging', icon: '📱', color: '#F22F46', keyLabel: 'Auth Token', keyPlaceholder: 'XXX...', docsUrl: 'https://console.twilio.com', category: 'Communication' },
  { id: 'discord', name: 'Discord', description: 'Send messages to Discord channels', icon: '🎮', color: '#5865F2', keyLabel: 'Bot Token', keyPlaceholder: 'XXX...', docsUrl: 'https://discord.com/developers', category: 'Communication' },
  { id: 'stripe', name: 'Stripe', description: 'Accept payments and subscriptions', icon: '💳', color: '#635BFF', keyLabel: 'Secret Key', keyPlaceholder: 'sk_live_XXX...', docsUrl: 'https://dashboard.stripe.com/apikeys', category: 'Payments' },
  { id: 'paddle', name: 'Paddle', description: 'Payments and subscription billing', icon: '🏓', color: '#0FA46A', keyLabel: 'API Key', keyPlaceholder: 'XXX...', docsUrl: 'https://developer.paddle.com', category: 'Payments' },
  { id: 'openai', name: 'OpenAI', description: 'GPT-5, DALL-E, embeddings, Whisper', icon: '✦', color: '#10A37F', keyLabel: 'API Key', keyPlaceholder: 'sk-XXX...', docsUrl: 'https://platform.openai.com/api-keys', category: 'AI' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude AI for reasoning and generation', icon: '◎', color: '#D4A574', keyLabel: 'API Key', keyPlaceholder: 'sk-ant-XXX...', docsUrl: 'https://console.anthropic.com', category: 'AI' },
  { id: 'elevenlabs', name: 'ElevenLabs', description: 'AI voice generation and cloning', icon: '🎙', color: '#9333EA', keyLabel: 'API Key', keyPlaceholder: 'XXX...', docsUrl: 'https://elevenlabs.io', category: 'AI' },
  { id: 'perplexity', name: 'Perplexity', description: 'Real-time web search AI', icon: '🔎', color: '#20B2AA', keyLabel: 'API Key', keyPlaceholder: 'pplx-XXX...', docsUrl: 'https://docs.perplexity.ai', category: 'AI' },
  { id: 'replicate', name: 'Replicate', description: 'Run open-source AI models', icon: '◈', color: '#111', keyLabel: 'API Token', keyPlaceholder: 'r8_XXX...', docsUrl: 'https://replicate.com/account', category: 'AI' },
  { id: 'github', name: 'GitHub', description: 'Repos, issues, PRs, actions', icon: '⌥', color: '#333', keyLabel: 'Personal Access Token', keyPlaceholder: 'ghp_XXX...', docsUrl: 'https://github.com/settings/tokens', category: 'Dev Tools' },
  { id: 'linear', name: 'Linear', description: 'Create and manage Linear issues', icon: '▲', color: '#5E6AD2', keyLabel: 'API Key', keyPlaceholder: 'lin_api_XXX...', docsUrl: 'https://linear.app/settings/api', category: 'Dev Tools' },
  { id: 'jira', name: 'Jira', description: 'Create and track Jira tickets', icon: '◉', color: '#0052CC', keyLabel: 'API Token', keyPlaceholder: 'XXX...', docsUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens', category: 'Dev Tools' },
  { id: 'vercel', name: 'Vercel', description: 'Deploy and manage Vercel projects', icon: '▲', color: '#333', keyLabel: 'Access Token', keyPlaceholder: 'XXX...', docsUrl: 'https://vercel.com/account/tokens', category: 'Dev Tools' },
  { id: 'google_maps', name: 'Google Maps', description: 'Maps, geocoding, places, routes', icon: '📍', color: '#4285F4', keyLabel: 'API Key', keyPlaceholder: 'AIzaXXX...', docsUrl: 'https://console.cloud.google.com', category: 'Location' },
  { id: 'mapbox', name: 'Mapbox', description: 'Custom maps and geospatial data', icon: '🗺', color: '#4264FB', keyLabel: 'Access Token', keyPlaceholder: 'pk.XXX...', docsUrl: 'https://account.mapbox.com/access-tokens', category: 'Location' },
  { id: 'posthog', name: 'PostHog', description: 'Product analytics and session recording', icon: '🦔', color: '#F54E00', keyLabel: 'Project API Key', keyPlaceholder: 'phc_XXX...', docsUrl: 'https://posthog.com', category: 'Analytics' },
  { id: 'mixpanel', name: 'Mixpanel', description: 'Event tracking and user analytics', icon: '📊', color: '#7856FF', keyLabel: 'Project Token', keyPlaceholder: 'XXX...', docsUrl: 'https://mixpanel.com', category: 'Analytics' },
  { id: 'amplitude', name: 'Amplitude', description: 'Product analytics and cohorts', icon: '📈', color: '#1B1B1B', keyLabel: 'API Key', keyPlaceholder: 'XXX...', docsUrl: 'https://amplitude.com', category: 'Analytics' },
];

const CATEGORIES = ['All', 'Data', 'CMS', 'CRM', 'Communication', 'Payments', 'AI', 'Dev Tools', 'Location', 'Analytics'];

interface Props { projectId: string; }

export function ConnectorsPanel({ projectId }: Props) {
  const [category, setCategory] = useState('All');
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = CONNECTORS.filter(c => {
    const matchCat = category === 'All' || c.category === category;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const connect = async (connector: Connector) => {
    const key = keys[connector.id];
    if (!key?.trim()) return;
    setSaving(connector.id);
    try {
      await fetch('/api/connectors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, service: connector.id, apiKey: key }) });
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>App Connectors</div>
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>{CONNECTORS.length} services</span>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search connectors..." style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, border: `1px solid ${category === c ? 'var(--sky)' : 'var(--border)'}`, background: category === c ? 'var(--sky)' : 'transparent', color: category === c ? 'white' : 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: category === c ? 600 : 400 }}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.map(c => (
          <div key={c.id}>
            <div onClick={() => setConnecting(connecting === c.id ? null : c.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: connecting === c.id ? '8px 8px 0 0' : 8, border: `1px solid ${connecting === c.id ? 'var(--sky)' : 'var(--border)'}`, background: 'var(--bg2)', cursor: 'pointer' }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: ['#fff','#F4F4F5','#333','#000','#111'].includes(c.color) ? '#1a1a1a' : c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{c.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>
              </div>
              {connected.has(c.id)
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399' }} /><span style={{ fontSize: 9, color: '#34D399', fontWeight: 600 }}>Connected</span></div>
                : <span style={{ fontSize: 9, color: 'var(--sky)', fontWeight: 500 }}>Connect</span>}
            </div>
            {connecting === c.id && !connected.has(c.id) && (
              <div style={{ padding: '8px 10px', background: 'var(--bg2)', borderRadius: '0 0 8px 8px', border: '1px solid var(--sky)', borderTop: 'none' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 5 }}>{c.keyLabel} — <a href={c.docsUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--sky)' }}>Get key ↗</a></div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <input value={keys[c.id] || ''} onChange={e => setKeys(prev => ({ ...prev, [c.id]: e.target.value }))} placeholder={c.keyPlaceholder} type="password"
                    style={{ flex: 1, padding: '5px 7px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 10, fontFamily: 'monospace', outline: 'none' }} />
                  <button onClick={() => connect(c)} disabled={saving === c.id || !keys[c.id]?.trim()}
                    style={{ padding: '5px 10px', borderRadius: 6, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: !keys[c.id]?.trim() ? 0.5 : 1 }}>
                    {saving === c.id ? '...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
            {connecting === c.id && connected.has(c.id) && (
              <div style={{ padding: '6px 10px', background: 'var(--bg2)', borderRadius: '0 0 8px 8px', border: '1px solid var(--border)', borderTop: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>Connected and ready</span>
                <button onClick={() => disconnect(c.id)} style={{ fontSize: 9, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Disconnect</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}