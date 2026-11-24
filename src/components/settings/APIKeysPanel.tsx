'use client';
import { useState, useEffect } from 'react';

// "Connect an AI agent": how to let Claude, Cursor or any MCP-capable agent work with a WyberAi account, in the order a
// person needs it: pick the tool, create a key (read-only or full, optionally expiring), copy the setup with the key
// already in it, and test that it works. A key is shown once and only its hash is stored (see /api/wyber-api).

interface APIKey { id: string; name: string; key_preview: string; active: boolean; created_at: string; last_used_at?: string | null; scope?: 'full' | 'read'; expires_at?: string | null }
type Client = 'claude' | 'code' | 'cursor' | 'vscode' | 'rest' | 'other';

const URL_MCP = 'https://wyberai.com/api/mcp';
const CLIENTS: Array<[Client, string]> = [['claude', 'Claude'], ['code', 'Claude Code'], ['cursor', 'Cursor'], ['vscode', 'VS Code'], ['rest', 'ChatGPT, n8n, scripts'], ['other', 'Other MCP agent']];

function setup(client: Client, key: string): { where: string; text: string } | null {
  switch (client) {
    case 'code': return { where: 'Run this in your terminal:', text: `claude mcp add --transport http wyberai ${URL_MCP} --header "x-api-key: ${key}"` };
    case 'cursor': return { where: 'Add this to ~/.cursor/mcp.json (or the project\'s .cursor/mcp.json):', text: JSON.stringify({ mcpServers: { wyberai: { url: URL_MCP, headers: { 'x-api-key': key } } } }, null, 2) };
    case 'vscode': return { where: 'Add this to .vscode/mcp.json in your project:', text: JSON.stringify({ servers: { wyberai: { type: 'http', url: URL_MCP, headers: { 'x-api-key': key } } } }, null, 2) };
    case 'rest': return {
      where: 'Anything that can send a web request can use WyberAi: ChatGPT custom actions, n8n, Zapier, Make, a script. List the tools, then run one by name:',
      text: [
        `curl -H "x-api-key: ${key}" https://wyberai.com/api/v1/tools`,
        '',
        `curl -X POST -H "x-api-key: ${key}" -H "content-type: application/json" -d '{}' https://wyberai.com/api/v1/tools/list_projects`,
        '',
        '# ChatGPT custom actions: import https://wyberai.com/api/v1/openapi.json',
        '# and set authentication to API key, header name x-api-key.',
      ].join('\n'),
    };
    case 'other': return { where: 'Any agent or tool that speaks MCP over HTTP needs two things: this address and the key sent as the x-api-key header (or as Authorization: Bearer).', text: `URL:      ${URL_MCP}\nHeader:   x-api-key: ${key}` };
    default: return null;
  }
}

function ago(iso?: string | null): string {
  if (!iso) return 'never used';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return 'used just now';
  if (s < 3600) return `used ${Math.round(s / 60)} min ago`;
  if (s < 86400) return `used ${Math.round(s / 3600)} h ago`;
  return `used ${Math.round(s / 86400)} d ago`;
}
function expiry(iso?: string | null): { text: string; warn: boolean } {
  if (!iso) return { text: 'no expiry', warn: false };
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (d <= 0) return { text: 'expired', warn: true };
  return { text: d === 1 ? 'expires tomorrow' : `expires in ${d} days`, warn: d <= 7 };
}

