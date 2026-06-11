'use client';

export type ProjectType = 'app' | 'mobile' | 'agent' | 'workflow';

interface ChooserProps {
  open: boolean;
  onClose: () => void;
  onPick: (type: ProjectType) => void;
}

const CARDS: {
  type: ProjectType;
  title: string;
  desc: string;
  icon: React.ReactNode;
  available: boolean;
}[] = [
  {
    type: 'app',
    title: 'Web App',
    desc: 'Dashboards, SaaS tools, internal apps — built and deployed instantly.',
    available: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    type: 'mobile',
    title: 'Mobile App',
    desc: 'iOS & Android apps with React Native — preview live as you build.',
    available: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" />
      </svg>
    ),
  },
  {
    type: 'agent',
    title: 'AI Agent',
    desc: 'Autonomous agents that run tasks, call tools, and work on your behalf.',
    available: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
      </svg>
    ),
  },
  {
    type: 'workflow',
    title: 'Workflow',
    desc: 'Automations that connect apps and move data — no code required.',
    available: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="15" width="6" height="6" rx="1" /><path d="M9 6h6a3 3 0 0 1 3 3v6" />
      </svg>
    ),
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
          width: '100%', maxWidth: 720,
          background: '#15171f', border: '1px solid #262a36', borderRadius: 16,
          padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f4f4f5', margin: 0 }}>What do you want to build?</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        </div>
        <p style={{ color: '#a1a1aa', fontSize: 14, margin: '0 0 22px' }}>Pick a starting point. You can describe the details next.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {CARDS.map((c) => (
            <button
              key={c.type}
              onClick={() => c.available && onPick(c.type)}
              disabled={!c.available}
              style={{
                textAlign: 'left', cursor: c.available ? 'pointer' : 'not-allowed',
                background: 'linear-gradient(180deg, #1b1e27 0%, #181b23 100%)',
                border: '1px solid #262a36', borderRadius: 12, padding: 18,
                display: 'flex', flexDirection: 'column', gap: 10, position: 'relative',
                opacity: c.available ? 1 : 0.55, transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { if (c.available) { e.currentTarget.style.borderColor = '#0EA5E9'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#262a36'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(14,165,233,0.12)', color: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {c.icon}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f4f4f5' }}>{c.title}</div>
              <div style={{ fontSize: 12.5, color: '#a1a1aa', lineHeight: 1.5 }}>{c.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
