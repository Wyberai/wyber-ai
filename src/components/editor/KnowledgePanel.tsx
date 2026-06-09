'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@/store/editor';

interface Props {
  projectId?: string;
}

export function KnowledgePanel({ projectId }: Props) {
  const { knowledge, setKnowledge, files, framework } = useEditorStore();
  const [localValue, setLocalValue] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [generating, setGenerating] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load knowledge from store (already hydrated by IDELayout) on mount
  useEffect(() => {
    setLocalValue(knowledge || '');
    setLoaded(true);
  }, [knowledge]);

  // Debounced auto-save to Supabase
  const save = useCallback((value: string) => {
    if (!projectId) return;
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await fetch('/api/projects/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, knowledge: value }),
        });
        setKnowledge(value); // keep store in sync so generation picks it up
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 1500);
      } catch {
        setSaveState('idle');
      }
    }, 700);
  }, [projectId, setKnowledge]);

  const handleChange = (value: string) => {
    setLocalValue(value);
    save(value);
  };

  // Auto-generate knowledge from current app files (Lovable's "T=0" feature)
  const handleGenerate = async () => {
    if (generating || Object.keys(files).length === 0) return;
    setGenerating(true);
    try {
      const fileContext = Object.entries(files)
        .slice(0, 12)
        .map(([path, f]) => `<file path="${path}">\n${(f as any).content.slice(0, 1500)}\n</file>`)
        .join('\n\n');

      const prompt = `Analyze this ${framework} app's files and write a concise project knowledge document (a PRD-style brief). Include: product vision (1-2 sentences), core features (bullet list), the design system/visual style observed, and any user roles. Keep it under 300 words. Output ONLY the knowledge document as plain markdown text, no code, no file blocks, no preamble.`;

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, framework, fileContext, history: [], modelTier: 'fast', projectId }),
      });

      if (!res.body) throw new Error('No response');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let raw = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
      }
      // Strip any stray file blocks just in case
      const cleaned = raw.replace(/<file[\s\S]*?<\/file>/g, '').trim();
      const finalText = cleaned || raw.trim();
      setLocalValue(finalText);
      save(finalText);
    } catch (err) {
      console.error('Knowledge generation failed:', err);
    }
    setGenerating(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      {/* Explainer */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--ide-border)', flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: 'var(--ide-text2)', margin: 0, lineHeight: 1.5 }}>
          Knowledge is your project's brain. It's sent with <strong style={{ color: 'var(--ide-text)' }}>every prompt</strong> so the AI always understands your vision, features, design system, and rules.
        </p>
      </div>

      {/* Auto-generate */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--ide-border)', flexShrink: 0 }}>
        <button
          onClick={handleGenerate}
          disabled={generating || Object.keys(files).length === 0}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8,
            border: '1px solid var(--accent-dim)',
            background: generating ? 'var(--bg-overlay)' : 'var(--accent-glow)',
            color: 'var(--accent)', fontSize: 12, fontWeight: 600,
            cursor: generating || Object.keys(files).length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: Object.keys(files).length === 0 ? 0.5 : 1,
          }}
        >
          {generating ? (
            <><span style={{ width: 11, height: 11, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Analyzing your app...</>
          ) : (
            <>✦ Auto-generate from current app</>
          )}
        </button>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--ide-text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Knowledge</span>
          <span style={{ fontSize: 10, color: saveState === 'saved' ? 'var(--ide-green)' : 'var(--ide-text3)' }}>
            {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? '✓ Saved' : ''}
          </span>
        </div>
        <textarea
          value={localValue}
          onChange={e => handleChange(e.target.value)}
          placeholder={`# Product Vision\nWhat are you building and for whom?\n\n# Core Features\n- Feature one\n- Feature two\n\n# Design System\nColors, fonts, style direction\n\n# User Roles\nAdmin, User, etc. and what each can do\n\n# Rules\nThings the AI should never change`}
          style={{
            flex: 1, width: '100%', resize: 'none',
            background: 'var(--bg-elevated)', border: '1px solid var(--ide-border)',
            borderRadius: 8, padding: '12px', color: 'var(--ide-text)',
            fontSize: 12, lineHeight: 1.6, fontFamily: 'var(--font-mono, monospace)',
            outline: 'none',
          }}
        />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
