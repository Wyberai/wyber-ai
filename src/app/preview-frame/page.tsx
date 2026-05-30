'use client';
import { useEffect, useRef, useState } from 'react';

type FileTree = Record<string, any>;

function filesToTree(files: Record<string, { content: string }>): FileTree {
  const tree: FileTree = {};
  for (const [path, file] of Object.entries(files)) {
    const parts = path.replace(/^\//, '').split('/').filter(Boolean);
    let node = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]]) node[parts[i]] = { directory: {} };
      node = node[parts[i]].directory;
    }
    node[parts[parts.length - 1]] = { file: { contents: file.content } };
  }
  return tree;
}

function getDevArgs(framework: string): [string, string[]] {
  if (framework === 'next') return ['npm', ['run', 'dev']];
  if (framework === 'vue') return ['npm', ['run', 'dev', '--', '--host']];
  return ['npm', ['run', 'dev', '--', '--host', '0.0.0.0', '--port', '3000']];
}

let wcInstance: any = null;

export default function PreviewFrame() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState('Waiting for files...');
  const [statusType, setStatusType] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const initialized = useRef(false);

  const log = (msg: string) => {
    console.log('[WebContainer]', msg);
    setLogs(prev => [...prev.slice(-80), msg]);
  };

  const boot = async (files: Record<string, { content: string }>, framework: string) => {
    if (initialized.current && wcInstance) {
      // Hot update files only
      log(`Hot updating ${Object.keys(files).length} files...`);
      for (const [path, file] of Object.entries(files)) {
        try {
          const dir = path.split('/').slice(0, -1).join('/');
          if (dir) await wcInstance.fs.mkdir(dir, { recursive: true }).catch(() => {});
          await wcInstance.fs.writeFile(path.replace(/^\//, ''), file.content);
        } catch {}
      }
      log('Files updated - hot reload triggered');
      return;
    }

    initialized.current = true;
    setStatusType('loading');

    try {
      setStatus('Booting WebContainer...');
      log('Importing WebContainer API...');
      const { WebContainer } = await import('@webcontainer/api');

      if (!wcInstance) {
        wcInstance = await WebContainer.boot();
        log('WebContainer booted successfully');
      }

      const wc = wcInstance;

      wc.on('server-ready', (port: number, url: string) => {
        log(`Server ready on port ${port}: ${url}`);
        setPreviewUrl(url);
        setStatus(`Running on port ${port}`);
        setStatusType('ready');
        if (iframeRef.current) iframeRef.current.src = url;
      });

      wc.on('error', (err: Error) => {
        log(`Runtime error: ${err.message}`);
        setStatus(`Error: ${err.message}`);
        setStatusType('error');
      });

      setStatus('Mounting files...');
      log(`Mounting ${Object.keys(files).length} files...`);
      await wc.mount(filesToTree(files));
      log('Files mounted');

      setStatus('Installing dependencies...');
      log('Running npm install...');
      const install = await wc.spawn('npm', ['install']);
      install.output.pipeTo(new WritableStream({
        write(chunk) { log(chunk.toString().trim()); }
      }));
      const installExit = await install.exit;
      if (installExit !== 0) throw new Error(`npm install exited with code ${installExit}`);
      log('npm install complete');

      const [cmd, args] = getDevArgs(framework);
      setStatus(`Starting ${framework} dev server...`);
      log(`Running: ${cmd} ${args.join(' ')}`);
      const dev = await wc.spawn(cmd, args);
      dev.output.pipeTo(new WritableStream({
        write(chunk) { log(chunk.toString().trim()); }
      }));

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`Fatal: ${msg}`);
      setStatus(`Error: ${msg}`);
      setStatusType('error');
      initialized.current = false;
    }
  };

  useEffect(() => {
    // Receive files via BroadcastChannel (same origin)
    const bc = new BroadcastChannel('wyber-preview');
    bc.onmessage = (e) => {
      if (e.data?.type === 'files') {
        boot(e.data.files, e.data.framework);
      }
    };

    // Also receive via postMessage (for iframe embed fallback)
    const msgHandler = (e: MessageEvent) => {
      if (e.data?.type === 'init' || e.data?.type === 'files') {
        boot(e.data.files, e.data.framework ?? 'react-vite');
      }
    };
    window.addEventListener('message', msgHandler);

    // Tell parent we are ready
    window.parent?.postMessage({ type: 'frame-ready' }, '*');
    bc.postMessage({ type: 'frame-ready' });

    // Check if files were stored in sessionStorage (new tab flow)
    try {
      const stored = sessionStorage.getItem('wyber-preview-files');
      if (stored) {
        const { files, framework } = JSON.parse(stored);
        sessionStorage.removeItem('wyber-preview-files');
        boot(files, framework);
      }
    } catch {}

    return () => { bc.close(); window.removeEventListener('message', msgHandler); };
  }, []);

  const COLOR: Record<string, string> = {
    idle: '#525252', loading: '#F59E0B', ready: '#22C55E', error: '#EF4444'
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#09090B', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

      {/* Status bar */}
      <div style={{ height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111113' }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: COLOR[statusType], boxShadow: statusType === 'loading' ? `0 0 8px ${COLOR[statusType]}` : 'none', animation: statusType === 'loading' ? 'pulse 1.5s infinite' : 'none', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: statusType === 'error' ? '#EF4444' : 'rgba(255,255,255,0.5)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{status}</span>
        {previewUrl && <a href={previewUrl} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#0EA5E9', textDecoration: 'none', flexShrink: 0 }}>Open ↗</a>}
      </div>

      {/* Loading screen */}
      {statusType !== 'ready' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 }}>
          {statusType === 'loading' && (
            <div style={{ display: 'flex', gap: 5 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', animation: `bounce 1.2s ${i*0.15}s ease-in-out infinite` }} />
              ))}
            </div>
          )}
          <div style={{ maxWidth: 480, width: '100%', maxHeight: 300, overflow: 'auto', background: '#0F0F11', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px' }}>
            {logs.length === 0
              ? <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '12px 0' }}>Waiting for files...</div>
              : logs.slice(-30).map((line, i) => (
                <div key={i} style={{ fontSize: 10, fontFamily: 'monospace', lineHeight: 1.7, color: line.includes('error') || line.includes('Error') ? '#F87171' : line.includes('ready') || line.includes('complete') ? '#4ADE80' : 'rgba(255,255,255,0.4)', wordBreak: 'break-all' }}>
                  {line}
                </div>
              ))
            }
          </div>
          {statusType === 'loading' && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.7 }}>
              Installing dependencies — 30 to 60 seconds first time<br/>
              <span style={{ color: 'rgba(255,255,255,0.15)' }}>Hot reload on every change after that</span>
            </div>
          )}
        </div>
      )}

      {/* Live preview iframe */}
      <iframe
        ref={iframeRef}
        style={{ flex: 1, border: 'none', display: statusType === 'ready' ? 'block' : 'none', background: '#fff' }}
        allow="cross-origin-isolated"
        title="Live App Preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
      />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>
    </div>
  );
}
