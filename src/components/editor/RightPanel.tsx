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

type Tab = 'chat' | 'agent' | 'templates' | 'themes' | 'github' | 'knowledge' | 'security' | 'fix' | 'supabase' | 'history' | 'deploy' | 'settings';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'chat',      icon: '⚡', label: 'Chat' },
  { id: 'agent',     icon: '◎', label: 'Agent' },
  { id: 'templates', icon: '⊞', label: 'Templates' },
  { id: 'themes',    icon: '✦', label: 'Themes' },
  { id: 'supabase',  icon: '🗄', label: 'Backend' },
  { id: 'github',    icon: '⌥', label: 'GitHub' },
  { id: 'deploy',    icon: '↥', label: 'Deploy' },
  { id: 'history',   icon: '⟳', label: 'History' },
  { id: 'security',  icon: '🛡', label: 'Security' },
  { id: 'knowledge', icon: '⚙', label: 'Knowledge' },
  { id: 'fix',       icon: '✕', label: 'Fix Error' },
  { id: 'settings',  icon: '◈', label: 'Settings' },
];

interface Props {
  projectId?: string;
  userId?: string;
  projectName?: string;
  githubRepo?: string | null;
  lastCommitSha?: string | null;
}

export function RightPanel({ projectId, userId, projectName, githubRepo, lastCommitSha }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail as Tab;
      if (TABS.find(t => t.id === tab)) setActiveTab(tab);
    };
    window.addEventListener('wyber:switch-tab', handler);
    return () => window.removeEventListener('wyber:switch-tab', handler);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '7px 10px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent)' : 'transparent'}`, color: activeTab === tab.id ? 'var(--accent)' : 'var(--ide-text3)', transition: 'all 0.12s', minWidth: 46 }}>
            <span style={{ fontSize: 12 }}>{tab.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 500, whiteSpace: 'nowrap' }}>{tab.label}</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'chat'      && <ChatPanel projectId={projectId} />}
        {activeTab === 'agent'     && <div style={{ flex:1, overflow:'auto' }}><AgentMode /></div>}
        {activeTab === 'templates' && <TemplateGallery />}
        {activeTab === 'themes'    && <div style={{ flex:1, overflow:'auto' }}><ThemePanel /></div>}
        {activeTab === 'supabase'  && <div style={{ flex:1, overflow:'auto' }}><SupabaseGenerator /></div>}
        {activeTab === 'github'    && <div style={{ flex:1, overflow:'auto' }}><GitHubPanel projectId={projectId} userId={userId} githubRepo={githubRepo} lastCommitSha={lastCommitSha} /></div>}
        {activeTab === 'deploy'    && <div style={{ flex:1, overflow:'auto' }}><DeployPanel projectId={projectId} userId={userId} projectName={projectName} /></div>}
        {activeTab === 'history'   && <div style={{ flex:1, overflow:'auto' }}><VersionHistory projectId={projectId} /></div>}
        {activeTab === 'security'  && <div style={{ flex:1, overflow:'auto' }}><SecurityScanner /></div>}
        {activeTab === 'knowledge' && <div style={{ flex:1, overflow:'auto' }}><KnowledgePanel /></div>}
        {activeTab === 'fix'       && <div style={{ flex:1, overflow:'auto' }}><ErrorFixPanel /></div>}
        {activeTab === 'settings'  && <div style={{ flex:1, overflow:'auto' }}><ProjectSettings projectId={projectId} /></div>}
      </div>
    </div>
  );
}