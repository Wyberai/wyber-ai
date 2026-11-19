import { imageDirective, subjectFor } from './render-images'
import { UI } from './ui-strings'
import { DEFAULT_LAYOUT, type BuildSpec, type ImageSlot, type LangId, type LayoutPlan, type PlannedSection, type SiteCopy } from './types'

type Ctx = { spec: BuildSpec; copy: SiteCopy; lay: LayoutPlan; used: Set<string> }
const U = (c: Ctx, ...names: string[]) => names.forEach(n => c.used.add(n))
const cp = (id: string) => `COPY.sections[${JSON.stringify(id)}]`

function heroMedia(c: Ctx, slot: ImageSlot | undefined): string {
  if (!slot) return ''
  U(c, 'MediaFrame')
  return `<MediaFrame src="${imageDirective(slot, subjectFor(c.spec, c.copy, slot))}" alt={COPY.hero.imageAlt} ratio="${slot.ratio}" />`
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
    const text = `<section className="mx-auto max-w-5xl px-6 pb-16 ${slot && c.lay.heroMediaFirst ? 'pt-12' : 'pt-36 md:pt-44'} text-center">
          {COPY.hero.eyebrow && <p className="mb-4 font-mono text-sm text-muted-foreground">{COPY.hero.eyebrow}</p>}
          <HeroHeadline>{COPY.hero.headline}</HeroHeadline>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{COPY.hero.sub}</p>
          <div className="flex justify-center">${buttons}</div>
        </section>`
    if (!slot) return text
    if (c.lay.heroMediaFirst) return `<section className="mx-auto max-w-5xl px-6 pt-28 md:pt-32">${heroMedia(c, slot)}</section>\n        ${text}`
    return `${text}\n        <section className="mx-auto max-w-5xl px-6 pb-20">${heroMedia(c, slot)}</section>`
  }
  U(c, 'HeroHeadline')
  const flip = c.lay.heroFlip && slot
  return `<section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-32 md:grid-cols-12 md:pt-40">
          <div className="${slot ? 'md:col-span-6' : 'md:col-span-12 max-w-3xl'}${flip ? ' md:order-2' : ''}">
            {COPY.hero.eyebrow && <p className="mb-4 font-mono text-sm text-muted-foreground">{COPY.hero.eyebrow}</p>}
            <HeroHeadline>{COPY.hero.headline}</HeroHeadline>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{COPY.hero.sub}</p>
            ${buttons}
          </div>
          ${slot ? `<div className="md:col-span-6${flip ? ' md:order-1' : ''}">${heroMedia(c, slot)}</div>` : ''}
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
            {${k}.items!.map((it: any, i: number) => (
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
            {${k}.items!.map((it: any, i: number) => (
              <BentoCard key={i} title={it.title} description={it.text} colSpan={[2, 1, 1, 2][i] ?? 1} />
            ))}
          </BentoGrid>`
  }
  U(c, 'Stagger', 'StaggerItem', 'FeatureCard')
  return `${heading(c, s)}
          <Stagger className="grid gap-4 md:grid-cols-3">
            {${k}.items!.map((it: any, i: number) => (
              <StaggerItem key={i}><FeatureCard title={it.title} description={it.text} /></StaggerItem>
            ))}
          </Stagger>`
}