const card = { padding: 12, borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--border)' } as const;
const mono = { fontFamily: 'monospace', fontSize: 11 } as const;
const input = { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', outline: 'none' } as const;
const primary = { padding: '8px 14px', borderRadius: 8, background: 'var(--sky)', color: '#03111c', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' } as const;
const ghost = { padding: '7px 12px', borderRadius: 7, background: 'transparent', color: 'var(--text)', fontWeight: 600, fontSize: 11, border: '1px solid var(--border)', cursor: 'pointer' } as const;

export function APIKeysPanel() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [client, setClient] = useState<Client>('claude');
  const [name, setName] = useState('');
  const [scope, setScope] = useState<'full' | 'read'>('read');
  const [days, setDays] = useState<number>(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signedOut, setSignedOut] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [copied, setCopied] = useState('');
  const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const load = () => fetch('/api/wyber-api').then(r => r.json()).then(d => setKeys(d.keys || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const createKey = async () => {
    setLoading(true); setError(''); setTest(null);
    const res = await fetch('/api/wyber-api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name || undefined, scope, expiresInDays: days || null }) });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.status === 401) { setSignedOut(true); setError('Sign in to your WyberAi account first, then create your key.'); return; }
    if (!res.ok || !data.key) { setError(data.error || 'Could not create the key. Please try again.'); return; }
    setNewKey(data.key); setKeys(prev => [data.keyData, ...prev]); setName('');
  };

  const revokeKey = async (id: string, label: string) => {
    if (!confirm(`Revoke "${label}"? Any agent using it stops working immediately.`)) return;
    await fetch('/api/wyber-api', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setKeys(prev => prev.filter(k => k.id !== id));
  };

  const copy = (what: string, text: string) => { navigator.clipboard?.writeText(text); setCopied(what); setTimeout(() => setCopied(''), 1800); };

  const runTest = async () => {
    setTesting(true); setTest(null);
    try {
      const r = await fetch('/api/wyber-api/test', { headers: { 'x-api-key': newKey } });
      const j = await r.json().catch(() => ({}));
      setTest({ ok: r.ok && j.ok, message: j.message || j.error || 'No answer. Try again.' });
    } catch { setTest({ ok: false, message: 'Could not reach WyberAi. Check your connection and try again.' }); }
    setTesting(false);
  };

  const snip = setup(client, newKey || 'YOUR_KEY');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Connect an AI agent</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, lineHeight: 1.5 }}>Let Claude, Cursor or any agent that speaks MCP look at your projects, build, and publish. You stay in charge: a key can be read-only, it can expire, and you can revoke it at any time.</div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }} role="tablist" aria-label="Which tool">
          {CLIENTS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={client === k} onClick={() => setClient(k)} style={{ ...ghost, background: client === k ? 'var(--sky)' : 'transparent', color: client === k ? '#03111c' : 'var(--text)', borderColor: client === k ? 'var(--sky)' : 'var(--border)' }}>{label}</button>
          ))}
        </div>

        {client === 'claude' ? (
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.65 }}>
            <div>In Claude (claude.ai or the desktop app), open <strong>Settings, then Connectors</strong> and choose <strong>Add custom connector</strong>.</div>
            <div style={{ margin: '6px 0' }}>Name it WyberAi and paste this address:</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <code style={{ ...mono, flex: 1, padding: '8px 10px', borderRadius: 7, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--sky)' }}>{URL_MCP}</code>
              <button onClick={() => copy('url', URL_MCP)} style={ghost}>{copied === 'url' ? 'Copied' : 'Copy'}</button>
            </div>
            <div style={{ marginTop: 6 }}>Then sign in to WyberAi and approve. <strong>You do not need a key</strong> for this one: Claude asks for your permission and you can remove it from Claude whenever you like.</div>
          </div>
        ) : snip && (
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            <div style={{ marginBottom: 6 }}>{snip.where}</div>
            <div style={{ position: 'relative' }}>
              <pre style={{ ...mono, margin: 0, padding: '10px 12px', borderRadius: 7, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--sky)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{snip.text}</pre>
              <button onClick={() => copy('snip', snip.text)} style={{ ...ghost, position: 'absolute', top: 6, right: 6, background: 'var(--bg2)' }}>{copied === 'snip' ? 'Copied' : 'Copy'}</button>
            </div>
            <div style={{ marginTop: 6, color: 'var(--text3)' }}>{newKey ? 'Your new key is already in this setup.' : <>Create a key below and it fills in <code style={mono}>YOUR_KEY</code> for you.</>}</div>
          </div>
        )}
      </div>

      {client !== 'claude' && (
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Create a key</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 160px' }}>
              <label htmlFor="key-name" style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Name</label>
              <input id="key-name" value={name} onChange={e => setName(e.target.value)} placeholder={`${CLIENTS.find(c => c[0] === client)?.[1] ?? 'My agent'} on my laptop`} style={{ ...input, width: '100%', boxSizing: 'border-box' }} onKeyDown={e => e.key === 'Enter' && createKey()} />
            </div>
            <div>
              <label htmlFor="key-scope" style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Access</label>
              <select id="key-scope" value={scope} onChange={e => setScope(e.target.value as 'full' | 'read')} style={input}>
                <option value="read">Read-only: can look, cannot change</option>
                <option value="full">Full access: can build, publish and delete</option>
              </select>
            </div>
            <div>
              <label htmlFor="key-days" style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Expires</label>
              <select id="key-days" value={days} onChange={e => setDays(Number(e.target.value))} style={input}>
                <option value={30}>In 30 days</option><option value={90}>In 90 days</option><option value={365}>In 1 year</option><option value={0}>Never</option>
              </select>
            </div>
            <button onClick={createKey} disabled={loading} style={primary}>{loading ? 'Creating' : 'Create key'}</button>
          </div>
          {scope === 'full' && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 8, lineHeight: 1.5 }}>A full-access key can change and delete your projects. Treat it like a password, and prefer read-only unless the agent needs to build.</div>}
          {error && <div role="alert" style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>{error}{signedOut && <> <a href="/login?next=/api-keys" style={{ color: 'var(--sky)', fontWeight: 600 }}>Sign in</a></>}</div>}
        </div>
      )}

      {newKey && (
        <div style={{ ...card, background: 'rgba(52,211,153,0.06)', borderColor: 'rgba(52,211,153,0.3)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#34D399', marginBottom: 6 }}>Copy your key now. It will not be shown again.</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <code style={{ ...mono, flex: '1 1 240px', padding: '8px 10px', borderRadius: 7, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', overflowX: 'auto', whiteSpace: 'nowrap' }}>{newKey}</code>
            <button onClick={() => copy('key', newKey)} style={primary}>{copied === 'key' ? 'Copied' : 'Copy key'}</button>
            <button onClick={runTest} disabled={testing} style={ghost}>{testing ? 'Testing' : 'Test it'}</button>
          </div>
          {test && <div role="status" style={{ fontSize: 12, marginTop: 8, color: test.ok ? '#34D399' : '#f87171' }}>{test.message}</div>}
          <button onClick={() => { setNewKey(''); setTest(null); }} style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>I have saved it</button>
        </div>
      )}

      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Your keys</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {keys.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: 'var(--text3)', fontSize: 12, padding: 18 }}>No keys yet. Claude connects without one; other agents need one.</div>
          ) : keys.map(k => {
            const ex = expiry(k.expires_at);
            return (
              <div key={k.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 12px' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: ex.text === 'expired' ? '#f87171' : '#34D399', flexShrink: 0 }} />
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{k.name}</div>
                  <div style={{ ...mono, color: 'var(--text3)' }}>{k.key_preview}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', fontSize: 11 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 20, border: '1px solid var(--border)', color: k.scope === 'read' ? '#34D399' : '#f59e0b' }}>{k.scope === 'read' ? 'Read-only' : 'Full access'}</span>
                  <span style={{ color: ex.warn ? '#f87171' : 'var(--text3)' }}>{ex.text}</span>
                  <span style={{ color: 'var(--text3)' }}>{ago(k.last_used_at)}</span>
                </div>
                <button onClick={() => revokeKey(k.id, k.name)} style={{ ...ghost, color: '#f87171' }}>Revoke</button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
        Keys are stored as a one-way hash, so we cannot show one again. If you lose a key, revoke it and make a new one. If a key may have leaked, revoke it right away: it stops working on the agent&apos;s next request.
      </div>
    </div>
  );
}
