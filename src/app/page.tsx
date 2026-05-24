'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

// ─── Logo SVG — Code Bracket concept ───
function WyberLogo({ size = 32, dark = false }: { size?: number; dark?: boolean }) {
  const bg = dark ? '#38BDF8' : '#0EA5E9';
  const stroke = dark ? '#060D18' : 'white';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill={bg} />
      <path d="M20 7L11 16L20 25" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 11L28 16L23 21" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
    </svg>
  );
}

function Wordmark({ size = 17, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <span style={{ fontSize: size, fontWeight: 700, letterSpacing: '-0.055em', color: dark ? '#EDF4FF' : '#0B1627', fontFamily: "'DM Sans', sans-serif" }}>
      Wyber<span style={{ color: dark ? '#38BDF8' : '#0EA5E9' }}>AI</span>
    </span>
  );
}

// ─── Typewriter ───
function useTypewriter(words: string[], speed = 64, pause = 2400) {
  const [text, setText] = useState('');
  const [wi, setWi] = useState(0);
  const [del, setDel] = useState(false);
  useEffect(() => {
    const word = words[wi % words.length];
    const t = setTimeout(() => {
      if (!del) {
        setText(word.slice(0, text.length + 1));
        if (text.length === word.length) setTimeout(() => setDel(true), pause);
      } else {
        setText(word.slice(0, text.length - 1));
        if (text.length === 0) { setDel(false); setWi(i => i + 1); }
      }
    }, del ? speed / 2 : speed);
    return () => clearTimeout(t);
  }, [text, del, wi, words, speed, pause]);
  return text;
}

