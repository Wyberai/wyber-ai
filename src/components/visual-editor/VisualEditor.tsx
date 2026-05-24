'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditorStore } from '@/store/editor';

interface SelectedElement {
  tagName: string;
  text: string;
  path: string;          // CSS selector path
  styles: Record<string, string>;
  rect: DOMRect;
}

interface Props { previewUrl: string | null; }

export function VisualEditor({ previewUrl }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selected, setSelected] = useState<SelectedElement | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { isGenerating } = useEditorStore();

  // Inject selection overlay script into iframe
  const injectScript = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;
    const doc = iframe.contentDocument;

    // Add CSS for hover/selection highlighting
    const style = doc.createElement('style');
    style.id = '__wyber_style';
    style.textContent = `
      .__wyber_hover { outline: 2px solid #7c6ef7 !important; outline-offset: 2px !important; cursor: crosshair !important; }
      .__wyber_selected { outline: 2px solid #3dd68c !important; outline-offset: 2px !important; }
    `;
    if (!doc.getElementById('__wyber_style')) doc.head?.appendChild(style);

    // Add hover+click listeners
    const handleMouseOver = (e: Event) => {
      if (!isEditMode) return;
      const el = e.target as HTMLElement;
      doc.querySelectorAll('.__wyber_hover').forEach(n => n.classList.remove('__wyber_hover'));
      el.classList.add('__wyber_hover');
      e.stopPropagation();
    };

    const handleClick = (e: Event) => {
      if (!isEditMode) return;
      e.preventDefault();
      e.stopPropagation();
      const el = e.target as HTMLElement;
      doc.querySelectorAll('.__wyber_selected').forEach(n => n.classList.remove('__wyber_selected'));
      el.classList.add('__wyber_selected');

      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      setSelected({
        tagName: el.tagName.toLowerCase(),
        text: el.innerText?.slice(0, 100) ?? '',
        path: getSelector(el),
        styles: {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          padding: styles.padding,
          margin: styles.margin,
          borderRadius: styles.borderRadius,
          display: styles.display,
        },
        rect,
      });
    };

    doc.body?.addEventListener('mouseover', handleMouseOver, true);
    doc.body?.addEventListener('click', handleClick, true);
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode) { setSelected(null); return; }
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.addEventListener('load', injectScript);
    injectScript();
    return () => iframe.removeEventListener('load', injectScript);
  }, [isEditMode, injectScript]);

  function getSelector(el: HTMLElement): string {
    const path: string[] = [];
    let current: HTMLElement | null = el;
    while (current && current.tagName !== 'BODY') {
      let selector = current.tagName.toLowerCase();
      if (current.id) selector += `#${current.id}`;
      else if (current.className) selector += `.${current.className.trim().split(/\s+/)[0]}`;
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(' > ');
  }

  const { addMessage, setIsGenerating, appendStreamingContent, setStreamingContent, clearStreamingContent, updateMessage, setFiles, files, framework } = useEditorStore();

  const applyVisualEdit = async (instruction: string) => {
    if (!selected) return;
    const prompt = `The user clicked on a \`${selected.tagName}\` element with text "${selected.text}" (CSS path: \`${selected.path}\`). They want to: ${instruction}. Apply this change visually in the code. Only modify the necessary file(s).`;

    const id = Math.random().toString(36).slice(2, 9);
    addMessage({ id, role: 'assistant', content: '', timestamp: Date.now(), status: 'streaming' });
    setIsGenerating(true);
    clearStreamingContent();

    const fileContext = Object.entries(files).slice(0, 20).map(([p, f]) => `<file path="${p}">\n${f.content.slice(0, 3000)}\n</file>`).join('\n\n');

    const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, framework, fileContext, history: [] }) });
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      full += chunk;
      appendStreamingContent(chunk);
      setStreamingContent(full);
    }

    // Parse and apply files
    const { parseGenerationOutput } = await import('@/lib/file-parser');
    const { files: newFiles, chatText } = parseGenerationOutput(full);
    if (newFiles.length > 0) {
      const updated = { ...files };
      for (const { path, content } of newFiles) {
        const ext = path.split('.').pop() ?? '';
        const langMap: Record<string, string> = { ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript', css: 'css', html: 'html', json: 'json', vue: 'vue' };
        updated[path] = { path, content, language: langMap[ext] ?? 'plaintext' };
      }
      setFiles(updated);
    }
    updateMessage(id, { content: chatText || full, status: 'done', filesChanged: newFiles.map(f => f.path) });
    setIsGenerating(false);
    clearStreamingContent();
    setSelected(null);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 40, borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', flexShrink: 0 }}>
        <button
          onClick={() => setIsEditMode(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: `1px solid ${isEditMode ? 'var(--accent)' : 'var(--border)'}`, background: isEditMode ? 'var(--accent-glow)' : 'transparent', color: isEditMode ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
        >
          <span style={{ fontSize: 14 }}>◎</span> {isEditMode ? 'Editing — click any element' : 'Visual Edit'}
        </button>
        {selected && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>&lt;{selected.tagName}&gt; selected</span>
        )}
      </div>

      {/* Iframe */}
      {previewUrl ? (
        <iframe ref={iframeRef} src={previewUrl} style={{ flex: 1, border: 'none', background: '#fff' }} sandbox="allow-scripts allow-same-origin allow-forms" title="Preview" />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, opacity: 0.2 }}>⬡</div>
          <div style={{ fontSize: 13 }}>Preview appears here once E2B sandbox starts</div>
        </div>
      )}

      {/* Element edit panel */}
      {selected && isEditMode && (
        <ElementEditPanel selected={selected} onApply={applyVisualEdit} onDismiss={() => setSelected(null)} />
      )}
    </div>
  );
}

function ElementEditPanel({ selected, onApply, onDismiss }: { selected: SelectedElement; onApply: (instruction: string) => void; onDismiss: () => void; }) {
  const [instruction, setInstruction] = useState('');
  const quickEdits = [
    'Make it larger', 'Make it smaller', 'Change color to blue', 'Make it bold',
    'Add more padding', 'Make it rounded', 'Center it', 'Add a border',
  ];

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', padding: 14, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
          Edit &lt;{selected.tagName}&gt; {selected.text ? `"${selected.text.slice(0, 30)}"` : ''}
        </span>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>

      {/* Quick edits */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {quickEdits.map(q => (
          <button key={q} onClick={() => onApply(q)} style={{ padding: '3px 9px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}>
            {q}
          </button>
        ))}
      </div>

      {/* Custom instruction */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={instruction} onChange={e => setInstruction(e.target.value)}
          placeholder="Describe your change... e.g. make the background dark purple"
          onKeyDown={e => { if (e.key === 'Enter') { onApply(instruction); setInstruction(''); } }}
          style={{ flex: 1, padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
        />
        <button onClick={() => { onApply(instruction); setInstruction(''); }} className="btn btn-primary" style={{ fontSize: 12 }}>Apply ⚡</button>
      </div>
    </div>
  );
}
