'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Template {
  app_id: string;
  name: string;
  category: string | null;
  preview_color: string | null;
}

export function TemplatesShowcase({ userId }: { userId?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('prebuilt_apps')
          .select('app_id, name, category, preview_color')
          .eq('valid', true)
          .order('category', { ascending: true });
        if (data) setTemplates(data as Template[]);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const categories = ['All', ...Array.from(new Set(templates.map(t => t.category).filter(Boolean) as string[]))];
  const filtered = activeCategory === 'All' ? templates : templates.filter(t => t.category === activeCategory);

  const openTemplate = async (templateId: string) => {
    if (!userId || opening) return;
    setOpening(templateId);
    try {
      const res = await fetch('/api/projects/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, userId }),
      });
      const data = await res.json();
      if (data.projectId) {
        router.push(`/project/${data.projectId}?type=app`);
      } else {
        setOpening(null);
      }
    } catch {
      setOpening(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px 0', color: 'var(--ide-text3, #71717a)', fontSize: 13 }}>
        Loading templates...
      </div>
    );
  }

  if (templates.length === 0) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ide-text, #fafafa)', margin: 0 }}>Start from a template</h2>
          <p style={{ fontSize: 12, color: 'var(--ide-text3, #71717a)', margin: '3px 0 0' }}>{templates.length} ready-made apps · open one and describe your changes</p>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '5px 12px',
              borderRadius: 7,
              border: '1px solid',
              borderColor: activeCategory === cat ? 'rgba(14,165,233,0.4)' : 'var(--ide-border, rgba(255,255,255,0.08))',
              background: activeCategory === cat ? 'rgba(14,165,233,0.12)' : 'transparent',
              color: activeCategory === cat ? '#0EA5E9' : 'var(--ide-text2, #a1a1aa)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {filtered.map(t => {
          const color = t.preview_color || '#0EA5E9';
          const isOpening = opening === t.app_id;
          return (
            <button
              key={t.app_id}
              onClick={() => openTemplate(t.app_id)}
              disabled={!!opening}
              style={{
                textAlign: 'left',
                border: '1px solid var(--ide-border, rgba(255,255,255,0.08))',
                borderRadius: 12,
                overflow: 'hidden',
                background: 'var(--bg-surface, #18181b)',
                cursor: opening ? 'wait' : 'pointer',
                padding: 0,
                fontFamily: 'inherit',
                transition: 'all 0.15s',
                opacity: opening && !isOpening ? 0.5 : 1,
              }}
              onMouseEnter={e => { if (!opening) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.4)'; }}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--ide-border, rgba(255,255,255,0.08))'}
            >
              {/* Preview swatch */}
              <div style={{ height: 90, background: `linear-gradient(135deg, ${color}22, ${color}08)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: color, opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 800 }}>
                  {t.name?.charAt(0)?.toUpperCase() || 'W'}
                </div>
                {isOpening && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  </div>
                )}
              </div>
              {/* Card body */}
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ide-text, #fafafa)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                {t.category && <div style={{ fontSize: 11, color: 'var(--ide-text3, #71717a)', marginTop: 2 }}>{t.category}</div>}
              </div>
            </button>
          );
        })}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