// ─── Scroll reveal ───
function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.08 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return { ref, v };
}
function Up({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, v } = useInView();
  return (
    <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? 'none' : 'translateY(22px)', transition: `opacity 0.65s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 0.65s cubic-bezier(.16,1,.3,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

const WORDS = ['a live SaaS product', 'a React dashboard', 'a customer portal', 'an e-commerce store', 'a landing page', 'an internal tool', 'a Vue application', 'a booking system'];

const STEPS = [
  { n: '01', tag: 'DESCRIBE', title: 'Say what you want to build.', body: 'Plain English. No Figma, no briefs, no back-and-forth. The more specific you are, the better the output — but even vague ideas produce something real.' },
  { n: '02', tag: 'GENERATE', title: 'Watch it appear in real time.', body: 'Files generate as you watch. A live preview loads alongside the code. Your idea becomes a working app in under 60 seconds.' },
  { n: '03', tag: 'REFINE', title: 'Iterate until it\'s right.', body: 'Every change tracked. Every version restorable. If the AI gets something wrong, fixing it costs you nothing. You only pay for what works.' },
  { n: '04', tag: 'SHIP', title: 'Live URL. One click.', body: 'Deploy to Vercel, connect GitHub, add your domain. Share your product with real users before the day is over.' },
];

const FEATURES = [
  { icon: '◎', t: 'Your code. Full stop.', b: 'Every file is yours from generation one. Export, self-host, open-source it. Walk away any time — no migration fees, no data hostage.' },
  { icon: '⬡', t: 'Full stack in one prompt.', b: 'React, Vue, Next.js, Vanilla JS. Database schema, auth flows, API routes — generated as a complete, working system. Not just a UI shell.' },
  { icon: '✦', t: 'Pay for outcomes. Not attempts.', b: 'Credits deduct only when a generation succeeds. AI mistakes are fixed free. Every time. No exceptions. No hidden complexity multipliers.' },
  { icon: '🛡', t: 'Secure before it ships.', b: 'Every deployment automatically scanned. Leaked keys, open endpoints, missing auth — caught before your users ever see the app.' },
  { icon: '◈', t: 'Agent Mode. Fully autonomous.', b: 'Describe a full feature. Agent Mode plans, builds, and commits each step without you doing anything. Review the result, not the process.' },
  { icon: '⌥', t: 'Every version. Restorable.', b: 'Auto-commit to GitHub on every generation. Full history preserved. Restore any state in one click — no matter how far back.' },
];

const MARQUEE_ITEMS = [
  'SaaS dashboard with auth', 'Customer portal', 'Invoice generator', 'AI chatbot interface',
  'CRM for freelancers', 'E-commerce storefront', 'Internal admin tool', 'Kanban board',
  'Investor pitch tool', 'Booking platform', 'Analytics dashboard', 'Job board', 'Portfolio site', 'API explorer',
];

const PLANS = {
  monthly: [
    { id: 'free', tier: 'Free', price: '$0', per: 'forever', credits: '50 credits / month', note: '~50 full generations', featured: false, cta: 'Start free →', features: ['50 generations/month', 'Live preview on every build', 'GitHub sync', 'Export as ZIP anytime', 'Free AI error fixes', 'Public projects'] },
    { id: 'starter', tier: 'Starter', price: '$15', per: 'per month', credits: '400 credits / month', note: 'Credits roll over', featured: false, cta: 'Get Starter →', features: ['Everything in Free', '400 generations/month', 'Private projects', 'Custom domain deploy', 'Remove Wyber branding', 'Priority generation speed'] },
    { id: 'pro', tier: 'Pro', price: '$39', per: 'per month', credits: '1,200 credits / month', note: '+5 bonus credits daily', featured: true, cta: 'Get Pro →', features: ['Everything in Starter', '1,200 generations/month', 'Agent Mode included', 'Supabase auto-backend', 'Security scanner', 'Unlimited version history'] },
    { id: 'teams', tier: 'Teams', price: '$79', per: 'per seat / month', credits: '3,000 credits / seat', note: 'Shared credit pool', featured: false, cta: 'Get Teams →', features: ['Everything in Pro', 'Shared team workspace', 'Multiplayer editing', 'SSO / SAML', 'Admin dashboard', 'Priority support'] },
  ],
  annual: [
    { id: 'free', tier: 'Free', price: '$0', per: 'forever', credits: '50 credits / month', note: '~50 full generations', featured: false, cta: 'Start free →', features: ['50 generations/month', 'Live preview on every build', 'GitHub sync', 'Export as ZIP anytime', 'Free AI error fixes', 'Public projects'] },
    { id: 'starter', tier: 'Starter', price: '$11', per: 'per month, billed annually', credits: '400 credits / month', note: 'Credits roll over', featured: false, cta: 'Get Starter →', features: ['Everything in Free', '400 generations/month', 'Private projects', 'Custom domain deploy', 'Remove Wyber branding', 'Priority generation speed'] },
    { id: 'pro', tier: 'Pro', price: '$29', per: 'per month, billed annually', credits: '1,200 credits / month', note: '+5 bonus credits daily', featured: true, cta: 'Get Pro →', features: ['Everything in Starter', '1,200 generations/month', 'Agent Mode included', 'Supabase auto-backend', 'Security scanner', 'Unlimited version history'] },
    { id: 'teams', tier: 'Teams', price: '$59', per: 'per seat / month, billed annually', credits: '3,000 credits / seat', note: 'Shared credit pool', featured: false, cta: 'Get Teams →', features: ['Everything in Pro', 'Shared team workspace', 'Multiplayer editing', 'SSO / SAML', 'Admin dashboard', 'Priority support'] },
  ],
};

const CHAT_RESPONSES: Record<string, string> = {
  'what can i build': 'Almost anything with a browser — SaaS dashboards, CRMs, e-commerce stores, booking platforms, internal tools, landing pages, AI interfaces, portfolios. If you can describe it in plain English, Wyber AI can build it. What are you thinking of making?',
  'how does it work': "Type what you want in plain English. Wyber AI generates all the code in real time, shows you a live preview, and lets you iterate. When it's ready, one click deploys it to a live URL. First version usually takes under 2 minutes.",
  'what are the pricing': 'Four plans: Free ($0, 50 credits/month), Starter ($15/month, 400 credits), Pro ($39/month, 1,200 credits + Agent Mode), Teams ($79/seat, 3,000 credits + SSO). Annual billing saves 25%. AI errors always free on every plan.',
  'no coding': "Perfect — that's exactly who Wyber AI is built for. Just describe what you want in everyday language. The more specific you are about what it should do, the better the result. Want to tell me your idea?",
  'why wyber': "Three things: your code always belongs to you (export anytime, zero lock-in), you only pay for successful generations (AI errors always free), and we support 4 frameworks not just React.",
  'free': "Yes — start completely free with 50 credits/month, no card required. That's enough to build and iterate a real project. Upgrade to Starter ($15/month) when you need more volume.",
  'github': 'Every generation auto-commits to your GitHub repo. Full version history. Restore any state in one click, no matter how far back.',
  'deploy': 'One-click deploy to Vercel. Custom domain on Starter and above. Share your app the same day you build it.',
  'agent': 'Agent Mode (Pro+) lets you describe a full feature and Wyber AI plans, builds, and commits each step autonomously. You review the result, not the process.',
  'team': 'The Teams plan ($79/seat/month) includes shared workspace, multiplayer editing, shared credit pool, SSO/SAML, and admin dashboard.',
  'secure': 'Every deployment gets an automatic security scan before going live. Leaked keys, open endpoints, missing auth — caught automatically.',
};

function getChatReply(msg: string): string {
  const m = msg.toLowerCase();
  for (const [k, v] of Object.entries(CHAT_RESPONSES)) {
    if (m.includes(k)) return v;
  }
  return "Good question. Best way to see it is to try — 50 free credits, no card needed. Tell me your specific idea and I'll walk you through exactly how Wyber AI would build it.";
}

export default function Page() {
  const typed = useTypewriter(WORDS);
  const [scrolled, setScrolled] = useState(false);
  const [ready, setReady] = useState(false);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'bot' | 'user'; text: string }[]>([
    { role: 'bot', text: "Hey 👋 Got an idea you want to build? Tell me what it is — or ask me anything about Wyber AI." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [chipsShown, setChipsShown] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => setReady(true), 80);
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendChat = useCallback((text: string) => {
    if (!text.trim()) return;
    setChipsShown(false);
    setMessages(m => [...m, { role: 'user', text }]);
    setChatInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, { role: 'bot', text: getChatReply(text) }]);
    }, 900 + Math.random() * 600);
  }, []);

  const C = {
    bg: isDark ? '#060D18' : '#F6F8FB',
    bg2: isDark ? '#0A1220' : '#EDF1F8',
    bg3: isDark ? '#0F1A2E' : '#E2E9F3',
    border: isDark ? '#172133' : '#DCE4F0',
    border2: isDark ? '#1E2D44' : '#C8D6E8',
    text: isDark ? '#EDF4FF' : '#0B1627',
    text2: isDark ? '#6A96C0' : '#3D5A7A',
    text3: isDark ? '#334E6A' : '#7A9BBE',
    sky: isDark ? '#38BDF8' : '#0EA5E9',
    sky2: isDark ? '#7DD3FC' : '#0284C7',
    skyGlow: isDark ? 'rgba(56,189,248,0.1)' : 'rgba(14,165,233,0.12)',
    card: isDark ? '#0A1220' : '#FFFFFF',
    navy: isDark ? '#EDF4FF' : '#0B1627',
    green: isDark ? '#34D399' : '#059669',
    shadow: isDark ? '0 1px 4px rgba(0,0,0,0.4),0 4px 16px rgba(0,0,0,0.25)' : '0 1px 4px rgba(11,22,39,0.06),0 4px 16px rgba(11,22,39,0.04)',
  };

  const fade = (delay = 0) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? 'none' : 'translateY(14px)',
    transition: `opacity 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms`,
  });

  const plans = PLANS[billing];

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'DM Sans', system-ui, sans-serif", overflowX: 'hidden', transition: 'background 0.35s, color 0.35s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=DM+Serif+Display:ital@0;1&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        ::selection{background:rgba(14,165,233,0.2)}
        a{text-decoration:none;color:inherit}
        .nh:hover{color:${C.sky}!important;transition:color 0.15s}
        .bh{transition:all 0.2s cubic-bezier(.16,1,.3,1)}
        .bh:hover{transform:translateY(-1px)}
        .bc{transition:all 0.22s cubic-bezier(.16,1,.3,1)}
        .bc:hover{border-color:rgba(14,165,233,0.3)!important;transform:translateY(-2px)}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes dotpulse{0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-5px);opacity:1}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:2px}
        @media(max-width:768px){
          .mobile-nav-links{display:none!important}
          .mobile-pad{padding-left:20px!important;padding-right:20px!important}
          .mobile-stack{flex-direction:column!important}
          .mobile-grid-1{grid-template-columns:1fr!important}
          .mobile-grid-2{grid-template-columns:1fr 1fr!important}
          .mobile-text-sm{font-size:clamp(38px,10vw,56px)!important}
          .mobile-stats{gap:20px!important;flex-wrap:wrap!important}
          .mobile-stat{padding-right:20px!important;margin-right:20px!important}
          .mobile-hero-min{min-width:unset!important;width:100%!important}
          .mobile-chat{width:calc(100vw - 32px)!important;right:16px!important}
          .mobile-hide{display:none!important}
          .mobile-full{width:100%!important}
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(16px,4vw,40px)', height: 58, background: scrolled ? (isDark ? 'rgba(6,13,24,0.94)' : 'rgba(246,248,251,0.94)') : C.bg, backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: `1px solid ${C.border}`, transition: 'all 0.35s' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <WyberLogo size={30} dark={isDark} />
          <Wordmark size={16} dark={isDark} />
        </Link>
        <div className='mobile-nav-links' style={{ display: 'flex', gap: 28 }}>
          {[['Pricing', '/pricing'], ['Templates', '/templates'], ['Docs', '/docs'], ['Status', '/status']].map(([l, h]) => (
            <Link key={h} href={h} className="nh" style={{ fontSize: 13, color: C.text3, fontWeight: 500 }}>{l}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setIsDark(d => !d)} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, transition: 'all 0.2s' }}>
            {isDark ? '☀️' : '🌙'}
          </button>
          <Link href="/login" className="nh" style={{ fontSize: 13, color: C.text2, padding: '7px 14px', fontWeight: 500 }}>Sign in</Link>
          <Link href="/signup" className="bh" style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, background: C.sky, color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', letterSpacing: '-0.01em', boxShadow: `0 2px 12px ${C.skyGlow}`, display: 'inline-block' }}>
            Start free →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(48px,8vw,88px) clamp(20px,5vw,40px) clamp(40px,6vw,68px)' }}>
        <div style={{ ...fade(0), display: 'inline-flex', alignItems: 'center', gap: 8, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 20, padding: '5px 14px', marginBottom: 32, fontSize: 12, color: C.text2, fontWeight: 500 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, flexShrink: 0, boxShadow: `0 0 6px ${C.green}` }} />
          Now live — build your first app free, no card required
        </div>

        <h1 style={{ ...fade(60), fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(50px, 7vw, 84px)', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.0, margin: '0 0 22px', color: C.text }}>
          Turn your idea into<br />
          <span style={{ color: C.sky, fontStyle: 'italic', display: 'inline-block', minWidth: 'clamp(160px, 38vw, 500px)' }}>
            {typed || '\u00A0'}
          </span>
          <span style={{ borderRight: `4px solid ${C.sky}`, marginLeft: 3, animation: 'blink 1s step-end infinite', display: 'inline-block', height: '0.8em', verticalAlign: '-0.06em' }} /><br />
          <span style={{ color: C.text3 }}>before lunch.</span>
        </h1>

        <p style={{ ...fade(120), fontSize: 'clamp(17px, 2vw, 20px)', color: C.text2, lineHeight: 1.65, maxWidth: 540, margin: '0 0 40px', fontWeight: 400 }}>
          Stop waiting on developers. Type what you want — Wyber AI ships production-ready code with a live preview in seconds. No experience required.
        </p>

        <div style={{ ...fade(180), display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 64 }}>
          <Link href="/signup" className="bh" style={{ padding: '14px 32px', borderRadius: 10, background: C.sky, color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', letterSpacing: '-0.02em', boxShadow: `0 4px 20px ${C.skyGlow}`, display: 'inline-block' }}>
            Start building free →
          </Link>
          <Link href="/templates" className="bh" style={{ padding: '14px 22px', borderRadius: 10, border: `1.5px solid ${C.border2}`, color: C.text2, fontSize: 14, background: 'transparent', cursor: 'pointer', fontWeight: 600, display: 'inline-block' }}>
            Browse templates
          </Link>
        </div>

        <div style={{ ...fade(240), display: 'flex', gap: 0, paddingTop: 44, borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
          {[['50', 'Free credits/month'], ['$15', 'Starter plan'], ['4', 'Frameworks'], ['0', 'Charges for AI errors']].map(([n, l], i) => (
            <div key={l} style={{ paddingRight: 36, marginRight: 36, borderRight: i < 3 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, letterSpacing: '-0.04em', color: C.sky, lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 12, color: C.text3, marginTop: 5, fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MARQUEE */}
      <div style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.bg2, overflow: 'hidden', paddingBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px clamp(16px,4vw,40px) 0' }}>What people are building right now</div>
        <div style={{ display: 'flex', animation: 'marquee 32s linear infinite', whiteSpace: 'nowrap', padding: '10px 0' }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, margin: '0 6px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: '5px 14px', fontSize: 12, color: C.text2, fontWeight: 500, boxShadow: C.shadow }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.sky, flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* PROOF BAR */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.bg, padding: '14px clamp(16px,4vw,40px)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: 10 }}>
        {['Your code — export or push to GitHub, always', 'AI errors fixed free — pay only for what works', 'Live preview on every generation', 'Deploy to production in one click'].map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: C.text2, fontWeight: 500 }}>
            <span style={{ color: C.green, fontWeight: 700 }}>✓</span> {t}
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(48px,8vw,88px) clamp(20px,5vw,40px)' }}>
        <Up>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.sky, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 400, letterSpacing: '-0.025em', color: C.text, margin: '0 0 44px', lineHeight: 1.1 }}>
            Idea to live URL.<br /><em style={{ color: C.sky }}>Four steps. Minutes.</em>
          </h2>
        </Up>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
          {STEPS.map((s, i) => (
            <Up key={s.n} delay={i * 60}>
              <div className="bc" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '36px 32px', height: '100%', boxShadow: C.shadow, transition: 'all 0.22s' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, letterSpacing: '0.1em', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'monospace' }}>
                  {s.n} — {s.tag}
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, fontWeight: 400, letterSpacing: '-0.025em', color: C.text, marginBottom: 10, lineHeight: 1.15 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, maxWidth: 300 }}>{s.body}</div>
              </div>
            </Up>
          ))}
        </div>
      </div>

      {/* POWER STATEMENT */}
      <div style={{ background: C.navy, padding: 'clamp(48px,8vw,88px) clamp(20px,5vw,40px)', textAlign: 'center', transition: 'background 0.35s' }}>
        <Up>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(36px, 5.5vw, 66px)', fontWeight: 400, letterSpacing: '-0.025em', color: isDark ? C.text : '#fff', lineHeight: 1.06, maxWidth: 760, margin: '0 auto 20px' }}>
            The idea in your head is worth<br />more than the code<br /><em style={{ color: C.sky }}>needed to build it.</em>
          </h2>
          <p style={{ fontSize: 18, color: isDark ? C.text2 : 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto 44px', lineHeight: 1.65 }}>
            Stop letting technical barriers stand between you and what you can create.
          </p>
          <Link href="/signup" className="bh" style={{ display: 'inline-block', padding: '15px 34px', borderRadius: 10, background: isDark ? C.sky : '#fff', color: isDark ? '#fff' : C.navy, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', letterSpacing: '-0.01em' }}>
            Start building free →
          </Link>
        </Up>
      </div>

      {/* FEATURES */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(48px,8vw,88px) clamp(20px,5vw,40px)' }}>
        <Up>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.sky, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>What you get</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 400, letterSpacing: '-0.025em', color: C.text, margin: '0 0 8px', lineHeight: 1.1 }}>
            Built to ship.<br /><em style={{ color: C.sky }}>Not to impress demo-watchers.</em>
          </h2>
          <p style={{ fontSize: 16, color: C.text2, maxWidth: 480, lineHeight: 1.65, marginBottom: 44 }}>Everything a serious builder needs. Nothing that slows you down or locks you in.</p>
        </Up>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
          {FEATURES.map((f, i) => (
            <Up key={f.t} delay={i * 40}>
              <div className="bc" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '28px 24px', height: '100%', boxShadow: C.shadow }}>
                <div style={{ width: 38, height: 38, background: C.skyGlow, border: `1px solid rgba(14,165,233,0.15)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 18, color: C.sky }}>
                  {f.icon}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.03em', color: C.text, marginBottom: 8, lineHeight: 1.2 }}>{f.t}</div>
                <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.68 }}>{f.b}</div>
              </div>
            </Up>
          ))}
        </div>
      </div>

      {/* TRUST STRIP */}
      <div style={{ background: C.bg2, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {[
            { t: 'No lock-in. Ever.', b: 'Export everything as a ZIP anytime. Standard tools, standard code — no proprietary formats, no migration.' },
            { t: 'Transparent billing. Always.', b: 'See credit cost before and after every generation. No hidden multipliers, no surprise invoices, ever.' },
            { t: 'Built for the long run.', b: 'Wyber AI is part of the SignalPulse Technologies product family — a focused company building tools that last.' },
          ].map((item, i) => (
            <div key={item.t} style={{ padding: '32px 28px', borderRight: i < 2 ? `1px solid ${C.border}` : 'none', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: `rgba(5,150,105,0.1)`, border: `1px solid rgba(5,150,105,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: C.green, flexShrink: 0, marginTop: 2 }}>✓</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 5, letterSpacing: '-0.02em' }}>{item.t}</div>
                <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>{item.b}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <div style={{ padding: 'clamp(48px,8vw,88px) clamp(20px,5vw,40px)', background: C.bg }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <Up>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.sky, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Pricing</div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 400, letterSpacing: '-0.025em', color: C.text, margin: '0 0 10px', lineHeight: 1.1 }}>
                Honest pricing.<br /><em style={{ color: C.sky }}>No gotchas.</em>
              </h2>
              <p style={{ fontSize: 15, color: C.text2, marginBottom: 24 }}>Start free. Upgrade when ready. Cancel any time.</p>
              <div style={{ display: 'inline-flex', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 4, gap: 4 }}>
                {(['monthly', 'annual'] as const).map(b => (
                  <button key={b} onClick={() => setBilling(b)} style={{ fontSize: 12, padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', background: billing === b ? C.card : 'transparent', color: billing === b ? C.text : C.text3, boxShadow: billing === b ? C.shadow : 'none', fontFamily: "'DM Sans', sans-serif" }}>
                    {b === 'monthly' ? 'Monthly' : <span>Annual <span style={{ color: C.green, fontSize: 10, marginLeft: 4 }}>Save 25%</span></span>}
                  </button>
                ))}
              </div>
            </div>
          </Up>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
            {plans.map((plan, i) => (
              <Up key={plan.id} delay={i * 50}>
                <div style={{ background: plan.featured ? C.navy : C.card, border: `1.5px solid ${plan.featured ? C.sky : C.border}`, borderRadius: 16, padding: '28px 22px', position: 'relative', boxShadow: plan.featured ? `0 8px 32px ${C.skyGlow}` : C.shadow, height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.22s' }}>
                  {plan.featured && (
                    <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: C.sky, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>Most Popular</div>
                  )}
                  <div style={{ fontSize: 11, fontWeight: 700, color: plan.featured ? 'rgba(255,255,255,0.5)' : C.text3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>{plan.tier}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, fontWeight: 400, letterSpacing: '-0.04em', color: plan.featured ? '#fff' : C.text, lineHeight: 1, marginBottom: 3 }}>{plan.price}</div>
                  <div style={{ fontSize: 12, color: plan.featured ? 'rgba(255,255,255,0.45)' : C.text3, marginBottom: 8 }}>{plan.per}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: plan.featured ? C.sky2 : C.sky, marginBottom: 4 }}>{plan.credits}</div>
                  <div style={{ fontSize: 11, color: plan.featured ? 'rgba(255,255,255,0.35)' : C.text3, marginBottom: 24 }}>{plan.note}</div>
                  <div style={{ height: 1, background: plan.featured ? 'rgba(255,255,255,0.1)' : C.border, marginBottom: 20 }} />
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 28, flex: 1 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ fontSize: 12, color: plan.featured ? 'rgba(255,255,255,0.7)' : C.text2, display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4 }}>
                        <span style={{ color: plan.featured ? '#4ade80' : C.green, fontWeight: 700, fontSize: 11, flexShrink: 0, marginTop: 1 }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.id === 'free' ? '/signup' : '/pricing'} style={{ display: 'block', width: '100%', padding: '11px', borderRadius: 9, background: plan.featured ? '#fff' : C.bg2, color: plan.featured ? C.navy : C.text, fontWeight: 700, fontSize: 13, border: `1px solid ${plan.featured ? 'transparent' : C.border}`, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', letterSpacing: '-0.01em' }}>
                    {plan.cta}
                  </Link>
                </div>
              </Up>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: C.text3, marginTop: 24 }}>
            All plans: AI errors always free to fix · No card for Free plan · Credits roll over · Cancel any time · Enterprise? <a href="mailto:hello@wyberai.com" style={{ color: C.sky, fontWeight: 600 }}>hello@wyberai.com</a>
          </p>
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: 'clamp(56px,8vw,96px) clamp(20px,5vw,40px) clamp(64px,8vw,108px)' }}>
        <Up>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(46px, 6.5vw, 80px)', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 0.98, margin: '0 0 36px', color: C.text }}>
            The fastest path from<br />idea to <em style={{ color: C.sky }}>live product</em><br />is one prompt.
          </h2>
          <Link href="/signup" className="bh" style={{ display: 'inline-block', padding: '15px 36px', borderRadius: 10, background: C.sky, color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', letterSpacing: '-0.02em', boxShadow: `0 4px 24px ${C.skyGlow}` }}>
            Start building free →
          </Link>
        </Up>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '36px clamp(20px,5vw,40px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
        <div>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <WyberLogo size={24} dark={isDark} />
            <Wordmark size={14} dark={isDark} />
          </Link>
          <div style={{ fontSize: 12, color: C.text3, lineHeight: 1.7 }}>
            A product by <a href="https://signalpulsehq.com" target="_blank" rel="noreferrer" style={{ color: C.sky, fontWeight: 500 }}>SignalPulse Technologies</a> · Wyoming, USA<br />
            <a href="mailto:hello@wyberai.com" style={{ color: C.text3 }}>hello@wyberai.com</a> · © 2026 SignalPulse Technologies Pvt. Ltd.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[['Pricing', '/pricing'], ['Templates', '/templates'], ['Docs', '/docs'], ['Privacy', '/privacy'], ['Terms', '/terms'], ['Status', '/status']].map(([l, h]) => (
            <Link key={h} href={h} className="nh" style={{ fontSize: 13, color: C.text3, fontWeight: 500 }}>{l}</Link>
          ))}
        </div>
      </footer>

      {/* CHATBOT */}
      <button onClick={() => setChatOpen(o => !o)} style={{ position: 'fixed', bottom: 22, right: 22, zIndex: 300, width: 50, height: 50, background: C.sky, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', boxShadow: `0 4px 20px ${C.skyGlow}`, transition: 'all 0.2s', fontSize: 20 }}>
        {chatOpen ? '×' : '💬'}
      </button>

      {chatOpen && (
        <div style={{ position: 'fixed', bottom: 82, right: 22, zIndex: 300, width: 'min(336px, calc(100vw - 32px))', background: C.card, border: `1px solid ${C.border2}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 490, boxShadow: `0 20px 60px ${isDark ? 'rgba(0,0,0,0.6)' : 'rgba(11,22,39,0.16)'}` }}>
          {/* Chat header */}
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <WyberLogo size={32} dark={isDark} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>Wyber AI</div>
                <div style={{ fontSize: 11, color: C.green, display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} />
                  Online · Instant replies
                </div>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', maxWidth: '90%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ padding: '9px 13px', fontSize: 13, lineHeight: 1.5, background: msg.role === 'user' ? C.sky : C.bg2, color: msg.role === 'user' ? '#fff' : C.text, fontWeight: msg.role === 'user' ? 500 : 400, border: msg.role === 'bot' ? `1px solid ${C.border}` : 'none', borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '4px 12px 12px 12px' }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex', gap: 4, padding: '9px 13px', background: C.bg2, borderRadius: '4px 12px 12px 12px', border: `1px solid ${C.border}`, width: 'fit-content', alignItems: 'center' }}>
                {[0, 1, 2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: C.text3, display: 'block', animation: `dotpulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chips */}
          {chipsShown && (
            <div style={{ padding: '0 14px 8px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {['What can I build?', 'How does it work?', 'Pricing plans?', 'No coding skills?', 'Why Wyber?'].map(chip => (
                <button key={chip} onClick={() => sendChat(chip)} style={{ fontSize: 11, padding: '5px 11px', borderRadius: 20, border: `1px solid ${C.border2}`, color: C.text2, background: 'transparent', cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif" }}>
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 7 }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendChat(chatInput); }} placeholder="Tell me what you want to build..." style={{ flex: 1, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 11px', fontSize: 13, color: C.text, outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
            <button onClick={() => sendChat(chatInput)} style={{ width: 32, height: 32, borderRadius: 8, background: C.sky, border: 'none', cursor: 'pointer', fontSize: 13, color: '#fff', flexShrink: 0 }}>→</button>
          </div>
        </div>
      )}
    </div>
  );
}