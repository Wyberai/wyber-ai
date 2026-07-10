// WYBER UI KIT — the premium component library injected into EVERY generated app.
//
// WHY: output quality was capped by asking the model to hand-write every card,
// button and hero from scratch inside a token budget — under that pressure every
// model regresses to flat 2020-style UI. v0/Lovable solve this by making the
// model COMPOSE a pre-built design system instead of writing one. This is ours.
//
// HOW IT WORKS
//   - The kit is ONE generated-app module, `src/wyber-ui.tsx`, injected at
//     build time by BOTH pipelines (wyber-preview engine virtual FS + publish
//     sanitizeFiles) — exactly like the auto-injected tailwind config & stubs.
//     It is transient: never persisted to the saved project, user files win.
//   - Apps import it relatively: `import { Button, SpotlightCard } from './wyber-ui'`
//     (from src/components/*: '../wyber-ui'). Unused exports are tree-shaken.
//   - The model never sees this source — it sees WYBER_UI_KIT_PROMPT (below),
//     a compact API reference kept in this file so docs and code can't drift.
//
// HARD CONSTRAINTS (breaking any of these breaks user builds, not our build):
//   - Only deps guaranteed by both pipelines: react, framer-motion, clsx,
//     lucide-react (see engine.ts EXTERNAL_DEPS + sanitize-files REQUIRED_DEPS).
//     NO radix, NO tailwind plugins.
//   - Colors ONLY via the semantic design tokens (bg-primary, border-border,
//     hsl(var(--primary) / 0.1), …) so the kit inherits each app's bespoke
//     palette. Never a literal color.
//   - The source lives in a String.raw template: NO backticks, NO ${ sequences
//     inside the kit code. Validated by wyber-ui-kit.test.ts (TS transpile).
//   - animate-marquee / animate-aurora / animate-gradient-spin keyframes are
//     provided by THEME_EXTEND in design-system.ts (shared by both engines).

export const WYBER_UI_KIT_PATH = 'src/wyber-ui.tsx'

