'use client';
import { useState } from 'react';
import { useEditorStore } from '@/store/editor';
import { SECURITY_BEAST_CHECKLIST, SECURITY_FIX_PROMPTS } from '@/lib/security-beast-scan';
import { BeastScanChecklist } from './BeastScanChecklist';
import { useBeastScanRunner } from './useBeastScanRunner';
import { applyBeastFixes } from './applyBeastFixes';

// "Security Beast" scan — the comprehensive 16-check static-analysis pass
// (src/lib/security-beast-scan.ts) run against this project's real files.
// Sibling to RlsScanPanel (which proves a live DB isn't leaking via a real
// probe) — this instead checks the code itself for the classic vibe-coding
// security gaps: hardcoded keys, XSS, SQLi, CORS, rate limiting, auth on
// admin routes, cookie/session handling, webhook signature checks. Shows the
// full checklist up front; nothing is charged until "Go ahead".
export function SecurityBeastPanel({ projectId, onSwitchToChat }: { projectId: string; onSwitchToChat?: () => void }) {
  const { phase, results, revealCount, report, error, showPreview, cancelPreview, run, reset, markChecksFixed } = useBeastScanRunner();
  const [expandedAllDone, setExpandedAllDone] = useState(true);
  const files = useEditorStore(s => s.files);
  const setFiles = useEditorStore(s => s.setFiles);
  const pushCheckpoint = useEditorStore(s => s.pushCheckpoint);
  const [applyResult, setApplyResult] = useState<{ filesWritten: number; remainingPromptSent: boolean } | null>(null);

  const goAhead = () => { setApplyResult(null); run(() =>
    fetch('/api/security/beast-scan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    })
  ); };

  const fixWithAi = (checkId: string, label: string) => {
    onSwitchToChat?.();
    setTimeout(() => window.dispatchEvent(new CustomEvent('wyber:chat-prompt', { detail: SECURITY_FIX_PROMPTS[checkId] || `Fix this security issue: ${label}` })), 60);
  };

  const applyAllFixes = () => {
    if (!report) return;
    const result = applyBeastFixes({
      report, files, setFiles, pushCheckpoint,
      checkpointLabel: 'Before Security Beast fixes',
      promptForRemaining: id => SECURITY_FIX_PROMPTS[id],
      onSwitchToChat,
    });
    markChecksFixed(report.fixedCheckIds ?? []);
    setApplyResult(result);
  };

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'rgba(240,82,75,0.06)', border: '1px solid rgba(240,82,75,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--ide-text2, #9aa)', lineHeight: 1.6 }}>
        🛡️ <strong>Security Beast scan.</strong> 16 real, static checks against your actual code — hardcoded secrets, XSS, SQL injection, CORS, rate limiting, admin-route auth, cookie handling, webhook verification, and more. No LLM guessing.
      </div>

      {phase === 'idle' && (
        <button onClick={showPreview}
          style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: 'none', background: '#F0524B', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          🛡️ Run Security Beast scan — 100 credits
        </button>
      )}

      {phase !== 'idle' && (
        <div style={{ border: '1px solid var(--ide-border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: 'var(--ide-text)', background: 'var(--bg-surface, #16181d)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{phase === 'preview' ? "We'll check all of this:" : phase === 'scanning' ? 'Scanning…' : 'Security Beast scan'}</span>
            {phase === 'done' && report && (
              <span style={{ fontSize: 16, fontWeight: 700, color: report.score >= 85 ? '#34D399' : report.score >= 50 ? '#F5A623' : '#F0524B' }}>{report.score}/100</span>
            )}
          </div>
          <div style={{ padding: '12px', maxHeight: phase === 'done' && !expandedAllDone ? 0 : 420, overflow: 'auto', transition: 'max-height 0.2s' }}>
            <BeastScanChecklist items={SECURITY_BEAST_CHECKLIST} results={results} revealCount={revealCount} phase={phase} />
          </div>

          {phase === 'preview' && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid var(--ide-border)' }}>
              <button onClick={goAhead} style={{ flex: 1, padding: '8px 12px', borderRadius: 7, fontSize: 12.5, fontWeight: 700, background: '#F0524B', color: '#fff', border: 'none', cursor: 'pointer' }}>
                🛡️ Go ahead — charge 100 credits
              </button>
              <button onClick={cancelPreview} style={{ padding: '8px 12px', borderRadius: 7, fontSize: 12.5, fontWeight: 600, background: 'transparent', color: 'var(--ide-text2)', border: '1px solid var(--ide-border)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          )}

          {phase === 'done' && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid var(--ide-border)' }}>
              <button onClick={() => setExpandedAllDone(v => !v)} style={{ flex: 1, padding: '7px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'transparent', color: 'var(--ide-text2)', border: '1px solid var(--ide-border)', cursor: 'pointer' }}>
                {expandedAllDone ? 'Hide details' : 'Show details'}
              </button>
              <button onClick={reset} style={{ padding: '7px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'transparent', color: 'var(--ide-text2)', border: '1px solid var(--ide-border)', cursor: 'pointer' }}>
                Run again
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'done' && report && report.checks.some(c => c.status !== 'pass') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={applyAllFixes}
            style={{ alignSelf: 'flex-start', fontSize: 12.5, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#F0524B', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
            🔧 Apply all fixes ({report.checks.filter(c => c.status !== 'pass').length})
          </button>
          {applyResult && (
            <div style={{ fontSize: 11.5, color: 'var(--ide-text2)', lineHeight: 1.6 }}>
              {applyResult.filesWritten > 0 && <>✅ Wrote {applyResult.filesWritten} file{applyResult.filesWritten !== 1 ? 's' : ''} directly into the project.<br /></>}
              {applyResult.remainingPromptSent && <>✨ Asked the AI to fix the rest (the issues that need real code judgment, not a template) — check the chat.</>}
            </div>
          )}
          <details>
            <summary style={{ fontSize: 11, color: 'var(--ide-text3)', cursor: 'pointer' }}>Fix individually instead</summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {report.checks.filter(c => c.status !== 'pass').map(c => {
                const label = SECURITY_BEAST_CHECKLIST.find(x => x.id === c.id)?.label ?? c.id;
                return (
                  <button key={c.id} onClick={() => fixWithAi(c.id, label)}
                    style={{ alignSelf: 'flex-start', fontSize: 11.5, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--ide-border)', background: 'var(--bg-base, #0d0e12)', color: '#F0524B', cursor: 'pointer', fontWeight: 600 }}>
                    ✨ Fix &quot;{label}&quot; with AI
                  </button>
                );
              })}
            </div>
          </details>
        </div>
      )}

      {error && (
        <div style={{ fontSize: 12, color: '#F0524B', background: 'rgba(240,82,75,0.08)', border: '1px solid rgba(240,82,75,0.25)', borderRadius: 8, padding: '10px 12px' }}>{error}</div>
      )}
    </div>
  );
}
