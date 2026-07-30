'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useEditorStore } from '@/store/editor';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { PanelHeader } from './ui';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_SHELL_STRINGS } from '@/lib/i18n/dict/editor-shell';

const ChatPanel       = dynamic(() => import('./ChatPanel').then(m => ({ default: m.ChatPanel })), { ssr: false });
const KnowledgePanel  = dynamic(() => import('./KnowledgePanel').then(m => ({ default: m.KnowledgePanel })), { ssr: false });
const TemplateGallery = dynamic(() => import('../templates/TemplateGallery').then(m => ({ default: m.TemplateGallery })), { ssr: false });
const ThemePanel      = dynamic(() => import('../themes/ThemePanel').then(m => ({ default: m.ThemePanel })), { ssr: false });
const ConnectorsPanel = dynamic(() => import('./ConnectorsPanel').then(m => ({ default: m.ConnectorsPanel })), { ssr: false });
const VersionHistory  = dynamic(() => import('./VersionHistory').then(m => ({ default: m.VersionHistory })), { ssr: false });
const AgentMode       = dynamic(() => import('../agent/AgentMode').then(m => ({ default: m.AgentMode })), { ssr: false });
const FigmaImportPanel = dynamic(() => import('./FigmaImportPanel').then(m => ({ default: m.FigmaImportPanel })), { ssr: false });
const RlsScanPanel    = dynamic(() => import('./RlsScanPanel').then(m => ({ default: m.RlsScanPanel })), { ssr: false });
const WyberCloudScanPanel = dynamic(() => import('./WyberCloudScanPanel').then(m => ({ default: m.WyberCloudScanPanel })), { ssr: false });
const LaunchReadinessPanel = dynamic(() => import('./LaunchReadinessPanel').then(m => ({ default: m.LaunchReadinessPanel })), { ssr: false });
const FounderChecklistPanel = dynamic(() => import('./FounderChecklistPanel').then(m => ({ default: m.FounderChecklistPanel })), { ssr: false });
const ImagesPanel     = dynamic(() => import('./ImagesPanel').then(m => ({ default: m.ImagesPanel })), { ssr: false });
const CloudTab        = dynamic(() => import('../cloud/CloudTab').then(m => ({ default: m.CloudTab })), { ssr: false });
const PaymentsPanel   = dynamic(() => import('./PaymentsPanel').then(m => ({ default: m.PaymentsPanel })), { ssr: false });
const SeoScanPanel    = dynamic(() => import('./SeoScanPanel').then(m => ({ default: m.SeoScanPanel })), { ssr: false });
const AnalyticsPanel  = dynamic(() => import('./AnalyticsPanel').then(m => ({ default: m.AnalyticsPanel })), { ssr: false });

interface Props {
  projectId?: string;
  userId?: string;
  projectName?: string;
  githubRepo?: string;
  lastCommitSha?: string;
  onClose?: () => void;
}

type Tab = 'chat' | 'agent' | 'figma' | 'knowledge' | 'templates' | 'database' | 'security' | 'themes' | 'images' | 'connectors' | 'history' | 'payments' | 'seo' | 'analytics';

const TAB_ICONS: Record<string, JSX.Element> = {
  chat: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  agent: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  figma: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="2" x2="12" y2="22"/><path d="M5 9h7M5 15h7M12 9h7M12 15h7"/></svg>,
  knowledge: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  templates: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  database: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  security: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  themes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10M12 2a15.3 15.3 0 00-4 10 15.3 15.3 0 004 10M2 12h20"/></svg>,
  images: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>,
  connectors: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.5 13.5l7 3.5M15.5 7l-7 3.5"/></svg>,
  payments: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  seo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  analytics: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  history: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 106 5.3L3 8"/><path d="M12 7v5l3 2"/></svg>,
};

// WyberCloud is the free-database USP, not just another utility tab — it
// gets a permanent colored treatment (gradient fill + badge dot) so it
// doesn't blend into the row of monochrome utility icons. This is scoped
// entirely to the 'cloud' id and never touches the other tabs' styling.
const CLOUD_ICON_ACCENT = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.5 18.5a4.5 4.5 0 0 1-.9-8.91 5.5 5.5 0 0 1 10.63-2.02A4.5 4.5 0 0 1 16.5 18.5h-9Z"
      fill="url(#rpCloudGrad)"
    />
    <defs>
      <linearGradient id="rpCloudGrad" x1="2" y1="4" x2="20" y2="19" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60a5fa" />
        <stop offset="1" stopColor="#2563eb" />
      </linearGradient>
    </defs>
  </svg>
);

