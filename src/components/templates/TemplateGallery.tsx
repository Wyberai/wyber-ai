'use client';
import { useState, useEffect } from 'react';
import { EXTENDED_GALLERY, ALL_CATEGORIES } from '@/lib/templates/gallery';
import { useEditorStore } from '@/store/editor';
import { STARTER_TEMPLATES } from '@/lib/starter-templates';

interface CommunityTemplate {
  id: string; name: string; description: string; category: string;
  framework: string; tags: string[]; upvotes: number; use_count: number;
  thumbnail_url?: string;
}

interface Props { onClose?: () => void; }

export function TemplateGallery({ onClose }: Props) {
  const [tab, setTab] = useState<'curated' | 'community'>('curated');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState<string | null>(null);
  const [communityTemplates, setCommunityTemplates] = useState<CommunityTemplate[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [upvoting, setUpvoting] = useState<string | null>(null);

  const { setFiles, setFramework, addMessage, updateMessage, setIsGenerating, setStreamingContent, appendStreamingContent, clearStreamingContent } = useEditorStore();

  useEffect(() => {
    if (tab === 'community' && communityTemplates.length === 0) loadCommunity();
  }, [tab]);

  const loadCommunity = async () => {
    setCommunityLoading(true);
    try {
      const res = await fetch('/api/community-templates');
      const { templates } = await res.json();
      setCommunityTemplates(templates ?? []);
    } catch {}
    setCommunityLoading(false);
  };

  const upvote = async (templateId: string) => {
    setUpvoting(templateId);
    await fetch('/api/community-templates/upvote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId }) });
    setCommunityTemplates(t => t.map(tmpl => tmpl.id === templateId ? { ...tmpl, upvotes: tmpl.upvotes + 1 } : tmpl));
    setUpvoting(null);
  };

  const filtered = category === 'All' ? EXTENDED_GALLERY : EXTENDED_GALLERY.filter(t => t.category === category);

  const useTemplate = async (template: { framework: string; prompt: string; name: string }) => {
    if (loading) return;
    setLoading(template.name);
    const fw = template.framework as 'react-vite' | 'vue' | 'vanilla' | 'next';
    setFramework(fw);
    const starters = STARTER_TEMPLATES[fw];
    setFiles(starters);
    onClose?.();

    const msgId = Math.random().toString(36).slice(2,9);
    addMessage({ id: msgId, role: 'user', content: `Use template: ${template.name}`, timestamp: Date.now(), status: 'done' });
    const aId = Math.random().toString(36).slice(2,9);
    addMessage({ id: aId, role: 'assistant', content: '', timestamp: Date.now(), status: 'streaming' });
    setIsGenerating(true);
    clearStreamingContent();

    const fileContext = Object.entries(starters).map(([p, f]) => `<file path="${p}">\n${f.content.slice(0,2000)}\n</file>`).join('\n\n');
    const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: template.prompt, framework: template.framework, fileContext, history: [] }) });
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      full += chunk; appendStreamingContent(chunk); setStreamingContent(full);
    }
    const { parseGenerationOutput } = await import('@/lib/file-parser');
    const { files: newFiles, chatText } = parseGenerationOutput(full);
    if (newFiles.length > 0) {
      const updated = { ...starters };
      for (const { path, content } of newFiles) {
        const ext = path.split('.').pop() ?? '';
        const langMap: Record<string,string> = { ts:'typescript', tsx:'typescript', js:'javascript', css:'css', html:'html', json:'json', vue:'vue' };
        updated[path] = { path, content, language: langMap[ext] ?? 'plaintext' };
      }
      setFiles(updated);
    }
    updateMessage(aId, { content: chatText || full, status: 'done', filesChanged: newFiles.map(f => f.path) });
    setIsGenerating(false);
    clearStreamingContent();
    setLoading(null);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tab: Curated / Community */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {(['curated', 'community'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '8px', border: 'none', background: 'transparent', fontSize: 12, fontWeight: 500, cursor: 'pointer', borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`, color: tab === t ? 'var(--accent)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
            {t === 'curated' ? '⊞ Curated' : '◈ Community'}
          </button>
        ))}
      </div>

      {tab === 'curated' && (
        <>
          <div style={{ display: 'flex', gap: 5, padding: '8px 10px', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0 }}>
            {['All', ...ALL_CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                style={{ padding: '3px 9px', borderRadius: 12, border: '1px solid var(--border)', background: category === cat ? 'var(--accent)' : 'transparent', color: category === cat ? 'white' : 'var(--text-secondary)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: category === cat ? 500 : 400 }}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {filtered.map(t => (
                <button key={t.id} onClick={() => useTemplate(t)} disabled={!!loading}
                  style={{ textAlign: 'left', padding: '11px 12px', borderRadius: 9, border: '1px solid var(--border)', background: loading === t.name ? 'var(--accent-glow)' : 'var(--bg-elevated)', cursor: loading ? 'wait' : 'pointer' }}
                  className="template-card">
                  <div style={{ fontSize: 18, marginBottom: 5 }}>{t.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.description}</div>
                  {loading === t.name && <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 5 }}>⟳ Generating...</div>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'community' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
          {communityLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>Loading community templates...</div>
          ) : communityTemplates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.3 }}>◈</div>
              No community templates yet.<br />
              <span style={{ fontSize: 12 }}>Submit your project as a template from the Deploy tab.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {communityTemplates.map(t => (
                <div key={t.id} style={{ padding: '11px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{t.description}</div>
                    </div>
                    <button onClick={() => upvote(t.id)} disabled={upvoting === t.id}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }}>
                      <span>▲</span>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{t.upvotes}</span>
                    </button>
                  </div>
                  <button onClick={() => useTemplate({ ...t, emoji: '◈' } as any)} disabled={!!loading}
                    style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid var(--accent-dim)', background: 'var(--accent-glow)', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                    Use this template ⚡
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <style>{`.template-card:hover { border-color: var(--accent-dim) !important; }`}</style>
    </div>
  );
}
