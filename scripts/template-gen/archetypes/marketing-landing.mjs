// marketing-landing archetype — a real single-page marketing site, matching
// WyberAi's own single-page-by-default convention for sites where no
// separate "About"/"Contact" pages were requested (src/app/api/generate/
// route.ts MULTI-PAGE MODE: single-purpose landing stays single-page).
// Leans on wyber-ui-kit's marketing primitives that the SaaS build never
// touched: HeroHeadline, FeatureCard, TestimonialCard, PricingCard,
// CTASection, BentoGrid, Navbar, Footer.
//
// spec shape:
// {
//   brand, tagline, heroTitle, heroDescription, heroCta,
//   navLinks: [{label, href}], features: [{title, description}] (3-6),
//   stats: [{value, label, suffix?}] (3-4),
//   testimonials: [{quote, name, role, rating}] (2-3),
//   pricing: [{name, price, description, features, featured?}] | null,
//   ctaTitle, ctaDescription,
//   footerColumns: [{title, links:[{label,href}]}],
// }

function esc(s) { return String(s).replace(/'/g, "\\'") }

// Real per-product prompt so the hero isn't a bare gradient — the platform's
// own generate/route.ts SEO+DESIGN sections call an image-less hero "a build
// defect, not a stylistic choice". Derived from the template's own real
// content (tagline/description), not a generic placeholder.
function heroImagePrompt(spec) {
  const subject = (spec.heroDescription || spec.tagline || spec.brand).replace(/"/g, "'")
  return `editorial photograph capturing ${subject.toLowerCase()}, for ${spec.brand}, cinematic natural light, shallow depth of field, professional composition, muted sophisticated palette`
}

export function buildMarketingLandingPage(spec) {
  const navLinksJsx = (spec.navLinks || []).map((l) => `{ label: '${esc(l.label)}', href: '${l.href}' }`).join(', ')

  const featureItemsJsx = spec.features.map((f) => `
          <StaggerItem>
            <FeatureCard title="${f.title}" description="${f.description}" />
          </StaggerItem>`).join('')

  const statsJsx = spec.stats.map((s) => `
          <StatBlock value={${typeof s.value === 'number' ? s.value : `'${s.value}'`}} label="${s.label}"${s.suffix ? ` suffix="${s.suffix}"` : ''} />`).join('\n')

  const testimonialsJsx = spec.testimonials.map((t) => `
          <TestimonialCard quote="${t.quote.replace(/"/g, '&quot;')}" name="${t.name}" role="${t.role}" rating={${t.rating || 5}} />`).join('\n')

  const pricingJsx = spec.pricing ? spec.pricing.map((p) => `
          <PricingCard name="${p.name}" price="${p.price}"${p.period ? ` period="${p.period}"` : ''} description="${p.description}" cta="${p.cta || 'Get started'}" featured={${!!p.featured}} features={${JSON.stringify(p.features)}} />`).join('\n') : ''

  const footerColsJsx = (spec.footerColumns || []).map((c) =>
    `{ title: '${esc(c.title)}', links: [${c.links.map((l) => `{ label: '${esc(l.label)}', href: '${l.href}' }`).join(', ')}] }`,
  ).join(', ')

  const heroImgAlt = esc(`${spec.brand} — ${spec.tagline}`)

  const appTsx = `import {
  Navbar, Footer, Button, HeroHeadline, SectionHeading, FeatureCard, StatBlock,
  TestimonialCard, ${spec.pricing ? 'PricingCard, ' : ''}CTASection, Reveal, Stagger, StaggerItem, AuroraBackground, MediaFrame,
} from './wyber-ui'

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar
        brand={<>${spec.brand}</>}
        links={[${navLinksJsx}]}
        cta={<Button size="sm">${spec.heroCta}</Button>}
      />

      <main>
      <section className="relative overflow-hidden px-6 pb-24 pt-40">
        <AuroraBackground />
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <div className="mb-5 text-xs font-semibold uppercase tracking-widest text-primary">${spec.tagline}</div>
            <HeroHeadline className="text-4xl md:text-6xl">${spec.heroTitle}</HeroHeadline>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">${spec.heroDescription}</p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button size="lg">${spec.heroCta}</Button>
              <Button size="lg" variant="outline">Learn more</Button>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.15}>
          <div className="relative mx-auto mt-14 max-w-4xl">
            <MediaFrame
              src="{{wyber-image: ${heroImagePrompt(spec)} | 16:9}}"
              alt="${heroImgAlt}"
              ratio="16/9"
              className="rounded-2xl shadow-2xl"
            />
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid grid-cols-2 gap-8 rounded-2xl border border-border bg-card p-8 sm:grid-cols-${spec.stats.length}">${statsJsx}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <SectionHeading eyebrow="What you get" title="${spec.featuresTitle || 'Built for how you actually work'}" description="${spec.featuresDescription || ''}" />
        <Stagger className="grid grid-cols-1 gap-5 md:grid-cols-3">${featureItemsJsx}
        </Stagger>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <SectionHeading eyebrow="Trusted" title="${spec.testimonialsTitle || 'What clients say'}" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-${spec.testimonials.length}">${testimonialsJsx}
        </div>
      </section>
${spec.pricing ? `
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <SectionHeading eyebrow="Pricing" title="${spec.pricingTitle || 'Simple, transparent pricing'}" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-${spec.pricing.length}">${pricingJsx}
        </div>
      </section>` : ''}

      <section className="px-6 pb-24">
        <CTASection
          title="${spec.ctaTitle}"
          description="${spec.ctaDescription}"
          primaryCta="${spec.heroCta}"
          secondaryCta="Contact us"
        />
      </section>
      </main>

      <Footer
        brand={<>${spec.brand}</>}
        description="${spec.heroDescription}"
        columns={[${footerColsJsx}]}
        note="© ${new Date().getFullYear()} ${spec.brand}. All rights reserved."
      />
    </div>
  )
}
`

  return { appTsx }
}
