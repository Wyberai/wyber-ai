'use client';
// Images panel — every image in the app, managed in one place.
//
// Two kinds of entries:
//   • {{wyber-image: …}} directives still in the source (extracted per render)
//   • already-persisted generated-images URLs baked into the source
// Regenerate calls /api/images/regenerate (fresh nonce + force, so the
// idempotent cache can never return the old picture) and PINS the new
// permanent URL into the source — preview and publish both ship it.
// Uploads are free; regens charge credits (server-priced).
import { useMemo, useRef, useState } from 'react';
import { useEditorStore } from '@/store/editor';
import { extractImageDirectives, replaceTokenInFiles, gradientDataUri } from '@/lib/image-directives';
import { persistProjectFiles } from '@/lib/persist-project';
import { GlowButton, MicroLabel, EmptyState } from './ui';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_DESIGN_STRINGS } from '@/lib/i18n/dict/editor-design';

interface ImageEntry {
  /** exact source string to replace (directive token or persisted URL) */
  key: string
  kind: 'directive' | 'persisted'
  prompt: string
  ratio: string
  thumb: string
}

const PERSISTED_URL_RE = /https?:\/\/[^\s"'`)]+\/storage\/v1\/object\/public\/generated-images\/[^\s"'`)]+/g;

export function ImagesPanel({ projectId }: { projectId?: string }) {
  const t = useT(EDITOR_DESIGN_STRINGS);
  const { files, setFiles, project, setCredits, credits } = useEditorStore();
  const resolvedProjectId = projectId || project?.id;

  const entries = useMemo<ImageEntry[]>(() => {
    const out: ImageEntry[] = [];
    for (const d of extractImageDirectives(files)) {
      out.push({ key: d.token, kind: 'directive', prompt: d.prompt, ratio: d.ratio, thumb: gradientDataUri(d.prompt, d.ratio) });
    }
    const seen = new Set<string>();
    for (const val of Object.values(files)) {
      const content = (val as { content?: string })?.content ?? '';
      for (const m of content.matchAll(PERSISTED_URL_RE)) {
        if (seen.has(m[0])) continue;
        seen.add(m[0]);
        out.push({ key: m[0], kind: 'persisted', prompt: '', ratio: '1792x1024', thumb: m[0] });
      }
    }
    return out;
  }, [files]);

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [transparent, setTransparent] = useState<Record<string, boolean>>({});
  const [hero, setHero] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null); // entry.key + action
  const [status, setStatus] = useState<Record<string, string>>({});
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<string | null>(null);

  const persistFiles = (updated: typeof files) => {
    setFiles(updated);
    if (resolvedProjectId) {
      void persistProjectFiles(resolvedProjectId, updated, (project as { userId?: string } | null)?.userId);
    }
  };

  const replaceEverywhere = (oldStr: string, url: string) => {
    persistFiles(replaceTokenInFiles(files, oldStr, url) as typeof files);
  };

  const setStat = (key: string, msg: string) => {
    setStatus(s => ({ ...s, [key]: msg }));
    setTimeout(() => setStatus(s => (s[key] === msg ? { ...s, [key]: '' } : s)), 3500);
  };

  const regenerate = async (entry: ImageEntry) => {
    if (!resolvedProjectId || busy) return;
    const prompt = (drafts[entry.key] ?? entry.prompt).trim();
    if (!prompt) { setStat(entry.key, t('describeImageFirst')); return; }
    setBusy(entry.key + ':regen');
    try {
      const res = await fetch('/api/images/regenerate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: resolvedProjectId, prompt, ratio: entry.ratio,
          transparent: !!transparent[entry.key],
          ...(hero[entry.key] ? { quality: 'high' } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) { setStat(entry.key, data.error || t('generationFailedNotCharged')); return; }
      replaceEverywhere(entry.key, data.url);
      if (typeof data.credits === 'number') setCredits(data.credits);
      setStat(entry.key, t('newImageSaved'));
    } catch {
      setStat(entry.key, t('networkErrorNotCharged'));
    } finally {
      setBusy(null);
    }
  };

  // Directive → its already-cached generated URL, written into the source. 0
  // credits (resolve-directives reuses the cache the preview already paid for).
  const pin = async (entry: ImageEntry) => {
    if (!resolvedProjectId || busy || entry.kind !== 'directive') return;
    setBusy(entry.key + ':pin');
    try {
      const res = await fetch('/api/images/resolve-directives', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: resolvedProjectId, directives: [{ token: entry.key, prompt: entry.prompt, ratio: entry.ratio }] }),
      });
      const data = await res.json();
      const url = data?.urls?.[entry.key];
      if (!url) { setStat(entry.key, t('noGeneratedImageYet')); return; }
      replaceEverywhere(entry.key, url);
      setStat(entry.key, t('pinnedDone'));
    } catch {
      setStat(entry.key, t('networkError'));
    } finally {
      setBusy(null);
    }
  };

  const startUpload = (entry: ImageEntry) => {
    uploadTarget.current = entry.key;
    uploadInputRef.current?.click();
  };

  const handleUploadFile = (file: File | undefined) => {
    const targetKey = uploadTarget.current;
    uploadTarget.current = null;
    if (!file || !targetKey || !resolvedProjectId) return;
    setBusy(targetKey + ':upload');
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const dataUrl = e.target?.result as string;
        const b64 = dataUrl.split(',')[1];
        const res = await fetch('/api/images/upload', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: resolvedProjectId, b64, mimeType: file.type }),
        });
        const data = await res.json();
        if (!res.ok || !data.url) { setStat(targetKey, data.error || t('uploadFailed')); return; }
        replaceEverywhere(targetKey, data.url);
        setStat(targetKey, t('uploadedAndSaved'));
      } catch {
        setStat(targetKey, t('uploadFailed'));
      } finally {
        setBusy(null);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      <input ref={uploadInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" style={{ display: 'none' }}
        onChange={e => { handleUploadFile(e.target.files?.[0]); e.target.value = ''; }} />

      {entries.length === 0 ? (
        <EmptyState
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>}
          title={t('noImagesYetTitle')}
          hint={t('noImagesYetHint')}
        />
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <MicroLabel>{t('imagesCountLabel').replace('{count}', String(entries.length)).replace('{plural}', entries.length === 1 ? '' : 's')}</MicroLabel>
            <MicroLabel color="var(--ide-text2)">{credits} cr</MicroLabel>
          </div>
          {entries.map(entry => {
            const isBusy = busy?.startsWith(entry.key + ':') ?? false;
            const action = busy?.slice(entry.key.length + 1);
            return (
              <div key={entry.key} style={{ border: '1px solid var(--ide-border)', borderRadius: 10, background: 'var(--bg-surface)', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.thumb} alt="" style={{ width: '100%', height: 96, objectFit: 'cover', display: 'block', background: 'var(--bg-elevated)' }} />
                <div style={{ padding: 9, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <textarea
                    value={drafts[entry.key] ?? entry.prompt}
                    onChange={e => setDrafts(d => ({ ...d, [entry.key]: e.target.value }))}
                    placeholder={entry.kind === 'persisted' ? t('replaceImagePlaceholder') : t('imagePromptPlaceholderShort')}
                    rows={2}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--ide-border)', borderRadius: 7, color: 'var(--ide-text)', fontSize: 11, lineHeight: 1.5, padding: '6px 9px', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-sans)' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <GlowButton size="sm" onClick={() => regenerate(entry)} disabled={isBusy}>
                      {action === 'regen' ? t('regeneratingEllipsis') : hero[entry.key] ? t('regenerateHeroButton') : t('regenerateButton')}
                    </GlowButton>
                    <button onClick={() => startUpload(entry)} disabled={isBusy}
                      style={{ fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 7, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text2)', cursor: 'pointer' }}>
                      {action === 'upload' ? t('uploadingEllipsis') : t('uploadButton')}
                    </button>
                    {entry.kind === 'directive' && (
                      <button onClick={() => pin(entry)} disabled={isBusy} title={t('pinTooltip')}
                        style={{ fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 7, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text2)', cursor: 'pointer' }}>
                        {action === 'pin' ? t('pinningEllipsis') : t('pinButton')}
                      </button>
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', marginLeft: 'auto' }} title={t('heroQualityTooltip')}>
                      <input type="checkbox" checked={!!hero[entry.key]}
                        onChange={e => setHero(h => ({ ...h, [entry.key]: e.target.checked }))}
                        style={{ accentColor: 'var(--brand-accent)' }} />
                      <MicroLabel>{t('heroQualityLabel')}</MicroLabel>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }} title={t('transparentTooltip')}>
                      <input type="checkbox" checked={!!transparent[entry.key]}
                        onChange={e => setTransparent(tr => ({ ...tr, [entry.key]: e.target.checked }))}
                        style={{ accentColor: 'var(--brand-accent)' }} />
                      <MicroLabel>{t('transparentLabel')}</MicroLabel>
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <MicroLabel>{entry.kind === 'directive' ? t('directiveRatioLabel').replace('{ratio}', entry.ratio) : t('generatedImageInSource')}</MicroLabel>
                    {status[entry.key] && <MicroLabel color={status[entry.key].startsWith('✓') ? 'var(--ide-green)' : 'var(--ide-amber)'}>{status[entry.key]}</MicroLabel>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
