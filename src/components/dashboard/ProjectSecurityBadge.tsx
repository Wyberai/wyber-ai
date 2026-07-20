'use client';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useT } from '@/lib/i18n/useT';
import { DASHBOARD_STRINGS } from '@/lib/i18n/dict/dashboard';

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

function labelFor(info: ProjectSecurityInfo | undefined, t: (key: keyof typeof DASHBOARD_STRINGS['en']) => string): string {
  if (!info) return t('secNotScannedYet');
  if (info.criticalCount > 0) return t('secCriticalIssues').replace('{count}', String(info.criticalCount)).replace('{score}', String(info.score));
  if (info.score >= 85) return t('secCleanNoLeaks').replace('{score}', String(info.score));
  return (info.score >= 50 ? t('secSomeIssues') : t('secMultipleIssues')).replace('{score}', String(info.score));
}

/** Small colored dot on each project card — the security posture the user sees every session, not just on a marketing page. */
export function ProjectSecurityBadge({ info }: { info?: ProjectSecurityInfo }) {
  const t = useT(DASHBOARD_STRINGS);
  const level = levelFor(info);
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className="wy-sec-dot" data-level={level} aria-label={labelFor(info, t)} />
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
            {labelFor(info, t)}
            <Tooltip.Arrow style={{ fill: 'var(--bg-overlay)' }} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
