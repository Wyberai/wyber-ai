'use client';
import { useState } from 'react';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_CONNECTORS_STRINGS } from '@/lib/i18n/dict/editor-connectors';

const TEMPLATES = [
  { id: 'auth', icon: '🔐', name: 'Auth System', desc: 'Login, signup, password reset, protected routes', prompt: 'Add a complete authentication system using Supabase Auth. Include login page, signup page, password reset, and route protection. Use @supabase/supabase-js with environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' },
  { id: 'crud', icon: '🗄', name: 'Database CRUD', desc: 'Create, read, update, delete with Supabase', prompt: 'Add Supabase database integration. Create a table schema, add CRUD operations (create, read, update, delete), and display the data in the UI. Use @supabase/supabase-js.' },
  { id: 'realtime', icon: '⚡', name: 'Real-time Updates', desc: 'Live data sync with Supabase subscriptions', prompt: 'Add real-time data updates using Supabase subscriptions. Data should update live without page refresh across all connected clients.' },
  { id: 'storage', icon: '📁', name: 'File Storage', desc: 'Upload and manage files with Supabase Storage', prompt: 'Add file upload functionality using Supabase Storage. Include a file picker, upload progress, and file listing.' },
  { id: 'rls', icon: '🛡', name: 'Row Level Security', desc: 'User-scoped data with RLS policies', prompt: 'Add Row Level Security to the database. Each user should only see their own data. Include proper RLS policies and user-scoped queries.' },
];

export function SupabaseGenerator() {
  const [adding, setAdding] = useState<string | null>(null);
  const t = useT(EDITOR_CONNECTORS_STRINGS);

  const apply = (tpl: typeof TEMPLATES[0]) => {
    setAdding(tpl.id);
    window.dispatchEvent(new CustomEvent('wyber:chat-prompt', { detail: tpl.prompt }));
    setTimeout(() => setAdding(null), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--ide-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(63,207,142,0.15)', border: '1px solid rgba(63,207,142,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🗄</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#3FCF8E' }}>{t('supabaseIntegrationTitle')}</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {t('supabaseGeneratorIntro')}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {TEMPLATES.map(tpl => (
            <button key={tpl.id} onClick={() => apply(tpl)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 9, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(63,207,142,0.3)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ide-border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'; }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{tpl.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{tpl.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tpl.desc}</div>
              </div>
              <div style={{ fontSize: 10, color: adding === tpl.id ? '#3FCF8E' : 'var(--text-muted)', flexShrink: 0, fontWeight: 600 }}>
                {adding === tpl.id ? `✓ ${t('addedLabel')}` : `${t('generateLabel')} →`}
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 9, background: 'rgba(63,207,142,0.05)', border: '1px solid rgba(63,207,142,0.15)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#3FCF8E', marginBottom: 4 }}>{t('howItWorksTitle')}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {t('howItWorksBody')}
          </div>
        </div>
      </div>
    </div>
  );
}
