import type { AppEntity, AppModel } from '../app-spec/types'
import type { SiteCopy } from '../website-spec/types'
import type { SaasSpec } from './types'
import { imageDirective } from '../build-spec/images'

// The marketing site of a SaaS, built from the website pipeline's product plan and copy, the Wyber UI kit and the product's own sample data.
// The hero shows a real preview of the product (its own columns and its own sample rows, labelled Sample); no invented screenshots,
// logos, customer counts or ratings. Pricing is read from src/plans.ts at run time so the site and the product can never disagree.

const rel = (v: string): string => {
  if (v === 'today') return 'Today'
  const m = /^([+-])(\d+)d$/.exec(v)
  if (!m) return v
  const n = Number(m[2])
  return m[1] === '+' ? 'In ' + n + (n === 1 ? ' day' : ' days') : n + (n === 1 ? ' day ago' : ' days ago')
}

/** The columns and rows of the product preview, taken from the model so it shows what the product really lists. */
export function previewOf(app: AppModel): { entity: AppEntity; cols: { id: string; label: string; type: string }[]; rows: string[][]; stats: { label: string; value: string }[] } {
  const entity = app.entities.find(e => e.status || e.due || e.amount) ?? app.entities[0]
  const cols = entity.fields.filter(f => f.type !== 'longtext' && f.type !== 'ref' && f.type !== 'checkbox').slice(0, 4)
  const byTitle = (row: Record<string, string | number | boolean>, id: string, type: string): string => {
    const v = row[id]
    if (v === undefined || v === '') return ''
    if (type === 'date') return rel(String(v))
    if (type === 'money') return String(v)
    return String(v)
  }
  const rows = entity.sample.slice(0, 4).map(r => cols.map(c => byTitle(r, c.id, c.type)))
  // numbers that can be worked out from the sample rows alone (a date-relative "overdue" count cannot, so it is skipped)
  const stats: { label: string; value: string }[] = []
  for (const m of app.metrics) {
    const ent = app.entities.find(e => e.id === m.entity)
    if (!ent || m.where?.op === 'overdue') continue
    let rowsOf = ent.sample
    if (m.where) { const w = m.where; rowsOf = rowsOf.filter(r => (w.op === 'eq' ? String(r[w.field]) === String(w.value) : String(r[w.field]) !== String(w.value))) }
    const n = m.kind === 'count' || m.kind === 'countWhere' ? rowsOf.length : rowsOf.reduce((a, r) => a + (Number(r[m.field ?? '']) || 0), 0)
    stats.push({ label: m.label, value: m.money ? '{CUR}' + n.toLocaleString('en-IN') : String(n) })
    if (stats.length === 3) break
  }
  return { entity, cols, rows, stats }
}

