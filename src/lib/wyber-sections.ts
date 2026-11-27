// WYBER SECTIONS — original page sections for generated websites (19 Nov 2026).
//
// Injected as `src/wyber-sections.tsx` next to the UI kit (same rules: transient, user files win, tree-shaken when unused).
// Every composition here is our own. The proportions follow general principles of premium pages (oversized display type against
// small body text, hairline rules, a wide container with generous gutters, one image doing the selling, restraint with colour);
// nothing is copied from any third-party section, template or library. See docs/design-reference/jiro-sections-used.md.
//
// RULES (same as wyber-ui-kit.ts): the source lives in a String.raw template, so NO backticks and NO dollar-brace sequences inside it.
// Colours come only from the semantic tokens, so each site's design direction re-colours every section. The one exception is the
// white/black text and scrim over a photograph (HeroFullBleed, CtaPhoto, and the header while it sits transparent over a photo hero), which has to stay readable on any image.
//
// The file is NOT excluded from the anti-slop scanner (src/lib/unslop.ts skips only wyber-ui and wyber-grow), so it is written to pass it:
// no uppercase tracked labels, no hue gradients, no glow, no backdrop blur, no transition-all, no hover scale, no more than a handful of
// rounded-full. The only gradient is a black photo scrim.

export const WYBER_SECTIONS_PATH = 'src/wyber-sections.tsx'

