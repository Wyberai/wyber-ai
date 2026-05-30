'use client';
import { useState, useEffect } from 'react';
import { EXTENDED_GALLERY, ALL_CATEGORIES } from '@/lib/templates/gallery';
import { useEditorStore } from '@/store/editor';
import { STARTER_TEMPLATES } from '@/lib/starter-templates';
import * as Icons from 'lucide-react'
import { getPrebuilt } from '@/lib/templates/prebuilt';

interface CommunityTemplate {
  id: string; name: string; description: string; category: string;
  framework: string; tags: string[]; upvotes: number; use_count: number;
  thumbnail_url?: string;
}

interface Props { onClose?: () => void; }

// Render a Lucide icon by name
function TemplateIcon({ name, size = 18, color = 'currentColor' }: { name: string; size?: number; color?: string }) {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>>)[name];
  if (!IconComponent) {
    const Fallback = Icons.Layout;
    return <Fallback size={size} color={color} strokeWidth={1.5} />;
  }
  return <IconComponent size={size} color={color} strokeWidth={1.5} />;
}

// Category accent colors
const CATEGORY_COLORS: Record<string, { bg: string; icon: string; border: string }> = {
  'SaaS':          { bg: 'rgba(14,165,233,0.1)',  icon: '#0EA5E9', border: 'rgba(14,165,233,0.2)' },
  'Healthcare':    { bg: 'rgba(16,185,129,0.1)',  icon: '#10b981', border: 'rgba(16,185,129,0.2)' },
  'Fintech':       { bg: 'rgba(16,185,129,0.1)',  icon: '#10b981', border: 'rgba(16,185,129,0.2)' },
  'Finance':       { bg: 'rgba(16,185,129,0.1)',  icon: '#10b981', border: 'rgba(16,185,129,0.2)' },
  'Education':     { bg: 'rgba(245,158,11,0.1)',  icon: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  'Marketing':     { bg: 'rgba(239,68,68,0.1)',   icon: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  'HR':            { bg: 'rgba(139,92,246,0.1)',  icon: '#8b5cf6', border: 'rgba(139,92,246,0.2)' },
  'Real Estate':   { bg: 'rgba(245,158,11,0.1)',  icon: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  'Legal':         { bg: 'rgba(100,116,139,0.1)', icon: '#94a3b8', border: 'rgba(100,116,139,0.2)' },
  'Logistics':     { bg: 'rgba(249,115,22,0.1)',  icon: '#f97316', border: 'rgba(249,115,22,0.2)' },
  'Hospitality':   { bg: 'rgba(236,72,153,0.1)',  icon: '#ec4899', border: 'rgba(236,72,153,0.2)' },
  'Manufacturing': { bg: 'rgba(100,116,139,0.1)', icon: '#64748b', border: 'rgba(100,116,139,0.2)' },
  'Retail':        { bg: 'rgba(14,165,233,0.1)',  icon: '#0EA5E9', border: 'rgba(14,165,233,0.2)' },
  'Government':    { bg: 'rgba(100,116,139,0.1)', icon: '#64748b', border: 'rgba(100,116,139,0.2)' },
  'Security':      { bg: 'rgba(239,68,68,0.1)',   icon: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  'DevOps':        { bg: 'rgba(14,165,233,0.1)',  icon: '#0EA5E9', border: 'rgba(14,165,233,0.2)' },
  'Sports':        { bg: 'rgba(16,185,129,0.1)',  icon: '#10b981', border: 'rgba(16,185,129,0.2)' },
  'E-commerce':    { bg: 'rgba(249,115,22,0.1)',  icon: '#f97316', border: 'rgba(249,115,22,0.2)' },
  'Productivity':  { bg: 'rgba(14,165,233,0.1)',  icon: '#0EA5E9', border: 'rgba(14,165,233,0.2)' },
  'Dev Tools':     { bg: 'rgba(100,116,139,0.1)', icon: '#94a3b8', border: 'rgba(100,116,139,0.2)' },
  'Business':      { bg: 'rgba(14,165,233,0.1)',  icon: '#0EA5E9', border: 'rgba(14,165,233,0.2)' },
  'Communication': { bg: 'rgba(139,92,246,0.1)',  icon: '#8b5cf6', border: 'rgba(139,92,246,0.2)' },
  'Health':        { bg: 'rgba(16,185,129,0.1)',  icon: '#10b981', border: 'rgba(16,185,129,0.2)' },
  'Personal':      { bg: 'rgba(245,158,11,0.1)',  icon: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  'Games':         { bg: 'rgba(139,92,246,0.1)',  icon: '#8b5cf6', border: 'rgba(139,92,246,0.2)' },
};

const DEFAULT_COLOR = { bg: 'rgba(14,165,233,0.1)', icon: '#0EA5E9', border: 'rgba(14,165,233,0.2)' };

export function TemplateGallery({ onClose }: Props) {
  const [tab, setTab] = useState<'curated' | 'community'>('curated');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [communityTemplates, setCommunityTemplates] = useState<CommunityTemplate[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);

  const { setFiles, setFramework, addMessage, updateMessage, setIsGenerating, setHasGeneratedFiles, setStreamingContent, appendStreamingContent, clearStreamingContent } = useEditorStore();

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

  // Filter templates
  const filtered = EXTENDED_GALLERY.filter(t => {
    const matchCat = category === 'All' || t.category === category;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const useTemplate = async (template: { id?: string; framework: string; prompt: string; name: string; icon?: string; category?: string }) => {
    if (loading) return;
    setLoading(template.name);
    const fw = template.framework as 'react-vite' | 'vue' | 'vanilla' | 'next';
    setFramework(fw);
    onClose?.();

    // Check for prebuilt template first — instant load, no generation needed
    const prebuilt = template.id ? getPrebuilt(template.id) : null;
    if (prebuilt) {
      const starters = STARTER_TEMPLATES[fw];
      const merged: typeof starters = { ...starters };
      for (const [path, code] of Object.entries(prebuilt)) {
        const ext = path.split('.').pop() ?? '';
        const langMap: Record<string, string> = { ts: 'typescript', tsx: 'typescript', js: 'javascript', css: 'css', html: 'html', json: 'json' };
        merged[path] = { path, content: code, language: langMap[ext] ?? 'plaintext' };
      }
      setFiles(merged);
      setHasGeneratedFiles(true);
      const msgId = Math.random().toString(36).slice(2, 9);
      addMessage({ id: msgId, role: 'user', content: `Use template: ${template.name}`, timestamp: Date.now(), status: 'done' });
      addMessage({ id: Math.random().toString(36).slice(2, 9), role: 'assistant', content: `Built: ${template.name} loaded instantly. Customize it by typing what to change.`, timestamp: Date.now(), status: 'done' });
      setLoading(null);
      return;
    }

    // Fallback: generate via AI
    const starters = STARTER_TEMPLATES[fw];
    setFiles(starters);
    setHasGeneratedFiles(false);

    const msgId = Math.random().toString(36).slice(2, 9);
    addMessage({ id: msgId, role: 'user', content: `Use template: ${template.name}`, timestamp: Date.now(), status: 'done' });
    const aId = Math.random().toString(36).slice(2, 9);
    addMessage({ id: aId, role: 'assistant', content: '', timestamp: Date.now(), status: 'streaming' });
    setIsGenerating(true);
    clearStreamingContent();

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: template.prompt + '\n\nIMPORTANT: Max 6 files total. src/App.tsx + max 4 components + src/index.css. Relative imports only. Complete files, no truncation.',
          framework: template.framework,
          fileContext: '',
          history: [],
          modelTier: 'fast',
        }),
      });

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

      const { parseGenerationOutput } = await import('@/lib/file-parser');
      const { files: newFiles, chatText } = parseGenerationOutput(full);

      if (newFiles.length > 0) {
        const updated = { ...starters };
        for (const { path, content } of newFiles) {
          const ext = path.split('.').pop() ?? '';
          const langMap: Record<string, string> = { ts: 'typescript', tsx: 'typescript', js: 'javascript', css: 'css', html: 'html', json: 'json', vue: 'vue' };
          updated[path] = { path, content, language: langMap[ext] ?? 'plaintext' };
        }
        setFiles(updated);
        setHasGeneratedFiles(true);
      }

      updateMessage(aId, { content: chatText || `Built: ${template.name}`, status: 'done', filesChanged: newFiles.map(f => f.path) });
    } catch (err) {
      updateMessage(aId, { content: `Error: ${String(err)}`, status: 'error' });
    }

    setIsGenerating(false);
    clearStreamingContent();
    setLoading(null);
  };

  const colors = (cat?: string) => CATEGORY_COLORS[cat ?? ''] ?? DEFAULT_COLOR;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--ide-border)', flexShrink: 0 }}>
        {(['curated', 'community'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '9px', border: 'none', background: 'transparent', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderBottom: `2px solid ${tab === t ? '#0EA5E9' : 'transparent'}`, color: tab === t ? '#0EA5E9' : 'var(--text-secondary)', transition: 'all 0.15s', letterSpacing: '-0.01em' }}>
            {t === 'curated' ? '▦ Templates' : '◈ Community'}
          </button>
        ))}
      </div>

      {tab === 'curated' && (
        <>
          {/* Search */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--ide-border)' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search 80+ templates..."
              style={{ width: '100%', padding: '6px 10px', borderRadius: 7, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 5, padding: '7px 10px', borderBottom: '1px solid var(--ide-border)', overflowX: 'auto', flexShrink: 0 }}>
            {['All', ...ALL_CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                style={{ padding: '3px 10px', borderRadius: 20, border: `1px solid ${category === cat ? '#0EA5E9' : 'var(--ide-border)'}`, background: category === cat ? 'rgba(14,165,233,0.1)' : 'transparent', color: category === cat ? '#0EA5E9' : 'var(--text-secondary)', fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Template count */}
          <div style={{ padding: '5px 10px 0', fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
            {filtered.length} template{filtered.length !== 1 ? 's' : ''}
          </div>

          {/* Grid */}
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {filtered.map(t => {
                const c = colors(t.category);
                const isLoading = loading === t.name;
                return (
                  <button key={t.id} onClick={() => useTemplate(t)} disabled={!!loading}
                    style={{
                      textAlign: 'left', padding: '12px', borderRadius: 10,
                      border: `1px solid ${isLoading ? '#0EA5E9' : 'var(--ide-border)'}`,
                      background: isLoading ? 'rgba(14,165,233,0.05)' : 'var(--bg-surface)',
                      cursor: loading ? 'wait' : 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex', flexDirection: 'column', gap: 8,
                      opacity: loading && !isLoading ? 0.5 : 1,
                    }}
                    onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.borderColor = c.icon; (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; } }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isLoading ? '#0EA5E9' : 'var(--ide-border)'; (e.currentTarget as HTMLElement).style.background = isLoading ? 'rgba(14,165,233,0.05)' : 'var(--bg-surface)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                  >
                    {/* Icon */}
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isLoading
                        ? <div style={{ width: 14, height: 14, border: `2px solid ${c.icon}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        : <TemplateIcon name={t.icon ?? 'Layout'} size={16} color={c.icon} />
                      }
                    </div>

                    {/* Text */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 2, lineHeight: 1.2 }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                        {t.description}
                      </div>
                    </div>

                    {/* Category badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: c.bg, color: c.icon, border: `1px solid ${c.border}`, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {t.category}
                      </span>
                      {isLoading && <span style={{ fontSize: 10, color: '#0EA5E9' }}>Generating...</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 12 }}>
                No templates match "{search}"
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'community' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
          {communityLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
          ) : communityTemplates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Icons.Layers size={18} color="#0EA5E9" />
              </div>
              No community templates yet.<br />
              <span style={{ fontSize: 11 }}>Generate an app and click ◈ Template to share it.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {communityTemplates.map(t => {
                const c = colors(t.category);
                return (
                  <div key={t.id} style={{ padding: '12px', borderRadius: 10, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)' }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icons.Layout size={15} color={c.icon} strokeWidth={1.5} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.description}</div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Icons.Triangle size={9} color="currentColor" />
                        {t.upvotes}
                      </div>
                    </div>
                    <button onClick={() => useTemplate(t as any)} disabled={!!loading}
                      style={{ width: '100%', padding: '7px', borderRadius: 7, border: '1px solid rgba(14,165,233,0.2)', background: 'rgba(14,165,233,0.05)', color: '#0EA5E9', fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <Icons.Zap size={11} />
                      Use template
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
