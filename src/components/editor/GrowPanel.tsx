'use client';
// Grow panel — "get customers" for a built app, at 0 credits.
//
// Writes the Grow kit (lib/grow-kit.ts) straight into the app's files:
// WhatsApp + UPI pay buttons and LocalBusiness JSON-LD. Same write path as
// ThemePanel — setFiles (auto rebuild) → persistProjectFiles — no LLM. The
// share QR + launch posts already live in Publish → Launch Kit, so this panel
// links there instead of duplicating them.
import { useMemo, useState } from 'react';
import { useEditorStore } from '@/store/editor';
import { persistProjectFiles } from '@/lib/persist-project';
import {
  EMPTY_GROW_CONFIG, applyGrowKit, removeGrowKit, readGrowConfig, canApplyGrowKit,
  isGrowKitInstalled, isValidUpiId, normalizeWhatsApp, upiLink, activeWidgets, type GrowConfig,
} from '@/lib/grow-kit';
import { GlowButton, MicroLabel, EmptyState } from '@/components/editor/ui';

const inputStyle = {
  width: '100%', padding: '7px 9px', borderRadius: 7, border: '1px solid var(--ide-border)',
  background: 'var(--bg-elevated)', color: 'var(--ide-text)', fontSize: 12, outline: 'none',
  fontFamily: 'var(--font-sans)', boxSizing: 'border-box' as const,
};

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <MicroLabel>{label}</MicroLabel>
      {children}
      {(error || hint) && (
        <span style={{ fontSize: 10.5, color: error ? 'var(--ide-error, #ef4444)' : 'var(--ide-text3)' }}>{error || hint}</span>
      )}
    </label>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} aria-pressed={on}
      style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ide-text)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
      <span style={{ width: 28, height: 16, borderRadius: 999, background: on ? 'var(--brand-accent)' : 'var(--ide-border)', position: 'relative', transition: 'background 0.15s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 14 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
      </span>
      {label}
    </button>
  );
}

