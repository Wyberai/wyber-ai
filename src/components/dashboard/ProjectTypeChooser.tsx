'use client';

export type ProjectType = 'app' | 'mobile' | 'agent' | 'workflow' | 'employee' | 'gtm';

interface ChooserProps {
  open: boolean;
  onClose: () => void;
  onPick: (type: ProjectType) => void;
}

const CARDS: {
  type: ProjectType;
  title: string;
  desc: string;
  emoji: string;
  color: string;
  redirect?: string;
}[] = [
  {
    type: 'app',
    title: 'Web App',
    desc: 'Dashboards, SaaS tools, internal apps — AI builds from scratch in minutes.',
    emoji: '🌐',
    color: '#0EA5E9',
  },
  {
    type: 'mobile',
    title: 'Mobile App',
    desc: 'iOS & Android apps with React Native — preview live on your phone.',
    emoji: '📱',
    color: '#f97316',
  },
  {
    type: 'employee',
    title: 'AI Employee',
    desc: 'Agentic employees with memory and reasoning. Coming soon.',
    emoji: '🤖',
    color: '#a855f7',
    redirect: '/coming-soon?product=AI+Employees',
    soon: true,
  },
  {
    type: 'workflow',
    title: 'Workflow',
    desc: 'Visual automations with AI at every step. Coming soon.',
    emoji: '🔀',
    color: '#22c55e',
    redirect: '/coming-soon?product=Workflows',
    soon: true,
  },
  {
    type: 'gtm',
    title: 'GTM Campaign',
    desc: 'AI-powered lead gen and outreach. Coming soon.',
    emoji: '🎯',
    color: '#10b981',
    redirect: '/coming-soon?product=GTM+Engine',
    soon: true,
  },
];

export function ProjectTypeChooser({ open, onClose, onPick }: ChooserProps) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 780,
          background: '#15171f', border: '1px solid #262a36', borderRadius: 16,
          padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f4f4f5', margin: 0 }}>What would you like to build today?</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        </div>
        <p style={{ color: '#a1a1aa', fontSize: 14, margin: '0 0 22px' }}>Pick a product. Everything is built fresh by AI — no stale templates.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {CARDS.map((c) => (
            <button
              key={c.type}
              onClick={() => {
                if (c.redirect) { window.location.href = c.redirect; onClose(); }
                else onPick(c.type);
              }}
              style={{
                textAlign: 'left', cursor: 'pointer',
                background: 'linear-gradient(180deg, #1b1e27 0%, #181b23 100%)',
                border: '1px solid #262a36', borderRadius: 12, padding: 16,
                display: 'flex', flexDirection: 'column', gap: 8,
                transition: 'all 0.15s ease', fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#262a36'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 28 }}>{c.emoji}</span>
                {(c as any).soon && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>SOON</span>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: (c as any).soon ? '#71717a' : '#f4f4f5' }}>{c.title}</div>
              <div style={{ fontSize: 11.5, color: (c as any).soon ? '#52525b' : '#a1a1aa', lineHeight: 1.5 }}>{c.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
