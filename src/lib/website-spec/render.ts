import { getDirectionById } from '../design-directions'
import { directionFontsUrl } from '../direction-fonts'
import { llmsTxt, renderIndexHtml, robotsTxt, sitemapXml } from './seo'
import type { BuildSpec, ImageSlot, PlannedSection, SiteCopy } from './types'

const TOKEN_ORDER = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground', 'primary', 'primary-foreground',
  'secondary', 'secondary-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground', 'destructive',
  'destructive-foreground', 'border', 'input', 'ring',
]
const FALLBACK = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
const q = (s: string) => s.replace(/["{}|]/g, ' ').replace(/\s+/g, ' ').trim()

/** The directive parser only knows 1:1, 9:16 and 16:9; anything else falls back to wide. CSS crops to the slot ratio. */
export function directiveRatio(ratio: string): string { return ratio === '4/5' || ratio === '9/16' ? '9:16' : ratio === '1/1' ? '1:1' : '16:9' }
export function imageDirective(slot: ImageSlot): string { return `{{wyber-image: ${q(slot.brief)} | ${directiveRatio(slot.ratio)}}}` }

export function renderIndexCss(spec: BuildSpec): string {
  const d = getDirectionById(spec.direction.id)
  if (!d) throw new Error('unknown direction ' + spec.direction.id)
  const vars = TOKEN_ORDER.filter(k => d.palette.tokens[k]).map(k => `  --${k}: ${d.palette.tokens[k]};`).join('\n')
  return `@tailwind base;
@tailwind components;
@tailwind utilities;
*, *::before, *::after { box-sizing: border-box; }

:root {
${vars}
  --radius: ${d.palette.radius};
  --font-sans: '${d.fonts.body}', ${FALLBACK};
  --font-display: '${d.fonts.display}', '${d.fonts.body}', ${FALLBACK};
  --font-mono: '${d.fonts.mono}', ui-monospace, monospace;
}

html { scroll-behavior: smooth; }
body {
  margin: 0;
  padding: 0;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
.font-display { font-family: var(--font-display); font-weight: ${d.fonts.displayWeight}; letter-spacing: ${d.fonts.displayTracking}; }
.font-mono { font-family: var(--font-mono); }
section[id] { scroll-margin-top: 5rem; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}
`
}

export function fontsHref(spec: BuildSpec): string {
  const d = getDirectionById(spec.direction.id)!
  return directionFontsUrl([d.fonts.display, d.fonts.body, d.fonts.mono]) ?? 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
}

export function renderOwnerDetails(spec: BuildSpec): string {
  const f = spec.brief.facts
  const v = (s?: string) => JSON.stringify(s ?? '')
  return `// All business facts live here. The owner can edit these values later.
// Leave a value as an empty string when unknown; the site hides anything without a fact.
export const OWNER = {
  name: ${v(f.name)},
  city: ${v(f.city)},
  address: ${v(f.address)},
  phone: ${v(f.phone)},
  whatsapp: ${v(f.whatsapp)},
  email: ${v(f.email)},
  hours: ${v(f.hours)},
}
`
}

// ---------- sections ----------------------------------------------------------------------------------------------

type Ctx = { spec: BuildSpec; used: Set<string>; wrap: (jsx: string) => string }
const U = (c: Ctx, ...names: string[]) => names.forEach(n => c.used.add(n))
const cp = (id: string) => `COPY.sections[${JSON.stringify(id)}]`
const two = (i: number) => (i + 1 < 10 ? '0' : '') + (i + 1)

function heroMedia(c: Ctx, slot: ImageSlot | undefined, extra = ''): string {
  if (!slot) return ''
  U(c, 'MediaFrame')
  return `<MediaFrame src="${imageDirective(slot)}" alt={COPY.hero.imageAlt} ratio="${slot.ratio}"${extra} />`
}

function hero(c: Ctx): string {
  const slot = c.spec.images.find(i => i.id === 'hero')
  const first = c.spec.sections[0]?.id ?? 'main'
  const buttons = `<div className="mt-8 flex flex-wrap items-center gap-4">
            {hasContact && <Button size="lg" onClick={() => go(primaryHref)}>{COPY.hero.cta}</Button>}
            <a href="#${first}" className={(hasContact ? 'text-sm font-medium underline underline-offset-4' : 'inline-flex h-12 items-center rounded-lg border border-border px-6 text-base font-medium') + ' focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring'}>{COPY.hero.secondary}</a>
          </div>`
  U(c, 'Button')
  if (c.spec.hero === 'editorial') {
    U(c, 'EditorialHeadline')
    return `<section className="mx-auto max-w-6xl px-6 pb-12 pt-36 md:pt-44">
          <EditorialHeadline as="h1" eyebrow={COPY.hero.eyebrow}>{COPY.hero.headline}</EditorialHeadline>
          <div className="mt-10 grid gap-8 md:grid-cols-12">
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground md:col-span-6">{COPY.hero.sub}</p>
            <div className="md:col-span-6 md:justify-self-end">${buttons}</div>
          </div>
        </section>
        ${slot ? `<section className="mx-auto max-w-6xl px-6 pb-20">${heroMedia(c, slot)}</section>` : ''}`
  }
  if (c.spec.hero === 'stacked') {
    U(c, 'HeroHeadline')
    return `<section className="mx-auto max-w-5xl px-6 pb-16 pt-36 text-center md:pt-44">
          {COPY.hero.eyebrow && <p className="mb-4 font-mono text-sm text-muted-foreground">{COPY.hero.eyebrow}</p>}
          <HeroHeadline>{COPY.hero.headline}</HeroHeadline>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{COPY.hero.sub}</p>
          <div className="flex justify-center">${buttons}</div>
        </section>
        ${slot ? `<section className="mx-auto max-w-5xl px-6 pb-20">${heroMedia(c, slot)}</section>` : ''}`
  }
  U(c, 'HeroHeadline')
  return `<section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-32 md:grid-cols-12 md:pt-40">
          <div className="${slot ? 'md:col-span-6' : 'md:col-span-12 max-w-3xl'}">
            {COPY.hero.eyebrow && <p className="mb-4 font-mono text-sm text-muted-foreground">{COPY.hero.eyebrow}</p>}
            <HeroHeadline>{COPY.hero.headline}</HeroHeadline>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{COPY.hero.sub}</p>
            ${buttons}
          </div>
          ${slot ? `<div className="md:col-span-6">${heroMedia(c, slot)}</div>` : ''}
        </section>`
}

function heading(c: Ctx, s: PlannedSection, align: 'left' | 'center' = 'center'): string {
  const k = cp(s.id)
  if (c.spec.hero === 'editorial') {
    U(c, 'EditorialHeadline')
    return `<EditorialHeadline eyebrow={${k}.eyebrow}>{${k}.title}</EditorialHeadline>`
  }
  U(c, 'SectionHeading')
  return `<SectionHeading eyebrow={${k}.eyebrow} title={${k}.title} description={${k}.description} align="${align}" />`
}

function services(c: Ctx, s: PlannedSection): string {
  const k = cp(s.id)
  if (s.variant === 'list') {
    U(c, 'Reveal')
    return `${heading(c, s, 'left')}
          <div className="mt-12 border-t border-border">
            {${k}.items!.map((it, i) => (
              <Reveal key={i}>
                <div className="grid gap-3 border-b border-border py-8 md:grid-cols-12 md:gap-8">
                  <div className="font-mono text-sm text-muted-foreground md:col-span-1">{(i < 9 ? '0' : '') + (i + 1)}</div>
                  <h3 className="font-display text-2xl md:col-span-4">{it.title}</h3>
                  <p className="leading-relaxed text-muted-foreground md:col-span-7">{it.text}</p>
                </div>
              </Reveal>
            ))}
          </div>`
  }
  if (s.variant === 'bento') {
    U(c, 'BentoGrid', 'BentoCard')
    return `${heading(c, s)}
          <BentoGrid>
            {${k}.items!.map((it, i) => (
              <BentoCard key={i} title={it.title} description={it.text} colSpan={[2, 1, 1, 2][i] ?? 1} />
            ))}
          </BentoGrid>`
  }
  U(c, 'Stagger', 'StaggerItem', 'FeatureCard')
  return `${heading(c, s)}
          <Stagger className="grid gap-4 md:grid-cols-3">
            {${k}.items!.map((it, i) => (
              <StaggerItem key={i}><FeatureCard title={it.title} description={it.text} /></StaggerItem>
            ))}
          </Stagger>`
}

function rows(c: Ctx, s: PlannedSection): string {
  const k = cp(s.id)
  U(c, 'Reveal')
  return `${heading(c, s, 'left')}
          <div className="mt-12 border-t border-border">
            {${k}.items!.map((it, i) => (
              <Reveal key={i}>
                <div className="grid gap-2 border-b border-border py-6 md:grid-cols-12 md:gap-8">
                  <h3 className="font-display text-xl md:col-span-4">{it.title}</h3>
                  <p className="leading-relaxed text-muted-foreground md:col-span-6">{it.text}</p>
                  {it.meta && <p className="font-mono text-sm text-muted-foreground md:col-span-2 md:text-right">{it.meta}</p>}
                </div>
              </Reveal>
            ))}
          </div>`
}

function steps(c: Ctx, s: PlannedSection, n: number): string {
  const k = cp(s.id)
  U(c, 'SectionNumber', 'Stagger', 'StaggerItem')
  const cols = n >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'
  return `${heading(c, s, 'left')}
          <Stagger className="mt-12 grid gap-10 ${cols}">
            {${k}.items!.map((it, i) => (
              <StaggerItem key={i}>
                <SectionNumber n={i + 1} />
                <h3 className="mt-4 font-display text-xl">{it.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{it.text}</p>
              </StaggerItem>
            ))}
          </Stagger>`
}

function about(c: Ctx, s: PlannedSection): string {
  const k = cp(s.id)
  const slot = c.spec.images.find(i => i.id === 'about')
  U(c, 'Reveal')
  if (slot) U(c, 'MediaFrame')
  return `<div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-${slot ? '6' : '5'}">${heading(c, s, 'left')}</div>
            <div className="space-y-5 text-lg leading-relaxed text-muted-foreground md:col-span-${slot ? '6' : '7'}">
              {${k}.paragraphs!.map((p, i) => <Reveal key={i}><p>{p}</p></Reveal>)}
              ${slot ? `<MediaFrame src="${imageDirective(slot)}" alt={${k}.imageAlt ?? ''} ratio="${slot.ratio}" className="mt-8 max-w-sm" />` : ''}
            </div>
          </div>`
}

function faq(c: Ctx, s: PlannedSection): string {
  U(c, 'FAQAccordionIcon')
  return `${heading(c, s)}
          <div className="mx-auto max-w-3xl"><FAQAccordionIcon items={${cp(s.id)}.faq!} /></div>`
}

function visit(c: Ctx, s: PlannedSection): string {
  U(c, 'DataRow', 'SectionHeading')
  const map = c.spec.brief.modules.includes('map')
  return `<div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5">${heading(c, s, 'left')}</div>
            <div className="md:col-span-7">
              {OWNER.city && <DataRow label="Area" value={OWNER.city} />}
              {OWNER.address && <DataRow label="Address" value={OWNER.address} />}
              {OWNER.hours && <DataRow label="Hours" value={OWNER.hours} />}
              {OWNER.phone && <DataRow label="Phone" value={<a className="underline underline-offset-4" href={'tel:' + OWNER.phone}>{OWNER.phone}</a>} />}
              {OWNER.email && <DataRow label="Email" value={<a className="underline underline-offset-4" href={'mailto:' + OWNER.email}>{OWNER.email}</a>} />}
              ${map ? `{OWNER.address && <p className="mt-6"><a className="text-sm font-medium underline underline-offset-4" href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(OWNER.address + ' ' + OWNER.city)}>Open in maps</a></p>}` : ''}
            </div>
          </div>`
}

function contact(c: Ctx, s: PlannedSection): string {
  U(c, 'Card')
  return `{hasContact && (
            <div className="grid gap-12 md:grid-cols-12">
              <div className="md:col-span-5">${heading(c, s, 'left')}</div>
              <div className="md:col-span-7"><Card><EnquiryForm button={${cp(s.id)}.button!} /></Card></div>
            </div>
          )}`
}

function cta(c: Ctx, s: PlannedSection): string {
  U(c, 'CTASection')
  const k = cp(s.id)
  return `<CTASection title={${k}.title} description={${k}.description} primaryCta={${k}.button} onPrimary={() => go(primaryHref || '#faq')} />`
}

function sectionBody(c: Ctx, s: PlannedSection, copy: SiteCopy): string {
  switch (s.kind) {
    case 'services': return services(c, s)
    case 'rows': return rows(c, s)
    case 'steps': return steps(c, s, copy.sections[s.id]?.items?.length ?? 3)
    case 'about': return about(c, s)
    case 'faq': return faq(c, s)
    case 'visit': return visit(c, s)
    case 'contact': return contact(c, s)
    case 'cta': return cta(c, s)
  }
}

export function renderApp(spec: BuildSpec, copy: SiteCopy): string {
  const used = new Set<string>(['Footer', 'Input', 'Textarea', 'Button', 'Card', spec.header === 'condensing' ? 'CondensingNavbar' : 'Navbar'])
  const c: Ctx = { spec, used, wrap: j => j }
  const bodies = spec.sections.map((s, i) => {
    const inner = sectionBody(c, s, copy)
    const tone = i % 2 === 1 ? ' bg-card' : ''
    if (s.kind === 'cta') return `<section id="${s.id}" className="border-t border-border py-20 md:py-28"><div className="mx-auto max-w-6xl px-6">${inner}</div></section>`
    return `<section id="${s.id}" className="border-t border-border py-20 md:py-28${tone}"><div className="mx-auto max-w-6xl px-6">
          ${inner}
        </div></section>`
  })
  const heroJsx = hero(c)
  const nav = spec.sections.filter(s => s.nav).slice(0, 5)
  const navLinks = nav.map(s => s.kind === 'contact'
    ? `...(hasContact ? [{ label: ${JSON.stringify(s.nav)}, href: '#${s.id}' }] : [])`
    : `{ label: ${JSON.stringify(s.nav)}, href: '#${s.id}' }`).join(',\n    ')
  const Header = spec.header === 'condensing' ? 'CondensingNavbar' : 'Navbar'
  const names = [...used].sort()

  return `import { ${names.join(', ')} } from './wyber-ui'
import { OWNER } from './owner-details'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COPY: any = ${JSON.stringify(copy, null, 2)}

const BRAND: string = OWNER.name || COPY.brand
const hasWa = Boolean(OWNER.whatsapp)
const hasMail = Boolean(OWNER.email)
const hasContact = hasWa || hasMail
const primaryHref = hasWa
  ? 'https://wa.me/' + OWNER.whatsapp + '?text=' + encodeURIComponent('Hello, I found your website.')
  : hasMail ? 'mailto:' + OWNER.email : ''
const go = (href: string) => { if (href) window.location.href = href }

function EnquiryForm({ button }: { button: string }) {
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (f.get('company_website')) return
    const text = 'Name: ' + f.get('name') + '\\nContact: ' + f.get('contact') + '\\n\\n' + f.get('message')
    go(hasWa
      ? 'https://wa.me/' + OWNER.whatsapp + '?text=' + encodeURIComponent(text)
      : 'mailto:' + OWNER.email + '?subject=' + encodeURIComponent('Website enquiry') + '&body=' + encodeURIComponent(text))
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label htmlFor="enq-name" className="mb-1.5 block text-sm font-medium">Your name</label><Input id="enq-name" name="name" required autoComplete="name" /></div>
      <div><label htmlFor="enq-contact" className="mb-1.5 block text-sm font-medium">Phone or email</label><Input id="enq-contact" name="contact" required autoComplete="off" /></div>
      <div><label htmlFor="enq-message" className="mb-1.5 block text-sm font-medium">How can we help?</label><Textarea id="enq-message" name="message" required /></div>
      <input name="company_website" tabIndex={-1} aria-hidden="true" autoComplete="off" className="hidden" />
      <p className="text-xs text-muted-foreground">We use your details only to reply to your enquiry.</p>
      <Button type="submit" size="lg">{button}</Button>
    </form>
  )
}

export default function App() {
  const links = [
    ${navLinks}
  ]
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2">Skip to content</a>
      <${Header}
        brand={BRAND}
        links={links}
        cta={hasContact ? <Button size="sm" onClick={() => go(primaryHref)}>{COPY.hero.cta}</Button> : undefined}
      />
      <main id="main">
        ${heroJsx}
        ${bodies.join('\n        ')}
      </main>
      <Footer
        brand={BRAND}
        description={COPY.seo.description}
        columns={[{ title: 'Explore', links: [...links, { label: 'Privacy', href: '#privacy' }, { label: 'Terms', href: '#terms' }] }]}
        note={'\\u00a9 ' + new Date().getFullYear() + ' ' + BRAND}
      />
      <section id="privacy" className="mx-auto max-w-3xl px-6 py-10 text-sm text-muted-foreground">
        <h2 className="font-medium text-foreground">Privacy</h2>
        <p className="mt-2">When you send an enquiry we use your details only to reply to you. We do not sell them or share them for advertising.</p>
      </section>
      <section id="terms" className="mx-auto max-w-3xl px-6 pb-16 text-sm text-muted-foreground">
        <h2 className="font-medium text-foreground">Terms</h2>
        <p className="mt-2">Information on this site is general and may change. Please contact us to confirm anything before you rely on it.</p>
      </section>
    </div>
  )
}
`
}

export interface RenderedSite { files: Record<string, string> }

export function renderWebsite(spec: BuildSpec, copy: SiteCopy): RenderedSite {
  return {
    files: {
      'src/App.tsx': renderApp(spec, copy),
      'src/index.css': renderIndexCss(spec),
      'src/owner-details.ts': renderOwnerDetails(spec),
      'index.html': renderIndexHtml(spec, copy, fontsHref(spec)),
      'public/robots.txt': robotsTxt(spec),
      'public/sitemap.xml': sitemapXml(spec),
      'public/llms.txt': llmsTxt(spec, copy),
      'src/build-spec.json': JSON.stringify(spec, null, 2),
    },
  }
}
