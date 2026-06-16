'use client';
import { useEffect } from 'react';
import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, Project } from '@/lib/supabase/types';
import Link from 'next/link';
import { ReferralCard } from '@/components/shared/ReferralCard';
import { TemplatesShowcase } from '@/components/dashboard/TemplatesShowcase';
import { ProjectTypeChooser, type ProjectType } from '@/components/dashboard/ProjectTypeChooser';
import { ImportModal } from '@/components/dashboard/ImportModal';
import { WyberLogo } from '@/components/shared/WyberLogo'
import { NotificationBell } from '@/components/shared/NotificationBell';

interface Props { profile: Profile | null; projects: Partial<Project>[]; }

// SVG icons — no emojis
const IconHome = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>;
const IconGrid = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
const IconTemplates = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const IconSettings = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
const IconBolt = () => <svg width="14" height="14" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>;
const IconPhone = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>;
const IconZap = () => <svg width="15" height="15" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>;
const IconArrowUp = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5,12 12,5 19,12"/></svg>;
const IconChevronDown = ({ rotated }: { rotated?: boolean }) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" style={{ transform: rotated ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6"/></svg>;
const IconDot = () => <div style={{ width: 6, height: 6, borderRadius: 2, background: '#0EA5E9', flexShrink: 0 }} />;
const IconTrash = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconCopy = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const IconPlaceholder = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></svg>;
const IconEmpty = () => <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round"><rect x="6" y="10" width="36" height="28" rx="4"/><path d="M16 10V6M32 10V6M6 18h36"/></svg>;
const IconDocs = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;
const IconLearn = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const IconPeople = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const IconAgents = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><path d="M8 15h.01M12 15h.01M16 15h.01"/></svg>;

// Project type badge
const TYPE_META: Record<string, { label: string; color: string }> = {
  app:      { label: 'Web',      color: '#0EA5E9' },
  mobile:   { label: 'Mobile',   color: '#8b5cf6' },
  agent:    { label: 'Agent',    color: '#10b981' },
  workflow: { label: 'Workflow', color: '#f59e0b' },
};

function TypeBadge({ type }: { type?: string }) {
  const meta = TYPE_META[type ?? ''] ?? { label: 'Web', color: '#0EA5E9' };
  return (
    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: meta.color, background: `${meta.color}18`, border: `1px solid ${meta.color}35`, borderRadius: 4, padding: '2px 6px', lineHeight: 1.4 }}>
      {meta.label}
    </span>
  );
}

const QUICK_PROMPTS = [
  'Build a SaaS analytics dashboard with MRR, churn rate, and customer health scores',
  'Build a CRM with lead pipeline, email sequences, and deal forecasting',
  'Build a VC portfolio management platform with fund analytics and deal tracking',
  'Build an HR platform with onboarding tracker, org chart, and performance reviews',
  'Build a customer support hub with ticket queue, SLA tracking, and escalations',
  'Build a revenue operations dashboard with pipeline scoring and forecast analytics',
];

// Colors
const BG = '#15171f';
const SIDEBAR_BG = '#10121a';
const BORDER = '#262a36';
const TEXT = '#f4f4f5';
const MUTED = '#a1a1aa';
const DIM = '#52525b';
const CARD_BG = '#1a1d28';
const BRAND = '#0EA5E9';