const TAB_DEFS: { id: Tab; labelKey: keyof typeof EDITOR_SHELL_STRINGS['en']; descKey: keyof typeof EDITOR_SHELL_STRINGS['en'] }[] = [
  { id: 'chat',       labelKey: 'rpTabChatLabel',       descKey: 'rpTabChatDesc' },
  { id: 'agent',      labelKey: 'rpTabAgentLabel',      descKey: 'rpTabAgentDesc' },
  { id: 'figma',      labelKey: 'rpTabFigmaLabel',      descKey: 'rpTabFigmaDesc' },
  { id: 'knowledge',  labelKey: 'rpTabKnowledgeLabel',  descKey: 'rpTabKnowledgeDesc' },
  { id: 'database',   labelKey: 'rpTabDatabaseLabel',   descKey: 'rpTabDatabaseDesc' },
  { id: 'security',   labelKey: 'rpTabSecurityLabel',   descKey: 'rpTabSecurityDesc' },
  { id: 'themes',     labelKey: 'rpTabThemesLabel',     descKey: 'rpTabThemesDesc' },
  { id: 'images',     labelKey: 'rpTabImagesLabel',     descKey: 'rpTabImagesDesc' },
  { id: 'connectors', labelKey: 'rpTabConnectorsLabel', descKey: 'rpTabConnectorsDesc' },
  { id: 'payments',   labelKey: 'rpTabPaymentsLabel',   descKey: 'rpTabPaymentsDesc' },
  { id: 'seo',        labelKey: 'rpTabSeoLabel',        descKey: 'rpTabSeoDesc' },
  { id: 'analytics',  labelKey: 'rpTabAnalyticsLabel',  descKey: 'rpTabAnalyticsDesc' },
  { id: 'history',    labelKey: 'rpTabHistoryLabel',    descKey: 'rpTabHistoryDesc' },
];

