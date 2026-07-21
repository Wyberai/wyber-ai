'use client';
import { Dialog, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useT } from '@/lib/i18n/useT';
import { DASHBOARD_STRINGS } from '@/lib/i18n/dict/dashboard';

export type ProjectType = 'app' | 'mobile' | 'agent' | 'workflow' | 'employee' | 'gtm';

interface ChooserProps {
  open: boolean;
  onClose: () => void;
  onPick: (type: ProjectType) => void;
}

// SVG icons — no emojis (project-wide convention, see DashboardClient.tsx)
const IconWeb = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20 15.3 15.3 0 010-20z"/></svg>;
const IconMobile = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>;
const IconEmployee = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><path d="M8 15h.01M12 15h.01M16 15h.01"/></svg>;
const IconWorkflow = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="9" width="6" height="6" rx="1.5"/><rect x="3" y="15" width="6" height="6" rx="1.5"/><path d="M9 6h3a3 3 0 0 1 3 3M9 18h3a3 3 0 0 0 3-3"/></svg>;
const IconTarget = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>;

const CARDS: {
  type: ProjectType;
  titleKey: keyof typeof DASHBOARD_STRINGS['en'];
  descKey: keyof typeof DASHBOARD_STRINGS['en'];
  icon: React.ReactNode;
  color: string;
  redirect?: string;
  soon?: boolean;
}[] = [
  {
    type: 'app',
    titleKey: 'cardWebTitle',
    descKey: 'cardWebDesc',
    icon: <IconWeb />,
    color: '#0EA5E9',
  },
  {
    type: 'mobile',
    titleKey: 'cardMobileTitle',
    descKey: 'cardMobileDesc',
    icon: <IconMobile />,
    color: '#f97316',
  },
  {
    type: 'employee',
    titleKey: 'cardEmployeeTitle',
    descKey: 'cardEmployeeDesc',
    icon: <IconEmployee />,
    color: '#a855f7',
    redirect: '/coming-soon?product=AI+Employees',
    soon: true,
  },
  {
    type: 'workflow',
    titleKey: 'cardWorkflowTitle',
    descKey: 'cardWorkflowDesc',
    icon: <IconWorkflow />,
    color: '#22c55e',
    redirect: '/coming-soon?product=Workflows',
    soon: true,
  },
  {
    type: 'gtm',
    titleKey: 'cardGtmTitle',
    descKey: 'cardGtmDesc',
    icon: <IconTarget />,
    color: '#10b981',
    redirect: '/coming-soon?product=GTM+Engine',
    soon: true,
  },
];

export function ProjectTypeChooser({ open, onClose, onPick }: ChooserProps) {
  const t = useT(DASHBOARD_STRINGS);
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }} maxWidth={780}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <DialogTitle className="dialog-title" style={{ marginBottom: 0 }}>{t('chooserTitle')}</DialogTitle>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ide-text3)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>&times;</button>
      </div>
      <DialogDescription className="dialog-desc">{t('chooserDesc')}</DialogDescription>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {CARDS.map((c) => (
          <button
            key={c.type}
            onClick={() => {
              if (c.redirect) { window.location.href = c.redirect; onClose(); }
              else onPick(c.type);
            }}
            className="pt-chooser-card"
            style={{
              textAlign: 'left', cursor: 'pointer',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--ide-border)', borderRadius: 12, padding: 16,
              display: 'flex', flexDirection: 'column', gap: 8,
              fontFamily: 'inherit',
              ['--pt-accent' as string]: c.color,
            } as React.CSSProperties}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: c.soon ? 'var(--ide-text3)' : c.color }}>{c.icon}</span>
              {c.soon && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>{t('soonBadge')}</span>}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.soon ? 'var(--ide-text3)' : 'var(--ide-text)' }}>{t(c.titleKey)}</div>
            <div style={{ fontSize: 11.5, color: c.soon ? 'var(--ide-text3)' : 'var(--ide-text2)', lineHeight: 1.5 }}>{t(c.descKey)}</div>
          </button>
        ))}
      </div>
    </Dialog>
  );
}