export const WYBER_UI_KIT_SOURCE = String.raw`// Wyber UI Kit — premium primitives provided by the platform. Auto-injected;
// edits here are overwritten on every build. Compose these instead of
// hand-rolling cards/buttons/heroes. All colors come from the app's design
// tokens (src/index.css), so everything below matches this app's palette.
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import clsx from 'clsx'
import { Menu, X, Check, ChevronDown, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react'

type ClassValue = string | number | boolean | undefined | null | Record<string, unknown> | ClassValue[]
export function cn(...inputs: ClassValue[]) { return clsx(...(inputs as never[])) }

const springFast = { type: 'spring' as const, stiffness: 420, damping: 28 }
const easeOut = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number]

/* ================================ MOTION ================================ */

export function Reveal({ children, delay = 0, y = 24, once = true, className }: {
  children?: React.ReactNode; delay?: number; y?: number; once?: boolean; className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({ children, delay = 0, interval = 0.08, className }: {
  children?: React.ReactNode; delay?: number; interval?: number; className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: interval, delayChildren: delay } } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOut } } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedNumber({ value, duration = 1400, prefix = '', suffix = '', decimals = 0, className }: {
  value: number; duration?: number; prefix?: string; suffix?: string; decimals?: number; className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!inView) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(value * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])
  const text = display.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return <span ref={ref} className={cn('tabular-nums', className)}>{prefix}{text}{suffix}</span>
}

export function Marquee({ children, speed = 30, reverse = false, pauseOnHover = true, className }: {
  children?: React.ReactNode; speed?: number; reverse?: boolean; pauseOnHover?: boolean; className?: string
}) {
  return (
    <div className={cn('group relative flex overflow-hidden', className)}>
      <div
        className={cn('flex w-max shrink-0 items-center gap-6 pr-6 animate-marquee', pauseOnHover && 'group-hover:[animation-play-state:paused]')}
        style={{ animationDuration: speed + 's', animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        <div className="flex shrink-0 items-center gap-6">{children}</div>
        <div className="flex shrink-0 items-center gap-6" aria-hidden="true">{children}</div>
      </div>
    </div>
  )
}

/* ========================== SCROLL STORYTELLING ========================== */

export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll()
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: scrollYProgress }}
      className={cn('fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-primary', className)}
    />
  )
}

export function Parallax({ children, speed = 0.3, className }: {
  children?: React.ReactNode; speed?: number; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [speed * -80, speed * 80])
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}

export function SplitTextReveal({ text, delay = 0, className }: {
  text: string; delay?: number; className?: string
}) {
  const words = text.split(' ')
  return (
    <motion.span
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: delay } } }}
      aria-label={text}
      className={cn('inline-block', className)}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: '110%' }, show: { y: '0%', transition: { duration: 0.5, ease: easeOut } } }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </motion.span>
  )
}

// Apple-style pinned walkthrough: the section pins for items.length viewports
// and crossfades through each item as the user scrolls. THE cinematic moment
// for product feature stories — use once per page, 3-4 items.
export function StickyShowcase({ items, className }: {
  items: { title: string; description?: string; visual?: React.ReactNode }[]; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [active, setActive] = useState(0)
  useEffect(() => {
    const unsub = scrollYProgress.on('change', v => {
      setActive(Math.min(items.length - 1, Math.max(0, Math.floor(v * items.length))))
    })
    return unsub
  }, [scrollYProgress, items.length])
  return (
    <div ref={ref} className={cn('relative', className)} style={{ height: (items.length * 100) + 'vh' }}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{ opacity: active === i ? 1 : 0, y: active === i ? 0 : 28, scale: active === i ? 1 : 0.97 }}
            transition={{ duration: 0.45, ease: easeOut }}
            style={{ pointerEvents: active === i ? 'auto' : 'none' }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          >
            {item.visual && <div className="mb-8 w-full max-w-2xl">{item.visual}</div>}
            <h3 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-5xl">{item.title}</h3>
            {item.description && <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">{item.description}</p>}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Cards pin under the header and stack with a slight offset as you scroll —
// pure CSS sticky, no scroll math, works everywhere.
export function ScrollStack({ items, className }: { items: React.ReactNode[]; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {items.map((item, i) => (
        <div key={i} className="sticky" style={{ top: 88 + i * 26 }}>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_48px_hsl(var(--foreground)/0.1)]">
            {item}
          </div>
        </div>
      ))}
    </div>
  )
}

export function TiltCard({ children, maxTilt = 8, className }: {
  children?: React.ReactNode; maxTilt?: number; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  return (
    <div
      ref={ref}
      onMouseMove={e => {
        const r = ref.current ? ref.current.getBoundingClientRect() : null
        if (!r) return
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        setTilt({ rx: -py * maxTilt, ry: px * maxTilt })
      }}
      onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
      style={{ perspective: '900px' }}
      className={className}
    >
      <div
        className="rounded-xl border border-border bg-card p-6 transition-transform duration-150 will-change-transform"
        style={{ transform: 'rotateX(' + tilt.rx + 'deg) rotateY(' + tilt.ry + 'deg)' }}
      >
        {children}
      </div>
    </div>
  )
}

export function LiquidUnderline({ children, href, className, ...rest }: {
  children?: React.ReactNode; href?: string; className?: string
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={href} className={cn('group relative inline-block text-sm font-medium text-foreground', className)} {...rest}>
      {children}
      <span aria-hidden="true" className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-primary transition-transform duration-300 ease-out group-hover:scale-x-100" />
    </a>
  )
}

/* ============================== PRIMITIVES ============================== */

const BUTTON_VARIANTS: Record<string, string> = {
  primary: 'bg-primary text-primary-foreground shadow-[0_1px_2px_hsl(var(--primary)/0.4),inset_0_1px_0_hsl(var(--primary-foreground)/0.15)] hover:brightness-110',
  secondary: 'bg-secondary text-secondary-foreground border border-border hover:bg-accent',
  outline: 'border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
  ghost: 'text-muted-foreground hover:text-foreground hover:bg-accent',
  destructive: 'bg-destructive text-destructive-foreground hover:brightness-110',
}
const BUTTON_SIZES: Record<string, string> = {
  sm: 'h-8 px-3 text-xs rounded-md',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'h-12 px-6 text-base rounded-lg',
}

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={springFast}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
        BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className,
      )}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </motion.button>
  )
}

const BADGE_VARIANTS: Record<string, string> = {
  default: 'bg-primary/10 text-primary border border-primary/20',
  outline: 'border border-border text-muted-foreground',
  solid: 'bg-primary text-primary-foreground',
  destructive: 'bg-destructive/10 text-destructive border border-destructive/20',
}

export function Badge({ variant = 'default', className, children }: {
  variant?: 'default' | 'outline' | 'solid' | 'destructive'; className?: string; children?: React.ReactNode
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', BADGE_VARIANTS[variant], className)}>
      {children}
    </span>
  )
}

export function Input({ className, ...rest }: { className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn('h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50', className)}
      {...rest}
    />
  )
}

export function Textarea({ className, ...rest }: { className?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn('min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50', className)}
      {...rest}
    />
  )
}

export function Card({ className, hover = false, children }: { className?: string; hover?: boolean; children?: React.ReactNode }) {
  return (
    <div className={cn(
      'rounded-xl border border-border bg-card text-card-foreground p-6 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]',
      hover && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_hsl(var(--foreground)/0.08)] hover:border-primary/30',
      className,
    )}>
      {children}
    </div>
  )
}

export function GlassPanel({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn('rounded-xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06),0_8px_32px_hsl(var(--foreground)/0.06)] p-6', className)}>
      {children}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

export function EmptyState({ icon, title, description, action, className }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-14 text-center', className)}>
      {icon && <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">{icon}</div>}
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {description && <div className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Switch({ checked, onChange, className }: { checked: boolean; onChange: (next: boolean) => void; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', checked ? 'bg-primary' : 'bg-muted', className)}
    >
      <span className={cn('block h-5 w-5 transform rounded-full bg-background shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  )
}

export function Tabs({ tabs, active, onChange, className }: {
  tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void; className?: string
}) {
  const idRef = useRef('tabs-' + Math.random().toString(36).slice(2))
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn('relative rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors', active === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
        >
          {active === t.id && (
            <motion.span layoutId={idRef.current} transition={springFast} className="absolute inset-0 rounded-md bg-background shadow-sm" />
          )}
          <span className="relative z-10">{t.label}</span>
        </button>
      ))}
    </div>
  )
}

export function Dialog({ open, onClose, title, children, className }: {
  open: boolean; onClose: () => void; title?: string; children?: React.ReactNode; className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-foreground/25 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.22, ease: easeOut }}
            role="dialog"
            aria-modal="true"
            className={cn('relative w-full max-w-lg rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl', className)}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              {title && <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>}
              <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function Accordion({ items, className }: {
  items: { title: string; content: React.ReactNode }[]; className?: string
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  return (
    <div className={cn('divide-y divide-border rounded-xl border border-border bg-card', className)}>
      {items.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
            >
              {item.title}
              <ChevronDown size={16} className={cn('shrink-0 text-muted-foreground transition-transform duration-300', isOpen && 'rotate-180')} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: easeOut }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

/* ============================ PREMIUM SURFACES ============================ */

export function SpotlightCard({ children, className, spotlightSize = 380 }: {
  children?: React.ReactNode; className?: string; spotlightSize?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: -9999, y: -9999 })
  const [hovering, setHovering] = useState(false)
  return (
    <div
      ref={ref}
      onMouseMove={e => {
        const rect = ref.current ? ref.current.getBoundingClientRect() : null
        if (rect) setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={cn('relative overflow-hidden rounded-xl border border-border bg-card p-6 text-card-foreground', className)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: hovering ? 1 : 0,
          background: 'radial-gradient(' + spotlightSize + 'px circle at ' + pos.x + 'px ' + pos.y + 'px, hsl(var(--primary) / 0.1), transparent 70%)',
        }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

export function GradientBorder({ children, className, contentClassName }: {
  children?: React.ReactNode; className?: string; contentClassName?: string
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl p-px', className)}>
      <div
        aria-hidden="true"
        className="absolute inset-[-50%] animate-gradient-spin"
        style={{ background: 'conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary)) 55deg, transparent 115deg, transparent 235deg, hsl(var(--primary) / 0.45) 295deg, transparent 360deg)' }}
      />
      <div className={cn('relative rounded-[inherit] bg-card p-6', contentClassName)}>{children}</div>
    </div>
  )
}

// Film-grain texture — the cheapest "not AI-generated" signature. Perfectly
// smooth gradients read synthetic; a whisper of monochrome noise over heroes,
// gradient panels and dark sections makes surfaces feel physical.
const NOISE_URI = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"

export function NoiseOverlay({ opacity = 0.05, className }: { opacity?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{ backgroundImage: 'url("' + NOISE_URI + '")', backgroundRepeat: 'repeat', opacity, mixBlendMode: 'overlay' }}
    />
  )
}

// Oversized fluid display type — 2026 heroes run 3-7rem+ scaled to viewport.
// Wrap an accent word in <em> for an italic, primary-colored moment:
// <HeroHeadline>Ship <em>beautiful</em> apps</HeroHeadline>
export function HeroHeadline({ children, as = 'h1', className }: {
  children?: React.ReactNode; as?: 'h1' | 'h2'; className?: string
}) {
  const Tag = as
  return (
    <Tag className={cn(
      'font-display font-bold tracking-tight text-foreground text-[clamp(2.75rem,6.5vw,6.5rem)] leading-[0.98] [&_em]:italic [&_em]:text-primary',
      className,
    )}>
      {children}
    </Tag>
  )
}

export function AuroraBackground({ className, intensity = 0.16, grain = true }: { className?: string; intensity?: number; grain?: boolean }) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div
        className="absolute -top-1/4 left-[10%] h-[36rem] w-[36rem] rounded-full blur-3xl animate-aurora"
        style={{ background: 'hsl(var(--primary) / ' + intensity + ')', animationDuration: '16s' }}
      />
      <div
        className="absolute -bottom-1/3 right-[5%] h-[30rem] w-[30rem] rounded-full blur-3xl animate-aurora"
        style={{ background: 'hsl(var(--primary) / ' + intensity * 0.7 + ')', animationDuration: '22s', animationDelay: '-6s', animationDirection: 'reverse' }}
      />
      <div
        className="absolute top-[20%] right-[25%] h-[22rem] w-[22rem] rounded-full blur-3xl animate-aurora"
        style={{ background: 'hsl(var(--accent-foreground) / ' + intensity * 0.35 + ')', animationDuration: '28s', animationDelay: '-12s' }}
      />
      {grain && <NoiseOverlay />}
    </div>
  )
}

export function BackgroundGrid({ variant = 'dots', fade = true, className }: {
  variant?: 'dots' | 'lines'; fade?: boolean; className?: string
}) {
  const pattern = variant === 'dots'
    ? { backgroundImage: 'radial-gradient(hsl(var(--foreground) / 0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }
    : { backgroundImage: 'linear-gradient(hsl(var(--foreground) / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.05) 1px, transparent 1px)', backgroundSize: '48px 48px' }
  const mask = 'radial-gradient(ellipse 80% 60% at 50% 35%, black 30%, transparent 100%)'
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
      style={fade ? { ...pattern, maskImage: mask, WebkitMaskImage: mask } : pattern}
    />
  )
}

/* ============================ COMPOSED SECTIONS ============================ */

export function SectionHeading({ eyebrow, title, description, align = 'center', className }: {
  eyebrow?: string; title: string; description?: string; align?: 'center' | 'left'; className?: string
}) {
  return (
    <Reveal className={cn('mb-12 max-w-2xl', align === 'center' ? 'mx-auto text-center' : 'text-left', className)}>
      {eyebrow && <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</div>}
      <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-5xl">{title}</h2>
      {description && <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">{description}</p>}
    </Reveal>
  )
}

const BENTO_COL_SPAN: Record<number, string> = { 1: '', 2: 'md:col-span-2', 3: 'md:col-span-3' }
const BENTO_ROW_SPAN: Record<number, string> = { 1: '', 2: 'md:row-span-2' }

export function BentoGrid({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-1 gap-4 md:auto-rows-[minmax(11rem,auto)] md:grid-cols-3', className)}>{children}</div>
}

export function BentoCard({ title, description, icon, colSpan = 1, rowSpan = 1, children, className }: {
  title?: string; description?: string; icon?: React.ReactNode; colSpan?: 1 | 2 | 3; rowSpan?: 1 | 2
  children?: React.ReactNode; className?: string
}) {
  return (
    <SpotlightCard className={cn('flex flex-col justify-between transition-colors duration-300 hover:border-primary/30', BENTO_COL_SPAN[colSpan], BENTO_ROW_SPAN[rowSpan], className)}>
      {icon && <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>}
      {children}
      {(title || description) && (
        <div className={cn(children ? 'mt-4' : 'mt-auto')}>
          {title && <div className="text-sm font-semibold text-foreground">{title}</div>}
          {description && <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</div>}
        </div>
      )}
    </SpotlightCard>
  )
}

export function FeatureCard({ icon, title, description, className }: {
  icon?: React.ReactNode; title: string; description?: string; className?: string
}) {
  return (
    <SpotlightCard className={cn('h-full transition-colors duration-300 hover:border-primary/30', className)}>
      {icon && <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>}
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {description && <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</div>}
    </SpotlightCard>
  )
}

export function StatBlock({ value, label, delta, prefix = '', suffix = '', decimals = 0, className }: {
  value: number | string; label: string; delta?: number; prefix?: string; suffix?: string; decimals?: number; className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {typeof value === 'number'
          ? <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
          : value}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {typeof delta === 'number' && (
          <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold', delta >= 0 ? 'text-primary' : 'text-destructive')}>
            {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
    </div>
  )
}

export function TestimonialCard({ quote, name, role, rating, className }: {
  quote: string; name: string; role?: string; rating?: number; className?: string
}) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
  return (
    <Card className={cn('flex h-full flex-col justify-between gap-5', className)}>
      <div>
        {typeof rating === 'number' && (
          <div className="mb-3 flex items-center gap-0.5 text-primary">
            {[0, 1, 2, 3, 4].map(i => (
              <Star key={i} size={14} className={i < rating ? 'fill-current' : 'opacity-25'} />
            ))}
          </div>
        )}
        <p className="text-sm leading-relaxed text-foreground">"{quote}"</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{initials}</div>
        <div>
          <div className="text-sm font-semibold text-foreground">{name}</div>
          {role && <div className="text-xs text-muted-foreground">{role}</div>}
        </div>
      </div>
    </Card>
  )
}

export function PricingCard({ name, price, period = '/month', description, features, cta = 'Get started', featured = false, onSelect, className }: {
  name: string; price: string; period?: string; description?: string; features: string[]
  cta?: string; featured?: boolean; onSelect?: () => void; className?: string
}) {
  return (
    <Card className={cn('relative flex h-full flex-col', featured && 'border-primary/40 shadow-[0_0_0_1px_hsl(var(--primary)/0.4),0_16px_48px_hsl(var(--primary)/0.12)]', className)}>
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="solid">Most popular</Badge>
        </div>
      )}
      <div className="mb-6">
        <div className="text-sm font-semibold text-foreground">{name}</div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="font-display text-4xl font-bold tracking-tight text-foreground">{price}</span>
          <span className="text-sm text-muted-foreground">{period}</span>
        </div>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      <ul className="mb-8 flex flex-col gap-2.5">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <Check size={15} className="mt-0.5 shrink-0 text-primary" />
            {f}
          </li>
        ))}
      </ul>
      <Button variant={featured ? 'primary' : 'outline'} className="mt-auto w-full" onClick={onSelect}>{cta}</Button>
    </Card>
  )
}

export function Navbar({ brand, links = [], cta, className }: {
  brand: React.ReactNode; links?: { label: string; href: string }[]; cta?: React.ReactNode; className?: string
}) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={cn(
      'fixed inset-x-0 top-0 z-40 transition-all duration-300',
      scrolled ? 'border-b border-border/60 bg-background/75 backdrop-blur-xl' : 'bg-transparent',
      className,
    )}>
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2 font-display text-base font-bold tracking-tight text-foreground">{brand}</div>
        <div className="hidden items-center gap-1 md:flex">
          {links.map(l => (
            <a key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              {l.label}
            </a>
          ))}
        </div>
        <div className="hidden md:block">{cta}</div>
        <button className="rounded-md p-2 text-foreground md:hidden" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="overflow-hidden border-b border-border bg-background/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 pb-6 pt-2">
              {links.map(l => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                  {l.label}
                </a>
              ))}
              {cta && <div className="mt-3">{cta}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export function Footer({ brand, description, columns = [], note, className }: {
  brand: React.ReactNode; description?: string
  columns?: { title: string; links: { label: string; href: string }[] }[]
  note?: string; className?: string
}) {
  return (
    <footer className={cn('border-t border-border bg-card/40', className)}>
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-16 md:grid-cols-5">
        <div className="col-span-2">
          <div className="flex items-center gap-2 font-display text-base font-bold tracking-tight text-foreground">{brand}</div>
          {description && <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {columns.map(col => (
          <div key={col.title}>
            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">{col.title}</div>
            <ul className="flex flex-col gap-2.5">
              {col.links.map(l => (
                <li key={l.href + l.label}>
                  <a href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {note && (
        <div className="border-t border-border/60 py-6">
          <div className="mx-auto max-w-6xl px-6 text-xs text-muted-foreground">{note}</div>
        </div>
      )}
    </footer>
  )
}

export function CTASection({ title, description, primaryCta = 'Get started', secondaryCta, onPrimary, onSecondary, className }: {
  title: string; description?: string; primaryCta?: string; secondaryCta?: string
  onPrimary?: () => void; onSecondary?: () => void; className?: string
}) {
  return (
    <Reveal className={className}>
      <div
        className="relative overflow-hidden rounded-3xl px-8 py-16 text-center md:px-16 md:py-20"
        style={{ backgroundImage: 'var(--gradient-hero, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.75)))' }}
      >
        <BackgroundGrid variant="dots" fade={false} className="opacity-20" />
        <NoiseOverlay opacity={0.07} />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-primary-foreground md:text-5xl">{title}</h2>
          {description && <p className="mt-4 text-base leading-relaxed text-primary-foreground/80 md:text-lg">{description}</p>}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={onPrimary} className="bg-background text-foreground shadow-none hover:brightness-95">{primaryCta}</Button>
            {secondaryCta && (
              <Button size="lg" variant="ghost" onClick={onSecondary} className="text-primary-foreground/90 hover:bg-primary-foreground/10 hover:text-primary-foreground">
                {secondaryCta}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  )
}

/* ===================== EDITORIAL PRECISION (2026) ====================== */
/* Mono microlabels, hairline structure, oversized editorial type — the
   "engineered precision" layer. Compose with the palette's display serif. */

export function MonoLabel({ children, accent = false, className }: {
  children?: React.ReactNode; accent?: boolean; className?: string
}) {
  return (
    <span className={cn(
      'font-mono text-[10px] font-medium uppercase tracking-[0.2em]',
      accent ? 'text-primary' : 'text-muted-foreground',
      className,
    )}>
      {children}
    </span>
  )
}

export function SectionNumber({ n, label, className }: {
  n: number | string; label?: string; className?: string
}) {
  const num = typeof n === 'number' ? (n < 10 ? '0' + String(n) : String(n)) : n
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="font-mono text-xs font-medium tracking-widest text-primary">{num}</span>
      <span aria-hidden="true" className="h-px w-10 bg-border" />
      {label && <MonoLabel>{label}</MonoLabel>}
    </div>
  )
}

export function EditorialHeadline({ eyebrow, children, align = 'left', as = 'h2', className }: {
  eyebrow?: string; children?: React.ReactNode; align?: 'left' | 'center'; as?: 'h1' | 'h2' | 'h3'; className?: string
}) {
  const Tag = as
  return (
    <div className={cn(align === 'center' ? 'text-center' : 'text-left', className)}>
      {eyebrow && <div className="mb-4"><MonoLabel accent>{eyebrow}</MonoLabel></div>}
      <Tag className="font-display font-medium tracking-tight text-foreground text-[clamp(2.25rem,5.5vw,4.75rem)] leading-[1.02] [&_em]:italic [&_em]:text-primary">
        {children}
      </Tag>
    </div>
  )
}

export function HairlineFrame({ children, ticks = true, padded = true, className }: {
  children?: React.ReactNode; ticks?: boolean; padded?: boolean; className?: string
}) {
  return (
    <div className={cn('relative border border-border', padded && 'p-6 md:p-10', className)}>
      {ticks && (
        <>
          <span aria-hidden="true" className="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-primary" />
          <span aria-hidden="true" className="absolute -right-px -top-px h-3 w-3 border-r-2 border-t-2 border-primary" />
          <span aria-hidden="true" className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary" />
          <span aria-hidden="true" className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" />
        </>
      )}
      {children}
    </div>
  )
}

export function MediaFrame({ src, alt, caption, index, ratio = '16/9', className }: {
  src: string; alt: string; caption?: string; index?: string; ratio?: string; className?: string
}) {
  return (
    <figure className={cn('group overflow-hidden border border-border bg-card', className)}>
      <div className="overflow-hidden" style={{ aspectRatio: ratio }}>
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
      </div>
      {(caption || index) && (
        <figcaption className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
          {caption && <MonoLabel>{caption}</MonoLabel>}
          {index && <span className="font-mono text-[10px] tracking-widest text-primary">{index}</span>}
        </figcaption>
      )}
    </figure>
  )
}

export function PinnedStory({ steps, visual, flip = false, className }: {
  steps: { title: string; description: string }[]; visual: React.ReactNode; flip?: boolean; className?: string
}) {
  return (
    <div className={cn('grid gap-10 md:grid-cols-2 md:gap-16', className)}>
      <div className={cn('order-1', flip && 'md:order-2')}>
        <div className="flex flex-col gap-16 md:gap-28 md:py-24">
          {steps.map((s, i) => (
            <Reveal key={s.title}>
              <SectionNumber n={i + 1} />
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{s.title}</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">{s.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
      <div className={cn('order-2', flip && 'md:order-1')}>
        <div className="md:sticky md:top-24">{visual}</div>
      </div>
    </div>
  )
}

export function DataRow({ label, value, sub, className }: {
  label: string; value: React.ReactNode; sub?: string; className?: string
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-6 border-b border-border py-3.5', className)}>
      <MonoLabel>{label}</MonoLabel>
      <span className="text-right">
        <span className="font-mono text-sm font-medium tabular-nums text-foreground">{value}</span>
        {sub && <span className="ml-2 font-mono text-[11px] text-muted-foreground">{sub}</span>}
      </span>
    </div>
  )
}

export function CursorGlow({ size = 480, opacity = 0.14, className }: {
  size?: number; opacity?: number; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    const el = ref.current ? ref.current.parentElement : null
    if (!el || reduced) return
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      setPos({ x: e.clientX - r.left, y: e.clientY - r.top })
    }
    const leave = () => setPos(null)
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave) }
  }, [reduced])
  return (
    <div ref={ref} aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {pos && (
        <div
          className="absolute rounded-full"
          style={{
            left: pos.x - size / 2, top: pos.y - size / 2, width: size, height: size,
            background: 'radial-gradient(circle, hsl(var(--primary) / ' + String(opacity) + '), transparent 65%)',
          }}
        />
      )}
    </div>
  )
}
`

