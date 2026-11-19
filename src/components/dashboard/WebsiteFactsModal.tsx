'use client';
import { useState } from 'react';
import { Dialog, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EMPTY_FACTS, type WebsiteFacts } from '@/lib/website-facts';

// Shown once, right after "Build" on a typed website brief that holds no business facts (see lib/website-facts.ts). Every field is
// optional and there is no cancel: both buttons build, so the step can never strand a project. Escape and an outside click do nothing.

interface Props {
  open: boolean;
  onBuild: (facts: WebsiteFacts) => void; // "Build my website": whatever was typed, possibly nothing
  onSkip: () => void; // "Skip and build": nothing added
  busy?: boolean;
}

const field: React.CSSProperties = {
  width: '100%', padding: '11px 13px', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none',
  background: 'var(--bg-base, #05060a)', color: 'var(--ide-text)', border: '1px solid var(--ide-border)',
};
const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ide-text2)', marginBottom: 6 };

export function WebsiteFactsModal({ open, onBuild, onSkip, busy }: Props) {
  const [f, setF] = useState<WebsiteFacts>(EMPTY_FACTS);
  const set = (k: keyof WebsiteFacts) => (e: React.ChangeEvent<HTMLInputElement>) => setF(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={() => { /* no cancel: only the two buttons leave this step */ }} maxWidth={520}>
      <form
        onSubmit={e => { e.preventDefault(); if (!busy) onBuild(f); }}
        style={{ padding: 26, display: 'grid', gap: 16 }}
      >
        <div>
          <DialogTitle style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ide-text)', margin: 0 }}>
            Make it yours before we build
          </DialogTitle>
          <DialogDescription style={{ fontSize: 13, color: 'var(--ide-text2)', lineHeight: 1.55, margin: '8px 0 0' }}>
            Add what you know. Anything you leave empty is simply left off the site: we never invent a name, number or hours.
          </DialogDescription>
        </div>
        <div>
          <label htmlFor="wf-name" style={label}>Business name</label>
          <input id="wf-name" value={f.name} onChange={set('name')} maxLength={80} autoComplete="organization" placeholder="e.g. Smile Care Dental Clinic" style={field} />
        </div>
        <div>
          <label htmlFor="wf-area" style={label}>Area and city</label>
          <input id="wf-area" value={f.area} onChange={set('area')} maxLength={80} placeholder="e.g. Navrangpura, Ahmedabad" style={field} />
        </div>
        <div>
          <label htmlFor="wf-wa" style={label}>WhatsApp number (for the message button)</label>
          <input id="wf-wa" value={f.whatsapp} onChange={set('whatsapp')} maxLength={20} inputMode="tel" autoComplete="tel" placeholder="e.g. 98765 43210" style={field} />
        </div>
        <div>
          <label htmlFor="wf-hours" style={label}>Opening hours</label>
          <input id="wf-hours" value={f.hours} onChange={set('hours')} maxLength={120} placeholder="e.g. Mon to Sat, 10am to 7pm" style={field} />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          <button
            type="submit"
            disabled={busy}
            style={{ flex: '1 1 200px', padding: '12px 18px', borderRadius: 10, border: 'none', background: '#0EA5E9', color: '#03111c', fontSize: 14, fontWeight: 800, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1 }}
          >
            Build my website
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onSkip}
            style={{ padding: '12px 18px', borderRadius: 10, background: 'transparent', color: 'var(--ide-text2)', border: '1px solid var(--ide-border)', fontSize: 14, fontWeight: 600, cursor: busy ? 'wait' : 'pointer' }}
          >
            Skip and build
          </button>
        </div>
      </form>
    </Dialog>
  );
}
