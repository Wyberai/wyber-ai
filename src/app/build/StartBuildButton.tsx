'use client';
import { track } from '@/lib/track';

// The conversion edge of every /build page: instead of dumping visitors on a
// generic signup, stash this niche's starter prompt via the SAME localStorage
// contract the homepage hero uses (wyber-pending-prompt / wyber-pending-type,
// consumed by DashboardClient on mount) — so signup completes straight into
// their first build of exactly the app the page promised.
export function StartBuildButton({
  prompt,
  target,
  slug,
  label,
  color = '#0EA5E9',
  variant = 'solid',
}: {
  prompt: string;
  target: 'web' | 'mobile';
  slug: string;
  label: string;
  color?: string;
  variant?: 'solid' | 'compact';
}) {
  const onClick = () => {
    try {
      localStorage.setItem('wyber-pending-prompt', prompt.slice(0, 2000));
      localStorage.setItem('wyber-pending-type', target === 'mobile' ? 'mobile' : 'app');
    } catch { /* private mode */ }
    track('build_page_cta_clicked', { slug, target });
    window.location.href = '/signup';
  };
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-block',
        padding: variant === 'compact' ? '11px 24px' : '13px 28px',
        borderRadius: 10,
        background: color,
        color: '#fff',
        fontSize: variant === 'compact' ? 14 : 15,
        fontWeight: 700,
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
}
