'use client';
import { useState, useEffect } from 'react';

interface APIKey { id: string; name: string; key_preview: string; active: boolean; created_at: string; }

export function APIKeysPanel() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/wyber-api').then(r => r.json()).then(d => setKeys(d.keys || []));
  }, []);

  const createKey = async () => {
    setLoading(true);
    const res = await fetch('/api/wyber-api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName || 'Default' }) });
    const data = await res.json();
    if (data.key) { setNewKey(data.key); setKeys(prev => [data.keyData, ...prev]); setCreating(false); setNewName(''); }
    setLoading(false);
  };

  const revokeKey = async (id: string) => {
    if (!confirm('Revoke this key?')) return;
    await fetch('/api/wyber-api', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setKeys(prev => prev.filter(k => k.id !== id));
  };

  const copy = () => { navigator.clipboard.writeText(newKey); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>API Keys</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Access the WyberAi API and MCP server</div>
        </div>
        <button onClick={() => setCreating(!creating)} style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>+ New key</button>
      </div>

      <div style={{ padding: '12px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>MCP Server — for Claude & Cursor</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>A remote (Streamable HTTP) MCP server. Create a key below, then add it with your key in the <code style={{ fontFamily: 'monospace' }}>x-api-key</code> header. In Claude Code:</div>
        <code style={{ display: 'block', padding: '8px 10px', borderRadius: 7, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--sky)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          claude mcp add --transport http wyberai https://wyberai.com/api/mcp --header &quot;x-api-key: YOUR_KEY&quot;
        </code>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>34 tools — build (create_project, start_build, publish_to_web), inspect (list_files, read_file, get_project, get_account, get_message_status), database (execute_sql, get_database_status, connect_supabase), security (run_security_scan), manage (rename/duplicate/delete_project, list/restore_version, save/restore_snapshot), ship (search/buy_domain, export_code, push_to_github, invite_collaborator), knowledge, and connectors.</div>
      </div>

      {newKey && (
        <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.3)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#34D399', marginBottom: 6 }}>⚠ Copy now — won't be shown again</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <code style={{ flex: 1, padding: '7px 10px', borderRadius: 7, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 10, color: 'var(--text)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{newKey}</code>
            <button onClick={copy} style={{ padding: '7px 12px', borderRadius: 7, background: copied ? '#34D399' : 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{copied ? '✓' : 'Copy'}</button>
          </div>
          <button onClick={() => setNewKey('')} style={{ marginTop: 6, fontSize: 10, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Dismiss</button>
        </div>
      )}

      {creating && (
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Key name (e.g. Claude Desktop)" onKeyDown={e => e.key === 'Enter' && createKey()}
            style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={createKey} disabled={loading} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{loading ? '...' : 'Create'}</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {keys.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: 12, background: 'var(--bg2)', borderRadius: 9, border: '1px solid var(--border)' }}>No API keys yet. Create one to use the WyberAi API or MCP server.</div>
        ) : keys.map(k => (
          <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg2)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{k.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'monospace' }}>{k.key_preview}</div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>{new Date(k.created_at).toLocaleDateString()}</div>
            <button onClick={() => revokeKey(k.id)} style={{ fontSize: 10, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Revoke</button>
          </div>
        ))}
      </div>
    </div>
  );
}