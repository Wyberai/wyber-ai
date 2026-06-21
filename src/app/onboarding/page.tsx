'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WyberLogo } from '@/components/shared/WyberLogo';

const PERSONAS = [
  { id: 'solo', icon: '🚀', label: 'Solo founder', desc: 'Just starting or building alone. I want speed and simplicity.' },
  { id: 'team', icon: '👥', label: 'Small team (2-10)', desc: 'Building with a co-founder or small team. Collaboration matters.' },
  { id: 'agency', icon: '🏢', label: 'Agency / freelancer', desc: 'Building for clients. I need multi-project management.' },
  { id: 'enterprise', icon: '🏛️', label: 'Scaling business', desc: 'Growing company. I need automation, GTM, and AI employees.' },
];

const PRODUCTS = [
  { id: 'web', icon: '🌐', label: 'Web apps', desc: 'Dashboards, SaaS tools, landing pages — AI builds fresh React code in minutes.' },
  { id: 'mobile', icon: '📱', label: 'Mobile apps', desc: 'iOS & Android with Expo. Preview on your phone instantly.' },
  { id: 'agents', icon: '🤖', label: 'AI Agents', desc: '5,000 pre-built agents. Connect tools and let them work.' },
  { id: 'workflows', icon: '⚡', label: 'Workflows', desc: 'Visual automations. Chain triggers, AI steps, and actions.' },
  { id: 'employees', icon: '💼', label: 'AI Employees', desc: '100 roles that run on schedule. SDR, analyst, support — all AI.' },
  { id: 'gtm', icon: '🎯', label: 'GTM Engine', desc: 'Define your ICP. Wyber finds leads and runs outreach.' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [persona, setPersona] = useState('');
  const [product, setProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleComplete = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        full_name: name,
        persona,
        onboarded: true,
      }).eq('id', user.id);
    }

    const routes: Record<string, string> = {
      mobile: '/dashboard?new=mobile',
      agents: '/agents',
      workflows: '/flows',
      employees: '/ai-employees',
      gtm: '/gtm',
    };

    if (routes[product]) { router.push(routes[product]); return; }

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
    page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-sans)' } as const,
    box: { width: '100%', maxWidth: 620, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 'clamp(32px,5vw,48px)', boxShadow: 'var(--shadow-lg)' } as const,
    h1: { fontSize: 'clamp(24px,4vw,32px)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: 8, lineHeight: 1.2, fontFamily: 'var(--font-serif)' } as const,
    sub: { fontSize: 15, color: 'var(--text2)', marginBottom: 28, lineHeight: 1.6 } as const,
    input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 15, outline: 'none', fontFamily: 'var(--font-sans)', marginBottom: 16, transition: 'border-color 0.15s' } as const,
    btn: { width: '100%', padding: '14px', borderRadius: 10, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', letterSpacing: '-0.01em', transition: 'all 0.2s', fontFamily: 'var(--font-sans)' } as const,
    dot: (active: boolean, done: boolean) => ({ height: 3, flex: 1, borderRadius: 2, background: done ? 'var(--sky)' : active ? 'var(--sky)' : 'var(--border)', opacity: done ? 1 : active ? 1 : 0.4 }),
  };

  return (
    <div style={S.page}>
      <div style={S.box}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <WyberLogo markSize={40} showWordmark={false} />
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.055em', color: 'var(--text)' }}>Wyber<span style={{ color: 'var(--sky)' }}>AI</span></span>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
          {[1, 2, 3].map(i => <div key={i} style={S.dot(step === i, step > i)} />)}
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <>
            <h1 style={S.h1}>Welcome to WyberAi</h1>
            <p style={S.sub}>Six products. One platform. Let's get you set up in 30 seconds.</p>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, display: 'block' }}>What should we call you?</label>
            <input
              style={S.input}
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--sky)'}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'}
              autoFocus
            />
            <button style={{ ...S.btn, opacity: name.trim() ? 1 : 0.5 }} onClick={() => setStep(2)} disabled={!name.trim()}>
              Continue
            </button>
          </>
        )}

        {/* Step 2: Persona */}
        {step === 2 && (
          <>
            <h1 style={S.h1}>What describes you best?</h1>
            <p style={S.sub}>This helps us tailor your experience — you'll see the features that matter most to you first.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {PERSONAS.map(p => (
                <button key={p.id} onClick={() => setPersona(p.id)}
                  style={{
                    padding: '18px 16px', borderRadius: 14, textAlign: 'left',
                    border: `2px solid ${persona === p.id ? 'var(--sky)' : 'var(--border)'}`,
                    background: persona === p.id ? 'var(--sky3)' : 'var(--bg2)',
                    cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
                  }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{p.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: persona === p.id ? 'var(--sky)' : 'var(--text)', marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>{p.desc}</div>
                </button>
              ))}
            </div>
            <button style={{ ...S.btn, opacity: persona ? 1 : 0.5 }} onClick={() => setStep(3)} disabled={!persona}>
              Continue
            </button>
          </>
        )}

        {/* Step 3: Starting product */}
        {step === 3 && (
          <>
            <h1 style={S.h1}>Where do you want to start?</h1>
            <p style={S.sub}>Pick one to begin — you can access all six products any time from the dashboard.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {PRODUCTS.map(p => (
                <button key={p.id} onClick={() => setProduct(p.id)}
                  style={{
                    padding: '16px 14px', borderRadius: 14, textAlign: 'left',
                    border: `2px solid ${product === p.id ? 'var(--sky)' : 'var(--border)'}`,
                    background: product === p.id ? 'var(--sky3)' : 'var(--bg2)',
                    cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
                  }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{p.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: product === p.id ? 'var(--sky)' : 'var(--text)', marginBottom: 3 }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.5 }}>{p.desc}</div>
                </button>
              ))}
            </div>
            <button
              style={{ ...S.btn, opacity: product ? 1 : 0.5 }}
              onClick={handleComplete}
              disabled={loading || !product}>
              {loading ? 'Setting up...' : 'Start building'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text3)' }}>
              <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
                Skip for now
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
