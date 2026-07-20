'use client';
import { Dialog, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useT } from '@/lib/i18n/useT';
import { COMMON_STRINGS } from '@/lib/i18n/dict/common';
import { DASHBOARD_STRINGS } from '@/lib/i18n/dict/dashboard';

interface Props {
  open: boolean;
  projectName?: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteProjectDialog({ open, projectName, deleting, onCancel, onConfirm }: Props) {
  const t = useT(DASHBOARD_STRINGS);
  const tc = useT(COMMON_STRINGS);
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !deleting) onCancel(); }} maxWidth={420}>
      <DialogTitle className="dialog-title">{t('deleteProjectTitle')}</DialogTitle>
      <DialogDescription className="dialog-desc">
        {projectName ? <>&ldquo;{projectName}&rdquo; {t('deleteProjectDescSuffix')}</> : t('deleteProjectDescGeneric')} {t('deleteCannotBeUndone')}
      </DialogDescription>
      <div className="dialog-actions">
        <button className="wy-btn-ghost" onClick={onCancel} disabled={deleting}>{tc('cancel')}</button>
        <button className="dialog-btn-danger" onClick={onConfirm} disabled={deleting}>
          {deleting ? tc('deleting') : tc('delete')}
        </button>
      </div>
    </Dialog>
  );
}