export function DashboardClient({ profile, projects: initialProjects }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [projects, setProjects] = useState(initialProjects);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>(undefined);
  const [promptInput, setPromptInput] = useState('');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchParams = useSearchParams();

  // Deep-link: /dashboard?new=app|mobile|agent|workflow → open chooser
  // When ?template= is present for mobile, the type is already known — skip chooser.
  useEffect(() => {
    const newType = searchParams.get('new');
    if (!['app', 'mobile', 'agent', 'workflow'].includes(newType ?? '')) return;

    const templateId = searchParams.get('template');
    if (templateId && newType === 'mobile') {
      // Type is fully known — bypass the chooser and start immediately
      const templatePrompt = sessionStorage.getItem('wyber_mobile_template_prompt') ?? undefined;
      sessionStorage.removeItem('wyber_mobile_template_prompt');
      sessionStorage.removeItem('wyber_mobile_template_title');
      startProject(templatePrompt, 'mobile');
    } else {
      setPendingPrompt(undefined);
      setShowTypePicker(true);
    }
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, userId: profile?.id })
      });
      if (res.ok) setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) { console.error('Delete failed', err); }
    finally { setDeletingId(null); }
  };

  const handleRename = async (id: string, name: string) => {
    if (!name.trim()) { setRenamingId(null); return; }
    await fetch('/api/projects', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: id, name: name.trim(), userId: profile?.id }) });
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name: name.trim() } : p));
    setRenamingId(null);
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setDuplicatingId(id);
    const res = await fetch('/api/projects/duplicate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: id, userId: profile?.id }) });
    const data = await res.json();
    if (data?.project) setProjects(prev => [data.project, ...prev]);
    setDuplicatingId(null);
  };

  const credits = profile?.credits ?? 0;
  const plan = profile?.plan ?? 'free';
  const name = profile?.full_name || profile?.email?.split('@')[0] || 'there';
  const totalCredits = plan === 'pro' ? 400 : plan === 'business' ? 800 : 50;
  const creditPct = Math.min(100, (credits / totalCredits) * 100);

  const openChooser = (prompt?: string) => { setPendingPrompt(prompt); setShowTypePicker(true); };
  const startProject = async (prompt?: string, type: ProjectType = 'app') => {
    if (!profile?.id || creating) return;
    setCreating(true);
    try {
      const projectName = prompt
        ? prompt.slice(0, 40).trim()
        : 'New Project ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const { data, error } = await supabase
        .from('projects')
        .insert({ name: projectName, framework: 'react-vite', user_id: profile.id, initial_prompt: prompt || '', project_type: type })
        .select('id');
      if (error) throw error;
      if (data?.[0]?.id) {
        if (prompt) sessionStorage.setItem(`wyber_prompt_${data[0].id}`, prompt);
        router.push(`/project/${data[0].id}?type=${type}`);
      }
    } catch (err) {
      console.error(err);
      setCreating(false);
    }
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      openChooser(promptInput.trim() || undefined);
    }
  };

  const NAV = [
    { label: 'Home',         href: '/dashboard',       icon: <IconHome /> },
    { label: 'Templates',    href: '/gallery',         icon: <IconTemplates /> },
    { label: 'Mobile',       href: '/templates/mobile',icon: <IconPhone /> },
    { label: 'AI Agents',    href: '/agents',          icon: <IconAgents /> },
    { label: 'AI Employees', href: '/ai-employees',    icon: <IconPeople /> },
    { label: 'Workflows',    href: '/workflows',       icon: <IconZap /> },
    { label: 'Learn',        href: '/learn',           icon: <IconLearn /> },
    { label: 'Docs',         href: '/docs',            icon: <IconDocs /> },
    { label: 'Settings',     href: '/settings',        icon: <IconSettings /> },
  ];

  const ACCENT_PALETTE = ['#0EA5E9','#8b5cf6','#10b981','#f59e0b','#ef4444'];
  const accentFor = (n?: string) => ACCENT_PALETTE[Math.abs((n?.charCodeAt(0) ?? 0) % ACCENT_PALETTE.length)];

  return (
    <div style={{ display: 'flex', height: '100vh', background: BG, color: TEXT, fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Mobile top bar */}
      {isMobile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 52, background: SIDEBAR_BG, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, zIndex: 50, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(v => !v)} aria-label="Open menu"
            style={{ background: 'none', border: 'none', color: TEXT, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <WyberLogo markSize={22} wordmarkSize={13} />
        </div>
      )}

      {/* Mobile sidebar backdrop */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, backdropFilter: 'blur(2px)' }} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 220, height: '100vh', background: SIDEBAR_BG, borderRight: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: isMobile ? 'fixed' : 'sticky', top: 0, left: 0,
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: 'transform 0.25s ease',
        zIndex: isMobile ? 101 : 'auto' as any,
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '16px 14px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <WyberLogo markSize={26} wordmarkSize={14} />
          <NotificationBell />
        </div>

        {/* User row */}
        <button onClick={() => setSidebarExpanded(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', border: 'none', background: 'transparent', color: TEXT, cursor: 'pointer', width: '100%', textAlign: 'left', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #0EA5E9, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {name[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 10, color: DIM, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{plan} plan</div>
          </div>
          <IconChevronDown rotated={sidebarExpanded} />
        </button>

        {/* Credits panel */}
        {sidebarExpanded && (
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>Credits</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{credits} left</span>
              <Link href="/settings?tab=billing" style={{ fontSize: 11, color: BRAND, textDecoration: 'none', fontWeight: 600 }}>Add credits</Link>
            </div>
            <div style={{ height: 4, borderRadius: 9999, background: BORDER }}>
              <div style={{ height: '100%', borderRadius: 9999, background: creditPct < 20 ? '#ef4444' : BRAND, width: creditPct + '%', transition: 'width 0.5s ease' }} />
            </div>
            {credits < 10 && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 6, fontWeight: 600 }}>Low on credits — upgrade to continue building</div>}
          </div>
        )}

        {/* Nav */}
        <nav style={{ padding: '8px', flex: 1, overflow: 'auto' }}>
          {NAV.map(n => (
            <Link key={n.label} href={n.href}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, color: MUTED, fontSize: 13, fontWeight: 400, textDecoration: 'none', marginBottom: 1, transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `rgba(255,255,255,0.05)`; (e.currentTarget as HTMLElement).style.color = TEXT }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = MUTED }}>
              {n.icon}{n.label}
            </Link>
          ))}

          {projects.length > 0 && <>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 10px 5px' }}>Recent</div>
            {projects.slice(0, 4).map(p => (
              <Link key={p.id} href={`/project/${p.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 7, color: DIM, fontSize: 12, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'all 0.15s', marginBottom: 1 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = TEXT }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = DIM }}>
                <IconDot />
                {p.name || 'Untitled'}
              </Link>
            ))}
          </>}
        </nav>

        <ReferralCard />

        {plan === 'free' && (
          <div style={{ padding: '10px', borderTop: `1px solid ${BORDER}` }}>
            <Link href="/pricing"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 9, background: `rgba(14,165,233,0.1)`, border: `1px solid rgba(14,165,233,0.2)`, textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(14,165,233,0.15)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(14,165,233,0.1)'}>
              <IconBolt />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: BRAND }}>Upgrade to Starter</div>
                <div style={{ fontSize: 10, color: DIM }}>500 credits/month</div>
              </div>
            </Link>
          </div>
        )}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', marginTop: isMobile ? 52 : 0, width: isMobile ? '100%' : undefined }}>

        {/* Hero / prompt area */}
        <div style={{ position: 'relative', minHeight: isMobile ? 260 : 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '28px 16px 20px' : '40px 24px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 60% at 20% 40%, rgba(14,165,233,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 60%, rgba(139,92,246,0.14) 0%, transparent 60%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(22px,3vw,38px)', fontWeight: 800, letterSpacing: '-0.04em', textAlign: 'center', marginBottom: 24, zIndex: 1, position: 'relative' }}>
            What are we building, {name.split(' ')[0]}?
          </h1>

          <div style={{ width: '100%', maxWidth: 640, zIndex: 1, position: 'relative' }}>
            <div style={{ background: 'rgba(16,18,26,0.9)', backdropFilter: 'blur(20px)', border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
              <textarea ref={textareaRef} value={promptInput} onChange={e => setPromptInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Describe the app you want to build..." rows={3}
                style={{ width: '100%', padding: '16px 18px 12px', border: 'none', background: 'transparent', color: TEXT, fontSize: 15, fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.55 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '10px 14px 14px', gap: 10, borderTop: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 11, color: '#3f3f46' }}>Enter to build</span>
                <button onClick={() => openChooser(promptInput.trim() || undefined)} disabled={creating}
                  style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: creating ? '#27272a' : BRAND, color: '#fff', cursor: creating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                  {creating
                    ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    : <IconArrowUp />
                  }
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: isMobile ? undefined : 'wrap', flexDirection: isMobile ? 'column' : 'row', justifyContent: isMobile ? undefined : 'center', alignItems: isMobile ? 'stretch' : undefined }}>
              {QUICK_PROMPTS.slice(0, isMobile ? 3 : 4).map(p => (
                <button key={p} onClick={() => { setPromptInput(p); textareaRef.current?.focus() }}
                  style={{ padding: isMobile ? '8px 14px' : '4px 12px', borderRadius: 20, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.03)', color: DIM, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = TEXT; (e.currentTarget as HTMLElement).style.borderColor = `rgba(14,165,233,0.4)` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = DIM; (e.currentTarget as HTMLElement).style.borderColor = BORDER }}>
                  {p.replace('Build a ', '').replace('Create a ', '')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Projects + Templates */}
        <div style={{ flex: 1, padding: isMobile ? '16px 14px' : '24px 28px', overflowY: 'auto' }}>
          {projects.length > 0 ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>My Projects</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowImport(true)}
                    style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Import
                  </button>
                  <button onClick={() => openChooser()} disabled={creating}
                    style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: BRAND, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    + New Project
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {projects.slice(0, 11).map(p => (
                  <Link key={p.id} href={`/project/${p.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ height: 168, borderRadius: 12, border: `1px solid ${BORDER}`, background: CARD_BG, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.35)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.5)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>

                      {/* Action buttons */}
                      {p.id && <>
                        <button onClick={e => handleDelete(e, p.id!)} disabled={deletingId === p.id} title="Delete"
                          style={{ position: 'absolute', top: 7, right: 7, zIndex: 10, width: 24, height: 24, borderRadius: 6, border: `1px solid ${BORDER}`, background: 'rgba(16,18,26,0.85)', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                          {deletingId === p.id ? <div style={{ width: 10, height: 10, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <IconTrash />}
                        </button>
                        <button onClick={e => handleDuplicate(e, p.id!)} disabled={duplicatingId === p.id} title="Duplicate"
                          style={{ position: 'absolute', top: 7, right: 36, zIndex: 10, width: 24, height: 24, borderRadius: 6, border: `1px solid ${BORDER}`, background: 'rgba(16,18,26,0.85)', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                          {duplicatingId === p.id ? <div style={{ width: 10, height: 10, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <IconCopy />}
                        </button>
                      </>}

                      {/* Thumbnail */}
                      <div style={{ height: 112, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${accentFor(p.name)}18, rgba(16,18,26,0.9))` }}>
                        {(p as any).thumbnail_url
                          ? <img src={(p as any).thumbnail_url} alt={p.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
                              <IconPlaceholder />
                            </div>
                        }
                      </div>

                      {/* Footer */}
                      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          {renamingId === p.id && p.id ? (
                            <input autoFocus defaultValue={p.name || ''} onBlur={e => handleRename(p.id!, e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleRename(p.id!, (e.target as HTMLInputElement).value); if (e.key === 'Escape') setRenamingId(null); }} onClick={e => e.preventDefault()} style={{ fontSize: 12, fontWeight: 600, color: TEXT, background: 'rgba(255,255,255,0.08)', border: `1px solid rgba(14,165,233,0.5)`, borderRadius: 4, padding: '1px 5px', flex: 1, outline: 'none', fontFamily: 'inherit' }} />
                          ) : (
                            <div onDoubleClick={e => { e.preventDefault(); e.stopPropagation(); if (p.id) setRenamingId(p.id); }} style={{ fontSize: 12, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.name || 'Untitled'}</div>
                          )}
                          <TypeBadge type={(p as any).project_type} />
                        </div>
                        <div style={{ fontSize: 10, color: DIM }}>{p.framework || 'react'} · {p.updated_at ? new Date(p.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'New'}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div style={{ marginTop: 36 }}>
                <TemplatesShowcase userId={profile?.id} />
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 8, color: DIM }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><IconEmpty /></div>
                <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 8 }}>No projects yet</div>
                <div style={{ fontSize: 14, marginBottom: 16 }}>Describe your first app above, or start from a template below</div>
                <button onClick={() => setShowImport(true)}
                  style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Import existing project
                </button>
              </div>
              <div style={{ marginTop: 24 }}>
                <TemplatesShowcase userId={profile?.id} />
              </div>
            </>
          )}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>
      <ProjectTypeChooser
        open={showTypePicker}
        onClose={() => setShowTypePicker(false)}
        onPick={(type) => { setShowTypePicker(false); startProject(pendingPrompt, type); }}
      />
      <ImportModal open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}
