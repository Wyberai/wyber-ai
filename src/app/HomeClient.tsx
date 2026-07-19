'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { WyberLogo } from '@/components/shared/WyberLogo';
import { Footer } from '@/components/shared/FooterClient';
import { type Currency } from '@/lib/currency';
import { track } from '@/lib/track';
import { VoiceButton } from '@/components/editor/VoiceButton';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { LOCALE_SPEECH_CODE, LOCALE_STORAGE_KEY, LOCALES, type Locale } from '@/lib/i18n/locales';
import { HOME_STRINGS } from '@/lib/i18n/home-translations';
import { HERO_SEGMENT_STRINGS, type HeroSegment } from '@/lib/hero-segments';

const BRAND = '#0EA5E9';
const EASE = [0.22, 1, 0.36, 1] as const;

/* ————— shared atoms ————— */

const IcoCheck = ({ color = '#22c55e' }: { color?: string }) => (
  <svg width="10" height="10" viewBox="0 0 12 12" style={{ flexShrink: 0, marginTop: 4 }}>
    <path d="M2 6l3 3 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
);

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="mk-eyebrow" style={{ marginBottom: 18 }}>{children}</div>;
}

function Reveal({ children, delay = 0, y = 24 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function WindowChrome({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(56,189,248,0.5)' }} />
      <span className="mk-mono" style={{ marginLeft: 8, fontSize: 10 }}>{title}</span>
    </div>
  );
}

/* Build console — the truthful product depiction (what a live build looks like) */
function BuildConsole({ rows, accent = BRAND, title }: {
  rows: { done: boolean; active: boolean; label: string; detail: string }[];
  accent?: string;
  title: string;
}) {
  return (
    <div className="mk-frame mk-noise" style={{ position: 'relative', padding: 18, fontFamily: 'var(--brand-mono)', fontSize: 11 }}>
      <WindowChrome title={title} />
      {rows.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < rows.length - 1 ? 12 : 0 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: s.active ? accent : s.done ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${s.active ? accent : s.done ? 'rgba(34,197,94,0.6)' : 'var(--brand-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, boxShadow: s.active ? '0 0 14px var(--brand-glow)' : 'none' }}>
            {s.done && !s.active && <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" fill="none" /></svg>}
            {s.active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />}
          </div>
          <div>
            <div style={{ color: s.active ? 'var(--brand-text)' : s.done ? 'var(--brand-text-dim)' : 'var(--brand-text-faint)', fontWeight: s.active ? 600 : 400, fontSize: 11, letterSpacing: '0.02em' }}>{s.label}</div>
            <div style={{ color: 'var(--brand-text-faint)', fontSize: 10, marginTop: 2 }}>{s.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const WEB_BUILD_ROWS = [
  { done: true,  active: false, label: 'PROMPT RECEIVED',       detail: '"Build a CRM with pipeline view"' },
  { done: true,  active: false, label: 'GENERATING REACT CODE', detail: '14 files · Supabase schema' },
  { done: true,  active: false, label: 'PUSHING TO GITHUB',     detail: 'wyberai/crm-abc123' },
  { done: false, active: true,  label: 'DEPLOYING TO VERCEL',   detail: 'crm-abc123.vercel.app' },
];

const MOBILE_BUILD_ROWS = [
  { done: true,  active: false, label: 'SCAFFOLD EXPO PROJECT', detail: 'TypeScript · React Native' },
  { done: true,  active: false, label: 'GENERATE 9 SCREENS',    detail: 'Auth, home, profile, cart…' },
  { done: false, active: true,  label: 'LIVE PREVIEW READY',    detail: 'scan QR to open on device' },
  { done: false, active: false, label: 'EXPORT FOR APP STORE',  detail: 'EAS Build · IPA / APK' },
];

/* RLS scan readout — an illustrative example of what the scanner finds (not a
   live probe of the visitor's own data — that would require them to be
   authenticated, which a homepage visitor isn't). The window title says
   "example" rather than "live" for that reason. The one number that IS real —
   how many times this scanner has actually run, and what fraction came back
   clean — is fetched server-side in page.tsx and passed in as `stats`. */
function ScanReadout({ stats }: { stats?: { totalScans: number; cleanPct: number } | null }) {
  return (
    <div className="mk-frame mk-noise" style={{ position: 'relative', padding: 18, fontFamily: 'var(--brand-mono)', fontSize: 11 }}>
      <WindowChrome title="example scan — what the RLS trust scanner finds" />
      <div style={{ color: 'var(--brand-text-faint)', fontSize: 10, marginBottom: 10, letterSpacing: '0.06em' }}>
        $ probing live database with anon key (attacker&apos;s view)…
      </div>
      {[
        { table: 'profiles',  status: 'LOCKED',  ok: true,  note: 'RLS enforced · 0 rows leaked' },
        { table: 'orders',    status: 'LOCKED',  ok: true,  note: 'RLS enforced · 0 rows leaked' },
        { table: 'invoices',  status: 'EXPOSED', ok: false, note: '312 rows readable — publish blocked' },
      ].map(r => (
        <div key={r.table} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--brand-border)' }}>
          <span style={{ color: 'var(--brand-text-dim)', width: 76, flexShrink: 0 }}>{r.table}</span>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', padding: '2px 8px', borderRadius: 4, flexShrink: 0, color: r.ok ? '#22c55e' : '#ef4444', border: `1px solid ${r.ok ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.4)'}`, background: r.ok ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.08)' }}>{r.status}</span>
          <span style={{ color: 'var(--brand-text-faint)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.note}</span>
        </div>
      ))}
      <div style={{ color: 'var(--brand-text-faint)', fontSize: 10, marginTop: 10 }}>
        → real queries against your live DB. Not a linter.
      </div>
      {stats && (
        <div style={{ color: 'var(--brand-accent-hot)', fontSize: 10, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--brand-border)' }}>
          ✓ {stats.totalScans.toLocaleString()} real scans run · {stats.cleanPct}% came back clean on the first try
        </div>
      )}
    </div>
  );
}

/* ————— data ————— */

/* MCP console — the developer differentiator: drive WyberAi from your AI editor */
function McpConsole() {
  return (
    <div className="mk-frame mk-noise" style={{ position: 'relative', padding: 18, fontFamily: 'var(--brand-mono)', fontSize: 11 }}>
      <WindowChrome title="claude code — wyberai mcp" />
      <div style={{ color: 'var(--brand-text-faint)', fontSize: 10, marginBottom: 4, letterSpacing: '0.04em' }}>
        $ claude mcp add --transport http wyberai \
      </div>
      <div style={{ color: 'var(--brand-accent-hot)', fontSize: 10, marginBottom: 8, paddingLeft: 12, wordBreak: 'break-all' }}>
        https://wyberai.com/api/mcp --header &quot;x-api-key: wyb_•••&quot;
      </div>
      <div style={{ color: '#22c55e', fontSize: 10, marginBottom: 14 }}>✓ connected · 20 tools available</div>
      <div style={{ color: 'var(--brand-text-dim)', fontSize: 10, marginBottom: 8 }}>&gt; &quot;spin up a waitlist app and publish it&quot;</div>
      {[
        { t: 'create_project',  d: 'waitlist-app · react-vite' },
        { t: 'send_message',    d: 'building… 12 files generated' },
        { t: 'publish_project', d: 'live at waitlist-x1.wyber.app' },
      ].map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--brand-border)' }}>
          <span style={{ color: 'var(--brand-accent)', fontSize: 10, width: 128, flexShrink: 0 }}>{r.t}</span>
          <span style={{ color: 'var(--brand-text-faint)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.d}</span>
        </div>
      ))}
      <div style={{ color: 'var(--brand-text-faint)', fontSize: 10, marginTop: 10 }}>→ your workspace, driven from your editor.</div>
    </div>
  );
}

const PRODUCTS = [
  {
    key: 'web',
    label: 'WEB APPS',
    accent: BRAND,
    heading: 'Describe it. It builds.',
    body: 'Type what you want in plain English. Wyber generates production-ready React code, provisions a database, and deploys to a live URL — in minutes.',
    bullets: ['Fresh code every time — no stale templates', '27 integrations — Supabase, Stripe, OpenAI & more', 'GitHub push · Vercel deploy · custom domains'],
    cta: 'Start building',
    href: '/signup',
    mockup: <BuildConsole rows={WEB_BUILD_ROWS} title="wyberai.com — live build" />,
  },
  {
    key: 'mobile',
    label: 'MOBILE APPS',
    accent: '#f97316',
    heading: 'Describe it. Ship to iOS.',
    body: 'Generate a real React Native app with Expo. Preview on your phone via QR code. Export a ready-to-publish project.',
    bullets: ['React Native + Expo · camera, GPS, biometrics', 'Push notifications · in-app purchases', 'App Store submission guide included'],
    cta: 'Start building',
    href: '/templates/mobile',
    mockup: <BuildConsole rows={MOBILE_BUILD_ROWS} accent="#f97316" title="wyberai.com — mobile build" />,
  },
] as const;

// Homepage FAQ — visible accordion + matching FAQPage schema (AEO). The
// "Who makes WyberAi?" answer explicitly names SignalPulse Technologies to
// correct stale Knowledge Graph data.
const HOME_FAQS: [string, string][] = [
  ['What is WyberAi?', 'WyberAi is an AI platform that turns plain-English prompts into production-ready web and mobile apps. Describe what you want and it generates fresh React code, provisions a database, and deploys to a live URL — in minutes, no engineers needed.'],
  ['Who makes WyberAi?', 'WyberAi is built and operated by SignalPulse Technologies, a US-based software company.'],
  ['Can WyberAi build mobile apps?', 'Yes. WyberAi generates real React Native (Expo) mobile apps you can preview on your phone via QR code and export for the App Store — from the same prompt-based workflow as web apps.'],
  ['Do I need to know how to code?', 'No. You describe your app in plain English. WyberAi writes the code, wires up auth, database, and APIs, and deploys it. You can still push to GitHub and own the code if you want.'],
  ['How is WyberAi different from template builders?', 'WyberAi generates fresh code from scratch every time — never stale templates. Builds self-heal their own errors, ship full-stack (auth, database, APIs), and you own the code via GitHub with zero lock-in.'],
  ['How much does WyberAi cost?', 'You can start free with 50 credits, no credit card required. Paid plans are affordable and one-time credit top-ups never expire — see the pricing page for the current plans.'],
];

/* The six proof points — editorial numbered rows, not an icon grid */
const PROOF = [
  { n: '01', title: 'Fresh code, every time', desc: 'No drag-and-drop. No stale templates. AI writes real React + Tailwind from scratch for every project.' },
  { n: '02', title: 'Self-healing builds', desc: 'A broken import or a truncated file doesn\'t stop the build. WyberAi detects the failure and repairs itself in the same run — no red screen, no manual debugging.' },
  { n: '03', title: 'Live security scanning', desc: 'We probe your live database with the same anonymous key an attacker would use — real Row-Level Security testing, not a static linter guessing at your schema.' },
  { n: '04', title: 'Full-stack out of the box', desc: 'Auth, database, API routes, file uploads — generated and wired up. Not just a pretty frontend.' },
  { n: '05', title: 'GitHub integration', desc: 'Push to your own repo. Own your code. Fork it, extend it, hire devs later if you want. Zero lock-in.' },
  { n: '06', title: 'Smart model routing', desc: 'Opus for builds, Sonnet for edits, Haiku when speed matters. WyberAi picks the right AI model for every task — automatically.' },
];

/* Mission sequence — Describe → Build → Ship, rendered in normal flow */
const STAGES = [
  {
    tag: 'T-MINUS · DESCRIBE',
    title: 'Describe your app',
    desc: 'Tell Wyber what you want in plain English — or drop in screenshots, Figma files, or docs.',
    visual: (
      <div className="mk-frame mk-noise" style={{ position: 'relative', padding: 18, fontFamily: 'var(--brand-mono)', fontSize: 12 }}>
        <WindowChrome title="wyberai.com — new project" />
        <div style={{ padding: '14px 16px', border: '1px solid var(--brand-border-strong)', borderRadius: 10, background: 'rgba(255,255,255,0.02)', color: 'var(--brand-text)', lineHeight: 1.7 }}>
          Build a CRM for my agency with a kanban pipeline,<br />client notes, and an invoices page
          <span style={{ display: 'inline-block', width: 7, height: 15, background: 'var(--brand-accent-hot)', marginLeft: 3, verticalAlign: 'text-bottom', animation: 'blink 1.1s steps(1) infinite' }} />
        </div>
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="mk-mono" style={{ fontSize: 10 }}>EST. 30 CREDITS · OPUS SELECTED</span>
          <span style={{ padding: '6px 14px', borderRadius: 7, background: 'var(--brand-accent)', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Build →</span>
        </div>
      </div>
    ),
  },
  {
    tag: 'IGNITION · BUILD',
    title: 'AI builds it live',
    desc: 'Watch production-ready code generate in real time. Fresh code every run — and if something breaks mid-build, it heals itself before you ever see an error.',
    visual: <BuildConsole rows={WEB_BUILD_ROWS} title="wyberai.com — live build" />,
  },
  {
    tag: 'ORBIT · SHIP',
    title: 'Ship it',
    desc: 'Deploy to a live URL with one click. Connect your domain, push to GitHub, iterate with plain-English feedback.',
    visual: (
      <div className="mk-frame mk-noise" style={{ position: 'relative', padding: 18 }}>
        <WindowChrome title="crm-abc123.vercel.app" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--brand-border)', background: 'rgba(255,255,255,0.02)', marginBottom: 14 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.8)' }} />
          <span className="mk-mono" style={{ fontSize: 10, color: 'var(--brand-text-dim)' }}>https://crm-abc123.vercel.app — LIVE</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Pipeline', 'Clients', 'Invoices', 'Settings'].map((x, i) => (
              <div key={x} style={{ padding: '7px 10px', borderRadius: 6, fontSize: 10, fontFamily: 'var(--brand-mono)', color: i === 0 ? 'var(--brand-accent-hot)' : 'var(--brand-text-faint)', background: i === 0 ? 'rgba(14,165,233,0.08)' : 'transparent', border: i === 0 ? '1px solid rgba(14,165,233,0.25)' : '1px solid transparent' }}>{x}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {['LEAD', 'ACTIVE', 'WON'].map(col => (
              <div key={col} style={{ border: '1px solid var(--brand-border)', borderRadius: 6, padding: 6 }}>
                <div className="mk-mono" style={{ fontSize: 8, marginBottom: 6 }}>{col}</div>
                {[0, 1].map(i => <div key={i} style={{ height: 18, borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--brand-border)', marginBottom: 4 }} />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

/* ————— page ————— */

export function HomeClient({ initialCurrency = 'USD', scanStats = null, initialSegment = null }: { initialCurrency?: Currency; scanStats?: { totalScans: number; cleanPct: number } | null; initialSegment?: HeroSegment | null }) {
  const inr = initialCurrency === 'INR';
  // India-only locale switch — never rendered or read for non-India visitors.
  // Starts 'en' on every render (server and first client paint match, so no
  // hydration mismatch) and only adopts a saved preference after mount.
  const [locale, setLocale] = useState<Locale>('en');
  useEffect(() => {
    if (!inr) return;
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
      if (saved && (LOCALES as readonly string[]).includes(saved)) setLocale(saved);
    } catch { /* private mode */ }
  }, [inr]);
  // Adaptive hero segment: server-resolved on tagged/referred visits (in the
  // first paint — no flash), then remembered so the same visitor coming back
  // via a bare URL still sees "their" hero. Post-mount adoption only, same
  // hydration-safe pattern as the locale switch above.
  const [segment, setSegment] = useState<HeroSegment | null>(initialSegment);
  useEffect(() => {
    try {
      if (initialSegment) {
        localStorage.setItem('wyber-hero-seg', initialSegment);
      } else {
        const saved = localStorage.getItem('wyber-hero-seg') as HeroSegment | null;
        if (saved && saved in HERO_SEGMENT_STRINGS) setSegment(saved);
      }
    } catch { /* private mode */ }
    if (initialSegment) track('homepage_segment_shown', { segment: initialSegment });
  }, [initialSegment]);
  // English-only override: India's local-language heroes are already adapted.
  const base = HOME_STRINGS[locale];
  const t = segment && locale === 'en' ? { ...base, ...HERO_SEGMENT_STRINGS[segment] } : base;
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(0);
  const [showDemo, setShowDemo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [canPin, setCanPin] = useState(false);
  const reduce = useReducedMotion();
  const [heroPrompt, setHeroPrompt] = useState('');

  // Stash the idea and route through auth — DashboardClient consumes
  // wyber-pending-prompt on mount and turns it into the first project.
  // Read the DOM value, not state: autofill/paste can commit text without
  // React's onChange having run by submit time.
  const heroPromptRef = useRef<HTMLTextAreaElement | null>(null);
  const [heroTarget, setHeroTarget] = useState<'app' | 'mobile'>('app');
  const submitHeroPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    const p = (heroPromptRef.current?.value ?? heroPrompt).trim();
    if (p) {
      try {
        localStorage.setItem('wyber-pending-prompt', p.slice(0, 2000));
        localStorage.setItem('wyber-pending-type', heroTarget);
      } catch { /* private mode */ }
      track('homepage_prompt_submitted', { length: p.length, target: heroTarget, segment: segment ?? 'default' });
    }
    window.location.href = user ? '/dashboard' : '/signup';
  };

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => setUser(data.user));
    });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    const mqPin = window.matchMedia('(min-width: 861px)');
    const updatePin = () => setCanPin(mqPin.matches);
    updatePin();
    mqPin.addEventListener('change', updatePin);
    return () => { mq.removeEventListener('change', update); mqPin.removeEventListener('change', updatePin); };
  }, []);

  const product = PRODUCTS[activeProduct];

  const navLinks: [string, string][] = [[t.navWebApps, '/use-cases/ai-app-builder'], [t.navMobileApps, '/templates/mobile'], [t.navJourney, '/space-journey'], [t.navPricing, '/pricing']];

  return (
    <div className="mk-page" data-theme="dark">

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5,6,10,0.8)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--brand-border)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={26} wordmarkSize={15} />
        </Link>
        <div className="wyb-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {navLinks.map(([l, h]) => (
            <Link key={l} href={h} style={{ padding: '6px 12px', borderRadius: 7, fontSize: 13, color: 'var(--brand-text-dim)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand-text)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand-text-dim)'}>
              {l === t.navJourney ? <>✦ {l}</> : l}
            </Link>
          ))}
          <div style={{ width: 1, height: 16, background: 'var(--brand-border-strong)', margin: '0 6px' }} />
          {inr && <LanguageToggle locale={locale} onChange={setLocale} />}
          {user
            ? <Link href="/dashboard" className="mk-btn" style={{ padding: '7px 16px', fontSize: 13 }}>Dashboard →</Link>
            : <>
                <Link href="/login" style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, color: 'var(--brand-text-dim)', textDecoration: 'none', fontWeight: 500 }}>{t.signIn}</Link>
                <Link href="/signup" className="mk-btn" style={{ padding: '7px 16px', fontSize: 13 }}>{t.startFree}</Link>
              </>
          }
        </div>
        <button className="wyb-nav-hamburger" onClick={() => setMobileMenuOpen(o => !o)} aria-label="Toggle menu"
          style={{ display: 'none', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 8, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 22, height: 2, background: 'var(--brand-text-dim)', borderRadius: 1, transition: 'all 0.2s', transform: mobileMenuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
          <div style={{ width: 22, height: 2, background: mobileMenuOpen ? 'transparent' : 'var(--brand-text-dim)', borderRadius: 1 }} />
          <div style={{ width: 22, height: 2, background: 'var(--brand-text-dim)', borderRadius: 1, transition: 'all 0.2s', transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 99, background: 'rgba(5,6,10,0.98)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--brand-border-strong)', padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navLinks.map(([l, h]) => (
            <Link key={l} href={h} onClick={() => setMobileMenuOpen(false)} style={{ padding: '12px 4px', fontSize: 16, fontWeight: 600, color: 'var(--brand-text-dim)', textDecoration: 'none', borderBottom: '1px solid var(--brand-border)', display: 'block', minHeight: 44 }}>{l}</Link>
          ))}
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {user
              ? <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="mk-btn" style={{ justifyContent: 'center' }}>Dashboard →</Link>
              : <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="mk-btn-ghost" style={{ justifyContent: 'center' }}>{t.signIn}</Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="mk-btn" style={{ justifyContent: 'center' }}>{t.startFree}</Link>
                </>
            }
          </div>
          {inr && <div style={{ paddingTop: 12, display: 'flex', justifyContent: 'center' }}><LanguageToggle locale={locale} onChange={setLocale} /></div>}
        </div>
      )}

      {/* ── BUILD CHALLENGE BANNER ──────────────────────────────────── */}
      <Link href="/challenge" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '9px 20px', background: 'rgba(14,165,233,0.06)', borderBottom: '1px solid var(--brand-border)', textDecoration: 'none', color: 'var(--brand-text)', fontSize: 12.5, fontWeight: 500 }}>
        <span className="mk-mono" style={{ color: 'var(--brand-accent)', fontSize: 10 }}>WEEKLY BUILD CHALLENGE</span>
        <span style={{ color: 'var(--brand-text-dim)' }}>Build your MVP on Wyber, enter to win credits — new winners every Sunday</span>
        <span style={{ color: 'var(--brand-accent-hot)', fontSize: 12 }}>Enter →</span>
      </Link>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--brand-border)' }}>
        <div className="mk-stars" aria-hidden />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 55% at 68% 20%, rgba(14,165,233,0.10) 0%, transparent 62%)', pointerEvents: 'none' }} />
        <div className="mk-section" style={{ position: 'relative', display: 'grid', gridTemplateColumns: canPin ? '1.1fr 0.9fr' : '1fr', gap: 'clamp(32px,5vw,72px)', alignItems: 'center', paddingTop: 'clamp(72px,10vw,128px)', paddingBottom: 'clamp(64px,9vw,112px)' }}>
          <div>
            <Reveal y={16}>
              <div className="mk-eyebrow" style={{ marginBottom: 26 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px rgba(34,197,94,0.9)', animation: 'pulse 2s infinite' }} />
                <span style={{ textDecoration: 'line-through', color: 'var(--brand-text-faint)', opacity: 0.7 }}>{t.eyebrowStrike}</span>
                {' '}{t.eyebrowMain}
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mk-display" style={{ marginBottom: 26 }}>
                {t.heroLine1}<br />
                <span className="mk-serif">{t.heroLine2}</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mk-lead" style={{ maxWidth: 520, marginBottom: 36 }}>
                {t.heroLead}
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              {/* The prompt box IS the primary CTA: the visitor's idea rides
                  localStorage through signup/OAuth and becomes their first
                  project (DashboardClient consumes wyber-pending-prompt). */}
              <form onSubmit={submitHeroPrompt} className="mk-frame" style={{ maxWidth: 560, padding: 10, marginBottom: 14, borderColor: 'var(--brand-border-strong)' }}>
                <textarea
                  ref={heroPromptRef}
                  value={heroPrompt}
                  onChange={e => setHeroPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitHeroPrompt(e); } }}
                  placeholder={t.heroPlaceholder}
                  rows={2}
                  style={{ width: '100%', resize: 'none', background: 'transparent', border: 'none', outline: 'none', color: 'var(--brand-text)', fontSize: 15, lineHeight: 1.55, fontFamily: 'var(--font-sans)', padding: '8px 10px' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 8, borderTop: '1px solid var(--brand-border)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 4px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)' }}>
                    <button type="button" onClick={() => setHeroTarget('app')} aria-pressed={heroTarget === 'app'}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, border: heroTarget === 'app' ? '1px solid rgba(14,165,233,0.45)' : '1px solid transparent', background: heroTarget === 'app' ? 'rgba(14,165,233,0.18)' : 'transparent', color: heroTarget === 'app' ? 'var(--brand-accent)' : 'var(--brand-text-dim)', fontSize: 12.5, fontWeight: 650, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                      {t.targetWeb}
                    </button>
                    <button type="button" onClick={() => setHeroTarget('mobile')} aria-pressed={heroTarget === 'mobile'}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, border: heroTarget === 'mobile' ? '1px solid rgba(168,85,247,0.45)' : '1px solid transparent', background: heroTarget === 'mobile' ? 'rgba(168,85,247,0.18)' : 'transparent', color: heroTarget === 'mobile' ? '#a855f7' : 'var(--brand-text-dim)', fontSize: 12.5, fontWeight: 650, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                      {t.targetMobile}
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-text-dim)' }}>
                    <VoiceButton
                      lang={LOCALE_SPEECH_CODE[locale]}
                      onTranscript={txt => {
                        setHeroPrompt(prev => (prev ? prev + ' ' + txt : txt));
                        track('homepage_voice_used', { length: txt.length, locale });
                      }}
                    />
                    <button type="submit" className="mk-btn" style={{ padding: '10px 22px', fontSize: 14 }}>
                      {t.ctaBuild}
                    </button>
                  </div>
                </div>
              </form>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                <button onClick={() => setShowDemo(true)} className="mk-btn-ghost" style={{ fontSize: 14, padding: '10px 20px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: 'var(--brand-accent)', boxShadow: '0 0 12px var(--brand-glow)' }}>
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="#fff"><path d="M3 2l7 4-7 4z" /></svg>
                  </span>
                  {t.watchDemo}
                </button>
                <p className="mk-mono" style={{ fontSize: 11, marginBottom: 0 }}>
                  {t.creditsLine(inr ? '₹499' : '$29')}
                </p>
              </div>
              {inr && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--brand-text-dim)', fontWeight: 500 }}>🛡 {t.trustLine}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--brand-text-dim)', fontWeight: 500 }}>📱 {t.upiLine}</span>
                </div>
              )}
            </Reveal>
          </div>
          {canPin && (
            <Reveal delay={0.2} y={32}>
              <motion.div
                animate={reduce ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'relative' }}
              >
                <div style={{ position: 'absolute', inset: -24, background: 'radial-gradient(ellipse at center, rgba(14,165,233,0.10), transparent 70%)', pointerEvents: 'none' }} />
                <BuildConsole rows={WEB_BUILD_ROWS} title="wyberai.com — live build" />
              </motion.div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── TELEMETRY STRIP ──────────────────────────────────────────── */}
      <section style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px clamp(20px,5vw,48px)', display: 'flex', justifyContent: 'space-between', gap: 'clamp(20px,4vw,48px)', flexWrap: 'wrap' }}>
          {[
            { value: '2,400+', label: 'APPS BUILT' },
            { value: '30s', label: 'AVG BUILD TIME' },
            { value: '4.9/5', label: 'USER RATING' },
            { value: '99.9%', label: 'UPTIME TARGET', href: '/status' },
          ].map(s => (
            <div key={s.label}>
              <div className="mk-stat">{s.value}</div>
              <div className="mk-stat-label" style={{ marginTop: 4 }}>
                {s.href ? <a href={s.href} style={{ color: 'inherit', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>{s.label}</a> : s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MISSION SEQUENCE — normal flow (scroll-pinning removed Jul 11:
             even 4 presses of hijacked scroll read as "the page is stuck") */}
      <section className="mk-section" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <Reveal>
          <div className="mk-eyebrow" style={{ marginBottom: 48 }}>MISSION SEQUENCE</div>
        </Reveal>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(48px,6vw,88px)' }}>
          {STAGES.map(s => (
            <Reveal key={s.tag} delay={0.05}>
              <div className="wyb-seq-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 'clamp(28px,5vw,72px)', alignItems: 'center' }}>
                <div>
                  <div className="mk-mono" style={{ color: 'var(--brand-accent-hot)', marginBottom: 12 }}>{s.tag}</div>
                  <h2 className="mk-h2" style={{ fontSize: 'clamp(26px,3.5vw,40px)', marginBottom: 12 }}>{s.title}</h2>
                  <p className="mk-lead" style={{ maxWidth: 420 }}>{s.desc}</p>
                </div>
                <div>{s.visual}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── PRODUCTS ─────────────────────────────────────────────────── */}
      <section className="mk-section">
        <Reveal>
          <Eyebrow>PRODUCTS</Eyebrow>
          <h2 className="mk-h2" style={{ marginBottom: 10 }}>Web apps &amp; mobile apps, <span className="mk-serif">one platform</span></h2>
          <p className="mk-lead" style={{ marginBottom: 44, maxWidth: 560 }}>Everything you need to build, launch, and grow — in one place.</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="wyb-product-pills" style={{ display: 'flex', gap: 8, marginBottom: 36, flexWrap: 'wrap' }}>
            {PRODUCTS.map((p, i) => (
              <button key={p.key} onClick={() => setActiveProduct(i)}
                style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${i === activeProduct ? 'var(--brand-border-accent)' : 'var(--brand-border)'}`, background: i === activeProduct ? 'rgba(14,165,233,0.08)' : 'transparent', color: i === activeProduct ? 'var(--brand-accent-hot)' : 'var(--brand-text-faint)', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--brand-mono)', letterSpacing: '0.12em', transition: 'all 0.2s var(--brand-ease)', boxShadow: i === activeProduct ? '0 0 20px var(--brand-glow-soft)' : 'none' }}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="wyb-product-detail" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(28px,4vw,56px)', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,3vw,32px)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 12, color: 'var(--brand-text)', lineHeight: 1.12 }}>
                {product.heading}
              </h3>
              <p style={{ fontSize: 15, color: 'var(--brand-text-dim)', lineHeight: 1.7, marginBottom: 24 }}>
                {product.body}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {product.bullets.map((b, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--brand-text-dim)' }}>
                    <IcoCheck color={product.accent} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Link href={product.href} className="mk-btn" style={{ background: product.accent, boxShadow: `0 0 24px ${product.accent}50` }}>
                {product.cta} →
              </Link>
            </div>
            <div>{product.mockup}</div>
          </div>
        </Reveal>
      </section>

      {/* ── PROOF — editorial numbered rows + live scan readout ─────── */}
      <section style={{ borderTop: '1px solid var(--brand-border)', background: 'var(--brand-bg-raised)' }}>
        <div className="mk-section">
          <Reveal>
            <Eyebrow>WHY WYBER</Eyebrow>
            <h2 className="mk-h2" style={{ marginBottom: 10 }}>Not another <span className="mk-serif">template marketplace</span></h2>
            <p className="mk-lead" style={{ marginBottom: 52, maxWidth: 560 }}>
              Every other AI builder generates code and hopes it holds. WyberAi checks its own work — automatically.
            </p>
          </Reveal>

          <div className="wyb-proof-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'clamp(32px,5vw,64px)', alignItems: 'start' }}>
            <div>
              {PROOF.map((f, i) => (
                <Reveal key={f.n} delay={i * 0.05}>
                  <div style={{ display: 'flex', gap: 20, padding: '22px 0', borderTop: '1px solid var(--brand-border)', borderBottom: i === PROOF.length - 1 ? '1px solid var(--brand-border)' : 'none' }}>
                    <span className="mk-mono" style={{ color: 'var(--brand-accent)', fontSize: 12, paddingTop: 3, flexShrink: 0 }}>{f.n}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-text)', marginBottom: 6, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{f.title}</div>
                      <p style={{ fontSize: 13.5, color: 'var(--brand-text-dim)', lineHeight: 1.65, margin: 0, maxWidth: 480 }}>{f.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.15}>
              <div style={{ position: 'sticky', top: 90 }}>
                <div className="mk-mono" style={{ marginBottom: 12, color: 'var(--brand-accent-hot)' }}>HOW THE SCANNER WORKS</div>
                <ScanReadout stats={scanStats} />
                <p style={{ fontSize: 12, color: 'var(--brand-text-faint)', lineHeight: 1.6, marginTop: 12 }}>
                  The RLS trust scan runs before every publish. Critical leaks block the release until you fix them — or consciously override.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── MCP / DEVELOPERS ─────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--brand-border)' }}>
        <div className="mk-section">
          <Reveal>
            <Eyebrow>MCP SERVER</Eyebrow>
            <h2 className="mk-h2" style={{ marginBottom: 10 }}>Drive it from <span className="mk-serif">Claude, Cursor &amp; Claude Code</span></h2>
            <p className="mk-lead" style={{ marginBottom: 44, maxWidth: 600 }}>
              WyberAi ships a real MCP server — 20 tools. Create projects, run builds, inspect files, run SQL, scan for security holes, and publish live apps — without leaving your AI editor. No other app builder lets you do this.
            </p>
          </Reveal>
          <div className="wyb-product-detail" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(28px,4vw,56px)', alignItems: 'center' }}>
            <Reveal delay={0.1}>
              <div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>
                  {([
                    ['create_project', 'Start a new app'],
                    ['send_message', 'Kick off a build'],
                    ['execute_sql', 'Query the database'],
                    ['run_security_scan', 'Audit for data leaks'],
                    ['set_project_knowledge', 'Set your standards'],
                    ['publish_project', 'Ship it live'],
                  ] as [string, string][]).map(([t, d]) => (
                    <li key={t} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span className="mk-mono" style={{ color: 'var(--brand-accent)', fontSize: 11 }}>{t}</span>
                      <span style={{ fontSize: 13, color: 'var(--brand-text-dim)' }}>{d}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Link href="/api-keys" className="mk-btn" style={{ background: 'var(--brand-accent)', boxShadow: '0 0 24px var(--brand-glow-soft)' }}>
                    Get your MCP key →
                  </Link>
                  <Link href="/mcp" style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-accent)' }}>See all 20 tools →</Link>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <McpConsole />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ─────────────────────────────────────────── */}
      <section className="mk-section">
        <Reveal>
          <Eyebrow>PRICING</Eyebrow>
          <h2 className="mk-h2" style={{ marginBottom: 10 }}>Simple, transparent pricing</h2>
          <p className="mk-lead" style={{ marginBottom: 44, maxWidth: 520 }}>Start free. Upgrade when you need more builds. All features included on every plan.</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="wyb-plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 44 }}>
            {(inr
              ? [
                  { name: 'SPARK', price: '₹499', credits: '50', highlight: false, badge: 'INDIA ENTRY' },
                  { name: 'STARTER', price: '₹1,499', credits: '150', highlight: false },
                  { name: 'BUILDER', price: '₹3,999', credits: '500', highlight: true, badge: 'MOST POPULAR' },
                ]
              : [
                  { name: 'STARTER', price: '$29', credits: '150', highlight: false },
                  { name: 'BUILDER', price: '$79', credits: '500', highlight: true, badge: 'MOST POPULAR' },
                  { name: 'PRO', price: '$199', credits: '1,500', highlight: false, badge: 'BEST VALUE' },
                ]
            ).map(p => (
              <div key={p.name} className="mk-card" style={{ padding: '26px 22px', position: 'relative', borderColor: p.highlight ? 'var(--brand-border-accent)' : undefined, boxShadow: p.highlight ? '0 0 40px var(--brand-glow-soft)' : undefined }}>
                {p.badge && <div className="mk-mono" style={{ position: 'absolute', top: -9, left: 20, background: p.highlight ? 'var(--brand-accent)' : 'var(--brand-bg-overlay)', color: p.highlight ? '#fff' : 'var(--brand-text-dim)', fontSize: 9, padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap', border: p.highlight ? 'none' : '1px solid var(--brand-border-strong)' }}>{p.badge}</div>}
                <div className="mk-mono" style={{ color: p.highlight ? 'var(--brand-accent-hot)' : 'var(--brand-text-faint)', marginBottom: 12 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 14 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 700, color: 'var(--brand-text)', letterSpacing: '-0.03em' }}>{p.price}</span>
                  <span className="mk-mono" style={{ fontSize: 11 }}>/MO</span>
                </div>
                <div className="mk-mono" style={{ color: '#22c55e', fontSize: 11 }}>{p.credits} CREDITS</div>
                <div style={{ fontSize: 12, color: 'var(--brand-text-faint)', marginTop: 4 }}>All features unlocked</div>
              </div>
            ))}
          </div>
        </Reveal>

        {!inr && (
        <Reveal delay={0.15}>
          <div className="mk-frame" style={{ padding: '28px 28px 24px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              <div>
                <div className="mk-eyebrow" style={{ marginBottom: 10, color: '#f97316' }}>DONE-FOR-YOU</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--brand-text)', marginBottom: 4 }}>We build it for you</div>
                <div style={{ fontSize: 13, color: 'var(--brand-text-dim)', maxWidth: 420 }}>Prefer to hand it off? Book a $99 scoping call — the fee is credited toward your build.</div>
              </div>
              <a href="/setup-call" className="mk-btn" style={{ background: '#f97316', boxShadow: '0 0 24px rgba(249,115,22,0.35)', padding: '10px 20px', fontSize: 13, flexShrink: 0 }}>
                Book $99 consultation →
              </a>
            </div>
            <div className="wyb-builds-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { name: 'SIMPLE BUILD', price: '$199', delivery: '24 HOURS', desc: 'Landing pages, portfolios, tools. No auth or database.' },
                { name: 'MEDIUM BUILD', price: '$399', delivery: '3 WORKING DAYS', desc: 'SaaS MVP with auth + database. 3–6 screens, real accounts.', badge: 'MOST COMMON' },
                { name: 'COMPLEX BUILD', price: '$799', delivery: '1 WEEK', desc: 'Full SaaS with payments, multi-roles, integrations.' },
              ].map(b => (
                <div key={b.name} className="mk-card" style={{ padding: 16, position: 'relative', borderRadius: 12 }}>
                  {b.badge && <div className="mk-mono" style={{ position: 'absolute', top: -9, left: 14, background: 'var(--brand-accent)', color: '#fff', fontSize: 9, padding: '2px 8px', borderRadius: 20 }}>{b.badge}</div>}
                  <div className="mk-mono" style={{ color: 'var(--brand-text-dim)', marginBottom: 8 }}>{b.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--brand-text)' }}>{b.price}</span>
                    <span className="mk-mono" style={{ fontSize: 9 }}>{b.delivery}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--brand-text-dim)', lineHeight: 1.5 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        )}

        <Link href="/pricing" className="mk-btn-ghost" style={{ fontSize: 14 }}>See full pricing →</Link>
      </section>

      {/* ── SPACE JOURNEY INVITE ────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', borderTop: '1px solid var(--brand-border)', borderBottom: '1px solid var(--brand-border)' }}>
        <div className="mk-stars" aria-hidden />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 70% at 50% 100%, rgba(14,165,233,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <Link href="/space-journey" style={{ display: 'block', textDecoration: 'none', color: 'inherit', position: 'relative' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: 'clamp(48px,7vw,88px) clamp(20px,5vw,48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div className="mk-eyebrow" style={{ marginBottom: 14 }}>✦ THE JOURNEY</div>
              <div className="mk-h2" style={{ fontSize: 'clamp(26px,3.5vw,42px)' }}>See the whole system, <span className="mk-serif">in flight</span></div>
              <p className="mk-lead" style={{ marginTop: 10, fontSize: 15 }}>A cinematic tour of WyberAi — piloted by you, one scroll at a time.</p>
            </div>
            <span className="mk-btn-ghost" style={{ flexShrink: 0 }}>Begin the journey →</span>
          </div>
        </Link>
      </section>

      {/* ── FAQ (with FAQPage schema for AEO) ───────────────────────── */}
      <section className="mk-section" style={{ maxWidth: 820 }}>
        <Reveal>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mk-h2" style={{ marginBottom: 40 }}>Questions, answered</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {HOME_FAQS.map(([q, a], i) => (
              <details key={i} style={{ borderTop: '1px solid var(--brand-border)', borderBottom: i === HOME_FAQS.length - 1 ? '1px solid var(--brand-border)' : 'none', padding: '18px 0' }}>
                <summary style={{ cursor: 'pointer', fontSize: 15, fontWeight: 600, color: 'var(--brand-text)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontFamily: 'var(--font-display)' }}>
                  {q}<span className="mk-mono" style={{ color: 'var(--brand-accent)', fontSize: 16, flexShrink: 0, transition: 'transform 0.2s var(--brand-ease)' }}>+</span>
                </summary>
                <p style={{ fontSize: 14, color: 'var(--brand-text-dim)', lineHeight: 1.7, marginTop: 12, marginBottom: 0, maxWidth: 640 }}>{a}</p>
              </details>
            ))}
          </div>
        </Reveal>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: HOME_FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
          }).replace(/</g, '\\u003c') }}
        />
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', borderTop: '1px solid var(--brand-border)', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(14,165,233,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="mk-section" style={{ position: 'relative', maxWidth: 720, paddingTop: 'clamp(80px,10vw,140px)', paddingBottom: 'clamp(80px,10vw,140px)' }}>
          <Reveal>
            <h2 className="mk-display" style={{ fontSize: 'clamp(36px,6vw,72px)', marginBottom: 20 }}>
              Stop dreaming.<br /><span className="mk-serif">Start shipping.</span>
            </h2>
            <p className="mk-lead" style={{ maxWidth: 480, margin: '0 auto 36px' }}>
              Your next app is one prompt away. Describe it, watch it build, ship it today.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/signup" className="mk-btn" style={{ padding: '16px 40px', fontSize: 16 }}>Start for free →</Link>
              <Link href="/pricing" className="mk-btn-ghost" style={{ fontSize: 16 }}>View pricing →</Link>
            </div>
            <div className="mk-mono" style={{ marginTop: 20, fontSize: 10 }}>NO CREDIT CARD · 50 FREE CREDITS ON SIGNUP · CANCEL ANYTIME</div>
          </Reveal>
        </div>
      </section>

      {/* Demo modal */}
      {showDemo && (
        <div onClick={() => setShowDemo(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px,4vw,48px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: isMobile ? 'auto' : '100%', maxWidth: isMobile ? '94vw' : 1100, height: isMobile ? '84vh' : 'auto', aspectRatio: isMobile ? '9 / 16' : '16 / 9', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--brand-border-strong)', boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 60px var(--brand-glow-soft)' }}>
            <button onClick={() => setShowDemo(false)} aria-label="Close"
              style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            <iframe src={isMobile ? '/demo-intro-mobile.html' : '/demo-intro.html'} title="WyberAi demo" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
          </div>
        </div>
      )}

      {/* Featured on Product Hunt */}
      <section style={{ padding: '32px clamp(16px,4vw,48px)', borderTop: '1px solid var(--brand-border)', display: 'flex', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href="https://www.producthunt.com/products/wyberai?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-wyberai" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', lineHeight: 0, opacity: 0.85 }}>
          <img width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1180538&theme=dark" alt="WyberAi - From idea to live app — no code, just one prompt. | Product Hunt" />
        </a>
      </section>

      <Footer />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        details summary::-webkit-details-marker { display: none; }
        details[open] summary span { transform: rotate(45deg); }
        @media (max-width: 768px) {
          .wyb-nav-desktop { display: none !important; }
          .wyb-nav-hamburger { display: flex !important; }
          .wyb-plans-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .wyb-product-pills { gap: 6px !important; }
          .wyb-builds-grid { grid-template-columns: 1fr !important; }
          .wyb-product-detail { grid-template-columns: 1fr !important; }
          .wyb-proof-grid { grid-template-columns: 1fr !important; }
          .wyb-seq-row { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .wyb-nav-hamburger { display: none !important; }
        }
      `}</style>
    </div>
  );
}