export function renderSite(spec: SaasSpec, copy: SiteCopy, app: AppModel): string {
  const site = spec.site
  const lay = spec.layout
  const mo = site.motion
  const used = new Set<string>(['Button', 'Card', 'Badge', 'BrowserFrame', 'MonoLabel'])
  const U = (...n: string[]) => n.forEach(x => used.add(x))
  const tag = (kind: 'reveal' | 'stagger' | 'item'): string => {
    if (kind === 'reveal') { if (!mo.reveal) return 'div'; U('Reveal'); return 'Reveal' }
    if (!mo.stagger) return 'div'
    U(kind === 'stagger' ? 'Stagger' : 'StaggerItem')
    return kind === 'stagger' ? 'Stagger' : 'StaggerItem'
  }
  const cp = (id: string) => `COPY.sections[${JSON.stringify(id)}]`
  const features = site.sections.find(s => s.kind === 'services')
  const steps = site.sections.find(s => s.kind === 'steps')
  const faq = site.sections.find(s => s.kind === 'faq')
  const cta = site.sections.find(s => s.kind === 'cta')
  const pv = previewOf(app)
  const preview = `<div className="rounded-3xl bg-primary/10 p-3 sm:p-6"><BrowserFrame url="Preview with sample data" className="w-full shadow-xl">
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-base font-semibold text-foreground">${JSON.stringify(pv.entity.label).slice(1, -1)}</p>
                  <Badge variant="outline">Sample data</Badge>
                </div>
                ${pv.stats.length ? `<div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                  ${pv.stats.map(s => `<div className="rounded-lg border border-border bg-card p-2.5 sm:p-3"><p className="font-display text-lg font-semibold leading-tight text-foreground sm:text-xl">${s.value.replace('{CUR}', '{CURRENCY}')}</p><p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">${JSON.stringify(s.label).slice(1, -1)}</p></div>`).join('\n                  ')}
                </div>` : ''}
                <div className="mt-4 overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-muted text-muted-foreground"><tr>${pv.cols.map((c, i) => `<th scope="col" className="px-2.5 py-2 font-medium${i > 1 ? ' hidden sm:table-cell' : ''}">${JSON.stringify(c.label).slice(1, -1)}</th>`).join('')}</tr></thead>
                    <tbody className="divide-y divide-border">
                      ${pv.rows.map(r => `<tr>${r.map((v, i) => `<td className="px-2.5 py-2 ${i === 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}${i > 1 ? ' hidden sm:table-cell' : ''}">${pv.cols[i].type === 'money' ? '{CURRENCY}' + Number(v || 0).toLocaleString('en-IN') : JSON.stringify(v).slice(1, -1)}</td>`).join('')}</tr>`).join('\n                      ')}
                    </tbody>
                  </table>
                </div>
              </div>
            </BrowserFrame></div>`

  const buttons = `<div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" onClick={() => openApp()}>{COPY.hero.cta}</Button>
              <a href="#features" className="text-sm font-medium underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{COPY.hero.secondary}</a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Demo mode: nothing is charged, sent or stored on a server.</p>`
  const headline = mo.highlight ? (U('HighlightMarker'), '{hl(COPY.hero.headline, COPY.hero.accent)}') : '{COPY.hero.headline}'

  let hero: string
  const scene = (copy.hero.imageBrief || '').replace(/\s+/g, ' ').trim() || 'An everyday scene of the place and the people who use this product, in daylight.'
  const STYLE = 'Documentary photograph, natural light, unposed, real people and a real place, restrained colour, no text anywhere.'
  const heroPhotoSrc = imageDirective({ brief: STYLE, ratio: '16:9' }, scene)
  const bandPhotoSrc = imageDirective({ brief: STYLE, ratio: '16:9' }, 'A close, detailed view of the hands, tools and materials in the same setting as this scene, no faces: ' + scene)
  const closePhotoSrc = imageDirective({ brief: STYLE, ratio: '16:9' }, 'A quiet wide view of the same place with people small in the frame, calm end of the day: ' + scene)
  const reveal = mo.reveal ? ' reveal' : ''
  const sec = new Set<string>()
  const S = (n: string): string => (sec.add(n), n)
  if (lay.heroPhoto) {
    hero = `<HeroFullBleed eyebrow={COPY.hero.eyebrow} headline={COPY.hero.headline} sub={COPY.hero.sub} cta={COPY.hero.cta} onCta={() => openApp()} secondaryLabel={COPY.hero.secondary} secondaryHref="#features" media={<img src="${heroPhotoSrc}" alt={COPY.hero.imageAlt || BRAND} loading="eager" decoding="async" />}${reveal} />
        <p className="mx-auto max-w-[1320px] px-5 pt-6 text-xs text-muted-foreground sm:px-8 lg:px-12">Demo mode: nothing is charged, sent or stored on a server.</p>
        <section className="mx-auto max-w-5xl px-6 py-16">${preview}</section>`
    S('HeroFullBleed')
  } else if (site.hero === 'editorial') {
    U('EditorialHeadline')
    hero = `<section className="mx-auto max-w-6xl px-6 pb-12 pt-32 md:pt-40">
          <EditorialHeadline as="h1" eyebrow={COPY.hero.eyebrow}>${headline}</EditorialHeadline>
          <div className="mt-10 grid gap-8 md:grid-cols-12">
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground md:col-span-6">{COPY.hero.sub}</p>
            <div className="md:col-span-6 md:justify-self-end">${buttons}</div>
          </div>
        </section>
        <section className="mx-auto max-w-5xl px-6 pb-20">${preview}</section>`
  } else if (lay.heroPreview === 'right') {
    U('HeroHeadline')
    hero = `<section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-32 md:grid-cols-12 md:pt-40">
          <div className="md:col-span-6">
            {COPY.hero.eyebrow && <p className="mb-4 font-mono text-sm text-muted-foreground">{COPY.hero.eyebrow}</p>}
            <HeroHeadline className="text-[clamp(2.5rem,5vw,4.5rem)]">${headline}</HeroHeadline>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{COPY.hero.sub}</p>
            ${buttons}
          </div>
          <div className="md:col-span-6">
            ${preview}
          </div>
        </section>`
  } else {
    U('HeroHeadline')
    hero = `<section className="mx-auto max-w-5xl px-6 pb-12 pt-32 text-center md:pt-40">
          {COPY.hero.eyebrow && <p className="mb-4 font-mono text-sm text-muted-foreground">{COPY.hero.eyebrow}</p>}
          <HeroHeadline>${headline}</HeroHeadline>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{COPY.hero.sub}</p>
          <div className="flex flex-col items-center">${buttons}</div>
        </section>
        <section className="mx-auto max-w-5xl px-6 pb-20">${preview}</section>`
  }

  const pricing = lay.pricing === 'table'
    ? `<div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th scope="col" className="px-4 py-4 font-medium text-muted-foreground"><span className="sr-only">Plan</span></th>
                  {PLANS.map(p => (
                    <th key={p.id} scope="col" className="px-4 py-4 align-top">
                      <p className="font-display text-lg font-semibold text-foreground">{p.name}</p>
                      <p className="mt-1 text-sm font-normal text-muted-foreground">{priceLabel(p)}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><th scope="row" className="px-4 py-3 font-normal text-muted-foreground">{RECORD_NOUN.many.charAt(0).toUpperCase() + RECORD_NOUN.many.slice(1)}</th>{PLANS.map(p => <td key={p.id} className="px-4 py-3 text-foreground">{p.limits.records === null ? 'Unlimited' : p.limits.records}</td>)}</tr>
                <tr><th scope="row" className="px-4 py-3 font-normal text-muted-foreground">Team members</th>{PLANS.map(p => <td key={p.id} className="px-4 py-3 text-foreground">{p.limits.seats === null ? 'Unlimited' : p.limits.seats}</td>)}</tr>
                {allFeatures.map(f => <tr key={f}><th scope="row" className="px-4 py-3 font-normal text-muted-foreground">{f}</th>{PLANS.map(p => <td key={p.id} className="px-4 py-3 text-foreground">{p.features.includes(f) ? 'Included' : ''}</td>)}</tr>)}
                <tr><th scope="row" className="px-4 py-4"><span className="sr-only">Start</span></th>{PLANS.map(p => <td key={p.id} className="px-4 py-4"><Button size="sm" variant="outline" onClick={() => openApp()}>{'Start with ' + p.name}</Button></td>)}</tr>
              </tbody>
            </table>
          </div>`
    : `<div className={'grid gap-4 ' + (PLANS.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
            {PLANS.map(p => (
              <Card key={p.id} className="flex h-full flex-col gap-5">
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
                </div>
                <p className="font-display text-3xl font-semibold text-foreground">{priceLabel(p)}</p>
                <ul className="flex-1 space-y-2 text-sm text-foreground">
                  <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />{p.limits.records === null ? 'Unlimited ' + RECORD_NOUN.many : 'Up to ' + p.limits.records + ' ' + RECORD_NOUN.many}</li>
                  <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />{p.limits.seats === null ? 'Unlimited team members' : 'Up to ' + p.limits.seats + ' team ' + (p.limits.seats === 1 ? 'member' : 'members')}</li>
                  {p.features.map(f => <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />{f}</li>)}
                </ul>
                <Button variant="outline" onClick={() => openApp()}>{'Start with ' + p.name}</Button>
              </Card>
            ))}
          </div>`

  const hlCode = mo.highlight
    ? `function hl(text: string, accent?: string): React.ReactNode {
  if (!accent) return text
  const i = text.indexOf(accent)
  if (i < 0) return text
  return <>{text.slice(0, i)}<HighlightMarker>{accent}</HighlightMarker>{text.slice(i + accent.length)}</>
}

`
    : ''
  if (mo.progress) U('ScrollProgress')
  if (mo.backToTop) U('BackToTop')

  const nav = [
    features ? `{ label: ${JSON.stringify(site.sections.find(s => s.id === features.id)?.nav ?? 'Features')}, href: '#features' }` : '',
    steps ? `{ label: ${JSON.stringify(steps.nav ?? 'How it works')}, href: '#how' }` : '',
    `{ label: 'Pricing', href: '#pricing' }`,
    faq ? `{ label: ${JSON.stringify(faq.nav ?? 'Questions')}, href: '#faq' }` : '',
  ].filter(Boolean).join(',\n    ')
  if (mo.progress) U('ScrollProgress')
  if (mo.backToTop) U('BackToTop')

  const headerName = S(({ bar: 'HeaderBar', centered: 'HeaderCentered', index: 'HeaderIndex' } as const)[lay.header])
  let ti = 0
  const tone = (): string => (lay.rhythm === 'plain' ? 'plain' : lay.rhythm === 'rules' ? 'rule' : ti++ % 2 === 1 ? 'card' : 'plain')
  const listProps = (id: string) => `eyebrow={${cp(id)}.eyebrow} title={${cp(id)}.title} description={${cp(id)}.description} items={${cp(id)}.items}${reveal}`

  const featuresTag = features ? S(features.variant === 'bento' ? 'FeaturesBento' : features.variant === 'cards' ? 'FeaturesCards' : 'FeaturesIndex') : ''
  const stepsTag = steps ? S(lay.steps === 'timeline' ? 'StepsTimeline' : 'StepsColumns') : ''
  const faqTag = faq ? S(lay.faq === 'split' ? 'FaqSplit' : 'FaqBoxed') : ''
  const footerTag = S(lay.heroPhoto || lay.rhythm === 'rules' ? 'FooterGiant' : 'FooterSlim')

  const bandBlock = lay.heroPhoto
    ? `<${S('PhotoBand')} media={<img src="${bandPhotoSrc}" alt={'Close view of the work and the place. ' + (COPY.hero.imageAlt || '')} loading="lazy" decoding="async" />}${reveal} />`
    : ''
  const priceTone = tone()
  const body = [
    features ? `<section id="features"><${featuresTag} ${listProps(features.id)} tone="${tone()}" /></section>` : '',
    bandBlock,
    steps ? `<section id="how"><${stepsTag} ${listProps(steps.id)} tone="${tone()}" /></section>` : '',
    `<section id="pricing" className="${priceTone === 'card' ? 'bg-card' : priceTone === 'rule' ? 'border-t border-border' : ''}"><div className="mx-auto w-full max-w-[1320px] px-5 py-20 sm:px-8 md:py-32 lg:px-12">
          <${tag('reveal')} className="mb-12 max-w-2xl">
            <MonoLabel accent>Pricing</MonoLabel>
            <h2 className="mt-4 font-display text-[clamp(2.1rem,4.8vw,4.25rem)] leading-[1.04] tracking-[-0.025em] text-foreground">Plans</h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">{PLANS.some(p => p.price === null) ? 'Prices will be shown here once they are set. The limits below already apply.' : 'Choose a plan when you are ready. You can look around in the demo first.'}</p>
          </${tag('reveal')}>
          ${pricing}
        </div></section>`,
    faq ? `<section id="faq"><${faqTag} eyebrow={${cp(faq.id)}.eyebrow} title={${cp(faq.id)}.title} description={${cp(faq.id)}.description} faq={${cp(faq.id)}.faq} tone="${tone()}"${reveal} /></section>` : '',
  ].filter(Boolean).join('\n        ')

  const ctaTag = S(lay.heroPhoto ? 'CtaPhoto' : lay.rhythm === 'rules' ? 'CtaSplit' : 'CtaBand')
  const ctaBlock = cta
    ? `<${ctaTag} title={${cp(cta.id)}.title} description={${cp(cta.id)}.description} cta={${cp(cta.id)}.button || COPY.hero.cta} onCta={() => openApp()}${lay.heroPhoto ? ` media={<img src="${closePhotoSrc}" alt={'Quiet view of the place. ' + (COPY.hero.imageAlt || '')} loading="lazy" decoding="async" />}` : ''}${reveal} />
        <p className="mx-auto max-w-[1320px] px-5 py-4 text-xs text-muted-foreground sm:px-8 lg:px-12">Demo mode: nothing is charged, sent or stored on a server.</p>`
    : ''

  const imports = [...used].sort()
  return `${lay.pricing === 'cards' ? "import { Check } from 'lucide-react'\n" : ''}import { ${imports.join(', ')} } from './wyber-ui'
import { ${[...sec].sort().join(', ')} } from './wyber-sections'
import { OWNER } from './owner-details'
import { CURRENCY, PLANS, RECORD_NOUN, priceLabel } from './plans'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COPY: any = ${JSON.stringify(copy, null, 2)}

const openApp = () => { window.location.hash = '#/app' }
${lay.pricing === 'table' ? 'const allFeatures: string[] = Array.from(new Set(PLANS.flatMap(p => p.features)))\n' : ''}
${hlCode}export default function Site() {
  const BRAND: string = COPY.brand
  const links = [
    ${nav}
  ]
  return (
    <div className="min-h-screen bg-background text-foreground">
      ${mo.progress ? '<ScrollProgress />' : ''}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2">Skip to content</a>
      <${headerName} brand={BRAND} links={links}${lay.heroPhoto ? ' over' : ''} cta={<Button size="sm" onClick={() => openApp()}>{COPY.hero.cta}</Button>} />
      <main id="main">
        ${hero}
        ${body}
        ${ctaBlock}
      </main>
      ${mo.backToTop ? '<BackToTop />' : ''}
      <${footerTag}
        brand={BRAND}
        description={COPY.seo.description}
        columns={[
          { title: 'Product', links: [...links, { label: 'Open the demo', href: '#/app' }] },
          { title: 'Legal', links: [{ label: 'Terms', href: '#/terms' }, { label: 'Privacy policy', href: '#/privacy' }] },
        ]}
        note={'\\u00a9 ' + new Date().getFullYear() + ' ' + (OWNER.name || BRAND)}
      />
    </div>
  )
}
`
}
