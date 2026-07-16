'use client';
import { Dialog, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  projectName?: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteProjectDialog({ open, projectName, deleting, onCancel, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !deleting) onCancel(); }} maxWidth={420}>
      <DialogTitle className="dialog-title">Delete project?</DialogTitle>
      <DialogDescription className="dialog-desc">
        {projectName ? <>&ldquo;{projectName}&rdquo; will be permanently deleted.</> : 'This project will be permanently deleted.'} This cannot be undone.
      </DialogDescription>
      <div className="dialog-actions">
        <button className="wy-btn-ghost" onClick={onCancel} disabled={deleting}>Cancel</button>
        <button className="dialog-btn-danger" onClick={onConfirm} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </Dialog>
  );
}
