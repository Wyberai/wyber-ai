'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Lazy load panels
const ChatPanel      = dynamic(() => import('./ChatPanel').then(m => ({ default: m.ChatPanel })), { ssr: false });
const TemplateGallery = dynamic(() => import('../templates/TemplateGallery').then(m => ({ default: m.TemplateGallery })), { ssr: false });
const ThemePanel     = dynamic(() => import('../themes/ThemePanel').then(m => ({ default: m.ThemePanel })), { ssr: false });
const ConnectorsPanel = dynamic(() => import('./ConnectorsPanel').then(m => ({ default: m.ConnectorsPanel })), { ssr: false });
const SupabasePanel  = dynamic(() => import('./SupabasePanel').then(m => ({ default: m.SupabasePanel })), { ssr: false });
const VersionHistory = dynamic(() => import('./VersionHistory').then(m => ({ default: m.VersionHistory })), { ssr: false });
const ClonePanel     = dynamic(() => import('./ClonePanel').then(m => ({ default: m.ClonePanel })), { ssr: false });

interface Props {
  projectId?: string;
  userId?: string;
  onClose?: () => void;
}

type Tab = 'chat' | 'templates' | 'database' | 'themes' | 'connectors' | 'history' | 'clone';

const TABS: { id: Tab; icon: string; label: string; desc: string }[] = [
  { id: 'chat',       icon: '💬', label: 'Chat',       desc: 'Build & edit with AI' },
  { id: 'templates',  icon: '⊞',  label: 'Templates',  desc: '80+ instant templates' },
  { id: 'database',   icon: '🗄',  label: 'Database',   desc: 'Add Supabase backend' },
  { id: 'themes',     icon: '✦',  label: 'Themes',     desc: 'Colors & appearance' },
  { id: 'connectors', icon: '⬡',  label: 'Connect',    desc: 'Stripe, APIs & more' },
  { id: 'history',    icon: '⟳',  label: 'History',    desc: 'Save & restore versions' },
  { id: 'clone',      icon: '⎘',  label: 'Clone URL',  desc: 'Clone any website' },
];

export function RightPanel({ projectId, userId, onClose }: Props) {
  const [active, setActive] = useState<Tab>('chat');

  const scrollStyle = { height: '100%', overflowY: 'auto' as const };

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      background: 'var(--bg-base)',
      borderLeft: '1px solid var(--ide-border)',
    }}>

      {/* Icon sidebar — always visible, 7 clear icons */}
      <div style={{
        width: 52,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRight: '1px solid var(--ide-border)',
        background: 'var(--bg-surface)',
        padding: '8px 0',
        gap: 2,
        flexShrink: 0,
      }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActive(tab.id)} title={`${tab.label} — ${tab.desc}`}
            style={{
              width: 38, height: 38, borderRadius: 9, border: 'none',
              background: active === tab.id ? 'rgba(14,165,233,0.12)' : 'transparent',
              color: active === tab.id ? '#0EA5E9' : 'var(--ide-text3)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'all 0.15s',
              outline: active === tab.id ? '1px solid rgba(14,165,233,0.25)' : 'none',
            }}
            onMouseEnter={e => { if (active !== tab.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { if (active !== tab.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {tab.icon}
          </button>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Close panel button */}
        {onClose && (
          <button onClick={onClose} title="Close panel"
            style={{ width: 38, height: 38, borderRadius: 9, border: 'none', background: 'transparent', color: 'var(--ide-text3)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        )}
      </div>

      {/* Panel content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Panel header */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--ide-border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>{TABS.find(t => t.id === active)?.icon}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ide-text)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              {TABS.find(t => t.id === active)?.label}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ide-text3)' }}>
              {TABS.find(t => t.id === active)?.desc}
            </div>
          </div>
        </div>

        {/* Active panel */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {active === 'chat'       && <ChatPanel projectId={projectId} userId={userId} />}
          {active === 'templates'  && <div style={scrollStyle}><TemplateGallery onClose={() => setActive('chat')} /></div>}
          {active === 'database'   && <div style={scrollStyle}><SupabasePanel projectId={projectId || ''} /></div>}
          {active === 'themes'     && <div style={scrollStyle}><ThemePanel /></div>}
          {active === 'connectors' && <div style={scrollStyle}><ConnectorsPanel projectId={projectId || ''} /></div>}
          {active === 'history'    && <div style={scrollStyle}><VersionHistory projectId={projectId || ''} /></div>}
          {active === 'clone'      && <div style={scrollStyle}><ClonePanel /></div>}
        </div>
      </div>
    </div>
  );
}
