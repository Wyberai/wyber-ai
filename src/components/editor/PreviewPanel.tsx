'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditorStore } from '@/store/editor';

/**
 * PreviewPanel — Auto-deploy preview
 * 
 * On generation complete → auto-deploy to Vercel → show live URL in iframe
 * No in-browser bundling, no CDN timeouts, no Sandpack.
 * Real deployed app every time.
 */

export function PreviewPanel() {
  const { files, isGenerating, project } = useEditorStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deployedFiles, setDeployedFiles] = useState<string>('');
  const prevIsGenerating = useRef(false);

  const hasFiles = Object.keys(files).length >= 2;

  const autoDeployToVercel = useCallback(async () => {
    if (!hasFiles || deploying) return;

    const currentFilesKey = Object.keys(files).sort().join(',');
    if (currentFilesKey === deployedFiles) return; // already deployed this version

    setDeploying(true);
    setError(null);

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          projectName: project?.name ?? 'wyber-app',
          projectId: project?.id,
        }),
      });

      const data = await res.json();

      if (data.url) {
        // Wait for deployment to be ready
        const liveUrl = data.url.startsWith('http') ? data.url : `https://${data.url}`;
        setPreviewUrl(liveUrl);
        setDeployedFiles(currentFilesKey);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError('Deploy failed — check your Vercel token in env vars');
      console.error('Auto-deploy error:', err);
    } finally {
      setDeploying(false);
    }
  }, [files, hasFiles, deploying, deployedFiles, project]);

  // Auto-deploy when generation finishes
  useEffect(() => {
    if (prevIsGenerating.current && !isGenerating && hasFiles) {
      autoDeployToVercel();
    }
    prevIsGenerating.current = isGenerating;
  }, [isGenerating, hasFiles, autoDeployToVercel]);

  // Auto-deploy when project loads with existing files
  const initialDeployDone = useRef(false);
  useEffect(() => {
    if (hasFiles && !initialDeployDone.current && !isGenerating && !previewUrl) {
      initialDeployDone.current = true;
      autoDeployToVercel();
    }
  }, [hasFiles, isGenerating, previewUrl, autoDeployToVercel]);

  return (
    <div style={{
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#09090b',
      position: 'relative',
    }}>

      {/* Minimal toolbar */}
      <div style={{
        height: 36,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 8,
        borderBottom: '1px solid var(--ide-border)',
        background: 'var(--bg-base)',
        flexShrink: 0,
      }}>
        {/* Status dot + URL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: deploying ? '#f59e0b' : previewUrl ? '#22c55e' : '#52525b',
            boxShadow: deploying ? '0 0 6px rgba(245,158,11,0.5)' : previewUrl ? '0 0 6px rgba(34,197,94,0.4)' : 'none',
          }} />
          {previewUrl ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                color: 'var(--ide-text3)',
                fontFamily: 'var(--font-mono)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
              }}
            >
              {previewUrl.replace('https://', '')}
            </a>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--ide-text3)', fontFamily: 'var(--font-mono)' }}>
              {isGenerating
                ? 'Generating your app...'
                : deploying
                ? 'Deploying preview...'
                : hasFiles
                ? 'Ready to deploy'
                : 'Type a prompt to generate your app'}
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
          {previewUrl && (
            <>
              <button
                onClick={() => iframeRef.current && (iframeRef.current.src = previewUrl)}
                title="Refresh"
                style={{
                  background: 'none', border: '1px solid var(--ide-border)',
                  borderRadius: 5, color: 'var(--ide-text3)', cursor: 'pointer',
                  padding: '2px 8px', fontSize: 11,
                }}
              >↺</button>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'none', border: '1px solid var(--ide-border)',
                  borderRadius: 5, color: 'var(--ide-text3)', cursor: 'pointer',
                  padding: '2px 8px', fontSize: 11, textDecoration: 'none',
                }}
              >↗</a>
            </>
          )}
          {hasFiles && !deploying && (
            <button
              onClick={autoDeployToVercel}
              title="Deploy preview"
              style={{
                background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)',
                borderRadius: 5, color: '#0EA5E9', cursor: 'pointer',
                padding: '2px 10px', fontSize: 11, fontWeight: 600,
              }}
            >
              {previewUrl ? 'Redeploy' : 'Deploy preview'}
            </button>
          )}
        </div>
      </div>

      {/* Preview content */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>

        {/* Empty state */}
        {!hasFiles && !isGenerating && !deploying && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 14, color: '#52525b',
          }}>
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="rgba(14,165,233,0.06)" stroke="rgba(14,165,233,0.12)" strokeWidth="1"/>
              <path d="M20 7L11 16L20 25" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 11L28 16L23 21" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
            </svg>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#71717a', marginBottom: 4 }}>
                Type a prompt and generate your app to see it live here
              </div>
              <div style={{ fontSize: 11, color: '#52525b' }}>
                Your app will auto-deploy and appear in this panel
              </div>
            </div>
          </div>
        )}

        {/* Generating overlay */}
        {isGenerating && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 14, background: '#09090b',
          }}>
            <div style={{
              width: 28, height: 28,
              border: '2px solid rgba(14,165,233,0.15)',
              borderTopColor: '#0EA5E9',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 4 }}>
                Building your app...
              </div>
              <div style={{ fontSize: 11, color: '#52525b' }}>
                Will auto-deploy when complete
              </div>
            </div>
          </div>
        )}

        {/* Deploying overlay */}
        {deploying && !isGenerating && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 14, background: '#09090b',
          }}>
            <div style={{
              width: 28, height: 28,
              border: '2px solid rgba(245,158,11,0.15)',
              borderTopColor: '#f59e0b',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 4 }}>
                Deploying preview...
              </div>
              <div style={{ fontSize: 11, color: '#52525b' }}>
                Usually takes 20–40 seconds
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !deploying && !isGenerating && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 5,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 12, padding: 24,
          }}>
            <div style={{ fontSize: 22 }}>⚠️</div>
            <div style={{ fontSize: 13, color: '#ef4444', textAlign: 'center', maxWidth: 320 }}>{error}</div>
            <button
              onClick={autoDeployToVercel}
              style={{
                padding: '7px 18px', borderRadius: 8, border: 'none',
                background: '#0EA5E9', color: 'white',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Live preview iframe */}
        {previewUrl && !deploying && !isGenerating && (
          <iframe
            ref={iframeRef}
            src={previewUrl}
            title="App Preview"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            allow="clipboard-write; clipboard-read"
          />
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
