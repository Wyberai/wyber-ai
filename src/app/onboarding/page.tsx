'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WyberLogo } from '@/components/shared/WyberLogo';

const PILLARS = [
  {
    id: 'web',
    icon: '🌐',
    label: 'Web & SaaS apps',
    desc: 'Dashboards, landing pages, CRMs, tools — built in React in seconds.',
  },
  {
    id: 'mobile',
    icon: '📱',
    label: 'Mobile apps',
    desc: 'Full Expo / React Native apps for iOS & Android. Preview on your phone instantly.',
  },
  {
    id: 'agents',
    icon: '🤖',
    label: 'AI Agents',
    desc: '5,000+ pre-built agents for sales, finance, HR, and more. Connect your tools and run.',
  },
  {
    id: 'workflows',
    icon: '⚡',
    label: 'Automations',
    desc: 'Visual workflow builder. Chain triggers, AI steps, and actions — no code.',
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [useCase, setUseCase] = useState('');
  const [pillar, setPillar] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleComplete = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ full_name: name, onboarded: true }).eq('id', user.id);
    }

    if (pillar === 'mobile') { router.push('/dashboard?new=mobile'); return; }
    if (pillar === 'agents') { router.push('/agents'); return; }
    if (pillar === 'workflows') { router.push('/flows'); return; }

    // Web: create a blank project and let the user prompt from the editor
    const { data: project } = await supabase.from('projects').insert({
      user_id: user?.id,
      name: 'My first app',
      framework: 'react-vite',
      files: {},
      first_prompt: '',
    }).select().single();
    router.push(project ? `/project/${project.id}` : '/dashboard');
  };

  const S = {
    page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-sans)' },
    box: { width: '100%', maxWidth: 580, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 'clamp(32px,5vw,48px)', boxShadow: 'var(--shadow-lg)' },
    logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 },
    wordmark: { fontSize: 18, fontWeight: 700, letterSpacing: '-0.055em', color: 'var(--text)' },
    h1: { fontSize: 'clamp(24px,4vw,32px)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: 8, lineHeight: 1.2, fontFamily: 'var(--font-serif)' },
    sub: { fontSize: 15, color: 'var(--text2)', marginBottom: 32, lineHeight: 1.6 },
    input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 15, outline: 'none', fontFamily: 'var(--font-sans)', marginBottom: 16, transition: 'border-color 0.15s' },
    btn: { width: '100%', padding: '14px', borderRadius: 10, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', letterSpacing: '-0.01em', transition: 'all 0.2s', fontFamily: 'var(--font-sans)' },
    progress: { display: 'flex', gap: 6, marginBottom: 32 },
    dot: (active: boolean, done: boolean) => ({ height: 3, flex: 1, borderRadius: 2, background: done ? 'var(--sky)' : active ? 'var(--sky)' : 'var(--border)', opacity: done ? 1 : active ? 1 : 0.4 }),
  };

  return (
    <div style={S.page}>
      <div style={S.box}>
        <div style={S.logo}>
          <WyberLogo markSize={40} showWordmark={false} />
          <span style={S.wordmark}>Wyber<span style={{ color: 'var(--sky)' }}>AI</span></span>
        </div>

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
              {[
                'I have an app idea and want to build it',
                "I'm a developer speeding up my workflow",
                "I'm a designer bringing mockups to life",
                "I'm building for a client",
                'Just exploring',
              ].map(opt => (
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
            <p style={S.sub}>Wyber builds four things. Pick where to start — you can switch any time.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
              {PILLARS.map(p => (
                <button key={p.id} onClick={() => setPillar(p.id)}
                  style={{
                    padding: '18px 16px', borderRadius: 14, textAlign: 'left',
                    border: `2px solid ${pillar === p.id ? 'var(--sky)' : 'var(--border)'}`,
                    background: pillar === p.id ? 'var(--sky3)' : 'var(--bg2)',
                    cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
                  }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: pillar === p.id ? 'var(--sky)' : 'var(--text)', marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>{p.desc}</div>
                </button>
              ))}
            </div>
            <button
              style={{ ...S.btn, opacity: pillar ? 1 : 0.5 }}
              onClick={handleComplete}
              disabled={loading || !pillar}>
              {loading ? '⟳ Setting up...' : 'Start building ⚡'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text3)' }}>
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
