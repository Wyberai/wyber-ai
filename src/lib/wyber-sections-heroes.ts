// WYBER SECTIONS, part 2: more headers and heroes (25 Nov 2026). Appended to the same generated file as wyber-sections.ts, so it shares its
// primitives (Rv, Shell, Head, Frame, Actions, FactRow, useHeader, headerBase, headerSkin ...). Same rules: String.raw, so NO backticks and
// NO dollar-brace sequences; tokens only; honest content only (every string on screen comes from a prop); reduced-motion safe; the page
// is complete without any scroll-driven or View Transition feature. Patterns only, nothing copied from any third-party section or library.

export const WYBER_HEROES_NAMES = [
  'HeaderStack', 'HeaderIsland', 'HeaderDetails', 'HeaderUtility',
  'HeroSplitScreen', 'HeroTabbed', 'HeroIndex', 'HeroTriptych', 'HeroSheet', 'HeroOverlap', 'HeroLedger',
] as const

export const WYBER_HEROES_SOURCE = String.raw`
/* ------------------------------- more headers ------------------------------- */

type HeaderProps = { brand: string; links?: SectionLink[]; cta?: React.ReactNode; over?: boolean; notes?: string[] }

// A two-tier masthead: the brand alone on the first row, the links on a ruled second row. Once the page scrolls the first row closes up.
export function HeaderStack({ brand, links = [], cta, over }: HeaderProps) {
  const { scrolled, open, setOpen } = useHeader()
  return (
    <header className={cn(headerBase, headerSkin(over, scrolled, open), scrolled || open ? 'border-b border-border' : 'border-b border-transparent')}>
      <div className={cn(WRAP, 'flex h-[68px] items-center justify-between gap-6 md:h-auto md:flex-col md:items-stretch md:gap-0')}>
        <a href="#main" className={cn('font-display text-foreground md:text-center', scrolled ? 'text-xl md:py-2' : 'text-2xl md:py-5 md:text-4xl', FOCUS)}>{brand}</a>
        <nav aria-label={brand} className="hidden items-center justify-between gap-6 border-t border-border py-3 md:flex">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            {links.map(l => <a key={l.href} href={l.href} className={cn('text-sm text-muted-foreground transition-colors hover:text-foreground', FOCUS)}>{l.label}</a>)}
          </div>
          <div>{cta}</div>
        </nav>
        <MenuButton open={open} setOpen={setOpen} />
      </div>
      <MobileMenu open={open} setOpen={setOpen} links={links} cta={cta} />
    </header>
  )
}

// A bordered bar floating inside the page margins. It stays solid, so it reads over a photograph too.
export function HeaderIsland({ brand, links = [], cta }: HeaderProps) {
  const { open, setOpen } = useHeader()
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 pt-3">
      <div className={WRAP}>
        <div className="pointer-events-auto rounded-2xl border border-border bg-background">
          <nav className="flex h-14 items-center justify-between gap-6 px-4 md:px-6">
            <a href="#main" className={cn('font-display text-lg text-foreground', FOCUS)}>{brand}</a>
            <div className="hidden items-center gap-7 md:flex">
              {links.map(l => <a key={l.href} href={l.href} className={cn('text-sm text-muted-foreground transition-colors hover:text-foreground', FOCUS)}>{l.label}</a>)}
            </div>
            <div className="flex items-center gap-3"><div className="hidden md:block">{cta}</div><MenuButton open={open} setOpen={setOpen} /></div>
          </nav>
          {open && (
            <div className="flex flex-col border-t border-border px-4 pb-5 md:hidden">
              {links.map((l, i) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className={cn('flex items-baseline gap-4 border-b border-border py-4 font-display text-2xl text-foreground', FOCUS)}>
                  <span className="font-mono text-xs text-muted-foreground">{pad(i + 1)}</span>{l.label}
                </a>
              ))}
              {cta && <div className="mt-5">{cta}</div>}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// One native disclosure on every screen size: the brand, and a menu that opens a large numbered index. The browser does the opening, so it works before any script runs.
export function HeaderDetails({ brand, links = [], cta }: HeaderProps) {
  const ref = useRef<HTMLDetailsElement>(null)
  const close = () => { if (ref.current) ref.current.open = false }
  return (
    <header className={cn(headerBase, 'border-b border-border bg-background')}>
      <details ref={ref} className="group">
        <summary className={cn(WRAP, 'flex h-[72px] cursor-pointer list-none items-center justify-between gap-6 [&::-webkit-details-marker]:hidden', FOCUS)}>
          <span className="font-display text-xl text-foreground">{brand}</span>
          <span aria-label="Menu" className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-foreground">
            <Menu className="h-5 w-5 group-open:hidden" aria-hidden="true" />
            <X className="hidden h-5 w-5 group-open:block" aria-hidden="true" />
          </span>
        </summary>
        <nav aria-label={brand} className="max-h-[calc(100svh-72px)] overflow-y-auto border-t border-border bg-background">
          <div className={cn(WRAP, 'grid gap-10 py-10 md:grid-cols-12 md:py-14')}>
            <ol className="md:col-span-8">
              {links.map((l, i) => (
                <li key={l.href}>
                  <a href={l.href} onClick={close} className={cn('flex items-baseline gap-5 border-b border-border py-4 font-display text-[clamp(1.8rem,4vw,3.4rem)] leading-[1.1] tracking-[-0.02em] text-foreground transition-colors hover:text-primary', FOCUS)}>
                    <span className="font-mono text-xs text-muted-foreground">{pad(i + 1)}</span>{l.label}
                  </a>
                </li>
              ))}
            </ol>
            {cta && <div className="md:col-span-4 md:self-end">{cta}</div>}
          </div>
        </nav>
      </details>
    </header>
  )
}

// A narrow strip above the bar carries the facts the owner gave (hours, phone, place). With no facts it is only the bar.
export function HeaderUtility({ brand, links = [], cta, over, notes = [] }: HeaderProps) {
  const { scrolled, open, setOpen } = useHeader()
  const clean = notes.map(x => (x || '').trim()).filter(Boolean)
  return (
    <header className={cn(headerBase, headerSkin(over, scrolled, open), scrolled || open ? 'border-b border-border' : 'border-b border-transparent')}>
      {clean.length > 0 && !scrolled && !open && (
        <div className="hidden border-b border-border bg-background md:block">
          <ul className={cn(WRAP, 'flex h-9 items-center justify-between gap-6 text-xs text-muted-foreground')}>
            {clean.slice(0, 3).map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}
      <nav className={cn(WRAP, 'flex h-[68px] items-center justify-between gap-6')}>
        <a href="#main" className={cn('font-display text-xl text-foreground', FOCUS)}>{brand}</a>
        <div className="hidden items-center gap-8 md:flex">
          {links.map(l => <a key={l.href} href={l.href} className={cn('text-sm text-muted-foreground transition-colors hover:text-foreground', FOCUS)}>{l.label}</a>)}
        </div>
        <div className="flex items-center gap-3"><div className="hidden md:block">{cta}</div><MenuButton open={open} setOpen={setOpen} /></div>
      </nav>
      <MobileMenu open={open} setOpen={setOpen} links={links} cta={cta} />
    </header>
  )
}

/* -------------------------------- more heroes -------------------------------- */

type HeroMoreProps = HeroProps & { items?: SectionItem[]; itemsHref?: string }

function FactRowInvert({ facts, className }: { facts?: SectionFact[]; className?: string }) {
  if (!facts || facts.length === 0) return null
  return (
    <dl className={cn('grid gap-x-8 gap-y-5 border-t border-background/30 pt-6', className)} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))' }}>
      {facts.map((f, i) => (
        <div key={i}>
          <dt className="font-mono text-xs text-background/70">{f.label}</dt>
          <dd className="mt-1.5 text-base text-background [&_a]:underline">{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function tabKeys(e: React.KeyboardEvent, n: number, i: number, set: (v: number) => void, vertical?: boolean) {
  const next = vertical ? 'ArrowDown' : 'ArrowRight', prev = vertical ? 'ArrowUp' : 'ArrowLeft'
  if (e.key !== next && e.key !== prev && e.key !== 'Home' && e.key !== 'End') return
  e.preventDefault()
  const to = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : e.key === next ? (i + 1) % n : (i - 1 + n) % n
  set(to)
  const root = e.currentTarget.parentElement
  const btn = root?.querySelectorAll('[role="tab"]')[to] as HTMLElement | undefined
  btn?.focus()
}

// Two even halves. The left is a solid panel with the words, the right is the photograph edge to edge. Without a photo the right half carries the facts.
export function HeroSplitScreen(p: HeroMoreProps) {
  const photo = Boolean(p.media)
  return (
    <div className="grid min-h-[100svh] lg:grid-cols-2">
      <div className={cn('flex flex-col justify-end bg-foreground px-5 pb-12 pt-32 text-background sm:px-8 lg:px-14 lg:pb-20 lg:pt-40', p.flip && 'lg:order-2')}>
        <Rv load on={p.reveal}>
          {p.eyebrow && <p className="flex items-center gap-3 font-mono text-xs text-background/70"><span aria-hidden="true" className="h-px w-8 bg-background/50" />{p.eyebrow}</p>}
          <h1 className="mt-6 font-display text-[clamp(2.6rem,5.2vw,5.5rem)] leading-[0.98] tracking-[-0.03em]"><Accented text={p.headline} accent={p.accent} /></h1>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-background/80">{p.sub}</p>
          <Actions {...p} invert className="mt-10" />
          {!photo && <FactRowInvert facts={p.facts} className="mt-12" />}
        </Rv>
      </div>
      <div className={cn('relative min-h-[46svh] bg-muted lg:min-h-0', p.flip && 'lg:order-1')}>
        {photo
          ? <div className="absolute inset-0 [&_img]:h-full [&_img]:w-full [&_img]:object-cover">{p.media}</div>
          : <div className="flex h-full flex-col justify-end p-8 lg:p-14"><FactRow facts={p.facts} className="border-foreground" /></div>}
      </div>
    </div>
  )
}

// The headline on the left, and on the right a tabbed panel that shows what is on offer, one item at a time (the owner's own list, nothing invented).
export function HeroTabbed(p: HeroMoreProps) {
  const tabs = (p.items ?? []).slice(0, 4)
  const [i, setI] = useState(0)
  const calm = useReducedMotion()
  const uid = useId()
  const cur = tabs[Math.min(i, Math.max(0, tabs.length - 1))]
  return (
    <div className={cn(WRAP, 'pb-16 pt-32 md:pb-28 md:pt-44')}>
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <Rv load on={p.reveal} className={cn(cur ? 'lg:col-span-6' : 'lg:col-span-10', p.flip && cur && 'lg:order-2')}>
          <Eyebrow>{p.eyebrow}</Eyebrow>
          <h1 className="mt-6 font-display text-[clamp(2.6rem,5.6vw,5.5rem)] leading-[0.99] tracking-[-0.03em] text-foreground"><Accented text={p.headline} accent={p.accent} /></h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">{p.sub}</p>
          <Actions {...p} className="mt-10" />
        </Rv>
        {cur && tabs.length >= 2 && (
          <Rv load on={p.reveal} delay={0.12} className={cn('lg:col-span-6', p.flip && 'lg:order-1')}>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div role="tablist" aria-label={p.eyebrow || p.headline} className="flex overflow-x-auto border-b border-border">
                {tabs.map((t, k) => (
                  <button key={k} type="button" role="tab" id={uid + '-t' + k} aria-selected={k === i} aria-controls={uid + '-p'} tabIndex={k === i ? 0 : -1}
                    onClick={() => setI(k)} onKeyDown={e => tabKeys(e, tabs.length, i, setI)}
                    className={cn('shrink-0 border-b-2 px-5 py-4 text-sm font-medium transition-colors', k === i ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground', FOCUS)}>
                    {t.title}
                  </button>
                ))}
              </div>
              <div role="tabpanel" id={uid + '-p'} aria-labelledby={uid + '-t' + i} className="min-h-[18rem] p-7 md:p-10">
                <motion.div key={i} initial={calm ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                  <span className="font-display text-5xl leading-none text-primary">{pad(i + 1)}</span>
                  <h2 className="mt-8 font-display text-[clamp(1.6rem,2.6vw,2.4rem)] leading-[1.1] tracking-[-0.02em] text-foreground">{cur.title}</h2>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">{cur.text}</p>
                  {cur.meta && <p className="mt-6 border-t border-border pt-4 font-mono text-sm text-foreground">{cur.meta}</p>}
                </motion.div>
              </div>
            </div>
          </Rv>
        )}
      </div>
      <FactRow facts={p.facts} className="mt-16 md:mt-24" />
    </div>
  )
}

// Display type across the full width, and under it a numbered index of what the site covers, each line a link to its section.
export function HeroIndex(p: HeroMoreProps) {
  const rows = (p.items ?? []).slice(0, 6)
  return (
    <div className={cn(WRAP, 'pb-16 pt-32 md:pb-28 md:pt-44')}>
      <Rv load on={p.reveal}>
        <Eyebrow>{p.eyebrow}</Eyebrow>
        <h1 className="mt-8 max-w-6xl font-display text-[clamp(2.9rem,8.4vw,8.4rem)] leading-[0.93] tracking-[-0.04em] text-foreground"><Accented text={p.headline} accent={p.accent} /></h1>
      </Rv>
      <div className="mt-14 grid gap-12 border-t border-foreground pt-8 md:grid-cols-12 md:gap-16">
        <Rv load on={p.reveal} delay={0.1} className="md:col-span-5">
          <p className="max-w-md text-lg leading-relaxed text-muted-foreground md:text-xl">{p.sub}</p>
          <Actions {...p} className="mt-10" />
        </Rv>
        <Rv load on={p.reveal} delay={0.16} className="md:col-span-7">
          {rows.length >= 2
            ? (
              <ol>
                {rows.map((r, k) => (
                  <li key={k}>
                    <a href={p.itemsHref || '#main'} className={cn('group flex items-baseline gap-5 border-b border-border py-4 transition-colors hover:bg-accent/40', FOCUS)}>
                      <span className="font-mono text-xs text-muted-foreground">{pad(k + 1)}</span>
                      <span className="flex-1 font-display text-xl leading-snug text-foreground md:text-2xl">{r.title}</span>
                      <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ol>
            )
            : <FactRow facts={p.facts} className="border-t-0 pt-0" />}
        </Rv>
      </div>
    </div>
  )
}

// One photograph shown as three tall panels, each a different crop of it, set at different heights.
export function HeroTriptych(p: HeroMoreProps) {
  const crops = ['[&_img]:origin-left', '[&_img]:origin-center', '[&_img]:origin-right']
  return (
    <div className={cn(WRAP, 'pb-16 pt-32 md:pb-28 md:pt-40')}>
      <Rv load on={p.reveal} className="grid items-end gap-8 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-8">
          <Eyebrow>{p.eyebrow}</Eyebrow>
          <h1 className="mt-6 font-display text-[clamp(2.7rem,6.6vw,6.6rem)] leading-[0.96] tracking-[-0.035em] text-foreground"><Accented text={p.headline} accent={p.accent} /></h1>
        </div>
        <div className="md:col-span-4">
          <p className="text-lg leading-relaxed text-muted-foreground">{p.sub}</p>
          <Actions {...p} className="mt-8" />
        </div>
      </Rv>
      {p.media && (
        <Rv load on={p.reveal} delay={0.14} className="mt-14 grid grid-cols-3 items-end gap-3 md:mt-20 md:gap-5">
          {crops.map((c, k) => (
            <Frame key={k} media={p.media} ratio={k === 1 ? '3/4' : '4/5'} className={cn('[&_img]:scale-[1.9]', c, k === 1 ? 'md:-translate-y-8' : 'md:translate-y-4')} />
          ))}
        </Rv>
      )}
      <FactRow facts={p.facts} className="mt-16 md:mt-24" />
    </div>
  )
}

// Everything inside one bordered sheet: a meta row, the headline, then the sub line and actions, with a wide photograph closing the sheet.
export function HeroSheet(p: HeroMoreProps) {
  const [first, ...rest] = p.facts ?? []
  return (
    <div className={cn(WRAP, 'pb-16 pt-28 md:pb-24 md:pt-36')}>
      <Rv load on={p.reveal}>
        <div className="overflow-hidden rounded-3xl border border-foreground bg-card">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-b border-border px-6 py-4 font-mono text-xs text-muted-foreground md:px-10">
            <span>{p.eyebrow}</span>
            {first && <span>{first.label}: <span className="text-foreground">{first.value}</span></span>}
          </div>
          <div className="px-6 py-12 md:px-10 md:py-20">
            <h1 className="max-w-5xl font-display text-[clamp(2.6rem,6.4vw,6.4rem)] leading-[0.97] tracking-[-0.035em] text-foreground"><Accented text={p.headline} accent={p.accent} /></h1>
          </div>
          <div className="grid gap-8 border-t border-border px-6 py-8 md:grid-cols-12 md:items-end md:px-10">
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground md:col-span-7">{p.sub}</p>
            <Actions {...p} className="md:col-span-5 md:justify-end" />
          </div>
          {p.media && <div className="relative aspect-[16/9] border-t border-border md:aspect-[21/8]"><div className="absolute inset-0 [&_img]:h-full [&_img]:w-full [&_img]:object-cover">{p.media}</div></div>}
        </div>
        <FactRow facts={rest} className="mt-10" />
      </Rv>
    </div>
  )
}

// The photograph sits to one side and the words sit on a solid card that overlaps its edge.
export function HeroOverlap(p: HeroMoreProps) {
  const photo = Boolean(p.media)
  return (
    <div className={cn(WRAP, 'pb-16 pt-28 md:pb-28 md:pt-40')}>
      <div className="grid gap-0 lg:grid-cols-12">
        {photo && (
          <Rv load on={p.reveal} className={cn('lg:row-start-1 lg:col-span-8', p.flip ? 'lg:col-start-1' : 'lg:col-start-5')}>
            <Frame media={p.media} ratio="5/6" className="lg:aspect-[4/5]" />
          </Rv>
        )}
        <Rv load on={p.reveal} delay={0.12} className={cn('relative z-10 mx-4 -mt-16 lg:row-start-1 lg:mx-0 lg:mt-24', photo ? 'lg:col-span-7' : 'lg:col-span-10', photo && (p.flip ? 'lg:col-start-6' : 'lg:col-start-1'))}>
          <div className="rounded-2xl border border-foreground bg-background p-7 md:p-12">
            <Eyebrow>{p.eyebrow}</Eyebrow>
            <h1 className="mt-5 font-display text-[clamp(2.4rem,4.6vw,4.6rem)] leading-[1] tracking-[-0.03em] text-foreground"><Accented text={p.headline} accent={p.accent} /></h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">{p.sub}</p>
            <Actions {...p} className="mt-8" />
          </div>
        </Rv>
      </div>
      <FactRow facts={p.facts} className="mt-16 md:mt-24" />
    </div>
  )
}

// A ledger: the headline on the left and, on the right, the facts the owner gave listed with dotted leaders, like a printed price list.
export function HeroLedger(p: HeroMoreProps) {
  const facts = p.facts ?? []
  return (
    <div className={cn(WRAP, 'pb-16 pt-32 md:pb-28 md:pt-44')}>
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <Rv load on={p.reveal} className={cn('lg:col-span-7', p.flip && 'lg:order-2')}>
          <Eyebrow>{p.eyebrow}</Eyebrow>
          <h1 className="mt-6 font-display text-[clamp(2.7rem,6vw,6rem)] leading-[0.98] tracking-[-0.03em] text-foreground"><Accented text={p.headline} accent={p.accent} /></h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">{p.sub}</p>
          <Actions {...p} className="mt-10" />
        </Rv>
        <Rv load on={p.reveal} delay={0.12} className={cn('lg:col-span-5 lg:self-end', p.flip && 'lg:order-1')}>
          {facts.length > 0 && (
            <dl className="border-t border-foreground">
              {facts.map((f, k) => (
                <div key={k} className="flex items-baseline gap-3 border-b border-border py-5">
                  <dt className="font-mono text-xs text-muted-foreground">{f.label}</dt>
                  <span aria-hidden="true" className="flex-1 border-b border-dotted border-foreground/40" />
                  <dd className="text-right font-display text-lg text-foreground md:text-xl">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {p.media && <Frame media={p.media} ratio="16/10" className="mt-8" />}
        </Rv>
      </div>
    </div>
  )
}
`