export function RightPanel({ projectId, userId, onClose }: Props) {
  const t = useT(EDITOR_SHELL_STRINGS);
  const [active, setActive] = useState<Tab>('chat');
  const scrollStyle = { height: '100%', overflowY: 'auto' as const };
  const { files, setFiles } = useEditorStore();
  // Which data-leak scanner to show in the Security tab: a project's database
  // connector is one or the other, never both, so whichever is actually
  // connected wins. Defaults to the Supabase scanner (its own empty state
  // already explains "connect Supabase to run a scan") when neither is.
  const connectors = useEditorStore(s => s.connectors);
  const wyberCloudConnected = connectors?.some(c => c.service === 'cloud-database');

  // Resolve tab copy at render time (hooks can't run at module scope) —
  // see ProjectTypeChooser.tsx for the same pattern.
  const TABS = TAB_DEFS.map(def => ({ id: def.id, label: t(def.labelKey), desc: t(def.descKey) }));

  // Deep-link into a specific tab from elsewhere in the editor (e.g. the
  // SecurityReportCard's "Open full security scan" → 'security'). Same
  // CustomEvent pattern as wyber-request-mobile-view.
  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail;
      if (typeof tab === 'string' && TAB_DEFS.some(d => d.id === tab)) setActive(tab as Tab);
    };
    window.addEventListener('wyber-open-panel-tab', handler);
    return () => window.removeEventListener('wyber-open-panel-tab', handler);
  }, []);

  // FigmaImportPanel callback — add the imported component to the editor store and switch to chat
  const handleFigmaImport = (code: string, fileName: string) => {
    const path = `components/${fileName.replace(/\s+/g, '')}Figma.tsx`;
    setFiles({ ...files, [path]: { path, content: code, language: 'typescript' } });
    setActive('chat');
  };

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--bg-base)', borderLeft: '1px solid var(--ide-border)' }}>
      {/* Icon sidebar */}
      <div style={{ width: 44, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: '1px solid var(--ide-border)', background: 'var(--bg-surface)', padding: '8px 0', gap: 2, flexShrink: 0 }}>
        {TABS.map(tab => {
          const isCloud = tab.id === 'database';
          return (
          <button key={tab.id} onClick={() => setActive(tab.id)} title={`${tab.label} — ${tab.desc}`}
            style={{
              width: 38, height: 38, borderRadius: 9, border: isCloud ? '1px solid rgba(37,99,235,0.35)' : 'none',
              background: active === tab.id
                ? 'var(--brand-glow-soft, rgba(14,165,233,0.12))'
                : isCloud ? 'rgba(37,99,235,0.12)' : 'transparent',
              color: active === tab.id ? 'var(--brand-accent, #0EA5E9)' : 'var(--ide-text3)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              fontSize: 16, transition: 'all var(--brand-dur-fast, 0.15s) var(--brand-ease, ease)',
              outline: active === tab.id ? '1px solid var(--brand-border-accent, rgba(14,165,233,0.25))' : 'none',
              boxShadow: active === tab.id ? '0 0 10px var(--brand-glow-soft, rgba(14,165,233,0.15))' : 'none',
            }}
            onMouseEnter={e => { if (active !== tab.id) (e.currentTarget as HTMLElement).style.background = isCloud ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { if (active !== tab.id) (e.currentTarget as HTMLElement).style.background = isCloud ? 'rgba(37,99,235,0.12)' : 'transparent'; }}
          >
            {isCloud ? CLOUD_ICON_ACCENT : TAB_ICONS[tab.id]}
            {isCloud && (
              <span style={{
                position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: '50%',
                background: '#22c55e', border: '1.5px solid var(--bg-surface)',
              }} />
            )}
          </button>
          );
        })}
        <div style={{ flex: 1 }} />
        {onClose && (
          <button onClick={onClose} title={t('rpClosePanelTitle')}
            style={{ width: 38, height: 38, borderRadius: 9, border: 'none', background: 'transparent', color: 'var(--ide-text3)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        )}
      </div>

      {/* Panel content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <PanelHeader
          icon={active === 'database' ? CLOUD_ICON_ACCENT : TAB_ICONS[active]}
          title={TABS.find(tab => tab.id === active)?.label ?? ''}
          desc={TABS.find(tab => tab.id === active)?.desc}
        />

        {/* Every panel is error-boundary'd so a crash inside one tab can never
            take down the editor or the live preview (hard rule — a prior
            chatbot widget once broke the preview for days). key=active gives
            each tab its own boundary instance AND retriggers the entrance
            animation on switch. */}
        <div key={active} className="ide-panel-enter" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ErrorBoundary fallbackMessage={`${t('rpPanelErrorPrefix')} ${TABS.find(tab => tab.id === active)?.label ?? ''} ${t('rpPanelErrorSuffix')}`.trim().replace(/\s+/g, ' ')}>
            {active === 'chat'       && <ChatPanel projectId={projectId} userId={userId} />}
            {active === 'agent'      && <div style={scrollStyle}><AgentMode /></div>}
            {active === 'figma'      && <div style={scrollStyle}><FigmaImportPanel onImport={handleFigmaImport} /></div>}
            {active === 'knowledge'  && <KnowledgePanel projectId={projectId} />}
            {active === 'templates'  && <div style={scrollStyle}><TemplateGallery onClose={() => setActive('chat')} /></div>}
            {active === 'database'   && <CloudTab projectId={projectId || ''} />}
            {active === 'security'   && (
              <div style={scrollStyle}>
                {wyberCloudConnected
                  ? <WyberCloudScanPanel projectId={projectId || ''} />
                  : <RlsScanPanel projectId={projectId || ''} />}
                <div style={{ height: 1, background: 'var(--ide-border)', margin: '4px 16px' }} />
                <LaunchReadinessPanel projectId={projectId || ''} />
                <div style={{ height: 1, background: 'var(--ide-border)', margin: '4px 16px' }} />
                <FounderChecklistPanel projectId={projectId || ''} />
              </div>
            )}
            {active === 'themes'     && <div style={scrollStyle}><ThemePanel /></div>}
            {active === 'images'     && <div style={scrollStyle}><ImagesPanel projectId={projectId} /></div>}
            {active === 'connectors' && <div style={scrollStyle}><ConnectorsPanel projectId={projectId || ''} onSwitchToChat={() => setActive('chat')} /></div>}
            {active === 'payments'   && <div style={scrollStyle}><PaymentsPanel projectId={projectId || ''} onSwitchToChat={() => setActive('chat')} /></div>}
            {active === 'seo'        && <div style={scrollStyle}><SeoScanPanel projectId={projectId || ''} onSwitchToChat={() => setActive('chat')} /></div>}
            {active === 'analytics'  && <div style={scrollStyle}><AnalyticsPanel projectId={projectId || ''} /></div>}
            {active === 'history'    && <div style={scrollStyle}><VersionHistory projectId={projectId || ''} /></div>}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
