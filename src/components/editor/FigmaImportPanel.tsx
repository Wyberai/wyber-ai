'use client';
import { useState } from 'react';

interface Props {
  onImport: (code: string, fileName: string) => void;
}

export function FigmaImportPanel({ onImport }: Props) {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ fileName: string; code: string } | null>(null);
  const [showToken, setShowToken] = useState(false);

  const importFigma = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/figma-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figmaUrl: url, figmaToken: token }),
      });
      const data = await res.json();
      if (data.code) setResult({ fileName: data.fileName, code: data.code });
      else setError(data.error || 'Import failed');
    } catch { setError('Import failed'); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Figma Import</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>Paste a Figma share link and Wyber AI converts it to a React component.</div>

      <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 11, color: 'var(--text2)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--sky)' }}>How to get a share link:</strong><br />
        In Figma → right-click your design → Share → Copy link
      </div>

      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.figma.com/file/..."
        style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />

      <div>
        <button onClick={() => setShowToken(!showToken)} style={{ fontSize: 11, color: 'var(--sky)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
          {showToken ? '▲ Hide' : '▼ Add'} Figma access token (required for private files)
        </button>
        {showToken && (
          <input value={token} onChange={e => setToken(e.target.value)} placeholder="figd_XXXX... — get from figma.com/settings" type="password"
            style={{ marginTop: 6, width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 12, fontFamily: 'monospace', outline: 'none' }} />
        )}
      </div>

      <button onClick={importFigma} disabled={loading || !url.trim()} style={{ padding: '9px', borderRadius: 9, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: !url.trim() ? 0.5 : 1 }}>
        {loading ? 'Converting design...' : 'Import from Figma →'}
      </button>

      {error && <p style={{ color: '#EF4444', fontSize: 11 }}>{error}</p>}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#34D399', marginBottom: 4 }}>✓ Converted: {result.fileName}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{result.code.split('\n').length} lines of React code generated</div>
          </div>
          <button onClick={() => onImport(result.code, result.fileName)} style={{ padding: '9px', borderRadius: 9, background: '#34D399', color: '#0B1627', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Add to project →
          </button>
          <details style={{ fontSize: 11 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--text3)', padding: '4px 0' }}>Preview code</summary>
            <pre style={{ marginTop: 8, padding: '10px', borderRadius: 8, background: 'var(--bg2)', border: '1px solid var(--border)', fontSize: 10, overflow: 'auto', maxHeight: 200, color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>{result.code.slice(0, 500)}...</pre>
          </details>
        </div>
      )}
    </div>
  );
}