// WYBER SECTIONS, part 3: more page sections (25 Nov 2026). Appended to the same generated file as wyber-sections.ts (shares Rv, Shell, Head,
// Frame, Actions, FactRow, FaqRow ...). Same rules: String.raw (NO backticks, NO dollar-brace), tokens only, every string on screen is a prop,
// grids always fill whole rows (see fitSpans and MOSAIC), reduced-motion safe, complete without scroll-driven CSS or View Transitions.
// Patterns only (sticky stacking, snap scrollers, native exclusive details, ledgers, rails); nothing copied from any third-party section.

export const WYBER_BLOCKS_NAMES = [
  'FeaturesTabs', 'FeaturesStack', 'FeaturesScroller', 'FeaturesLedger', 'FeaturesZigzag', 'FeaturesMosaic', 'RibbonBand',
  'StepsRail', 'StepsPath', 'StepsAccordion',
  'AboutStatement', 'AboutNotes', 'AboutOverlap',
  'FaqColumns', 'FaqDetails',
  'CtaCentered', 'CtaStrip',
  'VisitCards', 'VisitStatement',
  'ContactInverted', 'ContactStacked',
  'FooterColumns', 'FooterCentered',
] as const

export const WYBER_BLOCKS_SOURCE = String.raw`
/* ----------------------------- more feature lists ----------------------------- */

const SPAN: Record<number, string> = { 2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4', 6: 'md:col-span-6' }
// Spans on a six-column grid that always add up to whole rows, so a grid never ends on an orphan.
const FIT: Record<number, number[]> = { 1: [6], 2: [3, 3], 3: [2, 2, 2], 4: [3, 3, 3, 3], 5: [2, 2, 2, 3, 3], 6: [2, 2, 2, 2, 2, 2] }
function fitSpans(n: number): string[] {
  const row = FIT[n]
  if (row) return row.map(x => SPAN[x])
  // more than six: rows of three, and a final row that is stretched to fill
  const spans = Array.from({ length: n }, () => 2)
  const rem = n % 3
  if (rem === 1) spans[n - 1] = 6
  if (rem === 2) { spans[n - 1] = 3; spans[n - 2] = 3 }
  return spans.map(x => SPAN[x])
}
// A mosaic: tiles of different widths, still whole rows (each row adds up to six).
const MOSAIC: Record<number, number[]> = { 1: [6], 2: [3, 3], 3: [3, 3, 6], 4: [4, 2, 2, 4], 5: [2, 2, 2, 3, 3], 6: [4, 2, 3, 3, 2, 4], 7: [6, 3, 3, 2, 2, 2, 6], 8: [2, 2, 2, 3, 3, 2, 2, 2] }

// One list on the left, the chosen item on the right: the accordion-driven feature explorer.
export function FeaturesTabs({ eyebrow, title, description, items, tone, reveal }: ListProps) {
  const [i, setI] = useState(0)
  const calm = useReducedMotion()
  const uid = useId()
  const cur = items[Math.min(i, Math.max(0, items.length - 1))]
  if (!cur) return null
  return (
    <Shell tone={tone}>
      <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="max-w-3xl" />
      <div className="mt-14 grid gap-8 md:mt-20 md:grid-cols-12 md:gap-12">
        <div role="tablist" aria-orientation="vertical" aria-label={title} className="flex flex-col border-t border-foreground md:col-span-5">
          {items.map((it, k) => (
            <button key={k} type="button" role="tab" id={uid + '-t' + k} aria-selected={k === i} aria-controls={uid + '-p'} tabIndex={k === i ? 0 : -1}
              onClick={() => setI(k)} onKeyDown={e => tabKeys(e, items.length, i, setI, true)}
              className={cn('flex items-baseline gap-5 border-b border-border px-1 py-5 text-left transition-colors md:py-6', k === i ? 'bg-accent/50 text-foreground' : 'text-muted-foreground hover:text-foreground', FOCUS)}>
              <span className="font-mono text-xs">{pad(k + 1)}</span>
              <span className="font-display text-xl leading-snug tracking-[-0.01em] md:text-2xl">{it.title}</span>
            </button>
          ))}
        </div>
        <div role="tabpanel" id={uid + '-p'} aria-labelledby={uid + '-t' + i} className="md:col-span-7">
          <motion.div key={i} initial={calm ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}
            className="flex min-h-[20rem] flex-col justify-between rounded-2xl border border-border bg-card p-8 md:min-h-[26rem] md:p-12">
            <span className="font-display text-[clamp(4rem,8vw,7rem)] leading-none tracking-[-0.04em] text-primary">{pad(i + 1)}</span>
            <div className="mt-12">
              <h3 className="font-display text-[clamp(1.8rem,3vw,2.8rem)] leading-[1.08] tracking-[-0.02em] text-foreground">{cur.title}</h3>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">{cur.text}</p>
              {cur.meta && <p className="mt-6 border-t border-border pt-4 font-mono text-sm text-foreground">{cur.meta}</p>}
            </div>
          </motion.div>
        </div>
      </div>
    </Shell>
  )
}

// Cards that pin under the heading and stack on top of each other as the page scrolls. Plain sticky positioning: no script, and the cards simply list in order where sticky is not wanted.
export function FeaturesStack({ eyebrow, title, description, items, tone, reveal }: ListProps) {
  return (
    <Shell tone={tone}>
      <div className="grid gap-12 md:grid-cols-12">
        <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="md:sticky md:top-28 md:col-span-4 md:self-start" />
        <div className="md:col-span-8">
          {items.map((it, k) => (
            <div key={k} className="sticky mb-6 last:mb-0" style={{ top: 'calc(6rem + ' + k * 0.9 + 'rem)' }}>
              <article className="grid min-h-[18rem] gap-6 rounded-2xl border border-border bg-card p-7 md:grid-cols-12 md:p-10">
                <span className="font-display text-6xl leading-none text-primary md:col-span-3 md:text-7xl">{pad(k + 1)}</span>
                <div className="md:col-span-9 md:self-end">
                  <h3 className="font-display text-2xl leading-tight tracking-[-0.015em] text-foreground md:text-[2rem]">{it.title}</h3>
                  <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">{it.text}</p>
                  {it.meta && <p className="mt-5 border-t border-border pt-4 font-mono text-sm text-foreground">{it.meta}</p>}
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}

// A horizontal strip of cards that snaps as it scrolls. A native scroll container: touch, trackpad, scrollbar and keyboard all work.
export function FeaturesScroller({ eyebrow, title, description, items, tone, reveal }: ListProps) {
  return (
    <Shell tone={tone}>
      <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="max-w-3xl" />
      <div
        role="region" aria-label={title} tabIndex={0}
        className={cn('-mx-5 mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 [scrollbar-width:thin] sm:-mx-8 sm:px-8 md:mt-20 lg:-mx-12 lg:px-12', FOCUS)}
      >
        {items.map((it, k) => (
          <article key={k} className="flex min-h-[20rem] w-[80vw] max-w-[24rem] shrink-0 snap-start flex-col justify-between rounded-2xl border border-border bg-card p-7 md:w-[24rem] md:p-9">
            <span className="font-display text-5xl leading-none text-primary">{pad(k + 1)}</span>
            <div className="mt-10">
              <h3 className="font-display text-2xl leading-tight tracking-[-0.015em] text-foreground">{it.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{it.text}</p>
              {it.meta && <p className="mt-5 border-t border-border pt-4 font-mono text-sm text-foreground">{it.meta}</p>}
            </div>
          </article>
        ))}
      </div>
    </Shell>
  )
}

// Price-list style: the name, a dotted leader and the detail (the owner's own line, for example a price or a size) on one row, with the description under it.
export function FeaturesLedger({ eyebrow, title, description, items, tone, reveal }: ListProps) {
  return (
    <Shell tone={tone}>
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="md:sticky md:top-28 md:col-span-4 md:self-start" />
        <div className="border-t border-foreground md:col-span-8">
          {items.map((it, k) => (
            <Rv key={k} on={reveal} y={10}>
              <div className="border-b border-border py-6 md:py-8">
                <div className="flex items-baseline gap-4">
                  <h3 className="font-display text-xl leading-snug tracking-[-0.01em] text-foreground md:text-[1.75rem]">{it.title}</h3>
                  {it.meta && <><span aria-hidden="true" className="flex-1 border-b border-dotted border-foreground/40" /><span className="text-right font-mono text-sm text-foreground md:text-base">{it.meta}</span></>}
                </div>
                <p className="mt-2 max-w-xl text-base leading-relaxed text-muted-foreground">{it.text}</p>
              </div>
            </Rv>
          ))}
        </div>
      </div>
    </Shell>
  )
}

// Alternating rows: the number and title on one side, the text on the other, swapping sides down the page.
export function FeaturesZigzag({ eyebrow, title, description, items, tone, reveal }: ListProps) {
  return (
    <Shell tone={tone}>
      <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="max-w-3xl" />
      <div className="mt-14 border-t border-foreground md:mt-20">
        {items.map((it, k) => (
          <Rv key={k} on={reveal} y={12}>
            <div className="grid gap-5 border-b border-border py-10 md:grid-cols-12 md:gap-12 md:py-14">
              <div className={cn('md:col-span-7', k % 2 === 1 && 'md:order-2 md:col-start-6')}>
                <span className="font-mono text-sm text-muted-foreground">{pad(k + 1)}</span>
                <h3 className="mt-3 font-display text-[clamp(1.9rem,3.4vw,3.2rem)] leading-[1.05] tracking-[-0.025em] text-foreground">{it.title}</h3>
              </div>
              <div className={cn('md:col-span-5 md:self-end', k % 2 === 1 && 'md:order-1 md:col-start-1')}>
                <p className="text-base leading-relaxed text-muted-foreground md:text-lg">{it.text}</p>
                {it.meta && <p className="mt-4 font-mono text-sm text-foreground">{it.meta}</p>}
              </div>
            </div>
          </Rv>
        ))}
      </div>
    </Shell>
  )
}

// Tiles of different widths that still close every row. Every third tile is solid, so the grid has a rhythm without any decoration.
export function FeaturesMosaic({ eyebrow, title, description, items, tone, reveal }: ListProps) {
  const spans = (MOSAIC[items.length] ?? fitSpans(items.length).map(x => Number(x.replace('md:col-span-', '')))).map(x => SPAN[x])
  return (
    <Shell tone={tone}>
      <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="max-w-3xl" />
      <div className="mt-14 grid gap-4 md:mt-20 md:grid-cols-6">
        {items.map((it, k) => {
          const solid = k % 3 === 0
          return (
            <Rv key={k} on={reveal} delay={k * 0.05} y={12} className={spans[k]}>
              <article className={cn('flex h-full min-h-[15rem] flex-col justify-between rounded-2xl p-7 md:min-h-[17rem] md:p-9', solid ? 'bg-foreground text-background' : 'border border-border bg-card text-foreground')}>
                <span className={cn('font-mono text-sm', solid ? 'text-background/70' : 'text-muted-foreground')}>{pad(k + 1)}</span>
                <div className="mt-10">
                  <h3 className="font-display text-2xl leading-tight tracking-[-0.015em] md:text-[1.9rem]">{it.title}</h3>
                  <p className={cn('mt-3 text-base leading-relaxed', solid ? 'text-background/80' : 'text-muted-foreground')}>{it.text}</p>
                  {it.meta && <p className={cn('mt-4 font-mono text-sm', solid ? 'text-background/80' : 'text-foreground')}>{it.meta}</p>}
                </div>
              </article>
            </Rv>
          )
        })}
      </div>
    </Shell>
  )
}

// A moving ribbon of the names on the page (the owner's own list). Plain CSS keyframes, so it runs without scripts; reduced motion stops it and lets it wrap as text.
export function RibbonBand({ items, label }: { items: string[]; label?: string }) {
  const clean = items.map(x => (x || '').trim()).filter(Boolean)
  if (clean.length < 3) return null
  const reps = Math.max(2, Math.ceil(8 / clean.length))
  const run = Array.from({ length: reps }, () => clean).flat()
  const row = (copy: boolean) => (
    <ul aria-hidden={copy ? true : undefined} className="flex shrink-0 items-center gap-12 pr-12 motion-reduce:flex-wrap motion-reduce:gap-x-8 motion-reduce:gap-y-2 motion-reduce:pr-0">
      {run.map((t, k) => (
        <li key={k} className={cn('flex items-center gap-12 whitespace-nowrap font-display text-3xl md:text-5xl motion-reduce:gap-0 motion-reduce:whitespace-normal', (copy || k >= clean.length) && 'motion-reduce:hidden')} aria-hidden={!copy && k >= clean.length ? true : undefined}>
          {t}<span aria-hidden="true" className="h-2 w-2 shrink-0 bg-primary motion-reduce:hidden" />
        </li>
      ))}
    </ul>
  )
  return (
    <div role="group" aria-label={label || 'Highlights'} className="overflow-hidden bg-foreground py-7 text-background motion-reduce:overflow-visible">
      <div className="flex w-max animate-marquee motion-reduce:w-auto motion-reduce:animate-none motion-reduce:px-5 hover:[animation-play-state:paused]" style={{ animationDuration: Math.max(30, run.length * 6) + 's', animationDirection: 'reverse' }}>
        {row(false)}{row(true)}
      </div>
    </div>
  )
}

/* ----------------------------------- steps ----------------------------------- */

// The steps along a horizontal rail with a node for each; on a phone the rail turns to a rule down the left.
export function StepsRail({ eyebrow, title, description, items, tone, reveal }: ListProps) {
  const cols = items.length >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'
  return (
    <Shell tone={tone}>
      <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="max-w-3xl" />
      <ol className={cn('mt-14 grid gap-10 md:mt-24 md:gap-0', cols)}>
        {items.map((it, k) => (
          <li key={k} className="border-l border-border pl-6 md:border-l-0 md:pl-0 md:pr-8">
            <Rv on={reveal} delay={k * 0.07} y={14}>
              <div className="flex items-center gap-4">
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-foreground bg-background font-mono text-sm text-foreground">{pad(k + 1)}</span>
                {k < items.length - 1 && <span aria-hidden="true" className="hidden h-px flex-1 bg-foreground/40 md:block" />}
              </div>
              <h3 className="mt-6 font-display text-2xl leading-tight tracking-[-0.015em] text-foreground">{it.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{it.text}</p>
            </Rv>
          </li>
        ))}
      </ol>
    </Shell>
  )
}

// A spine down the middle with the steps alternating either side. Where the browser supports scroll timelines the spine fills as you read; elsewhere it is a plain line.
export function StepsPath({ eyebrow, title, description, items, tone, reveal }: ListProps) {
  return (
    <Shell tone={tone}>
      <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} center className="max-w-3xl" />
      <ol className="relative mt-16 md:mt-24">
        <span aria-hidden="true" className="absolute bottom-0 left-5 top-0 w-px bg-border md:left-1/2" />
        <span aria-hidden="true" data-grow="" className="absolute bottom-0 left-5 top-0 w-px bg-foreground md:left-1/2" />
        {items.map((it, k) => (
          <li key={k} className="relative grid pb-14 pl-14 last:pb-0 md:grid-cols-2 md:gap-24 md:pl-0">
            <span aria-hidden="true" className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg border border-foreground bg-background font-mono text-sm text-foreground md:left-1/2 md:-translate-x-1/2">{pad(k + 1)}</span>
            <Rv on={reveal} y={12} className={cn(k % 2 === 1 ? 'md:col-start-2' : 'md:col-start-1 md:text-right')}>
              <h3 className="pt-1 font-display text-2xl leading-tight tracking-[-0.015em] text-foreground md:text-3xl">{it.title}</h3>
              <p className={cn('mt-3 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg', k % 2 === 0 && 'md:ml-auto')}>{it.text}</p>
            </Rv>
          </li>
        ))}
      </ol>
    </Shell>
  )
}

// Each step is a native disclosure; they belong to one exclusive group, so opening one closes the other where the browser supports it. The first starts open.
export function StepsAccordion({ eyebrow, title, description, items, tone, reveal }: ListProps) {
  const group = useId()
  return (
    <Shell tone={tone}>
      <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="max-w-3xl" />
      <div className="mt-14 border-t border-foreground md:mt-20">
        {items.map((it, k) => (
          <details key={k} name={group} open={k === 0} data-anim="" className="group border-b border-border">
            <summary className={cn('flex cursor-pointer list-none items-center gap-6 py-7 md:gap-10 md:py-9 [&::-webkit-details-marker]:hidden', FOCUS)}>
              <span className="font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-none tracking-[-0.04em] text-primary">{pad(k + 1)}</span>
              <span className="flex-1 font-display text-xl leading-snug tracking-[-0.01em] text-foreground md:text-3xl">{it.title}</span>
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-foreground">
                <Plus className="h-4 w-4 group-open:hidden" /><Minus className="hidden h-4 w-4 group-open:block" />
              </span>
            </summary>
            <p className="max-w-2xl pb-9 text-base leading-relaxed text-muted-foreground md:pl-[8.5rem] md:text-lg">{it.text}</p>
          </details>
        ))}
      </div>
    </Shell>
  )
}

/* ----------------------------------- about ----------------------------------- */

// The lead paragraph set as the headline of the section, huge; the rest runs in two columns underneath.
export function AboutStatement({ eyebrow, title, paragraphs, tone, reveal }: AboutProps) {
  const [lead, ...rest] = paragraphs
  return (
    <Shell tone={tone}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Rv on={reveal}>
        <h2 className="mt-5 font-mono text-sm font-normal text-muted-foreground">{title}</h2>
        <p className="mt-8 max-w-5xl font-display text-[clamp(1.9rem,4.4vw,4rem)] leading-[1.1] tracking-[-0.025em] text-foreground">{lead}</p>
      </Rv>
      {rest.length > 0 && (
        <Rv on={reveal} delay={0.08} className="mt-14 border-t border-border pt-10 md:mt-20 md:columns-2 md:gap-16">
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">{rest.map((p, k) => <p key={k}>{p}</p>)}</div>
        </Rv>
      )}
    </Shell>
  )
}

// Notes in the margin: the title stays pinned on the left while numbered paragraphs run down the right.
export function AboutNotes({ eyebrow, title, paragraphs, tone, reveal }: AboutProps) {
  return (
    <Shell tone={tone}>
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <Head eyebrow={eyebrow} title={title} reveal={reveal} className="md:sticky md:top-28 md:col-span-5 md:self-start" />
        <div className="md:col-span-7">
          {paragraphs.map((p, k) => (
            <Rv key={k} on={reveal} y={10}>
              <div className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-border py-7 first:border-foreground md:grid-cols-[3rem_1fr] md:py-9">
                <span className="pt-1 font-mono text-xs text-muted-foreground">{pad(k + 1)}</span>
                <p className={k === 0 ? 'font-display text-[clamp(1.4rem,2.3vw,2rem)] leading-[1.3] text-foreground' : 'text-base leading-relaxed text-muted-foreground md:text-lg'}>{p}</p>
              </div>
            </Rv>
          ))}
        </div>
      </div>
    </Shell>
  )
}

// A large photograph with the text on a solid card that overlaps its edge. With no photograph the card stands alone.
export function AboutOverlap({ eyebrow, title, paragraphs, media, flip, tone, reveal }: AboutProps) {
  const [lead, ...rest] = paragraphs
  return (
    <Shell tone={tone}>
      <div className="grid lg:grid-cols-12">
        {media && (
          <Rv on={reveal} className={cn('lg:row-start-1 lg:col-span-8', flip ? 'lg:col-start-5' : 'lg:col-start-1')}>
            <Frame media={media} ratio="4/3" />
          </Rv>
        )}
        <Rv on={reveal} delay={0.1} className={cn('relative z-10 mx-4 -mt-12 lg:row-start-1 lg:mx-0 lg:mt-20', media ? 'lg:col-span-6' : 'lg:col-span-9', media && (flip ? 'lg:col-start-1' : 'lg:col-start-7'))}>
          <div className="rounded-2xl border border-foreground bg-background p-7 md:p-12">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 className={cn(DISPLAY, eyebrow && 'mt-5')}>{title}</h2>
            <p className="mt-8 font-display text-[clamp(1.25rem,1.8vw,1.6rem)] leading-[1.35] text-foreground">{lead}</p>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">{rest.map((p, k) => <p key={k}>{p}</p>)}</div>
          </div>
        </Rv>
      </div>
    </Shell>
  )
}

/* ------------------------------------ faq ------------------------------------ */

// Every question and answer in view at once, in two columns: no clicking needed to read it. An odd last item spans both columns so no row is left half empty.
export function FaqColumns({ eyebrow, title, description, faq, tone, reveal }: FaqProps) {
  return (
    <Shell tone={tone}>
      <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="max-w-3xl" />
      <div className="mt-14 grid gap-x-16 md:mt-20 md:grid-cols-2">
        {faq.map((f, k) => (
          <Rv key={k} on={reveal} y={10} className={cn('border-t border-foreground py-8 md:py-10', faq.length % 2 === 1 && k === faq.length - 1 && 'md:col-span-2')}>
            <h3 className="font-display text-xl leading-snug tracking-[-0.01em] text-foreground md:text-[1.6rem]">{f.question}</h3>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">{f.answer}</p>
          </Rv>
        ))}
      </div>
    </Shell>
  )
}

// Native exclusive disclosures that animate open where the browser can (CSS only). Opening one closes the others in the group.
export function FaqDetails({ eyebrow, title, description, faq, tone, reveal }: FaqProps) {
  const group = useId()
  return (
    <Shell tone={tone}>
      <div className="grid gap-12 md:grid-cols-12">
        <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="md:col-span-5" />
        <div className="border-t border-foreground md:col-span-7">
          {faq.map((f, k) => (
            <details key={k} name={group} open={k === 0} data-anim="" className="group border-b border-border">
              <summary className={cn('flex cursor-pointer list-none items-start justify-between gap-6 py-6 md:py-8 [&::-webkit-details-marker]:hidden', FOCUS)}>
                <span className="font-display text-xl leading-snug tracking-[-0.01em] text-foreground md:text-[1.5rem]">{f.question}</span>
                <span aria-hidden="true" className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-foreground">
                  <Plus className="h-4 w-4 group-open:hidden" /><Minus className="hidden h-4 w-4 group-open:block" />
                </span>
              </summary>
              <p className="max-w-2xl pb-8 text-base leading-relaxed text-muted-foreground md:text-lg">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </Shell>
  )
}

/* ------------------------------------ cta ------------------------------------ */

// The closing call on a solid primary panel, centred.
export function CtaCentered(p: CtaProps) {
  return (
    <div className={cn(WRAP, 'py-16 md:py-28')}>
      <Rv on={p.reveal}>
        <div className="rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground md:px-16 md:py-28">
          <h2 className="mx-auto max-w-4xl font-display text-[clamp(2.2rem,5.4vw,5rem)] leading-[1] tracking-[-0.03em]">{p.title}</h2>
          {p.description && <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/85 md:text-lg">{p.description}</p>}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            {p.cta && p.onCta && <Cta label={p.cta} onClick={p.onCta} mode="invert" />}
            {p.secondaryLabel && p.secondaryHref && <a href={p.secondaryHref} className={cn('text-base font-medium text-primary-foreground underline underline-offset-[6px]', FOCUS)}>{p.secondaryLabel}</a>}
          </div>
        </div>
      </Rv>
    </div>
  )
}

// One ruled row: the line on the left, the action on the right.
export function CtaStrip(p: CtaProps) {
  return (
    <div className={cn(WRAP, 'py-12 md:py-20')}>
      <Rv on={p.reveal}>
        <div className="grid gap-8 border-y border-foreground py-10 md:grid-cols-12 md:items-center md:py-14">
          <div className="md:col-span-8">
            <h2 className="font-display text-[clamp(1.8rem,3.6vw,3.2rem)] leading-[1.05] tracking-[-0.025em] text-foreground">{p.title}</h2>
            {p.description && <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">{p.description}</p>}
          </div>
          <Actions cta={p.cta} onCta={p.onCta} secondaryLabel={p.secondaryLabel} secondaryHref={p.secondaryHref} className="md:col-span-4 md:justify-end" />
        </div>
      </Rv>
    </div>
  )
}

/* ------------------------------- visit and contact ------------------------------- */

// The visiting facts as cards; the rows always fill (see fitSpans).
export function VisitCards({ eyebrow, title, description, facts = [], children, tone, reveal }: ContactProps) {
  const spans = fitSpans(facts.length)
  return (
    <Shell tone={tone}>
      <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="max-w-3xl" />
      <dl className="mt-14 grid gap-4 md:mt-20 md:grid-cols-6">
        {facts.map((f, k) => (
          <Rv key={k} on={reveal} delay={k * 0.05} y={12} className={spans[k]}>
            <div className="flex h-full min-h-[10rem] flex-col justify-between rounded-2xl border border-border bg-card p-6 md:p-8">
              <dt className="font-mono text-xs text-muted-foreground">{f.label}</dt>
              <dd className="mt-8 font-display text-xl leading-snug text-foreground md:text-2xl">{f.value}</dd>
            </div>
          </Rv>
        ))}
      </dl>
      {children && <Rv on={reveal} className="mt-8">{children}</Rv>}
    </Shell>
  )
}

// The first fact (the place) set as the statement of the section; the remaining facts run underneath in a ruled strip.
export function VisitStatement({ eyebrow, title, description, facts = [], children, tone, reveal }: ContactProps) {
  const [lead, ...rest] = facts
  return (
    <Shell tone={tone}>
      <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="max-w-2xl" />
      <Rv on={reveal} delay={0.06}>
        {lead && (
          <div className="mt-14 border-t border-foreground pt-8 md:mt-20">
            <p className="font-mono text-xs text-muted-foreground">{lead.label}</p>
            <p className="mt-4 max-w-5xl font-display text-[clamp(2rem,5vw,4.6rem)] leading-[1.04] tracking-[-0.03em] text-foreground">{lead.value}</p>
          </div>
        )}
        <FactRow facts={rest} className="mt-12" />
        {children && <div className="mt-8">{children}</div>}
      </Rv>
    </Shell>
  )
}

// The enquiry form on a light card sitting inside a solid inverted panel, with the contact facts beside it.
export function ContactInverted({ eyebrow, title, description, facts, children, flip, reveal }: ContactProps) {
  return (
    <div className={cn(WRAP, 'py-16 md:py-28')}>
      <div className="rounded-3xl bg-foreground p-6 text-background md:p-14">
        <div className="grid gap-12 md:grid-cols-12 md:gap-16">
          <Rv on={reveal} className={cn('md:col-span-5', flip && 'md:order-2')}>
            {eyebrow && <p className="flex items-center gap-3 font-mono text-xs text-background/70"><span aria-hidden="true" className="h-px w-8 bg-background/50" />{eyebrow}</p>}
            <h2 className={cn('font-display text-[clamp(2.1rem,4.8vw,4.25rem)] leading-[1.04] tracking-[-0.025em]', eyebrow && 'mt-5')}>{title}</h2>
            {description && <p className="mt-6 max-w-md text-base leading-relaxed text-background/80 md:text-lg">{description}</p>}
            <FactRowInvert facts={facts} className="mt-12" />
          </Rv>
          <Rv on={reveal} delay={0.08} className={cn('md:col-span-7', flip && 'md:order-1')}>
            <div className="rounded-2xl bg-background p-6 text-foreground md:p-10">{children}</div>
          </Rv>
        </div>
      </div>
    </div>
  )
}

// The contact facts as a row of cards above a wide form.
export function ContactStacked({ eyebrow, title, description, facts = [], children, tone, reveal }: ContactProps) {
  const spans = fitSpans(facts.length)
  return (
    <Shell tone={tone}>
      <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="max-w-3xl" />
      {facts.length > 0 && (
        <dl className="mt-12 grid gap-4 md:mt-16 md:grid-cols-6">
          {facts.map((f, k) => (
            <div key={k} className={cn('rounded-2xl border border-border bg-card p-6', spans[k])}>
              <dt className="font-mono text-xs text-muted-foreground">{f.label}</dt>
              <dd className="mt-3 break-words font-display text-xl leading-snug text-foreground">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <Rv on={reveal} delay={0.08} className="mt-4">
        <div className="rounded-3xl border border-foreground bg-background p-6 md:p-12">{children}</div>
      </Rv>
    </Shell>
  )
}

/* ---------------------------------- footers ---------------------------------- */

// A solid footer: the brand and its line on the left, the link columns on the right, the small print under a rule.
export function FooterColumns({ brand, description, columns = [], note }: FooterProps) {
  return (
    <footer className="bg-foreground text-background">
      <div className={cn(WRAP, 'py-16 md:py-24')}>
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-display text-3xl tracking-[-0.02em] md:text-4xl">{brand}</p>
            {description && <p className="mt-5 max-w-sm text-base leading-relaxed text-background/75">{description}</p>}
          </div>
          <div className="grid gap-10 sm:grid-cols-2 md:col-span-6 md:col-start-7">
            {columns.map(col => (
              <div key={col.title}>
                <p className="font-mono text-xs text-background/60">{col.title}</p>
                <ul className="mt-5 flex flex-col gap-3">
                  {col.links.map(l => <li key={l.href + l.label}><a href={l.href} className={cn('text-base text-background transition-colors hover:text-background/70', FOCUS)}>{l.label}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        {note && <p className="mt-14 border-t border-background/25 pt-6 text-sm text-background/70">{note}</p>}
      </div>
    </footer>
  )
}

// Everything centred: the brand, one row of links, the small print.
export function FooterCentered({ brand, description, columns = [], note }: FooterProps) {
  const links = columns.flatMap(c => c.links)
  return (
    <footer className="border-t border-border bg-background">
      <div className={cn(WRAP, 'py-16 text-center md:py-24')}>
        <p className="font-display text-[clamp(2rem,4vw,3.4rem)] tracking-[-0.025em] text-foreground">{brand}</p>
        {description && <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p>}
        <ul className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3">
          {links.map(l => <li key={l.href + l.label}><a href={l.href} className={cn('text-base text-foreground transition-colors hover:text-primary', FOCUS)}>{l.label}</a></li>)}
        </ul>
        {note && <p className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">{note}</p>}
      </div>
    </footer>
  )
}
`
