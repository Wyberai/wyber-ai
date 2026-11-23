import type { AppEntity, AppModel } from '../app-spec/types'
import type { SiteCopy } from '../website-spec/types'
import type { SaasSpec } from './types'

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
  const used = new Set<string>(['Navbar', 'Footer', 'Button', 'Card', 'Badge', 'BrowserFrame', 'MonoLabel', 'Accordion'])
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
  const band = (i: number) =>
    lay.rhythm === 'plain' ? 'py-24 md:py-32' : lay.rhythm === 'rules' ? 'border-t border-border py-20 md:py-28' : 'border-t border-border py-20 md:py-28' + (i % 2 === 1 ? ' bg-muted/60' : '')

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
  if (site.hero === 'editorial') {
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

  const heading = (id: string, align = 'left') => `<${tag('reveal')} className="mb-10 max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}">
            {${cp(id)}.eyebrow && <MonoLabel accent>{${cp(id)}.eyebrow}</MonoLabel>}
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{${cp(id)}.title}</h2>
            {${cp(id)}.description && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{${cp(id)}.description}</p>}
          </${tag('reveal')}>`

  const featureBlock = (): string => {
    if (!features) return ''
    const id = features.id
    const variant = features.variant ?? 'cards'
    const list = `${cp(id)}.items`
    if (variant === 'list') {
      return `<div className="divide-y divide-border border-y border-border">
            {${list}.map((it: { title: string; text: string }, i: number) => (
              <div key={it.title} className="grid gap-2 py-6 md:grid-cols-12 md:gap-8">
                <p className="font-mono text-sm text-muted-foreground md:col-span-1">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="font-display text-xl font-semibold text-foreground md:col-span-4">{it.title}</h3>
                <p className="text-muted-foreground md:col-span-7">{it.text}</p>
              </div>
            ))}
          </div>`
    }
    if (variant === 'bento') {
      return `<${tag('stagger')} className="grid gap-4 md:grid-cols-3">
            {${list}.map((it: { title: string; text: string }, i: number) => (
              <${tag('item')} key={it.title} className={i === 0 || i === 3 ? 'md:col-span-2' : ''}>
                <Card className="h-full">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-mono text-xs text-primary-foreground">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{it.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.text}</p>
                </Card>
              </${tag('item')}>
            ))}
          </${tag('stagger')}>`
    }
    return `<${tag('stagger')} className="grid gap-4 md:grid-cols-3">
            {${list}.map((it: { title: string; text: string }, i: number) => (
              <${tag('item')} key={it.title}>
                <Card className="h-full">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-mono text-xs text-primary-foreground">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{it.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.text}</p>
                </Card>
              </${tag('item')}>
            ))}
          </${tag('stagger')}>`
  }

  const stepsBlock = (): string => {
    if (!steps) return ''
    const list = `${cp(steps.id)}.items`
    if (lay.steps === 'timeline') {
      return `<ol className="relative max-w-2xl space-y-8 border-l border-border pl-8">
            {${list}.map((it: { title: string; text: string }, i: number) => (
              <li key={it.title} className="relative">
                <span className="absolute -left-[2.9rem] flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background font-mono text-xs text-foreground">{i + 1}</span>
                <h3 className="font-display text-lg font-semibold text-foreground">{it.title}</h3>
                <p className="mt-1 text-muted-foreground">{it.text}</p>
              </li>
            ))}
          </ol>`
    }
    const n = copy.sections[steps.id]?.items?.length ?? 3
    return `<ol className="grid gap-8 ${n === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}">
            {${list}.map((it: { title: string; text: string }, i: number) => (
              <li key={it.title} className="border-t-2 border-foreground pt-4">
                <p className="font-mono text-xs text-muted-foreground">{'Step ' + (i + 1)}</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{it.title}</h3>
                <p className="mt-2 text-muted-foreground">{it.text}</p>
              </li>
            ))}
          </ol>`
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

  const faqBlock = faq
    ? lay.faq === 'split'
      ? `<div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4">{${cp(faq.id)}.description && <p className="text-muted-foreground">{${cp(faq.id)}.description}</p>}</div>
            <div className="md:col-span-8"><Accordion items={${cp(faq.id)}.faq.map((f: { question: string; answer: string }) => ({ title: f.question, content: f.answer }))} /></div>
          </div>`
      : `<div className="mx-auto max-w-3xl"><Accordion items={${cp(faq.id)}.faq.map((f: { question: string; answer: string }) => ({ title: f.question, content: f.answer }))} /></div>`
    : ''

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
  const Header = site.header === 'condensing' ? 'CondensingNavbar' : 'Navbar'
  if (site.header === 'condensing') U('CondensingNavbar')
  used.delete(site.header === 'condensing' ? 'Navbar' : 'CondensingNavbar')

  let band_i = 0
  const sec = (id: string, inner: string) => `<section id="${id}" className="${band(band_i++)}"><div className="mx-auto max-w-6xl px-6">
          ${inner}
        </div></section>`

  const body = [
    features ? sec('features', `${heading(features.id)}\n          ${featureBlock()}`) : '',
    steps ? sec('how', `${heading(steps.id)}\n          ${stepsBlock()}`) : '',
    sec('pricing', `<${tag('reveal')} className="mb-10 max-w-2xl">
            <MonoLabel accent>Pricing</MonoLabel>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Plans</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{PLANS.some(p => p.price === null) ? 'Prices will be shown here once they are set. The limits below already apply.' : 'Choose a plan when you are ready. You can look around in the demo first.'}</p>
          </${tag('reveal')}>
          ${pricing}`),
    faq ? sec('faq', `${heading(faq.id)}\n          ${faqBlock}`) : '',
  ].filter(Boolean).join('\n        ')

  const ctaBlock = cta
    ? `<section className="mx-auto max-w-6xl px-6 py-20"><div className="rounded-3xl bg-foreground px-6 py-14 text-center text-background md:px-16 md:py-20">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight text-background md:text-5xl">{${cp(cta.id)}.title}</h2>
          {${cp(cta.id)}.description && <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-background/80">{${cp(cta.id)}.description}</p>}
          <div className="mt-8"><Button size="lg" onClick={() => openApp()}>{${cp(cta.id)}.button || COPY.hero.cta}</Button></div>
          <p className="mt-4 text-xs text-background/70">Demo mode: nothing is charged, sent or stored on a server.</p>
        </div></section>`
    : ''

  const imports = [...used].sort()
  return `${lay.pricing === 'cards' ? "import { Check } from 'lucide-react'\n" : ''}import { ${imports.join(', ')} } from './wyber-ui'
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
      <${Header} brand={BRAND} links={links} cta={<Button size="sm" onClick={() => openApp()}>{COPY.hero.cta}</Button>} />
      <main id="main">
        ${hero}
        ${body}
        ${ctaBlock}
      </main>
      ${mo.backToTop ? '<BackToTop />' : ''}
      <Footer
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
