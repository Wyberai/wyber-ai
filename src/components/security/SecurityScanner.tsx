'use client';
import { useState } from 'react';
import { useEditorStore } from '@/store/editor';

interface Vulnerability { severity: 'critical' | 'high' | 'medium' | 'low'; file: string; issue: string; fix: string; }
interface ScanResult { score: number; vulnerabilities: Vulnerability[]; passed: string[]; }

export function SecurityScanner() {
  const { files, framework, setFiles, addMessage, updateMessage } = useEditorStore();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [fixing, setFixing] = useState<string | null>(null);

  const scan = async () => {
    setScanning(true);
    setResult(null);

    const fileContext = Object.entries(files).slice(0, 20).map(([p, f]) => `<file path="${p}">\n${f.content.slice(0, 2000)}\n</file>`).join('\n\n');

    const prompt = `You are a security auditor reviewing AI-generated code. Analyze these files for vulnerabilities.

${fileContext}

Respond ONLY with a JSON object, no markdown:
{
  "score": <0-100 security score>,
  "vulnerabilities": [
    {
      "severity": "critical|high|medium|low",
      "file": "path/to/file",
      "issue": "Description of vulnerability",
      "fix": "How to fix it in one sentence"
    }
  ],
  "passed": ["Security check that passed", ...]
}

Check for: hardcoded secrets/API keys, missing input validation, XSS vulnerabilities, open CORS, missing auth checks, SQL injection risks, exposed sensitive data, insecure direct object references.`;

    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, framework, fileContext: '', history: [] }) });
      let full = '';
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
      }
      const clean = full.replace(/```json|```/g, '').trim();
      const parsed: ScanResult = JSON.parse(clean);
      setResult(parsed);
    } catch { setResult({ score: 0, vulnerabilities: [{ severity: 'medium', file: 'unknown', issue: 'Could not parse scan results', fix: 'Run again' }], passed: [] }); }
    setScanning(false);
  };

  const autoFix = async (vuln: Vulnerability) => {
    setFixing(vuln.issue);
    const id = Math.random().toString(36).slice(2, 9);
    addMessage({ id, role: 'assistant', content: `**Security fix:** ${vuln.issue}`, timestamp: Date.now(), status: 'streaming' });

    const fileContent = files[vuln.file]?.content ?? '';
    const prompt = `Fix this security vulnerability in ${vuln.file}:\n\nIssue: ${vuln.issue}\nFix: ${vuln.fix}\n\nCurrent file:\n${fileContent}\n\nOutput the fixed file.`;
    const fileContext = `<file path="${vuln.file}">\n${fileContent}\n</file>`;

    const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, framework, fileContext, history: [] }) });
    const { parseGenerationOutput } = await import('@/lib/file-parser');
    let full = '';
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });
    }
    const { files: newFiles, chatText } = parseGenerationOutput(full);
    if (newFiles.length > 0) {
      const updated = { ...files };
      for (const { path, content } of newFiles) {
        const ext = path.split('.').pop() ?? '';
        const langMap: Record<string, string> = { ts: 'typescript', tsx: 'typescript', js: 'javascript', css: 'css', html: 'html' };
        updated[path] = { path, content, language: langMap[ext] ?? 'plaintext' };
      }
      setFiles(updated);
    }
    updateMessage(id, { content: chatText || full, status: 'done', filesChanged: newFiles.map(f => f.path) });
    setFixing(null);
    // Remove fixed vuln from results
    if (result) setResult({ ...result, vulnerabilities: result.vulnerabilities.filter(v => v.issue !== vuln.issue) });
  };

  const severityColor = { critical: 'var(--red)', high: '#FF6B35', medium: 'var(--amber)', low: 'var(--text-muted)' };
  const scoreColor = (s: number) => s >= 80 ? 'var(--green)' : s >= 50 ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'rgba(240,82,82,0.05)', border: '1px solid rgba(240,82,82,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        🛡 Scans your code for hardcoded secrets, missing auth, XSS, and other vulnerabilities before you deploy. Fixes are applied automatically.
      </div>

      <button onClick={scan} disabled={scanning} className="btn btn-primary" style={{ justifyContent: 'center', fontSize: 13 }}>
        {scanning ? '⟳ Scanning...' : '🛡 Run security scan'}
      </button>

      {result && (
        <>
          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: scoreColor(result.score), letterSpacing: '-0.03em' }}>{result.score}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Security Score</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{result.vulnerabilities.length} issues · {result.passed.length} checks passed</div>
            </div>
          </div>

          {/* Vulnerabilities */}
          {result.vulnerabilities.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Issues found</p>
              {result.vulnerabilities.map((v, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${severityColor[v.severity]}33`, background: `${severityColor[v.severity]}08` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: severityColor[v.severity], textTransform: 'uppercase', letterSpacing: '0.06em' }}>{v.severity}</span>
                    <button onClick={() => autoFix(v)} disabled={!!fixing} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--accent)', cursor: 'pointer' }}>
                      {fixing === v.issue ? '⟳' : '⚡ Auto-fix'}
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 2 }}>{v.issue}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{v.file}</div>
                </div>
              ))}
            </div>
          )}

          {/* Passed checks */}
          {result.passed.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Passed</p>
              {result.passed.map((p, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--green)', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                  <span>✓</span>{p}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
