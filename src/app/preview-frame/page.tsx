'use client';
import { useEffect, useRef, useState } from 'react';

type FileSystemTree = Record<string, any>;

function filesToWebContainerTree(files: Record<string, { content: string }>): FileSystemTree {
  const tree: FileSystemTree = {};
  for (const [path, file] of Object.entries(files)) {
    const parts = path.split('/').filter(Boolean);
    let node = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]]) node[parts[i]] = { directory: {} };
      node = node[parts[i]].directory;
    }
    node[parts[parts.length - 1]] = { file: { contents: file.content } };
  }
  return tree;
}

function getDevCommand(framework: string): [string, string[]] {
  if (framework === 'next') return ['npm', ['run', 'dev']];
  if (framework === 'vue') return ['npm', ['run', 'dev', '--', '--host']];
  return ['npm', ['run', 'dev', '--', '--host', '0.0.0.0']];
}

export default function PreviewFrame() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wcRef = useRef<any>(null);
  const [status, setStatus] = useState<'idle' | 'booting' | 'installing' | 'starting' | 'ready' | 'error'>('idle');
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const serverStartedRef = useRef(false);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-50), msg]);

  const initWebContainer = async (files: Record<string, { content: string }>, framework: string) => {
    try {
      setStatus('booting');
      addLog('Booting WebContainer...');

      const { WebContainer } = await import('@webcontainer/api');

      if (!wcRef.current) {
        wcRef.current = await WebContainer.boot();
        addLog('WebContainer booted');
      }

      const wc = wcRef.current;

      // Listen for server ready
      wc.on('server-ready', (port: number, url: string) => {
        addLog(`Server ready on port ${port}: ${url}`);
        if (iframeRef.current) {
          iframeRef.current.src = url;
        }
        setStatus('ready');
        serverStartedRef.current = true;
        window.parent.postMessage({ type: 'server-ready', url }, '*');
      });

      wc.on('error', (err: Error) => {
        addLog(`Error: ${err.message}`);
        setError(err.message);
        setStatus('error');
      });

      setStatus('installing');
      addLog('Mounting files...');
      const tree = filesToWebContainerTree(files);
      await wc.mount(tree);
      addLog(`Mounted ${Object.keys(files).length} files`);

      // Run npm install
      addLog('Running npm install...');
      const install = await wc.spawn('npm', ['install']);
      install.output.pipeTo(new WritableStream({
        write(data) { addLog(data); }
      }));
      const installCode = await install.exit;
      if (installCode !== 0) throw new Error(`npm install failed with code ${installCode}`);
      addLog('npm install complete');

      // Start dev server
      setStatus('starting');
      const [cmd, args] = getDevCommand(framework);
      addLog(`Starting ${cmd} ${args.join(' ')}...`);
      const dev = await wc.spawn(cmd, args);
      dev.output.pipeTo(new WritableStream({
        write(data) { addLog(data); }
      }));

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus('error');
      addLog(`Fatal error: ${msg}`);
      window.parent.postMessage({ type: 'error', message: msg }, '*');
    }
  };

  const updateFiles = async (files: Record<string, { content: string }>) => {
    if (!wcRef.current) return;
    for (const [path, file] of Object.entries(files)) {
      try {
        const dir = path.split('/').slice(0, -1).join('/');
        if (dir) await wcRef.current.fs.mkdir(dir, { recursive: true }).catch(() => {});
        await wcRef.current.fs.writeFile(path, file.content);
      } catch {}
    }
    addLog(`Updated ${Object.keys(files).length} files (hot reload)`);
  };

  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      if (e.data?.type === 'init') {
        serverStartedRef.current = false;
        await initWebContainer(e.data.files, e.data.framework);
      }
      if (e.data?.type === 'update-files' && serverStartedRef.current) {
        await updateFiles(e.data.files);
      }
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: 'frame-ready' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const STATUS_LABELS: Record<string, string> = {
    idle: 'Waiting for files...',
    booting: 'Booting WebContainer...',
    installing: 'Installing dependencies...',
    starting: 'Starting dev server...',
    ready: 'App is running',
    error: 'Error occurred',
  };

  const STATUS_COLORS: Record<string, string> = {
    idle: '#525252', booting: '#F59E0B', installing: '#F59E0B',
    starting: '#0EA5E9', ready: '#22C55E', error: '#EF4444',
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0A0A0A', fontFamily: 'system-ui, sans-serif' }}>
      {status !== 'ready' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {status !== 'idle' && status !== 'error' && (
              <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: STATUS_COLORS[status], borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            )}
            <span style={{ fontSize: 14, fontWeight: 500, color: STATUS_COLORS[status] || '#F5F5F5' }}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          {status === 'installing' && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
              This takes 30-60 seconds the first time.<br />
              Subsequent changes will hot-reload instantly.
            </div>
          )}
          {error && <div style={{ fontSize: 12, color: '#EF4444', maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>{error}</div>}
          {logs.length > 0 && (
            <div style={{ maxWidth: 480, width: '100%', maxHeight: 200, overflow: 'auto', background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px' }}>
              {logs.slice(-20).map((log, i) => (
                <div key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', lineHeight: 1.6, wordBreak: 'break-all' }}>{log}</div>
              ))}
            </div>
          )}
        </div>
      )}
      <iframe
        ref={iframeRef}
        style={{ flex: 1, border: 'none', display: status === 'ready' ? 'block' : 'none', background: '#fff' }}
        allow="cross-origin-isolated"
        title="Live Preview"
      />
      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
