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
import { GlowButton, MicroLabel, EmptyState } from './ui';

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
  const [busy, setBusy] = useState<string | null>(null); // entry.key + action
  const [status, setStatus] = useState<Record<string, string>>({});
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<string | null>(null);

  const persistFiles = (updated: typeof files) => {
    setFiles(updated);
    if (resolvedProjectId) {
      fetch('/api/projects', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: resolvedProjectId, files: updated, userId: (project as { userId?: string } | null)?.userId || 'auto' }),
      }).catch(() => {});
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
    if (!prompt) { setStat(entry.key, 'Describe the image first'); return; }
    setBusy(entry.key + ':regen');
    try {
      const res = await fetch('/api/images/regenerate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: resolvedProjectId, prompt, ratio: entry.ratio, transparent: !!transparent[entry.key] }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) { setStat(entry.key, data.error || 'Generation failed — not charged'); return; }
      replaceEverywhere(entry.key, data.url);
      if (typeof data.credits === 'number') setCredits(data.credits);
      setStat(entry.key, '✓ New image saved');
    } catch {
      setStat(entry.key, 'Network error — not charged');
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
      if (!url) { setStat(entry.key, 'No generated image yet — Regenerate first'); return; }
      replaceEverywhere(entry.key, url);
      setStat(entry.key, '✓ Pinned');
    } catch {
      setStat(entry.key, 'Network error');
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
        if (!res.ok || !data.url) { setStat(targetKey, data.error || 'Upload failed'); return; }
        replaceEverywhere(targetKey, data.url);
        setStat(targetKey, '✓ Uploaded & saved');
      } catch {
        setStat(targetKey, 'Upload failed');
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
          title="No images in this app yet"
          hint="Ask for imagery in chat (a hero photo, product shots) and it shows up here for regeneration, uploads and transparency."
        />
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <MicroLabel>{entries.length} image{entries.length === 1 ? '' : 's'} in your app</MicroLabel>
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
                    placeholder={entry.kind === 'persisted' ? 'Describe the replacement image…' : 'Image prompt'}
                    rows={2}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--ide-border)', borderRadius: 7, color: 'var(--ide-text)', fontSize: 11, lineHeight: 1.5, padding: '6px 9px', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-sans)' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <GlowButton size="sm" onClick={() => regenerate(entry)} disabled={isBusy}>
                      {action === 'regen' ? 'Generating…' : `↻ Regenerate · 1cr`}
                    </GlowButton>
                    <button onClick={() => startUpload(entry)} disabled={isBusy}
                      style={{ fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 7, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text2)', cursor: 'pointer' }}>
                      {action === 'upload' ? 'Uploading…' : '⬆ Upload · free'}
                    </button>
                    {entry.kind === 'directive' && (
                      <button onClick={() => pin(entry)} disabled={isBusy} title="Freeze the current generated image into your code (uses the cached image — free)"
                        style={{ fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 7, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--ide-text2)', cursor: 'pointer' }}>
                        {action === 'pin' ? 'Pinning…' : '📌 Pin'}
                      </button>
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', marginLeft: 'auto' }} title="Generate the next image with a transparent background (logos, cut-outs)">
                      <input type="checkbox" checked={!!transparent[entry.key]}
                        onChange={e => setTransparent(t => ({ ...t, [entry.key]: e.target.checked }))}
                        style={{ accentColor: 'var(--brand-accent)' }} />
                      <MicroLabel>Transparent</MicroLabel>
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <MicroLabel>{entry.kind === 'directive' ? `directive · ${entry.ratio}` : 'generated image in source'}</MicroLabel>
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
