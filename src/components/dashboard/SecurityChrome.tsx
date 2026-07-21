'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ProjectSecurityInfo } from '@/components/dashboard/ProjectSecurityBadge';
import { useT } from '@/lib/i18n/useT';
import { DASHBOARD_STRINGS } from '@/lib/i18n/dict/dashboard';

interface Props {
  securityByProject: Record<string, ProjectSecurityInfo>;
}

/**
 * Persistent sidebar widget — the "not just a marketing claim" security signal,
 * visible every dashboard session. Only reflects projects that have actually
 * been scanned at least once (securityByProject) — the dashboard's own data
 * fetch (src/app/dashboard/page.tsx) doesn't know which projects have Supabase
 * connected vs. not, so it can't claim "N projects unscanned" without a false
 * count. That fuller breakdown lives on /dashboard/security, which does fetch
 * connectors.
 */
export function SecurityChrome({ securityByProject }: Props) {
  const t = useT(DASHBOARD_STRINGS);
  const scans = Object.values(securityByProject);
  if (scans.length === 0) return null;

  const criticalCount = scans.filter((s) => s.criticalCount > 0).length;
  const worst = criticalCount > 0 ? 'red' : 'green';

  const label = criticalCount > 0
    ? t('secIssuesAcrossProjects').replace('{count}', String(criticalCount)).replace('{total}', String(scans.length))
    : t('secProjectsScannedClean').replace('{total}', String(scans.length));

  return (
    <Link
      href="/dashboard/security"
      style={{
        position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 9,
        margin: '0 8px 8px', padding: '9px 10px', borderRadius: 9,
        border: '1px solid var(--ide-border)', background: 'var(--bg-surface)',
        textDecoration: 'none', color: 'var(--ide-text2)',
      }}
    >
      <div className="wy-sec-sweep" />
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: worst === 'red' ? '#F0524B' : '#34D399' }}>
        <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />
      </svg>
      <motion.span
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
        style={{ fontSize: 11, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {label}
      </motion.span>
    </Link>
  );
}
