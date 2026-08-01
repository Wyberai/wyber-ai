// Reference: Linear's marketing site — restrained, confident, mostly
// monochrome with the accent used sparingly, oversized precise type, a real
// product-mockup moment under the fold instead of stock imagery.
import { ArrowRight, ArrowUpRight, Zap, GitBranch, Layers } from 'lucide-react'
import {
  Navbar, Footer, Button, HeroHeadline, BackgroundGrid, SectionHeading,
  FeatureCard, TestimonialCard, CTASection, AnimatedNumber, Reveal, Stagger, StaggerItem,
  Card, DataRow, cn,
} from '../wyber-ui'

const STATS = [
  { label: 'used by', value: 42, suffix: 'k+', description: 'teams shipping product every day' },
  { label: 'over', value: 1.2, decimals: 1, suffix: 'M', description: 'issues tracked to completion' },
  { label: 'already', value: 99.98, decimals: 2, suffix: '%', description: 'uptime over the last 12 months' },
]

const FEATURES = [
  { icon: <Zap size={18} />, title: 'Built for speed', description: 'Every interaction responds instantly — no spinners, no waiting on the network.' },
  { icon: <GitBranch size={18} />, title: 'Fits your workflow', description: 'Keyboard-first, opinionated defaults, and just enough configuration to feel like yours.' },
  { icon: <Layers size={18} />, title: 'One tool, not ten', description: 'Replace the sprawl of disconnected tabs with a single, coherent surface.' },
]

const TESTIMONIALS = [
  { quote: 'We moved our whole team over in a week and never looked back.', name: 'Alicia Chen', role: 'Founder, Nimbus', rating: 5 },
  { quote: 'The fastest piece of software I use, full stop.', name: 'Marcus Webb', role: 'CTO, Fielder', rating: 5 },
  { quote: 'Feels like it was designed by people who actually use it.', name: 'Priya Shah', role: 'PM, Loopline', rating: 5 },
]

// A fake product surface for the hero — no stock imagery, just our own kit
// composed into something that reads as "real software" at a glance.
function ProductMockup() {
  return (
    <div className="overflow-hidden rounded-t-xl border border-b-0 border-border bg-card shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-muted" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted" />
      </div>
      <div className="grid grid-cols-[10rem_1fr] text-left">
        <div className="hidden border-r border-border p-4 sm:block">
          {['Overview', 'Issues', 'Cycles', 'Roadmap', 'Settings'].map((item, i) => (
            <div key={item} className={cn('mb-1 rounded-md px-2.5 py-1.5 text-xs font-medium', i === 1 ? 'bg-accent text-foreground' : 'text-muted-foreground')}>
              {item}
            </div>
          ))}
        </div>
        <div className="p-5">
          <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">In progress · 6</div>
          <div>
            {[
              { label: 'Ship v2 onboarding flow', value: 'Jordan L.' },
              { label: 'Fix checkout race condition', value: 'Priya S.' },
              { label: 'Migrate billing to new API', value: 'Sam O.' },
            ].map(row => <DataRow key={row.label} {...row} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar
        brand={<>Brand</>}
        links={[{ label: 'Product', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'Changelog', href: '#changelog' }]}
        cta={<Button size="sm">Get started <ArrowRight size={14} /></Button>}
      />

      <section className="relative overflow-hidden px-6 pt-40 pb-0">
        <BackgroundGrid variant="lines" />
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <a href="#changelog" className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
              Introducing v2.0 <ArrowUpRight size={12} />
            </a>
          </Reveal>
          <Reveal delay={0.05}>
            <HeroHeadline>
              The <em>issue tracker</em> you'll actually enjoy using
            </HeroHeadline>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Purpose-built for modern product teams — fast, keyboard-driven, and quietly out of your way.
            </p>
          </Reveal>
          <Reveal delay={0.25} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg">Start building <ArrowRight size={16} /></Button>
            <Button size="lg" variant="outline">View demo</Button>
          </Reveal>
        </div>

        <Reveal delay={0.4} className="relative mx-auto mt-20 max-w-4xl px-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-10 mx-auto h-64 max-w-2xl rounded-full blur-3xl"
            style={{ background: 'hsl(var(--primary) / 0.18)' }}
          />
          <ProductMockup />
        </Reveal>
      </section>

      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {STATS.map(s => (
              <div key={s.label} className="text-left">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</div>
                <div className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  <AnimatedNumber value={s.value} decimals={s.decimals ?? 0} suffix={s.suffix} />
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{s.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeading eyebrow="Why teams switch" title="Everything you need, nothing you don't" />
          <Stagger className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {FEATURES.map(f => (
              <StaggerItem key={f.title}><FeatureCard {...f} /></StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeading eyebrow="Loved by teams" title="Don't just take our word for it" />
          <Stagger className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {TESTIMONIALS.map(t => (
              <StaggerItem key={t.name}><TestimonialCard {...t} /></StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl">
          <CTASection title="Ready to move faster?" description="Set up your workspace in under two minutes." primaryCta="Get started free" secondaryCta="Talk to sales" />
        </div>
      </section>

      <Footer
        brand={<>Brand</>}
        description="The issue tracker built for modern product teams."
        columns={[
          { title: 'Product', links: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'Changelog', href: '#changelog' }] },
          { title: 'Company', links: [{ label: 'About', href: '#about' }, { label: 'Careers', href: '#careers' }] },
          { title: 'Legal', links: [{ label: 'Privacy', href: '#privacy' }, { label: 'Terms', href: '#terms' }] },
        ]}
        note="© 2026 Brand. All rights reserved."
      />
    </div>
  )
}
