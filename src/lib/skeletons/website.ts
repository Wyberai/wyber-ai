export const WEBSITE_SKELETON: Record<string, string> = {
  'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
:root {
  --background: 220 15% 98%;
  --foreground: 220 15% 8%;
  --card: 220 12% 100%;
  --card-foreground: 220 15% 8%;
  --primary: 220 70% 45%;
  --primary-foreground: 0 0% 100%;
  --secondary: 220 10% 95%;
  --secondary-foreground: 220 15% 8%;
  --muted: 220 10% 95%;
  --muted-foreground: 220 10% 45%;
  --accent: 240 65% 55%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 75% 55%;
  --destructive-foreground: 0 0% 100%;
  --border: 220 12% 88%;
  --input: 220 12% 100%;
  --ring: 220 70% 45%;
  --radius: 0.5rem;
  --popover: 220 12% 100%;
  --popover-foreground: 220 15% 8%;
  --gradient-hero: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { background-color: hsl(var(--background)); color: hsl(var(--foreground)); font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.fade-up { animation: fadeUp 0.6s ease forwards; }`,

  'src/App.tsx': `import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import SocialProof from './components/SocialProof'
import HowItWorks from './components/HowItWorks'
import Pricing from './components/Pricing'
import Testimonials from './components/Testimonials'
import FAQ from './components/FAQ'
import CTASection from './components/CTASection'
import Footer from './components/Footer'
import './index.css'

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}`,

  'src/components/Navbar.tsx': `import { useState, useEffect } from 'react'
import { Menu, X, Zap } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={\`fixed top-0 left-0 right-0 z-50 transition-all duration-300 \${scrolled ? 'bg-card/95 backdrop-blur-md border-b border-border shadow-sm' : 'bg-transparent'}\`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap size={14} className="text-primary-foreground" />
          </div>
          BrandName
        </a>
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition">{l.label}</a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition">Sign in</a>
          <a href="#" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">Get started</a>
        </div>
        <button onClick={() => setMenuOpen(o => !o)} className="md:hidden text-muted-foreground hover:text-foreground p-2">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-card border-b border-border px-4 py-4 space-y-3">
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="block text-sm text-muted-foreground hover:text-foreground">{l.label}</a>
          ))}
          <a href="#" className="block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium text-center">Get started</a>
        </div>
      )}
    </nav>
  )
}`,

  'src/components/Hero.tsx': `export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[image:radial-gradient(ellipse_60%_50%_at_50%_20%,hsl(var(--primary)/0.1),transparent)]" />
      <div className="max-w-4xl mx-auto fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-6">
          ✦ Now available — version 2.0
        </div>
        <h1 className="text-[clamp(40px,7vw,80px)] leading-[1.05] tracking-[-0.03em] font-bold text-foreground mb-6">
          The better way to<br />
          <span className="text-transparent bg-clip-text bg-[image:var(--gradient-hero)]">do your thing</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Replace this with your actual value proposition. Tell visitors what you do, who you do it for, and what makes you different. Keep it under 20 words.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a href="#" className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition shadow-[0_0_24px_hsl(var(--primary)/0.3)]">
            Get started free
          </a>
          <a href="#how-it-works" className="px-6 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition">
            See how it works →
          </a>
        </div>
        <p className="text-xs text-muted-foreground mt-4">No credit card required · Free forever plan</p>
      </div>
      <div className="mt-16 max-w-5xl mx-auto">
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden aspect-[16/9] flex items-center justify-center">
          <img src="{{wyber-image: product dashboard screenshot, clean modern UI, dark theme, data visualization | 16:9}}" alt="Product preview" className="w-full h-full object-cover" loading="lazy" />
        </div>
      </div>
    </section>
  )
}`,

  'src/components/Features.tsx': `import { Zap, Shield, BarChart2, Globe, Users, ArrowRight } from 'lucide-react'

const FEATURES = [
  { icon: Zap, title: 'Lightning fast', desc: 'Built for performance from the ground up. Every interaction feels instant.' },
  { icon: Shield, title: 'Secure by default', desc: 'Enterprise-grade security baked in, not bolted on. SOC 2 compliant.' },
  { icon: BarChart2, title: 'Real-time analytics', desc: 'See what\'s happening as it happens. No delays, no approximations.' },
  { icon: Globe, title: 'Works everywhere', desc: 'Desktop, tablet, mobile — the experience is consistent across all devices.' },
  { icon: Users, title: 'Built for teams', desc: 'Collaboration features that scale from 2 to 2,000 people.' },
  { icon: ArrowRight, title: 'Easy to start', desc: 'Get up and running in minutes, not days. Your team will thank you.' },
]

export default function Features() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground mb-3">Features</p>
          <h2 className="text-[clamp(28px,4vw,48px)] leading-[1.1] tracking-[-0.03em] font-bold text-foreground mb-4">
            Everything you need, nothing you don't
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Replace this with a description of your feature set. What problems do you solve? What makes you different?
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <Icon size={18} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}`,

  'src/components/SocialProof.tsx': `const LOGOS = ['Acme Corp', 'Globex', 'Initech', 'Umbrella Co', 'Massive Dyn', 'Soylent']

export default function SocialProof() {
  return (
    <section className="py-12 px-4 border-y border-border bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-8">
          Trusted by teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {LOGOS.map(logo => (
            <span key={logo} className="text-sm font-semibold text-muted-foreground/50 tracking-tight">{logo}</span>
          ))}
        </div>
      </div>
    </section>
  )
}`,

  'src/components/HowItWorks.tsx': `const STEPS = [
  { num: '01', title: 'Sign up in seconds', desc: 'Create your account with just an email. No credit card, no lengthy forms.' },
  { num: '02', title: 'Connect your tools', desc: 'Integrate with your existing stack in one click. We support 50+ integrations.' },
  { num: '03', title: 'Start getting results', desc: 'Immediately see value. Most teams see ROI within their first week.' },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground mb-3">How it works</p>
          <h2 className="text-[clamp(28px,4vw,48px)] leading-[1.1] tracking-[-0.03em] font-bold text-foreground">
            Up and running in minutes
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-[clamp(48px,6vw,72px)] font-bold text-primary/15 leading-none mb-4 font-mono">{s.num}</div>
              <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}`,

  'src/components/Pricing.tsx': `import { Check } from 'lucide-react'

const PLANS = [
  {
    name: 'Free', price: '$0', period: '/month', desc: 'For individuals getting started.',
    features: ['Up to 3 projects', '1 user', 'Basic analytics', 'Community support'],
    cta: 'Get started', highlight: false,
  },
  {
    name: 'Pro', price: '$29', period: '/month', desc: 'For teams that need more.',
    features: ['Unlimited projects', 'Up to 10 users', 'Advanced analytics', 'Priority support', 'API access', 'Custom integrations'],
    cta: 'Start free trial', highlight: true,
  },
  {
    name: 'Enterprise', price: 'Custom', period: '', desc: 'For organizations at scale.',
    features: ['Unlimited everything', 'SSO / SAML', 'SLA guarantee', 'Dedicated success manager', 'Custom contracts', 'Audit logs'],
    cta: 'Contact sales', highlight: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground mb-3">Pricing</p>
          <h2 className="text-[clamp(28px,4vw,48px)] leading-[1.1] tracking-[-0.03em] font-bold text-foreground mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground">No hidden fees. Cancel anytime.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(p => (
            <div key={p.name} className={\`rounded-2xl border p-6 flex flex-col \${p.highlight ? 'border-primary bg-[image:var(--gradient-hero)] text-white relative shadow-xl shadow-primary/20' : 'border-border bg-card'}\`}>
              {p.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-foreground text-background text-xs font-semibold">Most popular</div>}
              <div className="mb-5">
                <h3 className={\`font-semibold mb-1 \${p.highlight ? 'text-white' : 'text-foreground'}\`}>{p.name}</h3>
                <p className={\`text-sm mb-3 \${p.highlight ? 'text-white/80' : 'text-muted-foreground'}\`}>{p.desc}</p>
                <div className="flex items-end gap-1">
                  <span className={\`text-4xl font-bold tracking-tight \${p.highlight ? 'text-white' : 'text-foreground'}\`}>{p.price}</span>
                  <span className={\`text-sm mb-1 \${p.highlight ? 'text-white/70' : 'text-muted-foreground'}\`}>{p.period}</span>
                </div>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {p.features.map(f => (
                  <li key={f} className={\`flex items-start gap-2 text-sm \${p.highlight ? 'text-white/90' : 'text-muted-foreground'}\`}>
                    <Check size={14} className={\`mt-0.5 flex-shrink-0 \${p.highlight ? 'text-white' : 'text-primary'}\`} />{f}
                  </li>
                ))}
              </ul>
              <a href="#" className={\`block text-center py-2.5 rounded-lg font-medium text-sm transition hover:opacity-90 \${p.highlight ? 'bg-white text-primary' : 'bg-primary text-primary-foreground'}\`}>{p.cta}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}`,

  'src/components/Testimonials.tsx': `const TESTIMONIALS = [
  { quote: 'This changed how our team works. We cut our time in half and doubled output.', name: 'Sarah Chen', title: 'VP Engineering, TechCorp', initials: 'SC' },
  { quote: 'I was skeptical, but the results spoke for themselves within the first week.', name: 'Marcus Lee', title: 'Founder, StartupXYZ', initials: 'ML' },
  { quote: 'The support team is incredible and the product just keeps getting better.', name: 'Priya Patel', title: 'Product Manager, Scale Co', initials: 'PP' },
]

export default function Testimonials() {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground mb-3">Testimonials</p>
          <h2 className="text-[clamp(28px,4vw,48px)] leading-[1.1] tracking-[-0.03em] font-bold text-foreground">
            Teams love it
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => <span key={j} className="text-amber-400 text-sm">★</span>)}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">{t.initials}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}`,

  'src/components/FAQ.tsx': `import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQ_ITEMS = [
  { q: 'How long does setup take?', a: 'Most teams are up and running within 15 minutes. Our onboarding wizard guides you through every step.' },
  { q: 'Is there a free trial?', a: 'Yes — our Pro plan comes with a 14-day free trial, no credit card required.' },
  { q: 'Can I cancel anytime?', a: 'Absolutely. Cancel from your account settings any time. No cancellation fees, no questions asked.' },
  { q: 'Do you support SSO?', a: 'SSO (SAML 2.0) is available on our Enterprise plan. We support Okta, Azure AD, Google Workspace, and more.' },
  { q: 'Is my data secure?', a: 'We are SOC 2 Type II certified, GDPR compliant, and use AES-256 encryption at rest and in transit.' },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section className="py-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground mb-3">FAQ</p>
          <h2 className="text-[clamp(28px,4vw,40px)] leading-[1.1] tracking-[-0.03em] font-bold text-foreground">Common questions</h2>
        </div>
        <div className="divide-y divide-border">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 py-4 text-left text-foreground font-medium hover:text-primary transition">
                {item.q}
                <ChevronDown size={16} className={\`text-muted-foreground flex-shrink-0 transition-transform \${open === i ? 'rotate-180' : ''}\`} />
              </button>
              {open === i && <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}`,

  'src/components/CTASection.tsx': `export default function CTASection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto text-center bg-[image:var(--gradient-hero)] rounded-3xl p-12 md:p-20 text-white">
        <h2 className="text-[clamp(28px,4vw,48px)] leading-[1.1] tracking-[-0.03em] font-bold mb-4">
          Ready to get started?
        </h2>
        <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
          Join thousands of teams who made the switch. Your first 14 days are on us.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a href="#" className="px-6 py-3 rounded-lg bg-white text-primary font-semibold hover:bg-white/90 transition">
            Start free — no card needed
          </a>
          <a href="#" className="px-6 py-3 rounded-lg border border-white/40 text-white font-medium hover:bg-white/10 transition">
            Talk to sales
          </a>
        </div>
      </div>
    </section>
  )
}`,

  'src/components/Footer.tsx': `import { Zap } from 'lucide-react'

const LINKS = {
  Product: ['Features', 'Pricing', 'Changelog', 'Roadmap'],
  Resources: ['Documentation', 'Blog', 'Status', 'Guides'],
  Company: ['About', 'Careers', 'Press', 'Contact'],
  Legal: ['Privacy', 'Terms', 'Cookies', 'Security'],
}

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Zap size={14} className="text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">BrandName</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Built for teams who care about getting things done.</p>
          </div>
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">{category}</h4>
              <ul className="space-y-2">
                {links.map(l => (
                  <li key={l}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 BrandName Inc. All rights reserved.</p>
          <div className="flex gap-4">
            {['Twitter', 'LinkedIn', 'GitHub'].map(s => (
              <a key={s} href="#" className="text-xs text-muted-foreground hover:text-foreground transition">{s}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}`,
}
