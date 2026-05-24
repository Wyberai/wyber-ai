'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const IDEAS = [
  { icon: '📊', label: 'SaaS dashboard', prompt: 'Build a modern SaaS analytics dashboard with dark mode, sidebar navigation, KPI cards, revenue chart, and user activity table' },
  { icon: '🛒', label: 'E-commerce store', prompt: 'Build a modern e-commerce product listing page with grid layout, filters, cart functionality, and checkout flow' },
  { icon: '👥', label: 'CRM tool', prompt: 'Build a CRM dashboard with contact list, deal pipeline kanban board, and activity timeline' },
  { icon: '📝', label: 'Landing page', prompt: 'Build a stunning SaaS landing page with hero section, feature grid, pricing table, and testimonials' },
  { icon: '📅', label: 'Booking platform', prompt: 'Build a booking platform with calendar view, time slot selection, and confirmation flow' },
  { icon: '🎯', label: 'Project tracker', prompt: 'Build a project management tool with kanban board, task cards, priority levels, and team avatars' },
];

function WyberLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [useCase, setUseCase] = useState('');
  const [selectedIdea, setSelectedIdea] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleComplete = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ full_name: name, onboarded: true }).eq('id', user!.id);
    }
    // Create first project with selected idea
    if (selectedIdea || customPrompt) {
      const prompt = customPrompt || selectedIdea;
      const { data: project } = await supabase.from('projects').insert({
        user_id: user?.id,
        name: 'My first app',
        framework: 'react-vite',
        files: {},
        first_prompt: prompt,
      }).select().single();
      if (project) {
        router.push(`/project/${project.id}?prompt=${encodeURIComponent(prompt)}`);
        return;
      }
    }
    router.push('/dashboard');
  };

  const S = {
    page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-sans)' },
    box: { width: '100%', maxWidth: 580, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 'clamp(32px,5vw,48px)', boxShadow: 'var(--shadow-lg)' },
    logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 },
    wordmark: { fontSize: 18, fontWeight: 700, letterSpacing: '-0.055em', color: 'var(--text)' },
    h1: { fontSize: 'clamp(24px,4vw,32px)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: 8, lineHeight: 1.2, fontFamily: 'var(--font-serif)' },
    sub: { fontSize: 15, color: 'var(--text2)', marginBottom: 32, lineHeight: 1.6 },
    input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 15, outline: 'none', fontFamily: 'var(--font-sans)', marginBottom: 16, transition: 'border-color 0.15s' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, marginBottom: 24 },
    idea: (selected: boolean) => ({ padding: '16px 12px', borderRadius: 12, border: `2px solid ${selected ? 'var(--sky)' : 'var(--border)'}`, background: selected ? 'var(--sky3)' : 'var(--bg2)', cursor: 'pointer', textAlign: 'center' as const, transition: 'all 0.15s' }),
    ideaIcon: { fontSize: 28, marginBottom: 8 },
    ideaLabel: (selected: boolean) => ({ fontSize: 13, fontWeight: 600, color: selected ? 'var(--sky)' : 'var(--text2)' }),
    btn: { width: '100%', padding: '14px', borderRadius: 10, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', letterSpacing: '-0.01em', transition: 'all 0.2s', fontFamily: 'var(--font-sans)' },
    skip: { textAlign: 'center' as const, marginTop: 16, fontSize: 13, color: 'var(--text3)' },
    progress: { display: 'flex', gap: 6, marginBottom: 32 },
    dot: (active: boolean, done: boolean) => ({ height: 3, flex: 1, borderRadius: 2, background: done ? 'var(--sky)' : active ? 'var(--sky)' : 'var(--border)', opacity: done ? 1 : active ? 1 : 0.4 }),
  };

  return (
    <div style={S.page}>
      <div style={S.box}>
        <div style={S.logo}>
          <WyberLogo />
          <span style={S.wordmark}>Wyber<span style={{ color: 'var(--sky)' }}>AI</span></span>
        </div>

        {/* Progress bar */}
        <div style={S.progress}>
          {[1, 2, 3].map(i => <div key={i} style={S.dot(step === i, step > i)} />)}
        </div>

        {step === 1 && (
          <>
            <h1 style={S.h1}>Welcome to Wyber AI 👋</h1>
            <p style={S.sub}>You have 50 free credits to start. Let's get you set up in 30 seconds.</p>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, display: 'block' }}>What's your name?</label>
            <input style={S.input} placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
              onFocus={e => e.target.style.borderColor = 'var(--sky)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button style={S.btn} onClick={() => setStep(2)} disabled={!name.trim()}>
              Continue →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={S.h1}>What brings you here?</h1>
            <p style={S.sub}>This helps us tailor your experience.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {['I have an app idea and want to build it', 'I\'m a developer speeding up my workflow', 'I\'m a designer bringing mockups to life', 'I\'m building for a client', 'Just exploring'].map(opt => (
                <button key={opt} onClick={() => setUseCase(opt)}
                  style={{ padding: '13px 16px', borderRadius: 10, border: `2px solid ${useCase === opt ? 'var(--sky)' : 'var(--border)'}`, background: useCase === opt ? 'var(--sky3)' : 'var(--bg2)', color: useCase === opt ? 'var(--sky)' : 'var(--text2)', fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'var(--font-sans)' }}>
                  {useCase === opt ? '✓ ' : ''}{opt}
                </button>
              ))}
            </div>
            <button style={S.btn} onClick={() => setStep(3)} disabled={!useCase}>
              Continue →
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h1 style={S.h1}>What do you want to build?</h1>
            <p style={S.sub}>Pick a starting point or describe your own idea. You can change this any time.</p>
            <div style={S.grid}>
              {IDEAS.map(idea => (
                <div key={idea.label} style={S.idea(selectedIdea === idea.prompt)} onClick={() => { setSelectedIdea(idea.prompt); setCustomPrompt(''); }}>
                  <div style={S.ideaIcon}>{idea.icon}</div>
                  <div style={S.ideaLabel(selectedIdea === idea.prompt)}>{idea.label}</div>
                </div>
              ))}
            </div>
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>or describe your own</div>
              <textarea
                placeholder="e.g. A Notion-like notes app with dark mode and tag filtering..."
                value={customPrompt}
                onChange={e => { setCustomPrompt(e.target.value); setSelectedIdea(''); }}
                rows={3}
                style={{ ...S.input, resize: 'none', marginBottom: 0 }}
                onFocus={e => e.target.style.borderColor = 'var(--sky)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <button style={{ ...S.btn, opacity: (!selectedIdea && !customPrompt) ? 0.5 : 1 }}
              onClick={handleComplete}
              disabled={loading || (!selectedIdea && !customPrompt)}>
              {loading ? '⟳ Setting up...' : 'Start building ⚡'}
            </button>
            <p style={S.skip}>
              <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
                Skip for now →
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