export function GrowPanel() {
  const { files, setFiles, project } = useEditorStore();
  const fileMap = files as Record<string, unknown>;
  const supported = Object.keys(fileMap).length >= 2 && canApplyGrowKit(fileMap);
  const installed = isGrowKitInstalled(fileMap);
  const saved = useMemo(() => readGrowConfig(fileMap), [fileMap]);

  const [draft, setDraft] = useState<GrowConfig | null>(null);
  const cfg: GrowConfig = draft ?? saved ?? { ...EMPTY_GROW_CONFIG, businessName: project?.name ?? '' };
  const set = (patch: Partial<GrowConfig>) => setDraft({ ...cfg, ...patch });

  const [busy, setBusy] = useState<'apply' | 'remove' | null>(null);
  const [flash, setFlash] = useState('');

  const waError = cfg.showWhatsApp && cfg.whatsapp && normalizeWhatsApp(cfg.whatsapp).length < 8 ? 'Enter a full number with country code' : '';
  const upiError = cfg.showUpi && cfg.upiId && !isValidUpiId(cfg.upiId) ? 'Looks like name@bank, e.g. shopname@okicici' : '';
  const live = activeWidgets(cfg);
  const canApply = !!cfg.businessName.trim() && !waError && !upiError && !busy;

  const write = async (next: Record<string, unknown>, kind: 'apply' | 'remove', okMsg: string) => {
    setBusy(kind);
    try {
      setFiles(next as typeof files);
      const ok = project?.id ? await persistProjectFiles(project.id, next, project.userId) : true;
      if (ok) {
        setDraft(null);
        setFlash(okMsg);
        setTimeout(() => setFlash(''), 2200);
      }
    } finally {
      setBusy(null);
    }
  };

  const apply = async () => {
    if (!canApply) return;
    let qrSvg = '';
    if (live.upi) {
      const QRCode = (await import('qrcode')).default;
      qrSvg = await QRCode.toString(upiLink(cfg.upiId, cfg.upiName || cfg.businessName), { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
    }
    const next = applyGrowKit(fileMap, cfg, { qrSvg, siteUrl: project?.deployed_url || undefined });
    await write(next, 'apply', installed ? '✓ Updated in your app' : '✓ Added to your app');
  };

  const remove = () => write(removeGrowKit(fileMap), 'remove', 'Removed from your app');

  const openLaunchKit = () => window.dispatchEvent(new CustomEvent('wyber-open-publish'));

  if (!supported) {
    return (
      <EmptyState
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>}
        title={Object.keys(fileMap).length < 2 ? 'Build your app first' : 'Web apps only for now'}
        hint={Object.keys(fileMap).length < 2
          ? 'Then add WhatsApp, UPI payments and your Google listing details here, free.'
          : 'The Grow kit adds buttons to a web app. Mobile app support is coming.'}
      />
    );
  }

  return (
    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <MicroLabel>Turn visitors into customers</MicroLabel>
        <MicroLabel color="var(--brand-accent)">0 credits</MicroLabel>
      </div>

      <Field label="Business name">
        <input style={inputStyle} value={cfg.businessName} onChange={e => set({ businessName: e.target.value })} placeholder="Your business name" />
      </Field>

      {/* WhatsApp */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: 10, borderRadius: 10, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)' }}>
        <Toggle on={cfg.showWhatsApp} onChange={v => set({ showWhatsApp: v })} label="WhatsApp button" />
        {cfg.showWhatsApp && (
          <>
            <Field label="WhatsApp number" hint="10-digit Indian numbers get +91 automatically" error={waError}>
              <input style={inputStyle} inputMode="tel" value={cfg.whatsapp} onChange={e => set({ whatsapp: e.target.value })} placeholder="98765 43210" />
            </Field>
            <Field label="Message customers start with">
              <input style={inputStyle} value={cfg.whatsappMessage} onChange={e => set({ whatsappMessage: e.target.value })} />
            </Field>
          </>
        )}
      </div>

      {/* UPI */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: 10, borderRadius: 10, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)' }}>
        <Toggle on={cfg.showUpi} onChange={v => set({ showUpi: v })} label="Pay with UPI button" />
        {cfg.showUpi && (
          <>
            <Field label="UPI ID" hint="Opens GPay / PhonePe / Paytm on phones, shows a QR on computers" error={upiError}>
              <input style={inputStyle} value={cfg.upiId} onChange={e => set({ upiId: e.target.value })} placeholder="yourname@okicici" autoCapitalize="off" spellCheck={false} />
            </Field>
            <Field label="Name customers see when paying">
              <input style={inputStyle} value={cfg.upiName} onChange={e => set({ upiName: e.target.value })} placeholder={cfg.businessName || 'Business name'} />
            </Field>
          </>
        )}
      </div>

      {/* Local listing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ide-text)' }}>Google & AI search details</div>
          <MicroLabel style={{ textTransform: 'none', letterSpacing: '0.02em' }}>Added as LocalBusiness data so search shows your phone, address and hours</MicroLabel>
        </div>
        <Field label="Phone (optional)" hint="Uses your WhatsApp number if left blank">
          <input style={inputStyle} inputMode="tel" value={cfg.phone} onChange={e => set({ phone: e.target.value })} />
        </Field>
        <Field label="Address">
          <input style={inputStyle} value={cfg.address} onChange={e => set({ address: e.target.value })} placeholder="Shop no., street, area" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          <Field label="City">
            <input style={inputStyle} value={cfg.city} onChange={e => set({ city: e.target.value })} />
          </Field>
          <Field label="Hours">
            <input style={inputStyle} value={cfg.hours} onChange={e => set({ hours: e.target.value })} placeholder="Mo-Sa 10:00-20:00" />
          </Field>
        </div>
      </div>

      <GlowButton onClick={apply} disabled={!canApply} style={{ width: '100%' }}>
        {busy === 'apply' ? 'Adding…' : flash && flash.startsWith('✓') ? flash : installed ? 'Update my app' : 'Add to my app'}
      </GlowButton>
      {installed && (
        <button type="button" onClick={remove} disabled={!!busy}
          style={{ background: 'none', border: 'none', color: 'var(--ide-text3)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
          {busy === 'remove' ? 'Removing…' : flash === 'Removed from your app' ? flash : 'Remove Grow kit from my app'}
        </button>
      )}
      <MicroLabel style={{ textAlign: 'center', textTransform: 'none', letterSpacing: '0.02em' }}>
        Buttons sit beside your app, not inside it · publish picks them up automatically
      </MicroLabel>

      {/* Next steps that live outside the app */}
      <div style={{ borderTop: '1px solid var(--ide-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <MicroLabel>Then, get found</MicroLabel>
        <a href="https://business.google.com/create" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 12, color: 'var(--ide-text)', textDecoration: 'none', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)' }}>
          <strong>List on Google Maps</strong>
          <div style={{ fontSize: 11, color: 'var(--ide-text3)', marginTop: 2 }}>Free Google Business Profile, add your published link as the website</div>
        </a>
        <button type="button" onClick={openLaunchKit}
          style={{ textAlign: 'left', fontSize: 12, color: 'var(--ide-text)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', cursor: 'pointer', fontFamily: 'inherit' }}>
          <strong>Counter QR + WhatsApp post</strong>
          <div style={{ fontSize: 11, color: 'var(--ide-text3)', marginTop: 2 }}>In Publish → Launch Kit once your app is live</div>
        </button>
      </div>
    </div>
  );
}
