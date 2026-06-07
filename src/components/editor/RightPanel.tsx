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
  projectName?: string;
  githubRepo?: string;
  lastCommitSha?: string;
  onClose?: () => void;
}

type Tab = 'chat' | 'templates' | 'database' | 'themes' | 'connectors' | 'history' | 'clone';

// Purpose-made SVG icons for each tab
const TAB_ICONS: Record<string, JSX.Element> = {
  chat: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  templates: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  database: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  themes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10M12 2a15.3 15.3 0 00-4 10 15.3 15.3 0 004 10M2 12h20"/></svg>,
  connectors: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.5 13.5l7 3.5M15.5 7l-7 3.5"/></svg>,
  history: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 106 5.3L3 8"/><path d="M12 7v5l3 2"/></svg>,
  clone: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
};

const TABS: { id: Tab; label: string; desc: string }[] = [
  { id: 'chat',       label: 'Chat',      desc: 'Build & edit with AI' },
  { id: 'templates',  label: 'Templates', desc: '130+ instant templates' },
  { id: 'history',    label: 'History',   desc: 'Save & restore versions' },
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
        width: 44,
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
            {TAB_ICONS[tab.id]}
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
          <span style={{ display:'flex', alignItems:'center' }}>{TAB_ICONS[active]}</span>
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
