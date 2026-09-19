'use client';

// Shared "show everything we're about to check, then tick items off one by
// one" UI for the Security Beast and SEO/Marketing Beast scans. Used both in
// the dedicated Security/SEO tabs and inside Wyberman's chat panel, so the
// preview → confirm → animate-reveal flow looks and behaves identically
// everywhere it appears.

export type ChecklistItem = { id: string; label: string };
export type ChecklistResult = { id: string; status: 'pass' | 'warn' | 'fail'; detail: string };

const STATUS_STYLE: Record<ChecklistResult['status'], { color: string; icon: string }> = {
  pass: { color: '#34D399', icon: '✓' },
  warn: { color: '#F5A623', icon: '!' },
  fail: { color: '#F0524B', icon: '✕' },
};

/**
 * phase 'preview'  — every item shown unchecked, nothing has run yet.
 * phase 'scanning' — charge went through, waiting on the server; items still
 *                    unchecked but dimmed/pulsing to signal work in progress.
 * phase 'revealing'— results are back; items up to `revealCount` show their
 *                    real pass/warn/fail status, the rest still pending —
 *                    this is what produces the "ticking down the list" feel.
 * phase 'done'     — every item revealed.
 */
export function BeastScanChecklist({
  items,
  results,
  revealCount,
  phase,
  compact = false,
}: {
  items: ChecklistItem[];
  results: ChecklistResult[] | null;
  revealCount: number;
  phase: 'preview' | 'scanning' | 'revealing' | 'done';
  compact?: boolean;
}) {
  const resultFor = (id: string) => results?.find(r => r.id === id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 4 : 6 }}>
      {items.map((item, i) => {
        const revealed = phase === 'done' || (phase === 'revealing' && i < revealCount);
        const result = revealed ? resultFor(item.id) : undefined;
        const style = result ? STATUS_STYLE[result.status] : null;
        const isNext = phase === 'revealing' && i === revealCount;
        return (
          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 6 : 8 }}>
              <span style={{
                width: compact ? 14 : 16, height: compact ? 14 : 16, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: compact ? 9 : 10, fontWeight: 700,
                background: style ? style.color : 'transparent',
                color: style ? '#000' : 'var(--ide-text3, #44445A)',
                border: style ? 'none' : '1.5px solid var(--ide-border, #2A2A35)',
                animation: isNext ? 'beast-checklist-pulse 0.9s ease-in-out infinite' : 'none',
              }}>
                {style ? style.icon : ''}
              </span>
              <span style={{
                fontSize: compact ? 11 : 12.5, fontWeight: result ? 600 : 400,
                color: result ? 'var(--ide-text, #EEEEF4)' : 'var(--ide-text2, #7878A0)',
              }}>
                {item.label}
              </span>
            </div>
            {result && result.status !== 'pass' && (
              <div style={{ fontSize: compact ? 10 : 11, color: 'var(--ide-text3, #44445A)', lineHeight: 1.5, paddingLeft: compact ? 20 : 24 }}>
                {result.detail}
              </div>
            )}
          </div>
        );
      })}
      <style>{`
        @keyframes beast-checklist-pulse { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }
      `}</style>
    </div>
  );
}
