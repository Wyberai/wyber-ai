'use client';
import * as Tooltip from '@radix-ui/react-tooltip';

export interface ProjectSecurityInfo {
  score: number;
  criticalCount: number;
  reachable: boolean;
  scannedAt: string;
}

function levelFor(info?: ProjectSecurityInfo): 'green' | 'amber' | 'red' | 'none' {
  if (!info) return 'none';
  if (info.score >= 85) return 'green';
  if (info.score >= 50) return 'amber';
  return 'red';
}

function labelFor(info?: ProjectSecurityInfo): string {
  if (!info) return 'Not scanned yet — connect Supabase to get a security score.';
  if (info.criticalCount > 0) return `${info.criticalCount} critical issue${info.criticalCount === 1 ? '' : 's'} found (score ${info.score}).`;
  if (info.score >= 85) return `Clean — no leaks found (score ${info.score}).`;
  return `${info.score >= 50 ? 'Some' : 'Multiple'} issues found (score ${info.score}).`;
}

/** Small colored dot on each project card — the security posture the user sees every session, not just on a marketing page. */
export function ProjectSecurityBadge({ info }: { info?: ProjectSecurityInfo }) {
  const level = levelFor(info);
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className="wy-sec-dot" data-level={level} aria-label={labelFor(info)} />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={6}
            style={{
              background: 'var(--bg-overlay)', color: 'var(--ide-text)', border: '1px solid var(--ide-border)',
              borderRadius: 6, padding: '6px 10px', fontSize: 11, maxWidth: 220, lineHeight: 1.5, zIndex: 300,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            {labelFor(info)}
            <Tooltip.Arrow style={{ fill: 'var(--bg-overlay)' }} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