function rows(c: Ctx, s: PlannedSection): string {
  const k = cp(s.id)
  U(c, 'Reveal')
  return `${heading(c, s, 'left')}
          <div className="mt-12 border-t border-border">
            {${k}.items!.map((it: any, i: number) => (
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
  if (c.lay.steps === 'timeline') {
    return `<div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">${heading(c, s, 'left')}</div>
          <ol className="space-y-10 border-l border-border pl-8 md:col-span-7">
            {${k}.items!.map((it: any, i: number) => (
              <li key={i} className="relative">
                <span aria-hidden="true" className="absolute -left-10 top-2 h-3 w-3 rounded-full bg-primary" />
                <SectionNumber n={i + 1} />
                <h3 className="mt-3 font-display text-xl">{it.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{it.text}</p>
              </li>
            ))}
          </ol>
        </div>`
  }
  const cols = n >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'
  return `${heading(c, s, 'left')}
          <Stagger className="mt-12 grid gap-10 ${cols}">
            {${k}.items!.map((it: any, i: number) => (
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
  const flip = c.lay.aboutFlip
  return `<div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-${slot ? '6' : '5'}${flip ? ' md:order-2' : ''}">${heading(c, s, 'left')}</div>
            <div className="space-y-5 text-lg leading-relaxed text-muted-foreground md:col-span-${slot ? '6' : '7'}${flip ? ' md:order-1' : ''}">
              {${k}.paragraphs!.map((p: string, i: number) => <Reveal key={i}><p>{p}</p></Reveal>)}
              ${slot ? `<MediaFrame src="${imageDirective(slot, subjectFor(c.spec, c.copy, slot))}" alt={${k}.imageAlt ?? ''} ratio="${slot.ratio}" className="mt-8 max-w-sm" />` : ''}
            </div>
          </div>`
}

function faq(c: Ctx, s: PlannedSection): string {
  U(c, 'FAQAccordionIcon')
  if (c.lay.faq === 'split') {
    return `<div className="grid gap-12 md:grid-cols-12">
          <div className="md:sticky md:top-28 md:col-span-5 md:self-start">${heading(c, s, 'left')}</div>
          <div className="md:col-span-7"><FAQAccordionIcon items={${cp(s.id)}.faq!} /></div>
        </div>`
  }
  return `${heading(c, s)}
          <div className="mx-auto max-w-3xl"><FAQAccordionIcon items={${cp(s.id)}.faq!} /></div>`
}

function visit(c: Ctx, s: PlannedSection): string {
  U(c, 'DataRow', 'SectionHeading')
  const map = c.spec.brief.modules.includes('map')
  return `<div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5">${heading(c, s, 'left')}</div>
            <div className="md:col-span-7">
              {OWNER.city && <DataRow label={T.area} value={OWNER.city} />}
              {OWNER.address && <DataRow label={T.address} value={OWNER.address} />}
              {OWNER.hours && <DataRow label={T.hours} value={OWNER.hours} />}
              {OWNER.phone && <DataRow label={T.phone} value={<a className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" href={'tel:' + OWNER.phone}>{OWNER.phone}</a>} />}
              {OWNER.email && <DataRow label={T.email} value={<a className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" href={'mailto:' + OWNER.email}>{OWNER.email}</a>} />}
              ${map ? `{OWNER.address && <p className="mt-6"><a className="text-sm font-medium underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(OWNER.address + ' ' + OWNER.city)}>{T.maps}</a></p>}` : ''}
            </div>
          </div>`
}

function contact(c: Ctx, s: PlannedSection): string {
  U(c, 'Card')
  const flip = c.lay.contactFlip
  return `{hasContact && (
            <div className="grid gap-12 md:grid-cols-12">
              <div className="md:col-span-5${flip ? ' md:order-2' : ''}">${heading(c, s, 'left')}</div>
              <div className="md:col-span-7${flip ? ' md:order-1' : ''}"><Card><EnquiryForm button={${cp(s.id)}.button!} t={T} /></Card></div>
            </div>
          )}`
}

function cta(c: Ctx, s: PlannedSection): string {
  U(c, 'CTASection')
  const k = cp(s.id)
  return `<CTASection title={${k}.title} description={${k}.description} primaryCta={${k}.button} onPrimary={() => go(primaryHref || '#faq')} />`
}

function body(c: Ctx, s: PlannedSection): string {
  switch (s.kind) {
    case 'services': return services(c, s)
    case 'rows': return rows(c, s)
    case 'steps': return steps(c, s, c.copy.sections[s.id]?.items?.length ?? 3)
    case 'about': return about(c, s)
    case 'faq': return faq(c, s)
    case 'visit': return visit(c, s)
    case 'contact': return contact(c, s)
    case 'cta': return cta(c, s)
  }
}

function sectionClass(lay: LayoutPlan, i: number): string {
  if (lay.rhythm === 'plain') return 'py-24 md:py-32'
  if (lay.rhythm === 'rules') return 'border-t border-border py-20 md:py-28'
  return 'border-t border-border py-20 md:py-28' + (i % 2 === 1 ? ' bg-card' : '')
}

export type Translations = Partial<Record<LangId, SiteCopy>>

/** English nav labels come from the blueprint; a translation carries its own `nav`. */
export function navLabels(spec: BuildSpec): Record<string, string> {
  return Object.fromEntries(spec.sections.filter(s => s.nav).map(s => [s.id, s.nav as string]))
}

export function renderApp(spec: BuildSpec, copy: SiteCopy, translations: Translations = {}): string {
  const lay = spec.layout ?? DEFAULT_LAYOUT
  const used = new Set<string>(['Footer', 'Input', 'Textarea', 'Button', 'Card', spec.header === 'condensing' ? 'CondensingNavbar' : 'Navbar'])
  const c: Ctx = { spec, copy, lay, used }
  const bodies = spec.sections.map((s, i) => `<section id="${s.id}" className="${sectionClass(lay, i)}"><div className="mx-auto max-w-6xl px-6">
          ${body(c, s)}
        </div></section>`)
  const heroJsx = hero(c)
  const nav = spec.sections.filter(s => s.nav).slice(0, 5)
  const navLinks = nav.map(s => {
    const item = `{ label: (COPY.nav && COPY.nav[${JSON.stringify(s.id)}]) || ${JSON.stringify(s.nav)}, href: '#${s.id}' }`
    return s.kind === 'contact' ? `...(hasContact ? [${item}] : [])` : item
  }).join(',\n    ')
  const Header = spec.header === 'condensing' ? 'CondensingNavbar' : 'Navbar'
  const names = [...used].sort()

  const all: Record<string, SiteCopy & { nav?: Record<string, string> }> = { en: { ...copy, nav: navLabels(spec) } }
  const langs: LangId[] = ['en']
  for (const l of (spec.languages ?? ['en']).filter(x => x !== 'en')) {
    const t = translations[l]
    if (t) { all[l] = t as SiteCopy & { nav?: Record<string, string> }; langs.push(l) }
  }
  const ui = Object.fromEntries(langs.map(l => [l, UI[l]]))

  const langToggleCode = langs.length > 1
    ? `  const langToggle = LANGS.length > 1 ? (
    <div role="group" aria-label={T.language} className="flex overflow-hidden rounded-md border border-border text-sm">
      {LANGS.map(l => (
        <button key={l} type="button" aria-pressed={l === lang} onClick={() => setLang(l)} className={'px-3 py-1.5 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ' + (l === lang ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>{UI[l].label}</button>
      ))}
    </div>
  ) : null
`
    : '  const langToggle = null\n'

  return `import { useEffect, useState } from 'react'
import { ${names.join(', ')} } from './wyber-ui'
import { OWNER } from './owner-details'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COPY_BY_LANG: Record<string, any> = ${JSON.stringify(all, null, 2)}

const UI: Record<string, Record<string, string>> = ${JSON.stringify(ui, null, 2)}

const LANGS = Object.keys(COPY_BY_LANG)
const hasWa = Boolean(OWNER.whatsapp)
const hasMail = Boolean(OWNER.email)
const hasContact = hasWa || hasMail
const go = (href: string) => { if (href) window.location.href = href }

function EnquiryForm({ button, t }: { button: string; t: Record<string, string> }) {
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (f.get('company_website')) return
    const text = 'Name: ' + f.get('name') + '\\nContact: ' + f.get('contact') + '\\n\\n' + f.get('message')
    go(hasWa
      ? 'https://wa.me/' + OWNER.whatsapp + '?text=' + encodeURIComponent(text)
      : 'mailto:' + OWNER.email + '?subject=' + encodeURIComponent(t.subject) + '&body=' + encodeURIComponent(text))
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label htmlFor="enq-name" className="mb-1.5 block text-sm font-medium">{t.name}</label><Input id="enq-name" name="name" required autoComplete="name" /></div>
      <div><label htmlFor="enq-contact" className="mb-1.5 block text-sm font-medium">{t.contact}</label><Input id="enq-contact" name="contact" required autoComplete="off" /></div>
      <div><label htmlFor="enq-message" className="mb-1.5 block text-sm font-medium">{t.message}</label><Textarea id="enq-message" name="message" required /></div>
      <input name="company_website" tabIndex={-1} aria-hidden="true" autoComplete="off" className="hidden" />
      <p className="text-xs text-muted-foreground">{t.consent}</p>
      <Button type="submit" size="lg">{button}</Button>
    </form>
  )
}

export default function App() {
  const [lang, setLang] = useState<string>(() => {
    try { const s = localStorage.getItem('site-lang'); return s && COPY_BY_LANG[s] ? s : 'en' } catch { return 'en' }
  })
  useEffect(() => {
    document.documentElement.lang = lang
    try { localStorage.setItem('site-lang', lang) } catch { /* storage blocked */ }
  }, [lang])
  const COPY = COPY_BY_LANG[lang]
  const T = UI[lang]
  const BRAND: string = OWNER.name || COPY.brand
  const primaryHref = hasWa
    ? 'https://wa.me/' + OWNER.whatsapp + '?text=' + encodeURIComponent(T.hello)
    : hasMail ? 'mailto:' + OWNER.email : ''
  const links = [
    ${navLinks}
  ]
${langToggleCode}  const headerCta = (langToggle || hasContact) ? (
    <div className="flex items-center gap-3">
      {langToggle}
      {hasContact && <Button size="sm" onClick={() => go(primaryHref)}>{COPY.hero.cta}</Button>}
    </div>
  ) : undefined
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2">{T.skip}</a>
      <${Header}
        brand={BRAND}
        links={links}
        cta={headerCta}
      />
      <main id="main">
        ${heroJsx}
        ${bodies.join('\n        ')}
      </main>
      <Footer
        brand={BRAND}
        description={lang === 'en' ? COPY.seo.description : COPY.hero.sub}
        columns={[{ title: T.explore, links: [...links, { label: T.privacy, href: '#privacy' }, { label: T.terms, href: '#terms' }] }]}
        note={'\\u00a9 ' + new Date().getFullYear() + ' ' + BRAND}
      />
      <section id="privacy" className="mx-auto max-w-3xl px-6 py-10 text-sm text-muted-foreground">
        <h2 className="font-medium text-foreground">{T.privacy}</h2>
        <p className="mt-2">{T.privacyText}</p>
      </section>
      <section id="terms" className="mx-auto max-w-3xl px-6 pb-16 text-sm text-muted-foreground">
        <h2 className="font-medium text-foreground">{T.terms}</h2>
        <p className="mt-2">{T.termsText}</p>
      </section>
    </div>
  )
}
`
}
