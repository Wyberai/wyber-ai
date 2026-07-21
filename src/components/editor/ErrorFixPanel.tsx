'use client';
import { useState } from 'react';
import { useEditorStore } from '@/store/editor';
import { parseGenerationOutput } from '@/lib/file-parser';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_TOOLS_STRINGS } from '@/lib/i18n/dict/editor-tools';

export function ErrorFixPanel() {
  const t = useT(EDITOR_TOOLS_STRINGS);
  const [errorText, setErrorText] = useState('');
  const [fixing, setFixing] = useState(false);
  const { files, framework, setFiles, addMessage, updateMessage, setIsGenerating, clearStreamingContent, appendStreamingContent, setStreamingContent } = useEditorStore();

  const fix = async () => {
    if (!errorText.trim() || fixing) return;
    setFixing(true);
    setIsGenerating(true);
    clearStreamingContent();

    const fileContext = Object.entries(files).slice(0, 20).map(([p, f]) => `<file path="${p}">\n${f.content.slice(0, 3000)}\n</file>`).join('\n\n');
    const prompt = `Fix this error in my app. Do NOT charge me — this is error recovery mode.

ERROR:
${errorText}

Fix the root cause. Output only the changed files.`;

    const id = Math.random().toString(36).slice(2, 9);
    addMessage({ id, role: 'assistant', content: '', timestamp: Date.now(), status: 'streaming' });

    const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, framework, fileContext, history: [], isFix: true }) });
    let full = '';
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      full += chunk;
      appendStreamingContent(chunk);
      setStreamingContent(full);
    }

    const { files: newFiles, chatText } = parseGenerationOutput(full);
    if (newFiles.length > 0) {
      const updated = { ...files };
      for (const { path, content } of newFiles) {
        const ext = path.split('.').pop() ?? '';
        const langMap: Record<string, string> = { ts: 'typescript', tsx: 'typescript', js: 'javascript', css: 'css', html: 'html' };
        updated[path] = { path, content, language: langMap[ext] ?? 'plaintext' };
      }
      setFiles(updated);
    }
    updateMessage(id, { content: chatText || full, status: 'done', filesChanged: newFiles.map(f => f.path) });
    setIsGenerating(false);
    clearStreamingContent();
    setErrorText('');
    setFixing(false);
  };

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ background: 'rgba(61,214,140,0.05)', border: '1px solid rgba(61,214,140,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
        {t('errorFixInfoBox')}
      </div>
      <textarea
        value={errorText}
        onChange={e => setErrorText(e.target.value)}
        placeholder={`${t('errorFixPlaceholderIntro')}\n\nTypeError: Cannot read property 'map' of undefined\n    at App (src/App.tsx:24:18)`}
        rows={6}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'var(--font-mono)', lineHeight: 1.6, marginBottom: 10 }}
      />
      <button onClick={fix} disabled={fixing || !errorText.trim()} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
        {fixing ? t('errorFixFixing') : t('errorFixButton')}
      </button>
    </div>
  );
}