export const WYBER_SECTIONS_SOURCE = String.raw`// Wyber Sections — page sections provided by the platform. Auto-injected; edits here are overwritten on every build.
import React, { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowUpRight, Plus, Minus, Menu, X } from 'lucide-react'
import { cn } from './wyber-ui'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const WRAP = 'mx-auto w-full max-w-[1320px] px-5 sm:px-8 lg:px-12'
const DISPLAY = 'font-display text-[clamp(2.1rem,4.8vw,4.25rem)] leading-[1.04] tracking-[-0.025em] text-foreground'
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring'

export type SectionItem = { title: string; text: string; meta?: string }
export type SectionFaq = { question: string; answer: string }
export type SectionFact = { label: string; value: React.ReactNode }
export type SectionLink = { label: string; href: string }
type Tone = 'plain' | 'card' | 'rule'

/* ------------------------------- primitives ------------------------------- */

// A very wide display face and one long word can be wider than a phone. The heading then steps down in size until its longest
// word fits: words are never split, and headings that already fit are left exactly as designed.
function useFitWords<T extends HTMLElement>(min = 24) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      el.style.fontSize = ''
      // size containment stops the long word from stretching the column, so the overflow can be measured
      el.style.contain = 'inline-size'
      if (el.clientWidth >= 80) {
        let size = parseFloat(getComputedStyle(el).fontSize)
        for (let i = 0; i < 40 && size > min && el.scrollWidth > el.clientWidth + 1; i++) {
          size = Math.max(min, size * 0.95)
          el.style.fontSize = size + 'px'
        }
      }
      el.style.contain = ''
    }
    fit()
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    fonts?.ready.then(fit)
    fonts?.addEventListener?.('loadingdone', fit)
    window.addEventListener('resize', fit)
    return () => { fonts?.removeEventListener?.('loadingdone', fit); window.removeEventListener('resize', fit) }
  })
  return ref
}

const CALM_QUERY = '(prefers-reduced-motion: reduce)'
// Scroll-driven reveals run on the compositor with no JavaScript; the CSS for them lives in index.css (data-sv). Browsers without them keep the framer-motion reveal.
const SCROLL_REVEAL = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('animation-timeline: view()')

// load: the block is on the first screen, so it eases in once on load instead of waiting for a scroll position.
function Rv({ on, delay = 0, y = 16, className, children, load }: { on?: boolean; delay?: number; y?: number; className?: string; children?: React.ReactNode; load?: boolean }) {
  const calm = useReducedMotion()
  if (!on || calm) return <div className={className}>{children}</div>
  if (SCROLL_REVEAL && !load) return <div data-sv="" className={className} style={delay ? ({ '--sv-d': Math.min(30, Math.round(delay * 100)) } as React.CSSProperties) : undefined}>{children}</div>
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.7, delay, ease: EASE }}>
      {children}
    </motion.div>
  )
}

type VTDoc = Document & { startViewTransition?: (update: () => void) => { finished: Promise<unknown> } }

/** Runs a state update inside a native View Transition when the browser has one (and motion is allowed); otherwise just runs it. */
export function withViewTransition(update: () => void): void {
  const doc = document as VTDoc
  const calm = typeof matchMedia === 'function' && matchMedia(CALM_QUERY).matches
  if (typeof doc.startViewTransition !== 'function' || calm) { update(); return }
  try { doc.startViewTransition(() => { flushSync(update) }) } catch { update() }
}

/** Clicking an in-page link morphs the link into the heading of the section it points to (shared element). No support, or reduced motion: the link works as a plain anchor. */
export function AnchorMorph() {
  useEffect(() => {
    const doc = document as VTDoc
    if (typeof doc.startViewTransition !== 'function' || typeof matchMedia !== 'function') return
    const calm = matchMedia(CALM_QUERY)
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || calm.matches) return
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLElement | null
      const href = link?.getAttribute('href') ?? ''
      if (!link || href.length < 2 || href === '#main' || href.startsWith('#/')) return
      let id = href.slice(1)
      try { id = decodeURIComponent(id) } catch { /* keep the raw id */ }
      const target = document.getElementById(id)
      const heading = target?.querySelector('h1, h2') as HTMLElement | null
      if (!target || !heading || !doc.startViewTransition) return
      e.preventDefault()
      link.style.setProperty('view-transition-name', 'wyber-morph')
      const done = () => heading.style.removeProperty('view-transition-name')
      const t = doc.startViewTransition(() => {
        link.style.removeProperty('view-transition-name')
        heading.style.setProperty('view-transition-name', 'wyber-morph')
        target.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' })
        try { history.pushState(null, '', href) } catch { /* sandboxed frame */ }
        heading.tabIndex = -1
        heading.focus({ preventScroll: true })
      })
      t.finished.then(done, done)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
  return null
}

/** A photograph that leans toward the pointer on a spring. Fine pointers only; static on touch and under reduced motion. */
function Lean({ children, className, reach = 14, zoom = 1.05 }: { children?: React.ReactNode; className?: string; reach?: number; zoom?: number }) {
  const calm = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const z = useSpring(1, { stiffness: 90, damping: 20 })
  const sx = useSpring(mx, { stiffness: 110, damping: 16, mass: 0.7 })
  const sy = useSpring(my, { stiffness: 110, damping: 16, mass: 0.7 })
  const x = useTransform(sx, v => v * reach)
  const y = useTransform(sy, v => v * reach)
  useEffect(() => {
    const el = ref.current
    if (calm || !el || typeof matchMedia !== 'function' || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const root = (el.closest('[data-lean-root]') as HTMLElement | null) ?? el.parentElement
    if (!root) return
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const r = root.getBoundingClientRect()
      if (!r.width || !r.height) return
      mx.set(((e.clientX - r.left) / r.width - 0.5) * 2)
      my.set(((e.clientY - r.top) / r.height - 0.5) * 2)
    }
    const leave = () => { mx.set(0); my.set(0) }
    z.set(zoom)
    root.addEventListener('pointermove', move)
    root.addEventListener('pointerleave', leave)
    return () => { root.removeEventListener('pointermove', move); root.removeEventListener('pointerleave', leave); z.set(1) }
  }, [calm, mx, my, z, zoom])
  return (
    <div ref={ref} className={className}>
      <motion.div className="h-full w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover" style={{ x, y, scale: z }}>{children}</motion.div>
    </div>
  )
}

function Eyebrow({ children, className }: { children?: React.ReactNode; className?: string }) {
  if (!children) return null
  return (
    <p className={cn('flex items-center gap-3 font-mono text-xs text-muted-foreground', className)}>
      <span aria-hidden="true" className="h-px w-8 bg-foreground/40" />
      {children}
    </p>
  )
}

function Accented({ text, accent, onDark }: { text: string; accent?: string; onDark?: boolean }) {
  const i = accent ? text.indexOf(accent) : -1
  if (!accent || i < 0) return <>{text}</>
  const mark = onDark
    ? <em className="not-italic underline decoration-primary decoration-[0.08em] underline-offset-[0.14em]">{accent}</em>
    : <em className="not-italic text-primary">{accent}</em>
  return <>{text.slice(0, i)}{mark}{text.slice(i + accent.length)}</>
}

function Shell({ tone = 'plain', className, children }: { tone?: Tone; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn(tone === 'card' && 'bg-card', tone === 'rule' && 'border-t border-border')}>
      <div className={cn(WRAP, 'py-20 md:py-32', className)}>{children}</div>
    </div>
  )
}

function Head({ eyebrow, title, description, reveal, className, center }: { eyebrow?: string; title: string; description?: string; reveal?: boolean; className?: string; center?: boolean }) {
  const fitRef = useFitWords<HTMLHeadingElement>()
  return (
    <Rv on={reveal} className={cn(center && 'mx-auto text-center', className)}>
      <Eyebrow className={cn(center && 'justify-center')}>{eyebrow}</Eyebrow>
      <h2 ref={fitRef} className={cn(DISPLAY, eyebrow && 'mt-5')}>{title}</h2>
      {description && <p className={cn('mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg', center && 'mx-auto')}>{description}</p>}
    </Rv>
  )
}

type ActionProps = { cta?: string; onCta?: () => void; secondaryLabel?: string; secondaryHref?: string; dark?: boolean; invert?: boolean; className?: string }

function Cta({ label, onClick, mode = 'solid' }: { label: string; onClick?: () => void; mode?: 'solid' | 'light' | 'invert' }) {
  const body = mode === 'solid' ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90' : mode === 'light' ? 'border-white bg-white text-black hover:bg-white/90' : 'border-background bg-background text-foreground hover:bg-background/90'
  const chip = mode === 'solid' ? 'bg-primary-foreground/15' : 'bg-foreground/10'
  return (
    <button type="button" onClick={onClick} className={cn('inline-flex min-h-14 items-center gap-5 rounded-xl border py-2 pl-6 pr-2 text-left text-base font-medium transition-colors', FOCUS, body)}>
      {label}
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', chip)}><ArrowUpRight className="h-5 w-5" aria-hidden="true" /></span>
    </button>
  )
}

function Actions({ cta, onCta, secondaryLabel, secondaryHref, dark, invert, className }: ActionProps) {
  const mode = dark ? 'light' : invert ? 'invert' : 'solid'
  return (
    <div className={cn('flex flex-wrap content-end items-center gap-x-6 gap-y-4', className)}>
      {cta && onCta && <Cta label={cta} onClick={onCta} mode={mode} />}
      {secondaryLabel && secondaryHref && (
        cta && onCta
          ? <a href={secondaryHref} className={cn('py-2 text-base font-medium underline underline-offset-[6px] transition-colors', FOCUS, dark ? 'text-white hover:text-white/80' : invert ? 'text-background hover:text-background/80' : 'text-foreground hover:text-primary')}>{secondaryLabel}</a>
          : <a href={secondaryHref} className={cn('inline-flex h-14 items-center rounded-xl border px-6 text-base font-medium transition-colors', FOCUS, dark ? 'border-white/50 text-white hover:bg-white/10' : invert ? 'border-background/50 text-background hover:bg-background/10' : 'border-border text-foreground hover:bg-accent')}>{secondaryLabel}</a>
      )}
    </div>
  )
}

function Frame({ media, ratio, className, style, lean }: { media?: React.ReactNode; ratio?: string; className?: string; style?: React.CSSProperties; lean?: boolean }) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-border bg-muted', className)} style={ratio ? { aspectRatio: ratio, ...style } : style}>
      <div className="absolute inset-0 [&_img]:h-full [&_img]:w-full [&_img]:object-cover">{lean && media ? <Lean className="h-full w-full">{media}</Lean> : media}</div>
    </div>
  )
}

function FactRow({ facts, className, dark, invert }: { facts?: SectionFact[]; className?: string; dark?: boolean; invert?: boolean }) {
  if (!facts || facts.length === 0) return null
  return (
    // wrapping flex, not an auto-fit grid: a last fact on its own line fills it instead of leaving a hole (2 + 1)
    <dl className={cn('flex flex-wrap gap-x-8 gap-y-5 border-t pt-6', dark ? 'border-white/30' : invert ? 'border-background/30' : 'border-border', className)}>
      {facts.map((f, i) => (
        <div key={i} className="min-w-0 flex-[1_1_10rem] [overflow-wrap:anywhere]">
          <dt className={cn('font-mono text-xs', dark ? 'text-white/70' : invert ? 'text-background/90' : 'text-muted-foreground')}>{f.label}</dt>
          <dd className={cn('mt-1.5 text-base', TAP_LINK, dark ? 'text-white' : invert ? 'text-background' : 'text-foreground')}>{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}

const TAP_LINK = '[&_a]:-my-3 [&_a]:inline-block [&_a]:py-3'

const pad = (n: number) => (n < 10 ? '0' : '') + n

/* --------------------------------- headers --------------------------------- */

function useHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return { scrolled, open, setOpen }
}

function MenuButton({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  return (
    <button type="button" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)} className={cn('flex h-11 w-11 items-center justify-center rounded-lg border border-border text-foreground lg:hidden', FOCUS)}>
      {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
    </button>
  )
}

function MobileMenu({ open, setOpen, links, cta }: { open: boolean; setOpen: (v: boolean) => void; links: SectionLink[]; cta?: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2, ease: EASE }} className="border-b border-border bg-background lg:hidden">
          <div className={cn(WRAP, 'flex flex-col pb-6 pt-2')}>
            {links.map((l, i) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className={cn('flex items-baseline gap-4 border-b border-border py-4 font-display text-2xl text-foreground', FOCUS)}>
                <span className="font-mono text-xs text-muted-foreground">{pad(i + 1)}</span>{l.label}
              </a>
            ))}
            {cta && <div className="mt-5">{cta}</div>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const headerBase = 'fixed inset-x-0 top-0 z-40 transition-colors'
// a long business name steps down in size below laptop width so it stays within two lines
const longBrand = (brand: string) => (brand.length > 28 ? 'text-sm leading-snug sm:text-base lg:text-lg' : undefined)
// Over a photograph hero the bar starts transparent with white type, and turns solid once the page scrolls or the menu opens.
function headerSkin(over: boolean | undefined, scrolled: boolean, open: boolean): string {
  if (!over || scrolled || open) return 'bg-background'
  return 'bg-transparent [&_a]:!text-white [&_button[aria-label=Menu]]:!border-white/60 [&_button[aria-label=Menu]]:!text-white'
}

export function HeaderBar({ brand, links = [], cta, over }: { brand: string; links?: SectionLink[]; cta?: React.ReactNode; over?: boolean }) {
  const { scrolled, open, setOpen } = useHeader()
  return (
    <header className={cn(headerBase, headerSkin(over, scrolled, open), scrolled || open ? 'border-b border-border' : 'border-b border-transparent')}>
      <nav className={cn(WRAP, 'flex min-h-[72px] items-center justify-between gap-4 py-2 lg:gap-6')}>
        <a href="#main" className={cn('inline-flex min-h-10 min-w-0 items-center font-display text-xl text-foreground', longBrand(brand), FOCUS)}>{brand}</a>
        <div className="hidden items-center gap-5 lg:flex xl:gap-8">
          {links.map(l => <a key={l.href} href={l.href} className={cn('whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground', FOCUS)}>{l.label}</a>)}
        </div>
        <div className="flex items-center gap-3"><div className="hidden whitespace-nowrap lg:block">{cta}</div><MenuButton open={open} setOpen={setOpen} /></div>
      </nav>
      <MobileMenu open={open} setOpen={setOpen} links={links} cta={cta} />
    </header>
  )
}

export function HeaderCentered({ brand, links = [], cta, over }: { brand: string; links?: SectionLink[]; cta?: React.ReactNode; over?: boolean }) {
  const { scrolled, open, setOpen } = useHeader()
  const half = Math.ceil(links.length / 2)
  const left = links.slice(0, half), right = links.slice(half)
  const item = (l: SectionLink) => <a key={l.href} href={l.href} className={cn('whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground', FOCUS)}>{l.label}</a>
  return (
    <header className={cn(headerBase, headerSkin(over, scrolled, open), scrolled || open ? 'border-b border-border' : 'border-b border-transparent')}>
      <nav className={cn(WRAP, 'grid min-h-[76px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-2 lg:grid-cols-[1fr_auto_1fr] lg:gap-6')}>
        <div className="hidden items-center gap-5 lg:flex xl:gap-8">{left.map(item)}</div>
        <a href="#main" className={cn('col-start-1 inline-flex min-h-10 items-center font-display text-lg leading-tight text-foreground sm:text-2xl lg:col-start-2 lg:justify-center lg:text-center', longBrand(brand), FOCUS)}>{brand}</a>
        <div className="col-start-2 flex items-center justify-end gap-6 lg:col-start-3">
          <div className="hidden items-center gap-5 lg:flex xl:gap-8">{right.map(item)}</div>
          <div className="hidden whitespace-nowrap lg:block">{cta}</div>
          <MenuButton open={open} setOpen={setOpen} />
        </div>
      </nav>
      <MobileMenu open={open} setOpen={setOpen} links={links} cta={cta} />
    </header>
  )
}

export function HeaderIndex({ brand, links = [], cta, over }: { brand: string; links?: SectionLink[]; cta?: React.ReactNode; over?: boolean }) {
  const { scrolled, open, setOpen } = useHeader()
  return (
    <header className={cn(headerBase, headerSkin(over, scrolled, open), over && !scrolled && !open ? 'border-b border-transparent' : 'border-b border-border')}>
      <nav className={cn(WRAP, 'flex min-h-[72px] items-center justify-between gap-4 py-2 lg:gap-6')}>
        <a href="#main" className={cn('flex min-h-10 items-center gap-3 text-foreground', FOCUS)}>
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-foreground font-display text-lg text-background">{brand.slice(0, 1)}</span>
          <span className={cn('font-display text-lg', longBrand(brand))}>{brand}</span>
        </a>
        <div className="hidden items-center gap-5 lg:flex xl:gap-7">
          {links.map((l, i) => (
            <a key={l.href} href={l.href} className={cn('flex items-baseline gap-2 whitespace-nowrap text-sm text-foreground transition-colors hover:text-primary', FOCUS)}>
              <span className="font-mono text-xs text-muted-foreground">{pad(i + 1)}</span>{l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3"><div className="hidden whitespace-nowrap lg:block">{cta}</div><MenuButton open={open} setOpen={setOpen} /></div>
      </nav>
      <MobileMenu open={open} setOpen={setOpen} links={links} cta={cta} />
    </header>
  )
}

/* ---------------------------------- heroes ---------------------------------- */

type HeroProps = ActionProps & { eyebrow?: string; headline: string; accent?: string; sub: string; media?: React.ReactNode; facts?: SectionFact[]; reveal?: boolean; flip?: boolean }

export function HeroSplitPhoto(p: HeroProps) {
  const fitRef = useFitWords<HTMLHeadingElement>()
  return (
    <div data-lean-root="" className={cn(WRAP, 'pb-16 pt-32 md:pb-28 md:pt-44')}>
      <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-16">
        <div className={cn(p.media ? 'lg:col-span-7' : 'lg:col-span-10', p.flip && p.media && 'lg:order-2')}>
          <Rv load on={p.reveal}>
            <Eyebrow>{p.eyebrow}</Eyebrow>
            <h1 ref={fitRef} className="mt-6 font-display text-[clamp(2.75rem,6.2vw,6rem)] leading-[0.98] tracking-[-0.03em] text-foreground"><Accented text={p.headline} accent={p.accent} /></h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">{p.sub}</p>
            <Actions {...p} className="mt-10" />
          </Rv>
        </div>
        {p.media && (
          <Rv load on={p.reveal} delay={0.12} className={cn('lg:col-span-5', p.flip && 'lg:order-1')}>
            <Frame lean media={p.media} ratio="4/5" className="lg:translate-y-8" />
          </Rv>
        )}
      </div>
      <FactRow facts={p.facts} className="mt-16 md:mt-24" />
    </div>
  )
}

export function HeroEditorial(p: HeroProps) {
  const fitRef = useFitWords<HTMLHeadingElement>()
  return (
    <div className={cn(WRAP, 'pb-16 pt-32 md:pb-28 md:pt-44')}>
      <Rv load on={p.reveal}>
        <Eyebrow>{p.eyebrow}</Eyebrow>
        <h1 ref={fitRef} className="mt-8 font-display text-[clamp(3rem,10.5vw,10.5rem)] leading-[0.9] tracking-[-0.045em] text-foreground"><Accented text={p.headline} accent={p.accent} /></h1>
      </Rv>
      <Rv load on={p.reveal} delay={0.1} className="mt-12 grid gap-8 border-t border-border pt-8 md:grid-cols-12 md:gap-12">
        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground md:col-span-6 md:text-xl">{p.sub}</p>
        <Actions {...p} className="md:col-span-6 md:justify-end" />
      </Rv>
      {p.media && (
        <Rv load on={p.reveal} delay={0.15} className="mt-14 md:mt-20">
          <Frame media={p.media} className="aspect-[4/3] md:aspect-[21/9]" />
        </Rv>
      )}
      <FactRow facts={p.facts} className="mt-14" />
    </div>
  )
}

export function HeroCentered(p: HeroProps) {
  const fitRef = useFitWords<HTMLHeadingElement>()
  return (
    <div className={cn(WRAP, 'pb-16 pt-32 text-center md:pb-28 md:pt-44')}>
      <Rv load on={p.reveal} className="mx-auto max-w-4xl">
        <Eyebrow className="justify-center">{p.eyebrow}</Eyebrow>
        <h1 ref={fitRef} className="mt-6 font-display text-[clamp(2.75rem,7.4vw,7rem)] leading-[0.96] tracking-[-0.035em] text-foreground"><Accented text={p.headline} accent={p.accent} /></h1>
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">{p.sub}</p>
        <Actions {...p} className="mt-10 justify-center" />
      </Rv>
      {p.media && (
        <Rv load on={p.reveal} delay={0.15} className="mx-auto mt-16 max-w-3xl md:mt-24">
          <Frame media={p.media} ratio="5/6" style={{ borderRadius: '999px 999px 24px 24px' }} className="mx-auto" />
        </Rv>
      )}
      <FactRow facts={p.facts} className="mx-auto mt-16 max-w-4xl text-left" />
    </div>
  )
}

export function HeroFullBleed(p: HeroProps) {
  const fitRef = useFitWords<HTMLHeadingElement>()
  const photo = Boolean(p.media)
  return (
    <div data-lean-root="" className={cn('relative flex min-h-[92svh] flex-col justify-end overflow-hidden', photo ? 'bg-black' : 'bg-foreground')}>
      {photo && (
        <>
          <Lean className="absolute inset-0">{p.media}</Lean>
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        </>
      )}
      <div className={cn(WRAP, 'relative pb-12 pt-40 md:pb-16', photo ? 'text-white' : 'text-background')}>
        <Rv load on={p.reveal}>
          {p.eyebrow && (
            <p className={cn('flex items-center gap-3 font-mono text-xs', photo ? 'text-white/80' : 'text-background/90')}>
              <span aria-hidden="true" className={cn('h-px w-8', photo ? 'bg-white/60' : 'bg-background/50')} />{p.eyebrow}
            </p>
          )}
          <h1 ref={fitRef} className="mt-6 max-w-5xl font-display text-[clamp(2.9rem,8vw,8rem)] leading-[0.94] tracking-[-0.035em]"><Accented text={p.headline} accent={p.accent} onDark /></h1>
          <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end">
            <p className={cn('max-w-xl text-lg leading-relaxed md:col-span-6 md:text-xl', photo ? 'text-white/85' : 'text-background/95')}>{p.sub}</p>
            <Actions {...p} dark={photo} invert={!photo} className="md:col-span-6 md:justify-end" />
          </div>
        </Rv>
        <FactRow facts={p.facts} dark={photo} invert={!photo} className="mt-12" />
      </div>
    </div>
  )
}

export function HeroMinimal(p: HeroProps) {
  const fitRef = useFitWords<HTMLHeadingElement>()
  return (
    <div className={cn(WRAP, 'pb-16 pt-32 md:pb-28 md:pt-48')}>
      <div className="grid gap-10 md:grid-cols-12 md:gap-12">
        <div className="hidden lg:col-span-2 lg:block">
          <p className="font-mono text-xs text-muted-foreground">{p.eyebrow}</p>
          <span aria-hidden="true" className="mt-6 block h-40 w-px bg-border" />
        </div>
        <Rv load on={p.reveal} className="md:col-span-12 lg:col-span-10">
          {p.eyebrow && <Eyebrow className="mb-6 lg:hidden">{p.eyebrow}</Eyebrow>}
          <h1 ref={fitRef} className="font-display text-[clamp(2.9rem,7.6vw,7.5rem)] leading-[0.97] tracking-[-0.035em] text-foreground"><Accented text={p.headline} accent={p.accent} /></h1>
          <div className="mt-12 grid gap-8 md:grid-cols-10 md:gap-12">
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground md:col-span-5 md:text-xl">{p.sub}</p>
            <Actions {...p} className="md:col-span-5 md:justify-end" />
          </div>
        </Rv>
      </div>
      <FactRow facts={p.facts} className="mt-16 md:mt-24" />
    </div>
  )
}

/* -------------------------------- features -------------------------------- */

type ListProps = { eyebrow?: string; title: string; description?: string; items: SectionItem[]; tone?: Tone; reveal?: boolean }

export function FeaturesIndex({ eyebrow, title, description, items, tone, reveal }: ListProps) {
  return (
    <Shell tone={tone}>
      <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="max-w-3xl" />
      <div className="mt-14 border-t border-foreground md:mt-20">
        {items.map((it, i) => (
          <Rv key={i} on={reveal} y={10}>
            <div className="grid gap-3 border-b border-border py-8 transition-colors hover:bg-accent/40 md:grid-cols-12 md:gap-8 md:py-10">
              <div className="font-mono text-sm text-muted-foreground md:col-span-1">{pad(i + 1)}</div>
              <h3 className="font-display text-[clamp(1.6rem,2.8vw,2.6rem)] leading-[1.1] tracking-[-0.02em] text-foreground md:col-span-5">{it.title}</h3>
              <p className="text-base leading-relaxed text-muted-foreground md:col-span-4 md:pt-2 md:text-lg">{it.text}</p>
              {it.meta && <p className="font-mono text-sm text-foreground md:col-span-2 md:pt-2 md:text-right">{it.meta}</p>}
            </div>
          </Rv>
        ))}
      </div>
    </Shell>
  )
}

function spanFor(n: number, i: number): string {
  if (n === 4 || n === 2) return 'md:col-span-3'
  if (n === 5) return i < 3 ? 'md:col-span-2' : 'md:col-span-3'
  return 'md:col-span-2'
}

export function FeaturesCards({ eyebrow, title, description, items, tone, reveal }: ListProps) {
  return (
    <Shell tone={tone}>
      <div className="grid gap-8 md:grid-cols-12 md:items-end">
        <Head eyebrow={eyebrow} title={title} reveal={reveal} className="md:col-span-7" />
        {description && <p className="max-w-md text-base leading-relaxed text-muted-foreground md:col-span-5 md:justify-self-end md:text-lg">{description}</p>}
      </div>
      <div className="mt-14 grid gap-4 md:mt-20 md:grid-cols-6">
        {items.map((it, i) => (
          <Rv key={i} on={reveal} delay={i * 0.05} y={12} className={spanFor(items.length, i)}>
            <article className="flex h-full min-h-[18rem] flex-col justify-between rounded-2xl border border-border bg-card p-7 transition-colors hover:border-foreground/40 md:p-5 lg:p-9">
              <span className="font-display text-5xl leading-none text-primary">{pad(i + 1)}</span>
              <div className="mt-12">
                <h3 className="font-display text-2xl leading-tight tracking-[-0.015em] text-foreground md:text-xl lg:text-[1.7rem]">{it.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{it.text}</p>
                {it.meta && <p className="mt-5 border-t border-border pt-4 font-mono text-sm text-foreground">{it.meta}</p>}
              </div>
            </article>
          </Rv>
        ))}
      </div>
    </Shell>
  )
}

export function FeaturesBento({ eyebrow, title, description, items, tone, reveal }: ListProps) {
  const [a, b, c, d] = items
  const small = 'flex h-full min-h-[14rem] flex-col justify-between rounded-2xl border border-border bg-card p-7 md:p-8'
  const cell = (it: SectionItem | undefined, i: number, extra?: string) => it && (
    <Rv on={reveal} delay={i * 0.06} y={12} className={extra}>
      <article className={small}>
        <span className="font-mono text-sm text-muted-foreground">{pad(i + 1)}</span>
        <div className="mt-10">
          <h3 className="font-display text-2xl leading-tight tracking-[-0.015em] text-foreground md:text-3xl">{it.title}</h3>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{it.text}</p>
          {it.meta && <p className="mt-4 font-mono text-sm text-foreground">{it.meta}</p>}
        </div>
      </article>
    </Rv>
  )
  return (
    <Shell tone={tone}>
      <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="max-w-3xl" />
      <div className="mt-14 grid gap-4 md:mt-20 md:grid-cols-3">
        {a && (
          <Rv on={reveal} y={12} className="md:col-span-2">
            <article className="flex h-full min-h-[22rem] flex-col justify-between rounded-2xl bg-foreground p-8 text-background md:p-12">
              <span className="font-mono text-sm text-background/90">01</span>
              <div>
                <h3 className="font-display text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.05] tracking-[-0.025em]">{a.title}</h3>
                <p className="mt-4 max-w-md text-base leading-relaxed text-background/95 md:text-lg">{a.text}</p>
                {a.meta && <p className="mt-6 font-mono text-sm text-background/95">{a.meta}</p>}
              </div>
            </article>
          </Rv>
        )}
        {cell(b, 1)}
        {cell(c, 2)}
        {cell(d, 3, 'md:col-span-2')}
      </div>
    </Shell>
  )
}

export function FeaturesGrid({ eyebrow, title, description, items, tone, reveal }: ListProps) {
  return (
    <Shell tone={tone}>
      <div className="grid gap-12 md:grid-cols-12">
        <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="md:sticky md:top-28 md:col-span-4 md:self-start" />
        <div className="grid border-t border-foreground sm:grid-cols-2 md:col-span-8">
          {items.map((it, i) => (
            <Rv key={i} on={reveal} delay={i * 0.05} y={12} className={cn('border-b border-border p-7 md:p-10', i % 2 === 0 && 'sm:border-r')}>
              <span className="font-display text-4xl leading-none text-primary">{pad(i + 1)}</span>
              <h3 className="mt-10 font-display text-2xl leading-tight tracking-[-0.015em] text-foreground">{it.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{it.text}</p>
              {it.meta && <p className="mt-4 font-mono text-sm text-foreground">{it.meta}</p>}
            </Rv>
          ))}
        </div>
      </div>
    </Shell>
  )
}

/* ---------------------------------- steps ---------------------------------- */

export function StepsColumns({ eyebrow, title, description, items, tone, reveal }: ListProps) {
  const cols = items.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'
  return (
    <Shell tone={tone}>
      <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="max-w-3xl" />
      <div className={cn('mt-14 grid gap-x-10 gap-y-14 md:mt-24', cols)}>
        {items.map((it, i) => (
          <Rv key={i} on={reveal} delay={i * 0.07} y={14}>
            <div className="border-t border-foreground pt-6">
              <span className="font-display text-[clamp(4rem,7vw,6.5rem)] leading-none tracking-[-0.04em] text-primary">{pad(i + 1)}</span>
              <h3 className="mt-8 font-display text-2xl leading-tight tracking-[-0.015em] text-foreground">{it.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{it.text}</p>
            </div>
          </Rv>
        ))}
      </div>
    </Shell>
  )
}

export function StepsTimeline({ eyebrow, title, description, items, tone, reveal }: ListProps) {
  return (
    <Shell tone={tone}>
      <div className="grid gap-14 md:grid-cols-12">
        <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="md:sticky md:top-28 md:col-span-5 md:self-start" />
        <ol className="relative md:col-span-7">
          <span aria-hidden="true" className="absolute bottom-0 left-5 top-2 w-px bg-border" />
          {items.map((it, i) => (
            <li key={i} className="relative pb-12 pl-16 last:pb-0">
              {/* Outside the reveal wrapper on purpose: while the wrapper animates a transform it becomes the positioning parent, which moved this badge onto the heading (live, 25 Nov). */}
              <span aria-hidden="true" className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg border border-foreground bg-background font-mono text-sm text-foreground">{pad(i + 1)}</span>
              <Rv on={reveal} y={12}>
                <h3 className="pt-1 font-display text-2xl leading-tight tracking-[-0.015em] text-foreground md:text-3xl">{it.title}</h3>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">{it.text}</p>
              </Rv>
            </li>
          ))}
        </ol>
      </div>
    </Shell>
  )
}

/* ---------------------------------- about ---------------------------------- */

type AboutProps = { eyebrow?: string; title: string; paragraphs: string[]; media?: React.ReactNode; flip?: boolean; tone?: Tone; reveal?: boolean }

export function AboutSplit({ eyebrow, title, paragraphs, media, flip, tone, reveal }: AboutProps) {
  const [lead, ...rest] = paragraphs
  return (
    <Shell tone={tone}>
      <div className="grid items-start gap-12 md:grid-cols-12 md:gap-16">
        {media && (
          <Rv on={reveal} className={cn('md:col-span-5', flip && 'md:order-2')}>
            <Frame media={media} ratio="4/5" />
          </Rv>
        )}
        <div className={cn(media ? 'md:col-span-7' : 'md:col-span-10', flip && media && 'md:order-1')}>
          <Head eyebrow={eyebrow} title={title} reveal={reveal} />
          <Rv on={reveal} delay={0.08}>
            <p className="mt-10 font-display text-[clamp(1.4rem,2.3vw,2rem)] leading-[1.3] tracking-[-0.01em] text-foreground">{lead}</p>
            <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">{rest.map((p, i) => <p key={i}>{p}</p>)}</div>
          </Rv>
        </div>
      </div>
    </Shell>
  )
}

export function AboutBand({ eyebrow, title, paragraphs, media, tone, reveal }: AboutProps) {
  const fitRef = useFitWords<HTMLHeadingElement>()
  const [lead, ...rest] = paragraphs
  return (
    <Shell tone={tone}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Rv on={reveal}>
        <h2 ref={fitRef} className="mt-5 max-w-4xl font-display text-[clamp(2.1rem,5.2vw,4.75rem)] leading-[1.02] tracking-[-0.03em] text-foreground">{title}</h2>
      </Rv>
      <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-12 md:gap-12">
        <Rv on={reveal} className="md:col-span-5"><p className="font-display text-[clamp(1.3rem,2vw,1.75rem)] leading-[1.35] text-foreground">{lead}</p></Rv>
        <Rv on={reveal} delay={0.08} className="space-y-5 text-base leading-relaxed text-muted-foreground md:col-span-6 md:col-start-7 md:text-lg">{rest.map((p, i) => <p key={i}>{p}</p>)}</Rv>
      </div>
      {media && (
        <Rv on={reveal} className="mt-14 md:mt-20">
          <Frame media={media} className="aspect-[3/2] md:aspect-[21/9]" />
        </Rv>
      )}
    </Shell>
  )
}

/* ----------------------------------- faq ----------------------------------- */

function FaqRow({ q, a, open, onToggle, boxed }: { q: string; a: string; open: boolean; onToggle: () => void; boxed?: boolean }) {
  return (
    <div className={cn(boxed ? 'rounded-2xl border border-border bg-card' : 'border-b border-border')}>
      <button type="button" aria-expanded={open} onClick={onToggle} className={cn('flex w-full items-start justify-between gap-6 text-left', boxed ? 'p-6 md:p-8' : 'py-7 md:py-9', FOCUS)}>
        <span className="font-display text-xl leading-snug tracking-[-0.01em] text-foreground md:text-[1.6rem]">{q}</span>
        <span aria-hidden="true" className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-foreground">
          {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }}>
            <p className={cn('max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg', boxed ? 'px-6 pb-8 md:px-8' : 'pb-9')}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

type FaqProps = { eyebrow?: string; title: string; description?: string; faq: SectionFaq[]; tone?: Tone; reveal?: boolean }

export function FaqSplit({ eyebrow, title, description, faq, tone, reveal }: FaqProps) {
  const [open, setOpen] = useState<number>(0)
  return (
    <Shell tone={tone}>
      <div className="grid gap-12 md:grid-cols-12">
        <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="md:sticky md:top-28 md:col-span-4 md:self-start" />
        <div className="border-t border-foreground md:col-span-8">
          {faq.map((f, i) => <FaqRow key={i} q={f.question} a={f.answer} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />)}
        </div>
      </div>
    </Shell>
  )
}

export function FaqBoxed({ eyebrow, title, description, faq, tone, reveal }: FaqProps) {
  const [open, setOpen] = useState<number>(0)
  return (
    <Shell tone={tone}>
      <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} center className="max-w-3xl" />
      <div className="mx-auto mt-14 flex max-w-3xl flex-col gap-3 md:mt-20">
        {faq.map((f, i) => <FaqRow key={i} boxed q={f.question} a={f.answer} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />)}
      </div>
    </Shell>
  )
}

/* ----------------------------------- cta ----------------------------------- */

type CtaProps = { title: string; description?: string; cta?: string; onCta?: () => void; secondaryLabel?: string; secondaryHref?: string; reveal?: boolean }

export function CtaBand(p: CtaProps) {
  const fitRef = useFitWords<HTMLHeadingElement>()
  return (
    <div className="bg-foreground text-background">
      <div className={cn(WRAP, 'py-24 md:py-40')}>
        <Rv on={p.reveal}>
          <h2 ref={fitRef} className="max-w-5xl font-display text-[clamp(2.6rem,7vw,7rem)] leading-[0.96] tracking-[-0.04em]">{p.title}</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-12 md:items-end">
            {p.description && <p className="max-w-lg text-lg leading-relaxed text-background/95 md:col-span-6 md:text-xl">{p.description}</p>}
            <Actions cta={p.cta} onCta={p.onCta} secondaryLabel={p.secondaryLabel} secondaryHref={p.secondaryHref} invert className="md:col-span-6 md:justify-end" />
          </div>
        </Rv>
      </div>
    </div>
  )
}

export function CtaSplit(p: CtaProps) {
  const fitRef = useFitWords<HTMLHeadingElement>()
  return (
    <div className={cn(WRAP, 'py-16 md:py-28')}>
      <Rv on={p.reveal}>
        <div className="grid gap-10 rounded-3xl border border-foreground bg-card p-8 md:grid-cols-12 md:items-center md:gap-12 md:p-16">
          <div className="md:col-span-8">
            <h2 ref={fitRef} className="font-display text-[clamp(2rem,4.6vw,4rem)] leading-[1.02] tracking-[-0.03em] text-foreground">{p.title}</h2>
            {p.description && <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">{p.description}</p>}
          </div>
          <Actions cta={p.cta} onCta={p.onCta} secondaryLabel={p.secondaryLabel} secondaryHref={p.secondaryHref} className="md:col-span-4 md:justify-end" />
        </div>
      </Rv>
    </div>
  )
}

/* --------------------------------- photo ---------------------------------- */

export function PhotoBand({ media, ratio = '21/9', caption, reveal }: { media?: React.ReactNode; ratio?: string; caption?: string; reveal?: boolean }) {
  return (
    <div className={cn(WRAP, 'py-6 md:py-12')}>
      <Rv on={reveal}>
        <Frame media={media} ratio={ratio} className="rounded-3xl" />
        {caption && <p className="mt-3 text-sm text-muted-foreground">{caption}</p>}
      </Rv>
    </div>
  )
}

// The closing screen repeats the mood of the first one: a photograph under a flat dark overlay, a large line, one action.
export function CtaPhoto(p: CtaProps & { media?: React.ReactNode }) {
  const fitRef = useFitWords<HTMLHeadingElement>()
  const photo = Boolean(p.media)
  return (
    <div className={cn('relative isolate overflow-hidden', photo ? 'bg-black text-white' : 'bg-foreground text-background')}>
      {photo && (
        <>
          <div className="absolute inset-0 -z-20 [&_img]:h-full [&_img]:w-full [&_img]:object-cover">{p.media}</div>
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/60" />
        </>
      )}
      <div className={cn(WRAP, 'py-24 md:py-44')}>
        <Rv on={p.reveal}>
          <h2 ref={fitRef} className="max-w-5xl font-display text-[clamp(2.6rem,7vw,7rem)] leading-[0.96] tracking-[-0.04em]">{p.title}</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-12 md:items-end">
            {p.description && <p className={cn('max-w-lg text-lg leading-relaxed md:col-span-6 md:text-xl', photo ? 'text-white/85' : 'text-background/95')}>{p.description}</p>}
            <Actions cta={p.cta} onCta={p.onCta} secondaryLabel={p.secondaryLabel} secondaryHref={p.secondaryHref} dark={photo} invert={!photo} className="md:col-span-6 md:justify-end" />
          </div>
        </Rv>
      </div>
    </div>
  )
}

/* --------------------------------- contact --------------------------------- */

type ContactProps = { eyebrow?: string; title: string; description?: string; facts?: SectionFact[]; children?: React.ReactNode; flip?: boolean; tone?: Tone; reveal?: boolean }

export function ContactSplit({ eyebrow, title, description, facts, children, flip, tone, reveal }: ContactProps) {
  return (
    <Shell tone={tone}>
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <div className={cn('md:col-span-5', flip && 'md:order-2')}>
          <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} />
          <FactRow facts={facts} className="mt-12" />
        </div>
        <Rv on={reveal} delay={0.08} className={cn('md:col-span-7', flip && 'md:order-1')}>
          <div className="rounded-3xl border border-border bg-card p-6 md:p-12">{children}</div>
        </Rv>
      </div>
    </Shell>
  )
}

export function ContactCentered({ eyebrow, title, description, facts, children, tone, reveal }: ContactProps) {
  return (
    <Shell tone={tone}>
      <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} center className="max-w-3xl" />
      <Rv on={reveal} delay={0.08} className="mx-auto mt-14 max-w-2xl md:mt-20">
        <div className="rounded-3xl border border-foreground bg-background p-6 md:p-12">{children}</div>
      </Rv>
      <FactRow facts={facts} className="mx-auto mt-14 max-w-2xl" />
    </Shell>
  )
}

export function VisitList({ eyebrow, title, description, facts, children, tone, reveal }: ContactProps) {
  return (
    <Shell tone={tone}>
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <Head eyebrow={eyebrow} title={title} description={description} reveal={reveal} className="md:col-span-5" />
        <Rv on={reveal} delay={0.08} className="md:col-span-7">
          <dl className="border-t border-foreground">
            {(facts ?? []).map((f, i) => (
              <div key={i} className="grid gap-1 border-b border-border py-6 sm:grid-cols-3 sm:gap-6">
                <dt className="font-mono text-sm text-muted-foreground">{f.label}</dt>
                <dd className={cn('min-w-0 font-display text-xl leading-snug text-foreground [overflow-wrap:anywhere] sm:col-span-2 md:text-2xl', TAP_LINK)}>{f.value}</dd>
              </div>
            ))}
          </dl>
          {children && <div className="mt-6 [&>a]:inline-flex [&>a]:min-h-10 [&>a]:items-center">{children}</div>}
        </Rv>
      </div>
    </Shell>
  )
}

/* ---------------------------------- ticker ---------------------------------- */

// A slow strip of short facts the owner actually gave (place, hours, phone). Fewer than three facts renders nothing: a ticker needs something to say.
// Plain CSS keyframes (animate-marquee), so it runs without JavaScript. Under reduced motion it stops and wraps as ordinary text; hover, focus and the pause button also stop it.
export function FactTicker({ items, label }: { items: string[]; label?: string }) {
  const [paused, setPaused] = useState(false)
  const clean = items.map(x => (x || '').trim()).filter(Boolean)
  if (clean.length < 3) return null
  const reps = Math.max(2, Math.ceil(8 / clean.length))
  const run = Array.from({ length: reps }, () => clean).flat()
  const row = (copy: boolean) => (
    <ul aria-hidden={copy ? true : undefined} className="flex shrink-0 items-center gap-10 pr-10 motion-reduce:flex-wrap motion-reduce:gap-x-8 motion-reduce:gap-y-2 motion-reduce:pr-0">
      {run.map((t, i) => (
        <li key={i} className={cn('flex items-center gap-10 whitespace-nowrap font-display text-2xl text-foreground md:text-3xl motion-reduce:gap-0 motion-reduce:whitespace-normal', (copy || i >= clean.length) && 'motion-reduce:hidden')} aria-hidden={!copy && i >= clean.length ? true : undefined}>
          {t}<span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-sm bg-primary motion-reduce:hidden" />
        </li>
      ))}
    </ul>
  )
  return (
    <div role="group" aria-label={label || 'Details'} className={cn(WRAP, 'relative')}>
      <div className="group overflow-hidden border-y border-border py-5 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:overflow-visible motion-reduce:[mask-image:none]">
        <div
          className="flex w-max animate-marquee motion-reduce:w-auto motion-reduce:animate-none group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
          style={{ animationDuration: Math.max(24, run.length * 5) + 's', animationPlayState: paused ? 'paused' : undefined }}
        >
          {row(false)}{row(true)}
        </div>
      </div>
      <button type="button" onClick={() => setPaused(v => !v)} className={cn('absolute right-5 top-1 rounded-md bg-background px-2 py-1 text-xs text-muted-foreground sm:right-8 lg:right-12 motion-reduce:hidden sr-only focus-visible:not-sr-only', FOCUS)}>{paused ? 'Play ticker' : 'Pause ticker'}</button>
    </div>
  )
}

/* ---------------------------------- footers ---------------------------------- */

const FOOTER_LINK = 'inline-flex min-h-10 min-w-10 items-center text-base text-foreground transition-colors hover:text-primary md:min-h-0 md:min-w-0'

type FooterProps = { brand: string; description?: string; columns?: { title: string; links: SectionLink[] }[]; note?: string }

export function FooterGiant({ brand, description, columns = [], note }: FooterProps) {
  const fitRef = useFitWords<HTMLHeadingElement>(20)
  const vw = Math.min(16, 150 / Math.max(brand.length, 6))
  return (
    <footer className="border-t border-foreground bg-background">
      <div className={cn(WRAP, 'pt-16 md:pt-24')}>
        <div className="grid gap-12 md:grid-cols-12">
          {description && <p className="max-w-sm text-base leading-relaxed text-muted-foreground md:col-span-5">{description}</p>}
          <div className="grid gap-10 sm:grid-cols-2 md:col-span-6 md:col-start-7">
            {columns.map(col => (
              <div key={col.title}>
                <p className="font-mono text-xs text-muted-foreground">{col.title}</p>
                <ul className="mt-3 flex flex-col md:mt-5 md:gap-3">
                  {col.links.map(l => <li key={l.href + l.label}><a href={l.href} className={cn(FOOTER_LINK, FOCUS)}>{l.label}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p ref={fitRef} aria-hidden="true" className="mt-16 text-[length:var(--wordmark)] font-display leading-[0.9] tracking-[-0.045em] text-foreground md:mt-24" style={{ '--wordmark': 'clamp(2.5rem,' + vw.toFixed(1) + 'vw,14rem)' } as React.CSSProperties}>{brand}</p>
        {note && <p className="mt-8 border-t border-border py-6 text-sm text-muted-foreground">{note}</p>}
      </div>
    </footer>
  )
}

export function FooterSlim({ brand, description, columns = [], note }: FooterProps) {
  const links = columns.flatMap(c => c.links)
  return (
    <footer className="border-t border-border bg-card">
      <div className={cn(WRAP, 'py-14 md:py-20')}>
        <div className="grid gap-10 md:grid-cols-12 md:items-start">
          <div className="md:col-span-5">
            <p className="font-display text-2xl text-foreground">{brand}</p>
            {description && <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          <ul className="flex flex-wrap gap-x-8 md:col-span-7 md:justify-end md:gap-y-3">
            {links.map(l => <li key={l.href + l.label}><a href={l.href} className={cn(FOOTER_LINK, FOCUS)}>{l.label}</a></li>)}
          </ul>
        </div>
        {note && <p className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">{note}</p>}
      </div>
    </footer>
  )
}
`

// Map merged into the same places as WYBER_UI_KIT_FILES (user files always win).
export const WYBER_SECTIONS_FILES: Record<string, string> = {
  [WYBER_SECTIONS_PATH]: WYBER_SECTIONS_SOURCE,
}

/** Names the renderer may import from './wyber-sections'. Checked against the source by wyber-sections.test.ts. */
export const WYBER_SECTION_NAMES = [
  'HeaderBar', 'HeaderCentered', 'HeaderIndex',
  'HeroSplitPhoto', 'HeroEditorial', 'HeroCentered', 'HeroFullBleed', 'HeroMinimal',
  'FeaturesIndex', 'FeaturesCards', 'FeaturesBento', 'FeaturesGrid',
  'StepsColumns', 'StepsTimeline', 'AboutSplit', 'AboutBand', 'FaqSplit', 'FaqBoxed',
  'CtaBand', 'CtaSplit', 'CtaPhoto', 'PhotoBand', 'ContactSplit', 'ContactCentered', 'VisitList', 'FooterGiant', 'FooterSlim',
  'FactTicker', 'AnchorMorph', 'withViewTransition',
] as const