// Map merged into both build pipelines (user files always win).
export const WYBER_UI_KIT_FILES: Record<string, string> = {
  [WYBER_UI_KIT_PATH]: WYBER_UI_KIT_SOURCE,
}

// Compact API reference injected into the generation system prompt — the ONLY
// view of the kit the model gets. Kept next to the source so they can't drift:
// if you change an export or prop above, update this block in the same commit
// (the test cross-checks every export name listed here exists in the source).
export const WYBER_UI_KIT_PROMPT = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WYBER UI KIT — PRE-BUILT PREMIUM COMPONENTS (USE THESE — do NOT hand-write equivalents)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The platform injects src/wyber-ui.tsx into every build: ~40 production-grade, motion-enabled components already themed by YOUR design tokens. Import them instead of writing your own buttons/cards/heroes — they make the app feel premium at zero token cost. Unused imports are tree-shaken.

Import (relative — from src/App.tsx use './wyber-ui', from src/components/* use '../wyber-ui'):
import { Button, SpotlightCard, BentoGrid, BentoCard, Reveal, Stagger, StaggerItem, SectionHeading, HeroHeadline, NoiseOverlay, StickyShowcase, ScrollStack, Parallax, SplitTextReveal, ScrollProgress, TiltCard, LiquidUnderline, Navbar, Footer, CTASection, PricingCard, TestimonialCard, FeatureCard, StatBlock, AnimatedNumber, Marquee, AuroraBackground, BackgroundGrid, GradientBorder, GlassPanel, Card, Badge, Input, Textarea, Tabs, Dialog, Accordion, Switch, Skeleton, EmptyState, MonoLabel, SectionNumber, EditorialHeadline, HairlineFrame, MediaFrame, PinnedStory, DataRow, CursorGlow, cn } from './wyber-ui'

MOTION (wrap content — everything animates in on scroll):
- <Reveal delay={0.1} y={24}>…</Reveal> — fade+rise on scroll into view.
- <Stagger><StaggerItem>…</StaggerItem>…</Stagger> — staggered children (grids, lists).
- <AnimatedNumber value={4832} prefix="$" suffix="+" decimals={0} /> — counts up in view.
- <Marquee speed={30} reverse pauseOnHover>…logos…</Marquee> — infinite scroll row.

PRIMITIVES:
- <Button variant="primary|secondary|outline|ghost|destructive" size="sm|md|lg"> — spring hover/press built in.
- <Badge variant="default|outline|solid|destructive">, <Input>, <Textarea>, <Skeleton className="h-4 w-32">, <Switch checked onChange>
- <Card hover>…</Card>, <GlassPanel> (frosted glass), <EmptyState icon={<Icon/>} title description action={<Button/>}>
- <Tabs tabs={[{id,label}]} active onChange> — animated segmented control.
- <Dialog open onClose title>…</Dialog> — animated modal w/ backdrop + Escape.
- <Accordion items={[{title, content}]} /> — animated FAQ/accordion.

PREMIUM SURFACES & BACKDROPS:
- <SpotlightCard> — mouse-tracking spotlight card (hero feature cards).
- <GradientBorder contentClassName="p-8"> — animated rotating gradient border.
- <AuroraBackground /> — animated aurora blobs + built-in film grain; put inside a relative hero section.
- <BackgroundGrid variant="dots|lines" /> — subtle pattern overlay for heroes/sections.
- <NoiseOverlay opacity={0.05} /> — film-grain texture; add to gradient panels/dark sections so surfaces feel physical, not synthetic.
- <HeroHeadline>Ship <em>beautiful</em> apps</HeroHeadline> — fluid oversized display type (up to ~6.5rem); <em> renders as an italic primary-colored accent. Use for hero H1s instead of text-5xl.

SCROLL STORYTELLING (the layer that makes a page PERFORM, not just scroll):
- <StickyShowcase items={[{title, description, visual}]} /> — Apple-style pinned walkthrough: section pins and crossfades through 3-4 items as the user scrolls. THE cinematic centerpiece; use exactly once per landing page.
- <ScrollStack items={[<div className="p-8">…</div>, …]} /> — cards pin and stack with offset while scrolling (process steps, case studies).
- <Parallax speed={0.3}>…</Parallax> — subtle scroll depth; wrap hero images/visuals.
- <SplitTextReveal text="Crafted for modern teams" /> — per-word rise reveal; use inside section titles.
- <ScrollProgress /> — thin top scroll-progress bar; add once on long landing pages.
- <TiltCard maxTilt={8}> — pointer-tracking 3D tilt (featured pricing tier, product highlight).
- <LiquidUnderline href="#"> — animated underline links (inline/footer links).

EDITORIAL PRECISION (the 2026 layer — mono microlabels + hairline structure + oversized editorial type):
- <MonoLabel accent>Est. 2026</MonoLabel> — 10px uppercase tracked JetBrains Mono microlabel; THE eyebrow/caption/meta treatment (replaces plain text-xs labels).
- <SectionNumber n={1} label="The problem" /> — editorial 01/02/03 section marker with hairline rule; open numbered sections with it.
- <EditorialHeadline eyebrow="Manifesto" as="h2">Design is <em>the</em> product</EditorialHeadline> — oversized editorial display heading (section-scale sibling of HeroHeadline); <em> renders as an italic primary-colored serif accent — use it on ONE word.
- <HairlineFrame ticks> — 1px-precision bordered frame with corner ticks; frame a figure, spec panel, or manifesto block ("engineered" look).
- <MediaFrame src="{{wyber-image: …}}" alt caption="Fig. 01 — Process" index="01" ratio="16/9" /> — image in a 1px frame with a mono caption bar; the editorial way to place {{wyber-image}} shots.
- <PinnedStory steps={[{title, description}]} visual={<MediaFrame …/>} flip /> — sticky visual + numbered scrolling steps; calmer sibling of StickyShowcase for process/how-it-works.
- <DataRow label="Latency" value="42ms" sub="p99" /> — spec-sheet key/value row with hairline divider; stack for specs, facts, pricing details.
- <CursorGlow /> — pointer-following primary glow inside a relative dark hero/section; subtle, disabled for reduced-motion users.

SECTIONS (compose full pages fast):
- <Navbar brand={<>logo</>} links={[{label,href}]} cta={<Button/>} /> — fixed, glass-on-scroll, mobile menu. Add pt-16 to page content.
- <SectionHeading eyebrow="Features" title="…" description="…" align="center|left" />
- <BentoGrid><BentoCard title description icon colSpan={2} rowSpan={2}>…</BentoCard>…</BentoGrid>
- <FeatureCard icon={<Icon size={18}/>} title description />
- <StatBlock value={98.3} suffix="%" decimals={1} label="Uptime" delta={12.4} />
- <TestimonialCard quote name role rating={5} />
- <PricingCard name price="$29" period="/month" description features={[…]} featured onSelect />
- <CTASection title description primaryCta secondaryCta onPrimary />
- <Footer brand description columns={[{title, links:[{label,href}]}]} note="© 2026 …" />

RULES:
- PREFER kit components over hand-rolled ones for: nav, footer, pricing, testimonials, FAQ, stats, feature grids, CTAs, modals, tabs.
- Landing pages: hero gets <AuroraBackground/> or <BackgroundGrid/> behind it; every section wrapped in <Reveal> or <Stagger>; use <BentoGrid> for feature showcases.
- You may still write custom components for app-specific UI (tables, kanban, calendars) — style them with the same tokens.
- Do NOT create src/wyber-ui.tsx yourself, do NOT re-export from it, do NOT import it in index.css.`
