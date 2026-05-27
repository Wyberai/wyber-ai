'use client';
import { useState, useEffect } from 'react';
import { ChatPanel } from './ChatPanel';
import { AgentMode } from '@/components/agent/AgentMode';
import { ThemePanel } from '@/components/themes/ThemePanel';
import { GitHubPanel } from '@/components/github/GitHubPanel';
import { TemplateGallery } from '@/components/templates/TemplateGallery';
import { KnowledgePanel } from '@/components/knowledge/KnowledgePanel';
import { SecurityScanner } from '@/components/security/SecurityScanner';
import { ErrorFixPanel } from './ErrorFixPanel';
import { SupabaseGenerator } from '@/components/supabase-gen/SupabaseGenerator';
import { VersionHistory } from '@/components/history/VersionHistory';
import { DeployPanel } from '@/components/deploy/DeployPanel';
import { ProjectSettings } from './ProjectSettings';
import { PublishButton } from './PublishButton';
import { ImageGenPanel } from './ImageGenPanel';
import { BrowserTestPanel } from './BrowserTestPanel';
import { ConnectorsPanel } from './ConnectorsPanel';
import { SEOAuditPanel } from './SEOAuditPanel';
import { SkillsPanel } from './SkillsPanel';

type Tab = 'chat' | 'agent' | 'templates' | 'themes' | 'github' | 'knowledge' | 'security' | 'fix' | 'supabase' | 'history' | 'deploy' | 'publish' | 'images' | 'connectors' | 'test' | 'seo' | 'skills' | 'settings';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'chat',       icon: '⚡', label: 'Chat' },
  { id: 'agent',      icon: '◎', label: 'Agent' },
  { id: 'templates',  icon: '⊞', label: 'Templates' },
  { id: 'themes',     icon: '✦', label: 'Themes' },
  { id: 'images',     icon: '🖼', label: 'Images' },
  { id: 'connectors', icon: '⬡', label: 'Connect' },
  { id: 'supabase',   icon: '🗄', label: 'Backend' },
  { id: 'github',     icon: '⌥', label: 'GitHub' },
  { id: 'publish',    icon: '↑',  label: 'Publish' },
  { id: 'deploy',     icon: '↥',  label: 'Deploy' },
  { id: 'test',       icon: '▶',  label: 'Tests' },
  { id: 'seo',        icon: '🔍', label: 'SEO' },
  { id: 'security',   icon: '🛡', label: 'Security' },
  { id: 'skills',     icon: '📋', label: 'Skills' },
  { id: 'history',    icon: '⟳',  label: 'History' },
  { id: 'knowledge',  icon: '⚙',  label: 'Knowledge' },
  { id: 'fix',        icon: '✕',  label: 'Fix Error' },
  { id: 'settings',   icon: '⚙',  label: 'Settings' },
];

interface Props {
  projectId?: string;
  userId?: string;
  projectName?: string;
  githubRepo?: string | null;
  lastCommitSha?: string | null;
  publishedUrl?: string | null;
  subdomain?: string | null;
  projectFiles?: Record<string, { path: string; content: string; language: string }>;
  onChatMessage?: (msg: string) => void;
  onPublish?: (url: string) => void;
  onUnpublish?: () => void;
}

export function RightPanel({ projectId, userId, projectName, githubRepo, lastCommitSha, publishedUrl, subdomain, projectFiles, onChatMessage, onPublish, onUnpublish }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail as Tab;
      if (TABS.find(t => t.id === tab)) setActiveTab(tab);
    };
    window.addEventListener('wyber:switch-tab', handler);
    return () => window.removeEventListener('wyber:switch-tab', handler);
  }, []);

  const scrollStyle: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: '0 12px 12px' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)', flexShrink: 0, scrollbarWidth: 'none' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab ${activeTab === tab.id ? 'active' : ''}`} title={tab.label} style={{ minWidth: 'auto', padding: '0 10px', gap: 4 }}>
            <span>{tab.icon}</span>
            <span style={{ fontSize: 10 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'chat'       && <ChatPanel projectId={projectId} />}
        {activeTab === 'agent'      && <AgentMode />}
        {activeTab === 'templates'  && <TemplateGallery />}
        {activeTab === 'themes'     && <ThemePanel />}
        {activeTab === 'images'     && <div style={scrollStyle}><ImageGenPanel onInsert={(url, alt) => onChatMessage?.(`Add this image to the app: <img src="${url}" alt="${alt}" />`)} /></div>}
        {activeTab === 'connectors' && <div style={scrollStyle}><ConnectorsPanel projectId={projectId || ''} /></div>}
        {activeTab === 'supabase'   && <SupabaseGenerator />}
        {activeTab === 'github'     && <GitHubPanel projectId={projectId} userId={userId} githubRepo={githubRepo} lastCommitSha={lastCommitSha} />}
        {activeTab === 'publish'    && (
          <div style={scrollStyle}>
            <div style={{ paddingTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Publish to web</div>
              <PublishButton projectId={projectId || ''} projectName={projectName || ''} publishedUrl={publishedUrl} subdomain={subdomain} onPublish={onPublish} onUnpublish={onUnpublish} />
              {publishedUrl && (
                <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Share your app</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>Anyone with the link can view your published app. No sign-in required.</div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'deploy'     && <DeployPanel projectId={projectId} userId={userId} projectName={projectName} />}
        {activeTab === 'test'       && <div style={scrollStyle}><BrowserTestPanel projectUrl={publishedUrl || undefined} /></div>}
        {activeTab === 'seo'        && <div style={scrollStyle}><SEOAuditPanel projectUrl={publishedUrl || undefined} projectFiles={projectFiles} /></div>}
        {activeTab === 'security'   && <SecurityScanner />}
        {activeTab === 'skills'     && <div style={scrollStyle}><SkillsPanel onApply={msg => onChatMessage?.(msg)} /></div>}
        {activeTab === 'history'    && <VersionHistory projectId={projectId} />}
        {activeTab === 'knowledge'  && <KnowledgePanel />}
        {activeTab === 'fix'        && <ErrorFixPanel />}
        {activeTab === 'settings'   && <ProjectSettings projectId={projectId} userId={userId} />}
      </div>
    </div>
  );
}