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
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence, useInView, useScroll, useTransform, useReducedMotion, useMotionValue, useSpring } from 'framer-motion'
import clsx from 'clsx'
import { Menu, X, Check, ChevronDown, Star, ArrowUpRight, ArrowDownRight, GripVertical, Search, UploadCloud, ArrowRight, Lock, Wifi, BatteryFull, SignalHigh, Plus, Copy, Play, Smartphone, PlayCircle, ChevronRight, ChevronsLeft, ArrowUp, AlertTriangle, CheckCircle2, XCircle, Info, ChevronLeft, Cookie, Bell, Loader2 } from 'lucide-react'

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


/* ============================== HERO & HEADLINE FX ============================== */

export function TextScramble({ text, as = 'span', charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*+=', revealSpeed = 32, once = true, className }: {
  text: string
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p'
  charset?: string
  revealSpeed?: number
  once?: boolean
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once, margin: '-60px' })
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(text)
  const startedRef = useRef(false)

  useEffect(() => {
    if (reduced) { setDisplay(text); return }
    if (!inView || startedRef.current) return
    startedRef.current = true
    const totalFrames = Math.max(text.length * 3, 18)
    let frame = 0
    const id = setInterval(() => {
      frame++
      const revealCount = Math.floor((frame / totalFrames) * text.length)
      let out = ''
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') { out += ' '; continue }
        if (i < revealCount) { out += text[i]; continue }
        // deterministic pseudo-random glyph per cell/frame — avoids Math.random hydration risk
        const n = Math.abs(Math.sin((i + 1) * 12.9898 + frame * 78.233)) % 1
        out += charset[Math.floor(n * charset.length)]
      }
      setDisplay(out)
      if (revealCount >= text.length) { setDisplay(text); clearInterval(id) }
    }, revealSpeed)
    return () => clearInterval(id)
  }, [inView, reduced, text, charset, revealSpeed])

  const Tag = as as any
  return (
    <Tag ref={ref} className={cn('inline-block font-mono tabular-nums', className)}>
      {display}
    </Tag>
  )
}

export function GradientText({ children, as = 'span', speed = 6, className }: {
  children?: React.ReactNode
  as?: 'span' | 'h1' | 'h2' | 'h3'
  speed?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  const Tag = as as any
  return (
    <Tag
      className={cn('inline-block bg-clip-text text-transparent', !reduced && 'animate-gradient-move', className)}
      style={{
        backgroundImage: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))',
        backgroundSize: '200% 100%',
        animationDuration: speed + 's',
      }}
    >
      {children}
    </Tag>
  )
}

export function Typewriter({ text, typingSpeed = 45, deletingSpeed = 28, pauseDuration = 1400, loop = true, className, caretClassName }: {
  text: string | string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
  loop?: boolean
  className?: string
  caretClassName?: string
}) {
  const words = Array.isArray(text) ? text : [text]
  const reduced = useReducedMotion()
  const [wordIndex, setWordIndex] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const currentWord = words[wordIndex % words.length]
  const isLastWord = wordIndex === words.length - 1
  const finished = !loop && isLastWord && !deleting && charCount === currentWord.length

  useEffect(() => {
    if (reduced || finished) return
    let timeout: ReturnType<typeof setTimeout>
    const canAdvance = loop || !isLastWord

    if (!deleting && charCount < currentWord.length) {
      timeout = setTimeout(() => setCharCount(c => c + 1), typingSpeed)
    } else if (!deleting && charCount === currentWord.length && canAdvance) {
      timeout = setTimeout(() => setDeleting(true), pauseDuration)
    } else if (deleting && charCount > 0) {
      timeout = setTimeout(() => setCharCount(c => c - 1), deletingSpeed)
    } else if (deleting && charCount === 0) {
      setDeleting(false)
      setWordIndex(i => (i + 1) % words.length)
    }
    return () => clearTimeout(timeout)
  }, [charCount, deleting, currentWord, isLastWord, words.length, reduced, finished, typingSpeed, deletingSpeed, pauseDuration, loop])

  const display = reduced ? words[0] : currentWord.slice(0, charCount)

  return (
    <span className={cn('font-mono', className)}>
      {display}
      <span
        aria-hidden="true"
        className={cn('ml-0.5 inline-block h-[1em] w-[2px] -mb-[0.1em] bg-primary align-text-bottom', !reduced && 'animate-pulse', caretClassName)}
      />
    </span>
  )
}

export function WordCycler({ words, interval = 2200, className, wordClassName }: {
  words: string[]
  interval?: number
  className?: string
  wordClassName?: string
}) {
  const [index, setIndex] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || words.length < 2) return
    const id = setInterval(() => setIndex(i => (i + 1) % words.length), interval)
    return () => clearInterval(id)
  }, [words.length, interval, reduced])

  const widest = words.reduce((a, b) => (b.length > a.length ? b : a), '')

  return (
    <span className={cn('relative inline-grid overflow-hidden align-bottom', className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[index]}
          initial={reduced ? false : { y: 24, opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={reduced ? undefined : { y: -24, opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.45, ease: easeOut }}
          className={cn('col-start-1 row-start-1 inline-block text-primary', wordClassName)}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
      {/* invisible widest word reserves layout width/height so the swap never shifts surrounding text */}
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 inline-block whitespace-nowrap">
        {widest}
      </span>
    </span>
  )
}

const hero_DIGITS = '0123456789'.split('')

function hero_flapSequence(target: string, steps: number): string[] {
  const targetIndex = hero_DIGITS.indexOf(target)
  if (targetIndex === -1) return [target]
  const seq: string[] = []
  for (let s = steps; s >= 0; s--) {
    seq.push(hero_DIGITS[(targetIndex - s + 100) % 10])
  }
  return seq
}

export function SplitFlapCounter({ value, flapDuration = 90, className, cellClassName }: {
  value: string | number
  flapDuration?: number
  className?: string
  cellClassName?: string
}) {
  const target = String(value)
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState<string[]>(target.split(''))
  const prevTarget = useRef(target)

  useEffect(() => {
    if (reduced) { setDisplay(target.split('')); prevTarget.current = target; return }
    if (prevTarget.current === target) return
    prevTarget.current = target
    const chars = target.split('')
    // stagger each cell's flap-count by index so digits settle in a cascade, not all at once
    const sequences = chars.map((c, i) => hero_flapSequence(c, 3 + (i % 4)))
    const maxLen = Math.max(...sequences.map(s => s.length))
    let frame = 0
    const id = setInterval(() => {
      frame++
      setDisplay(chars.map((c, i) => {
        const seq = sequences[i]
        return seq[Math.min(frame, seq.length - 1)]
      }))
      if (frame >= maxLen - 1) clearInterval(id)
    }, flapDuration)
    return () => clearInterval(id)
  }, [target, reduced, flapDuration])

  return (
    <span className={cn('inline-flex gap-1', className)}>
      {display.map((ch, i) => (
        <span
          key={i}
          className={cn(
            'relative inline-flex h-[1.4em] w-[0.9em] items-center justify-center overflow-hidden rounded-[3px] border border-border bg-card font-mono text-[1em] font-bold tabular-nums text-card-foreground shadow-sm',
            cellClassName,
          )}
        >
          <AnimatePresence initial={false}>
            <motion.span
              key={ch + '-' + i}
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ duration: flapDuration / 1000, ease: 'easeIn' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {ch}
            </motion.span>
          </AnimatePresence>
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-background/40" />
        </span>
      ))}
    </span>
  )
}

export function AnnouncementBar({ message, icon, ctaLabel, ctaHref, dismissible = true, marquee = false, storageKey = 'wyber-announcement', className }: {
  message: React.ReactNode
  icon?: React.ReactNode
  ctaLabel?: string
  ctaHref?: string
  dismissible?: boolean
  marquee?: boolean
  storageKey?: string
  className?: string
}) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!dismissible) return
    // read after mount only — keeps SSR/client first paint identical, avoids hydration mismatch
    try {
      if (window.localStorage.getItem(storageKey) === '1') setVisible(false)
    } catch {
      /* storage unavailable, ignore */
    }
  }, [dismissible, storageKey])

  function dismiss() {
    setVisible(false)
    try { window.localStorage.setItem(storageKey, '1') } catch { /* ignore */ }
  }

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: easeOut }}
          className={cn('relative overflow-hidden border-b border-border bg-primary text-primary-foreground', className)}
        >
          <div className="flex items-center gap-2 px-4 py-2 text-sm">
            {icon && <span className="shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>}
            <div className={cn('min-w-0 flex-1', marquee && 'overflow-hidden whitespace-nowrap')}>
              {marquee ? (
                <span className="inline-block animate-marquee">{message}</span>
              ) : (
                <span className="block truncate">{message}</span>
              )}
            </div>
            {ctaLabel && ctaHref && (
              <a href={ctaHref} className="shrink-0 font-medium underline underline-offset-2 hover:opacity-80">
                {ctaLabel}
              </a>
            )}
            {dismissible && (
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss announcement"
                className="shrink-0 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function HeroOrbit({ center, items, radius = 140, duration = 18, className }: {
  center?: React.ReactNode
  items: Array<{ icon: React.ReactNode; angle?: number }>
  radius?: number
  duration?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <div className={cn('relative mx-auto flex items-center justify-center', className)} style={{ width: radius * 2 + 64, height: radius * 2 + 64 }}>
      <div aria-hidden="true" className="absolute rounded-full border border-dashed border-border/50" style={{ width: radius * 2, height: radius * 2 }} />
      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-card-foreground shadow-lg">
        {center}
      </div>
      {items.map((item, i) => {
        const angle = item.angle ?? (360 / items.length) * i
        const dur = duration + (i % 3) * 2
        // negative animation-delay phase-shifts a single shared keyframe so items appear evenly spaced without per-angle keyframes
        const delay = -((angle / 360) * dur)
        return (
          <div
            key={i}
            className={cn('absolute inset-0', !reduced && 'animate-spin')}
            style={
              reduced
                ? { transform: 'rotate(' + angle + 'deg)' }
                : { animationDuration: dur + 's', animationDelay: delay + 's', animationTimingFunction: 'linear' }
            }
          >
            <div
              className="absolute left-1/2 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-popover text-popover-foreground shadow-md [&_svg]:h-4 [&_svg]:w-4"
              style={
                reduced
                  ? { transform: 'translate(-50%, -50%) rotate(' + -angle + 'deg)' }
                  : {
                      transform: 'translate(-50%, -50%)',
                      animation: 'spin ' + dur + 's linear infinite reverse',
                      animationDelay: delay + 's',
                    }
              }
            >
              {item.icon}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function hero_TrafficLights({ className }: { className?: string }) {
  return (
    <div className={cn('flex shrink-0 gap-1.5', className)}>
      <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
      <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
      <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
    </div>
  )
}

export function BrowserFrame({ url = 'yourapp.com', children, className, contentClassName }: {
  url?: string
  children?: React.ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-foreground/10', className)}>
      <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
        <hero_TrafficLights />
        <div className="mx-auto flex w-full max-w-[min(60%,320px)] items-center justify-center gap-1.5 rounded-md border border-border/60 bg-background/60 px-3 py-1 font-mono text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span className="truncate">{url}</span>
        </div>
        <div className="w-[38px] shrink-0" aria-hidden="true" />
      </div>
      <div className={cn('bg-background', contentClassName)}>{children}</div>
    </div>
  )
}

export function TerminalFrame({ lines, prompt = '$', typingSpeed = 28, lineDelay = 480, loop = false, title = 'zsh', className, contentClassName }: {
  lines: Array<string | { text: string; output?: boolean }>
  prompt?: string
  typingSpeed?: number
  lineDelay?: number
  loop?: boolean
  title?: string
  className?: string
  contentClassName?: string
}) {
  const normalized = lines.map(l => (typeof l === 'string' ? { text: l, output: false } : l))
  const reduced = useReducedMotion()
  const [lineIndex, setLineIndex] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [done, setDone] = useState(reduced)

  useEffect(() => {
    if (reduced) return
    if (lineIndex >= normalized.length) {
      if (loop) {
        const t = setTimeout(() => { setLineIndex(0); setCharCount(0) }, lineDelay * 2)
        return () => clearTimeout(t)
      }
      setDone(true)
      return
    }
    const current = normalized[lineIndex]
    if (charCount < current.text.length) {
      const t = setTimeout(() => setCharCount(c => c + 1), current.output ? 4 : typingSpeed)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => { setLineIndex(i => i + 1); setCharCount(0) }, lineDelay)
    return () => clearTimeout(t)
  }, [lineIndex, charCount, normalized, reduced, loop, typingSpeed, lineDelay])

  const visibleLines = reduced
    ? normalized
    : normalized.slice(0, lineIndex).concat(
        lineIndex < normalized.length
          ? [{ text: normalized[lineIndex].text.slice(0, charCount), output: normalized[lineIndex].output }]
          : [],
      )

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-foreground/10', className)}>
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <hero_TrafficLights />
        <span className="mx-auto font-mono text-[11px] text-muted-foreground">{title}</span>
        <div className="w-[38px] shrink-0" aria-hidden="true" />
      </div>
      <div className={cn('space-y-1.5 bg-background px-4 py-4 font-mono text-[13px] leading-relaxed', contentClassName)}>
        {visibleLines.map((l, i) => (
          <div key={i} className="flex gap-2">
            {!l.output && <span className="shrink-0 text-primary">{prompt}</span>}
            <span className={cn('whitespace-pre-wrap break-all', l.output ? 'text-muted-foreground' : 'text-foreground')}>
              {l.text}
              {i === visibleLines.length - 1 && !done && (
                <span aria-hidden="true" className="ml-0.5 inline-block h-[1em] w-[7px] -mb-[0.15em] animate-pulse bg-primary align-text-bottom" />
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PhoneFrame({ children, statusBar = true, className, screenClassName }: {
  children?: React.ReactNode
  statusBar?: boolean
  className?: string
  screenClassName?: string
}) {
  return (
    <div className={cn('relative mx-auto w-[300px] rounded-[2.75rem] border border-border bg-card p-2.5 shadow-2xl shadow-foreground/15', className)}>
      <span aria-hidden="true" className="absolute -left-px top-24 h-8 w-1 rounded-l-full bg-border" />
      <span aria-hidden="true" className="absolute -right-px top-20 h-12 w-1 rounded-r-full bg-border" />
      <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[2.1rem] bg-background">
        {statusBar && (
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 pt-2.5 font-mono text-[11px] font-medium text-foreground">
            <span>9:41</span>
            <div className="flex items-center gap-1 [&_svg]:h-3 [&_svg]:w-3">
              <SignalHigh />
              <Wifi />
              <BatteryFull />
            </div>
          </div>
        )}
        <div aria-hidden="true" className="absolute left-1/2 top-2 z-20 h-6 w-28 -translate-x-1/2 rounded-full bg-foreground/90" />
        <div className={cn('h-full w-full overflow-y-auto', screenClassName)}>{children}</div>
      </div>
    </div>
  )
}

export function SplitHero({ left, right, reverse = false, gap = 'lg', align = 'center', className }: {
  left?: React.ReactNode
  right?: React.ReactNode
  reverse?: boolean
  gap?: 'md' | 'lg'
  align?: 'center' | 'start'
  className?: string
}) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const parallaxY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [24, -24])

  return (
    <div
      ref={ref}
      className={cn(
        'grid grid-cols-1 lg:grid-cols-2',
        gap === 'lg' ? 'gap-12 lg:gap-20' : 'gap-8 lg:gap-12',
        align === 'center' ? 'items-center' : 'items-start',
        reverse && 'lg:[&>*:first-child]:order-2',
        className,
      )}
    >
      <div className="relative z-10">{left}</div>
      <motion.div style={{ y: parallaxY }} className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: easeOut }}
        >
          {right}
        </motion.div>
      </motion.div>
    </div>
  )
}

/* ============================== CARDS & SURFACES ============================== */

export function HolographicCard({ children, className, intensity = 0.6 }: {
  children?: React.ReactNode; className?: string; intensity?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [hovering, setHovering] = useState(false)
  const reducedMotion = useReducedMotion()

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current ? ref.current.getBoundingClientRect() : null
    if (!rect) return
    setPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 })
  }

  const rotateX = reducedMotion || !hovering ? 0 : (50 - pos.y) / 6
  const rotateY = reducedMotion || !hovering ? 0 : (pos.x - 50) / 6

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      animate={{ rotateX, rotateY }}
      transition={springFast}
      style={{ transformStyle: 'preserve-3d', transformPerspective: 900 }}
      className={cn('relative overflow-hidden rounded-xl border border-border bg-card p-6 text-card-foreground', className)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: hovering ? intensity : intensity * 0.35,
          background:
            'radial-gradient(120% 120% at ' + pos.x + '% ' + pos.y + '%, hsl(var(--primary) / 0.35), transparent 45%), ' +
            'linear-gradient(115deg, transparent 20%, hsl(var(--accent) / 0.3) ' + pos.x + '%, transparent ' + (pos.x + 20) + '%), ' +
            'linear-gradient(230deg, transparent 30%, hsl(var(--secondary) / 0.25) ' + pos.y + '%, transparent ' + (pos.y + 25) + '%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{ opacity: hovering ? 0.5 : 0, boxShadow: 'inset 0 1px 0 hsl(var(--foreground) / 0.08)' }}
      />
      <div className="relative" style={{ transform: 'translateZ(24px)' }}>{children}</div>
    </motion.div>
  )
}

export function ClayCard({ children, className, tone = 'raised' }: {
  children?: React.ReactNode; className?: string; tone?: 'raised' | 'pressed'
}) {
  const raisedShadow =
    '8px 8px 20px hsl(var(--foreground) / 0.14), -8px -8px 20px hsl(var(--background) / 0.9), inset 1px 1px 1px hsl(var(--background) / 0.6), inset -2px -2px 6px hsl(var(--foreground) / 0.06)'
  const pressedShadow =
    'inset 6px 6px 14px hsl(var(--foreground) / 0.14), inset -6px -6px 14px hsl(var(--background) / 0.85)'
  return (
    <div
      className={cn('rounded-[28px] bg-card p-6 text-card-foreground transition-shadow duration-300', className)}
      style={{ boxShadow: tone === 'pressed' ? pressedShadow : raisedShadow }}
    >
      {children}
    </div>
  )
}

export function FlipCard({ front, back, className, flipOnClick = false, height = 280 }: {
  front?: React.ReactNode; back?: React.ReactNode; className?: string; flipOnClick?: boolean; height?: number
}) {
  const [flipped, setFlipped] = useState(false)
  const reducedMotion = useReducedMotion()

  return (
    <div
      className={cn('relative w-full', flipOnClick && 'cursor-pointer', className)}
      style={{ height: height + 'px', perspective: '1600px' }}
      onClick={() => flipOnClick && setFlipped(v => !v)}
      onMouseEnter={() => !flipOnClick && setFlipped(true)}
      onMouseLeave={() => !flipOnClick && setFlipped(false)}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: reducedMotion ? 0 : flipped ? 180 : 0 }}
        transition={reducedMotion ? { duration: 0 } : springFast}
      >
        <div
          className="absolute inset-0 overflow-hidden rounded-xl border border-border bg-card p-6 text-card-foreground"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>
        <div
          className="absolute inset-0 overflow-hidden rounded-xl border border-border bg-card p-6 text-card-foreground"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  )
}

export function ExpandableCard({ title, summary, children, className, defaultExpanded = false }: {
  title?: React.ReactNode; summary?: React.ReactNode; children?: React.ReactNode; className?: string; defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  return (
    <motion.div
      layout
      transition={springFast}
      className={cn('overflow-hidden rounded-xl border border-border bg-card text-card-foreground', className)}
    >
      <motion.button
        layout="position"
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center justify-between gap-4 p-6 text-left"
      >
        <div className="min-w-0">
          <div className="text-base font-semibold">{title}</div>
          {summary ? <div className="mt-1 text-sm text-muted-foreground">{summary}</div> : null}
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={springFast}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </motion.button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/60 px-6 pb-6 pt-4 text-sm text-muted-foreground">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function StackedDepthCards({ children, className, depth = 3, offset = 10 }: {
  children?: React.ReactNode; className?: string; depth?: number; offset?: number
}) {
  const reducedMotion = useReducedMotion()
  const backCount = Math.max(0, Math.min(depth - 1, 3))
  const rotations = [-5, 4, -3]
  return (
    <div className={cn('relative', className)}>
      {Array.from({ length: backCount }).map((_, i) => {
        const layer = backCount - i
        return (
          <div
            key={i}
            aria-hidden="true"
            className="absolute inset-0 rounded-xl border border-border bg-card"
            style={{
              transform: reducedMotion
                ? 'translateY(' + layer * offset + 'px)'
                : 'translateY(' + layer * offset + 'px) rotate(' + rotations[i % rotations.length] + 'deg)',
              opacity: 1 - layer * 0.18,
              zIndex: i,
            }}
          />
        )
      })}
      <motion.div
        whileHover={reducedMotion ? undefined : { y: -offset / 2, rotate: -1.5 }}
        transition={springFast}
        className="relative rounded-xl border border-border bg-card p-6 text-card-foreground shadow-[0_12px_32px_hsl(var(--foreground)/0.1)]"
        style={{ zIndex: backCount + 1 }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export function ImageRevealCard({ image, title, subtitle, className, aspect = 'aspect-[4/5]' }: {
  image?: React.ReactNode; title?: React.ReactNode; subtitle?: React.ReactNode; className?: string; aspect?: string
}) {
  const [hovering, setHovering] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={cn('group relative overflow-hidden rounded-xl border border-border bg-card', aspect, className)}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ scale: hovering ? 1.08 : 1, clipPath: hovering ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 28% 0%)' }}
        transition={{ duration: 0.5, ease: easeOut }}
      >
        {image}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, transparent 40%, hsl(var(--foreground) / 0.75) 100%)' }}
        />
      </motion.div>
      <motion.div className="absolute inset-x-0 bottom-0 p-5" animate={{ y: hovering ? 0 : 10 }} transition={springFast}>
        <div className="text-lg font-semibold text-background">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-background/70">{subtitle}</div> : null}
      </motion.div>
    </div>
  )
}

export function GlowOrbCard({ children, className, orbPosition = 'top-right', orbColor = 'primary' }: {
  children?: React.ReactNode; className?: string
  orbPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  orbColor?: 'primary' | 'accent' | 'secondary'
}) {
  const [hovering, setHovering] = useState(false)
  const posClass =
    orbPosition === 'top-left' ? '-left-10 -top-10' :
    orbPosition === 'bottom-right' ? '-bottom-10 -right-10' :
    orbPosition === 'bottom-left' ? '-bottom-10 -left-10' :
    '-right-10 -top-10'
  const colorClass = orbColor === 'accent' ? 'bg-accent' : orbColor === 'secondary' ? 'bg-secondary' : 'bg-primary'
  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={cn('relative overflow-hidden rounded-xl border border-border bg-card p-6 text-card-foreground', className)}
    >
      <motion.div
        aria-hidden="true"
        className={cn('pointer-events-none absolute h-40 w-40 rounded-full blur-3xl', posClass, colorClass)}
        animate={{ opacity: hovering ? 0.55 : 0.25, scale: hovering ? 1.3 : 1 }}
        transition={{ duration: 0.5, ease: easeOut }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

export function MasonryGrid({ children, className, columns = 3, gap = 16 }: {
  children?: React.ReactNode; className?: string; columns?: 2 | 3 | 4; gap?: number
}) {
  const colClass =
    columns === 2 ? 'columns-1 sm:columns-2' :
    columns === 4 ? 'columns-2 sm:columns-3 lg:columns-4' :
    'columns-1 sm:columns-2 lg:columns-3'
  return (
    <div className={cn('w-full', colClass, className)} style={{ columnGap: gap + 'px' }}>
      {React.Children.map(children, (child, i) => (
        <div key={i} className="break-inside-avoid" style={{ marginBottom: gap + 'px' }}>
          {child}
        </div>
      ))}
    </div>
  )
}

export function RibbonCard({ children, className, ribbonText = 'New', ribbonSide = 'right' }: {
  children?: React.ReactNode; className?: string; ribbonText?: string; ribbonSide?: 'left' | 'right'
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-border bg-card p-6 text-card-foreground', className)}>
      <div
        aria-hidden="true"
        className={cn('absolute top-0 flex h-24 w-24 items-start justify-center', ribbonSide === 'left' ? '-left-12' : '-right-12')}
      >
        <span
          className={cn(
            'mt-6 block w-40 bg-primary py-1 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-[0_2px_8px_hsl(var(--foreground)/0.15)]',
            ribbonSide === 'left' ? '-rotate-45' : 'rotate-45',
          )}
        >
          {ribbonText}
        </span>
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}

export function CheckerboardGrid({ children, className, columns = 3, offset = 32 }: {
  children?: React.ReactNode; className?: string; columns?: 2 | 3 | 4; offset?: number
}) {
  const items = React.Children.toArray(children)
  const colClass = columns === 2 ? 'grid-cols-2' : columns === 4 ? 'grid-cols-4' : 'grid-cols-3'
  return (
    <div className={cn('grid gap-6', colClass, className)}>
      {items.map((child, i) => (
        <div key={i} style={{ transform: i % 2 === 1 ? 'translateY(' + offset + 'px)' : undefined }}>
          {child}
        </div>
      ))}
    </div>
  )
}

export function NotchCard({ children, className, notchSize = 24, notchCorner = 'top-right' }: {
  children?: React.ReactNode; className?: string; notchSize?: number
  notchCorner?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}) {
  const n = notchSize
  const clipPaths: Record<string, string> = {
    'top-right': 'polygon(0 0, calc(100% - ' + n + 'px) 0, 100% ' + n + 'px, 100% 100%, 0 100%)',
    'top-left': 'polygon(' + n + 'px 0, 100% 0, 100% 100%, 0 100%, 0 ' + n + 'px)',
    'bottom-right': 'polygon(0 0, 100% 0, 100% calc(100% - ' + n + 'px), calc(100% - ' + n + 'px) 100%, 0 100%)',
    'bottom-left': 'polygon(0 0, 100% 0, 100% 100%, ' + n + 'px 100%, 0 calc(100% - ' + n + 'px))',
  }
  return (
    <div
      className={cn('relative border border-border bg-card p-6 text-card-foreground', className)}
      style={{ clipPath: clipPaths[notchCorner] }}
    >
      {children}
    </div>
  )
}

/* ============================== NAVIGATION ============================== */

// ============================================================
// FloatingDockNav — macOS Dock-style floating pill nav bar.
// Icons magnify as the cursor approaches them.
// ============================================================

type FloatingDockItem = {
  id: string
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
}

function FloatingDockIcon({ item, mouseX, size, magnification, distance }: {
  item: FloatingDockItem
  mouseX: any
  size: number
  magnification: number
  distance: number
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [hovered, setHovered] = useState(false)
  const reduced = useReducedMotion()

  const widthSync = useTransform(mouseX, (val: number) => {
    const rect = ref.current ? ref.current.getBoundingClientRect() : null
    if (!rect) return size
    const center = rect.left + rect.width / 2
    const diff = Math.abs(val - center)
    if (diff > distance) return size
    const strength = 1 - diff / distance
    return size + (size * magnification - size) * strength
  })
  const width = useSpring(widthSync, reduced ? { stiffness: 1000, damping: 100 } : springFast)

  return (
    <div className="relative flex flex-col items-center">
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={springFast}
            className="absolute -top-9 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 font-mono text-[10px] text-popover-foreground shadow-lg"
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        ref={ref}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => { item.onClick?.(); if (item.href) window.location.href = item.href }}
        style={{ width, height: width }}
        aria-label={item.label}
        className="flex items-center justify-center rounded-xl border border-border bg-secondary text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        {item.icon}
      </motion.button>
    </div>
  )
}

export function FloatingDockNav({ items, className, size = 44, magnification = 1.7, distance = 140 }: {
  items: FloatingDockItem[]
  className?: string
  size?: number
  magnification?: number
  distance?: number
}) {
  const mouseX = useMotionValue(Infinity)
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit items-end gap-2 rounded-2xl border border-border bg-card/80 px-3 py-2 shadow-2xl backdrop-blur-xl',
        className,
      )}
      onMouseMove={(e: React.MouseEvent) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
    >
      {items.map(item => (
        <FloatingDockIcon key={item.id} item={item} mouseX={mouseX} size={size} magnification={magnification} distance={distance} />
      ))}
    </div>
  )
}

// ============================================================
// CommandPalette — Cmd+K style search/command modal.
// Parent controls the open prop and wires the keybind that flips it.
// ============================================================

type CommandPaletteItem = {
  id: string
  label: string
  group?: string
  icon?: React.ReactNode
  shortcut?: string
  keywords?: string
  onSelect?: () => void
}

export function CommandPalette({
  open,
  onClose,
  items,
  placeholder = 'Type a command or search…',
  emptyMessage = 'No results found.',
  className,
}: {
  open: boolean
  onClose: () => void
  items: CommandPaletteItem[]
  placeholder?: string
  emptyMessage?: string
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(it => (it.label + ' ' + (it.keywords || '')).toLowerCase().includes(q))
  }, [items, query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActiveIndex(0)
    const t = setTimeout(() => inputRef.current?.focus(), 10)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(i => Math.min(i + 1, filtered.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(i => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const item = filtered[activeIndex]
        if (item) {
          item.onSelect?.()
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, filtered, activeIndex, onClose])

  const groups = useMemo(() => {
    const map = new Map<string, CommandPaletteItem[]>()
    for (const it of filtered) {
      const key = it.group || ''
      const arr = map.get(key) || []
      arr.push(it)
      map.set(key, arr)
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={springFast}
            className={cn(
              'relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl',
              className,
            )}
          >
            <div className="flex items-center gap-2 border-b border-border px-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">esc</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">{emptyMessage}</div>
              )}
              {groups.map(([group, groupItems]) => (
                <div key={group || 'ungrouped'} className="mb-1 last:mb-0">
                  {group && (
                    <div className="px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      {group}
                    </div>
                  )}
                  {groupItems.map(item => {
                    const globalIndex = filtered.indexOf(item)
                    const active = globalIndex === activeIndex
                    return (
                      <button
                        key={item.id}
                        onMouseEnter={() => setActiveIndex(globalIndex)}
                        onClick={() => {
                          item.onSelect?.()
                          onClose()
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                          active ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/60',
                        )}
                      >
                        {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
                        <span className="flex-1">{item.label}</span>
                        {item.shortcut && <span className="font-mono text-[10px] text-muted-foreground">{item.shortcut}</span>}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ============================================================
// MegaMenu — nav item revealing a wide multi-column dropdown.
// ============================================================

type MegaMenuSection = {
  heading: string
  links: { label: string; href: string; description?: string }[]
}

export function MegaMenu({ label, sections, className }: {
  label: string
  sections: MegaMenuSection[]
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {label}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={springFast}>
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={springFast}
            className="absolute left-1/2 top-full z-50 mt-3 w-[min(90vw,640px)] -translate-x-1/2 rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl"
          >
            <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(' + sections.length + ', minmax(0, 1fr))' }}>
              {sections.map(section => (
                <div key={section.heading}>
                  <div className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {section.heading}
                  </div>
                  <ul className="space-y-2.5">
                    {section.links.map(link => (
                      <li key={link.href}>
                        <a href={link.href} className="block text-sm text-foreground transition-colors hover:text-primary">
                          {link.label}
                          {link.description && (
                            <span className="mt-0.5 block text-xs text-muted-foreground">{link.description}</span>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// BottomTabBar — fixed mobile bottom tab bar with a sliding
// active indicator.
// ============================================================

type BottomTabItem = {
  id: string
  label: string
  icon: React.ReactNode
  onClick?: () => void
}

export function BottomTabBar({ items, active, onChange, className }: {
  items: BottomTabItem[]
  active: string
  onChange?: (id: string) => void
  className?: string
}) {
  return (
    <nav className={cn('fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/90 backdrop-blur-xl', className)}>
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(item => {
          const isActive = item.id === active
          return (
            <button
              key={item.id}
              onClick={() => {
                onChange?.(item.id)
                item.onClick?.()
              }}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-1 px-2 py-2.5 text-[11px] transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-tab-bar-indicator"
                  transition={springFast}
                  className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary"
                />
              )}
              <span className={cn('transition-transform', isActive && 'scale-110')}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ============================================================
// Breadcrumbs — simple breadcrumb trail with chevron separators.
// ============================================================

type BreadcrumbItem = { label: string; href?: string }

export function Breadcrumbs({ items, className, separator }: {
  items: BreadcrumbItem[]
  className?: string
  separator?: React.ReactNode
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex flex-wrap items-center gap-1.5 text-sm', className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className="text-muted-foreground/50">{separator || <ChevronRight className="h-3.5 w-3.5" />}</span>
            )}
            {item.href && !isLast ? (
              <a href={item.href} className="text-muted-foreground transition-colors hover:text-foreground">
                {item.label}
              </a>
            ) : (
              <span className={cn(isLast ? 'font-medium text-foreground' : 'text-muted-foreground')}>{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}

// ============================================================
// SidebarNav — collapsible vertical sidebar with an animated
// active-item indicator bar.
// ============================================================

type SidebarNavItem = {
  id: string
  label: string
  icon?: React.ReactNode
  onClick?: () => void
}

export function SidebarNav({ items, active, onChange, collapsed = false, onCollapsedChange, className }: {
  items: SidebarNavItem[]
  active: string
  onChange?: (id: string) => void
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  className?: string
}) {
  return (
    <motion.div
      animate={{ width: collapsed ? 72 : 232 }}
      transition={springFast}
      className={cn('flex h-full flex-col border-r border-border bg-card p-2', className)}
    >
      <div className="flex-1 space-y-1">
        {items.map(item => {
          const isActive = item.id === active
          return (
            <button
              key={item.id}
              onClick={() => {
                onChange?.(item.id)
                item.onClick?.()
              }}
              className={cn(
                'relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-nav-fill"
                  transition={springFast}
                  className="absolute inset-0 rounded-lg bg-accent"
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="sidebar-nav-bar"
                  transition={springFast}
                  className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                />
              )}
              {item.icon && <span className="relative z-10 shrink-0">{item.icon}</span>}
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="relative z-10 overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </div>
      {onCollapsedChange && (
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={springFast}>
            <ChevronsLeft className="h-3.5 w-3.5" />
          </motion.span>
        </button>
      )}
    </motion.div>
  )
}

// ============================================================
// PillTabNav — horizontal segmented pill tab switcher with a
// sliding background pill behind the active tab.
// ============================================================

type PillTab = { id: string; label: string }

export function PillTabNav({ tabs, active, onChange, className }: {
  tabs: PillTab[]
  active: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-full border border-border bg-muted p-1', className)}>
      {tabs.map(tab => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {isActive && (
              <motion.div
                layoutId="pill-tab-nav-indicator"
                transition={springFast}
                className="absolute inset-0 -z-10 rounded-full bg-primary"
              />
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

// ============================================================
// BackToTop — floating scroll-to-top button that fades and
// scales in past a scroll threshold.
// ============================================================

export function BackToTop({ threshold = 400, className }: { threshold?: number; className?: string }) {
  const [visible, setVisible] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold)
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.7, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 12 }}
          transition={springFast}
          onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })}
          aria-label="Back to top"
          className={cn(
            'fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-90',
            className,
          )}
        >
          <ArrowUp className="h-4 w-4" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// ============================================================
// ProgressTabNav — tab nav whose active underline width tracks
// a 0-1 progress value (drive it from scroll position, a form
// wizard step, etc).
// ============================================================

type ProgressTab = { id: string; label: string }

export function ProgressTabNav({ tabs, active, onChange, progress = 0, className }: {
  tabs: ProgressTab[]
  active: string
  onChange: (id: string) => void
  progress?: number
  className?: string
}) {
  const clamped = Math.min(1, Math.max(0, progress))
  return (
    <div className={cn('flex items-center gap-6 border-b border-border', className)}>
      {tabs.map(tab => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative pb-3 pt-1 text-sm font-medium transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-border" />
            {isActive && (
              <motion.span
                className="absolute bottom-0 left-0 h-0.5 bg-primary"
                animate={{ width: (clamped * 100) + '%' }}
                transition={springFast}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ============================================================
// CondensingNavbar — navbar that visibly shrinks height and
// padding, blurs its background, and scales its logo down once
// the page scrolls past the condensedAt threshold.
// ============================================================

export function CondensingNavbar({ brand, links = [], cta, condensedAt = 80, className }: {
  brand?: React.ReactNode
  links?: { label: string; href: string }[]
  cta?: React.ReactNode
  condensedAt?: number
  className?: string
}) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > condensedAt)
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [condensedAt])

  return (
    <motion.nav
      animate={{
        height: scrolled ? 56 : 96,
        backgroundColor: scrolled ? 'hsl(var(--background) / 0.85)' : 'hsl(var(--background) / 0)',
      }}
      transition={springFast}
      className={cn(
        'fixed inset-x-0 top-0 z-50 backdrop-blur-xl',
        scrolled ? 'border-b border-border shadow-sm' : 'border-b border-transparent',
        className,
      )}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <motion.div
          animate={{ scale: scrolled ? 0.8 : 1 }}
          transition={springFast}
          style={{ transformOrigin: 'left center' }}
          className="font-semibold text-foreground"
        >
          {brand}
        </motion.div>
        <div className="hidden items-center gap-8 md:flex">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </div>
        <div className="hidden md:block">{cta}</div>
        <button aria-label="Menu" className="text-foreground md:hidden" onClick={() => setOpen(o => !o)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </motion.nav>
  )
}

/* ============================== BACKGROUNDS & AMBIENT FX ============================== */

// ============================================================================
// Backgrounds & Ambient FX
// Deterministic seeded pseudo-random helper (no Math.random at render/mount).
// Prefixed to avoid collisions with helpers from other fragment categories.
// ============================================================================
function bgFxSeeded(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

// ----------------------------------------------------------------------------
// MeshGradient — dense, colorful layered blob mesh that slowly drifts/scales.
// ----------------------------------------------------------------------------
export function MeshGradient({
  className,
  blobCount = 4,
  intensity = 0.22,
  speed = 'slow',
}: {
  className?: string
  blobCount?: number
  intensity?: number
  speed?: 'slow' | 'medium' | 'fast'
}) {
  const reduced = useReducedMotion()
  const durations = { slow: 26, medium: 18, fast: 11 }
  const baseDuration = durations[speed]
  const colorPrefixes = ['hsl(var(--primary) / ', 'hsl(var(--accent) / ', 'hsl(var(--secondary) / ', 'hsl(var(--primary) / ']
  const positions = [
    { top: '-12%', left: '2%', size: 34 },
    { top: '8%', left: '54%', size: 30 },
    { top: '48%', left: '-8%', size: 32 },
    { top: '54%', left: '58%', size: 28 },
  ]
  const count = Math.max(1, Math.min(blobCount, positions.length))
  const blobs = Array.from({ length: count }, (_, i) => i)
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {blobs.map((i) => {
        const pos = positions[i]
        const opacity = intensity * (0.7 + bgFxSeeded(i + 1) * 0.6)
        const duration = baseDuration + bgFxSeeded(i + 11) * 8
        const delay = bgFxSeeded(i + 21) * baseDuration
        return (
          <div
            key={i}
            className={cn('absolute rounded-full blur-3xl', !reduced && 'animate-drift')}
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.size + 'rem',
              height: pos.size + 'rem',
              background: colorPrefixes[i % colorPrefixes.length] + String(opacity) + ')',
              animationDuration: duration + 's',
              animationDelay: '-' + delay + 's',
            }}
          />
        )
      })}
    </div>
  )
}

// ----------------------------------------------------------------------------
// StarField — deterministically scattered dots that twinkle on staggered delays.
// ----------------------------------------------------------------------------
export function StarField({
  className,
  count = 60,
  color = 'foreground',
}: {
  className?: string
  count?: number
  color?: 'foreground' | 'primary'
}) {
  const reduced = useReducedMotion()
  const colorVar = color === 'primary' ? '--primary' : '--foreground'
  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const x = bgFxSeeded(i * 3.1 + 1) * 100
      const y = bgFxSeeded(i * 7.7 + 2) * 100
      const size = 1 + bgFxSeeded(i * 5.3 + 3) * 1.6
      const delay = bgFxSeeded(i * 2.9 + 4) * 6
      const duration = 2.5 + bgFxSeeded(i * 4.1 + 5) * 3
      const opacity = 0.3 + bgFxSeeded(i * 6.6 + 6) * 0.5
      return { x, y, size, delay, duration, opacity }
    })
  }, [count])
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {stars.map((s, i) => (
        <span
          key={i}
          className={cn('absolute rounded-full', !reduced && 'animate-twinkle')}
          style={{
            left: s.x + '%',
            top: s.y + '%',
            width: s.size + 'px',
            height: s.size + 'px',
            background: 'hsl(var(' + colorVar + ') / ' + String(s.opacity) + ')',
            animationDuration: s.duration + 's',
            animationDelay: '-' + s.delay + 's',
          }}
        />
      ))}
    </div>
  )
}

// ----------------------------------------------------------------------------
// SpotlightSection — dot-grid revealed brightly near the cursor, dim elsewhere.
// ----------------------------------------------------------------------------
export function SpotlightSection({
  className,
  size = 520,
  dotColor = 'foreground',
}: {
  className?: string
  size?: number
  dotColor?: 'foreground' | 'primary'
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    if (reduced) return
    const el = wrapRef.current?.parentElement
    if (!el) return
    const move = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
    const leave = () => setPos(null)
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    return () => {
      el.removeEventListener('mousemove', move)
      el.removeEventListener('mouseleave', leave)
    }
  }, [reduced])
  const colorVar = dotColor === 'primary' ? '--primary' : '--foreground'
  const dimImage = 'radial-gradient(hsl(var(' + colorVar + ') / 0.06) 1px, transparent 1px)'
  const brightImage = 'radial-gradient(hsl(var(' + colorVar + ') / 0.5) 1px, transparent 1px)'
  const maskImage = pos
    ? 'radial-gradient(circle ' + size / 2 + 'px at ' + pos.x + 'px ' + pos.y + 'px, hsl(var(--foreground)) 0%, transparent 100%)'
    : 'radial-gradient(circle 0px at 0px 0px, transparent 0%, transparent 100%)'
  return (
    <div ref={wrapRef} aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="absolute inset-0" style={{ backgroundImage: dimImage, backgroundSize: '28px 28px' }} />
      {!reduced && pos && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: brightImage,
            backgroundSize: '28px 28px',
            WebkitMaskImage: maskImage,
            maskImage: maskImage,
          }}
        />
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// AnimatedGridLines — thin grid lines that slowly pan across the section.
// ----------------------------------------------------------------------------
export function AnimatedGridLines({
  className,
  size = 48,
  opacity = 0.08,
  direction = 'diagonal',
}: {
  className?: string
  size?: number
  opacity?: number
  direction?: 'diagonal' | 'horizontal' | 'vertical'
}) {
  const reduced = useReducedMotion()
  const lineColor = 'hsl(var(--foreground) / ' + String(opacity) + ')'
  const bgImage =
    direction === 'horizontal'
      ? 'linear-gradient(' + lineColor + ' 1px, transparent 1px)'
      : direction === 'vertical'
        ? 'linear-gradient(90deg, ' + lineColor + ' 1px, transparent 1px)'
        : 'linear-gradient(' + lineColor + ' 1px, transparent 1px), linear-gradient(90deg, ' + lineColor + ' 1px, transparent 1px)'
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div
        className={cn('absolute -inset-1/4', !reduced && 'animate-grid-pan')}
        style={{ backgroundImage: bgImage, backgroundSize: size + 'px ' + size + 'px' }}
      />
    </div>
  )
}

// ----------------------------------------------------------------------------
// LiquidBlob — single large organic blob that continuously morphs shape.
// ----------------------------------------------------------------------------
export function LiquidBlob({
  className,
  size = 420,
  opacity = 0.35,
}: {
  className?: string
  size?: number
  opacity?: number
}) {
  const reduced = useReducedMotion()
  const gradient =
    'radial-gradient(circle at 30% 30%, hsl(var(--primary) / ' +
    String(opacity) +
    '), hsl(var(--accent) / ' +
    String(opacity * 0.6) +
    ') 60%, transparent 80%)'
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div
        className={cn('absolute left-1/2 top-1/2 blur-2xl', !reduced && 'animate-blob-morph', reduced && 'rounded-full')}
        style={{
          width: size + 'px',
          height: size + 'px',
          marginLeft: -size / 2,
          marginTop: -size / 2,
          background: gradient,
        }}
      />
    </div>
  )
}

// ----------------------------------------------------------------------------
// DiagonalStripes — repeating diagonal stripe pattern, optionally slow-scrolling.
// ----------------------------------------------------------------------------
export function DiagonalStripes({
  className,
  animated = true,
  stripeWidth = 14,
  opacity = 0.06,
}: {
  className?: string
  animated?: boolean
  stripeWidth?: number
  opacity?: number
}) {
  const reduced = useReducedMotion()
  const shouldAnimate = animated && !reduced
  const stripeColor = 'hsl(var(--foreground) / ' + String(opacity) + ')'
  const half = stripeWidth / 2
  const bgImage =
    'repeating-linear-gradient(45deg, ' +
    stripeColor +
    ' 0px, ' +
    stripeColor +
    ' ' +
    half +
    'px, transparent ' +
    half +
    'px, transparent ' +
    stripeWidth +
    'px)'
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className={cn('absolute -inset-1/4', shouldAnimate && 'animate-stripe-pan')} style={{ backgroundImage: bgImage }} />
    </div>
  )
}

// ----------------------------------------------------------------------------
// WavesBackground — layered SVG waves drifting horizontally at different speeds.
// ----------------------------------------------------------------------------
export function WavesBackground({
  className,
  layers = 3,
}: {
  className?: string
  layers?: number
}) {
  const reduced = useReducedMotion()
  const configs = [
    { opacity: 0.18, duration: 22, colorVar: '--primary' },
    { opacity: 0.14, duration: 30, colorVar: '--accent' },
    { opacity: 0.1, duration: 40, colorVar: '--secondary' },
  ]
  const active = configs.slice(0, Math.max(1, Math.min(layers, configs.length)))
  const path = 'M0,60 C150,110 350,10 500,60 C650,110 850,10 1000,60 C1150,110 1350,10 1440,60 L1440,200 L0,200 Z'
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-64 overflow-hidden', className)}>
      {active.map((layer, i) => (
        <svg
          key={i}
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          className={cn('absolute bottom-0 left-0 h-full w-full', !reduced && 'animate-wave-drift')}
          style={{
            bottom: -i * 6,
            animationDuration: layer.duration + 's',
            animationDelay: '-' + i * 4 + 's',
            animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
          }}
        >
          <path d={path} fill={'hsl(var(' + layer.colorVar + ') / ' + String(layer.opacity) + ')'} />
        </svg>
      ))}
    </div>
  )
}

// ----------------------------------------------------------------------------
// VignetteOverlay — radial vignette using theme tokens, sits above other layers.
// ----------------------------------------------------------------------------
export function VignetteOverlay({
  className,
  strength = 0.65,
  mode = 'dark',
}: {
  className?: string
  strength?: number
  mode?: 'dark' | 'light'
}) {
  const token = mode === 'light' ? 'hsl(var(--card))' : 'hsl(var(--background))'
  const stop = Math.round(100 - (1 - strength) * 30)
  const gradient = 'radial-gradient(ellipse at center, transparent 40%, ' + token + ' ' + stop + '%)'
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{ background: gradient, opacity: strength }}
    />
  )
}

// ----------------------------------------------------------------------------
// DottedSpotlight — magnetic dot grid: dots scale up as the cursor nears them.
// ----------------------------------------------------------------------------
export function DottedSpotlight({
  className,
  rows = 9,
  cols = 14,
  radius = 140,
  dotColor = 'foreground',
}: {
  className?: string
  rows?: number
  cols?: number
  radius?: number
  dotColor?: 'foreground' | 'primary'
}) {
  const reduced = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<(HTMLSpanElement | null)[]>([])
  const rafRef = useRef<number | null>(null)
  const colorVar = dotColor === 'primary' ? '--primary' : '--foreground'
  const total = Math.max(1, rows) * Math.max(1, cols)
  useEffect(() => {
    if (reduced) return
    const el = wrapRef.current?.parentElement
    if (!el) return
    const update = (mx: number, my: number, rect: DOMRect) => {
      dotsRef.current.forEach((dot) => {
        if (!dot) return
        const dx = Number(dot.dataset.x) * rect.width - mx
        const dy = Number(dot.dataset.y) * rect.height - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        const t = Math.max(0, 1 - dist / radius)
        dot.style.transform = 'scale(' + String(1 + t * 1.8) + ')'
        dot.style.opacity = String(0.15 + t * 0.75)
      })
    }
    const move = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => update(mx, my, rect))
    }
    const leave = () => {
      dotsRef.current.forEach((dot) => {
        if (!dot) return
        dot.style.transform = 'scale(1)'
        dot.style.opacity = '0.18'
      })
    }
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    return () => {
      el.removeEventListener('mousemove', move)
      el.removeEventListener('mouseleave', leave)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [reduced, radius])
  return (
    <div ref={wrapRef} aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {Array.from({ length: total }, (_, i) => {
        const c = cols > 0 ? cols : 1
        const col = i % c
        const row = Math.floor(i / c)
        const x = (col + 0.5) / c
        const y = (row + 0.5) / Math.max(1, rows)
        return (
          <span
            key={i}
            ref={(node) => {
              dotsRef.current[i] = node
            }}
            data-x={x}
            data-y={y}
            className="absolute rounded-full transition-transform duration-150 ease-out"
            style={{
              left: x * 100 + '%',
              top: y * 100 + '%',
              width: '4px',
              height: '4px',
              marginLeft: '-2px',
              marginTop: '-2px',
              background: 'hsl(var(' + colorVar + ') / 0.18)',
              opacity: 0.18,
            }}
          />
        )
      })}
    </div>
  )
}

// ----------------------------------------------------------------------------
// GlowOrbsField — several small blurred orbs floating independently at fixed
// seeded positions and speeds.
// ----------------------------------------------------------------------------
export function GlowOrbsField({
  className,
  count = 6,
  size = 90,
  opacity = 0.28,
}: {
  className?: string
  count?: number
  size?: number
  opacity?: number
}) {
  const reduced = useReducedMotion()
  const colorPrefixes = ['hsl(var(--primary) / ', 'hsl(var(--accent) / ', 'hsl(var(--secondary) / ']
  const orbs = useMemo(() => {
    const n = Math.max(1, Math.min(count, 8))
    return Array.from({ length: n }, (_, i) => {
      const x = bgFxSeeded(i * 8.13 + 1) * 90 + 5
      const y = bgFxSeeded(i * 5.47 + 2) * 90 + 5
      const s = size * (0.6 + bgFxSeeded(i * 3.71 + 3) * 0.8)
      const duration = 6 + bgFxSeeded(i * 9.19 + 4) * 8
      const delay = bgFxSeeded(i * 2.53 + 5) * 6
      const distance = 14 + bgFxSeeded(i * 6.61 + 6) * 18
      const o = opacity * (0.6 + bgFxSeeded(i * 4.37 + 7) * 0.7)
      return { x, y, s, duration, delay, distance, o, color: colorPrefixes[i % colorPrefixes.length] }
    })
  }, [count, size, opacity])
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {orbs.map((orb, i) => (
        <div
          key={i}
          className={cn('absolute rounded-full blur-2xl', !reduced && 'animate-float-orb')}
          style={
            {
              left: orb.x + '%',
              top: orb.y + '%',
              width: orb.s + 'px',
              height: orb.s + 'px',
              background: orb.color + String(orb.o) + ')',
              animationDuration: orb.duration + 's',
              animationDelay: '-' + orb.delay + 's',
              '--float-distance': orb.distance + 'px',
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

/* ============================== TYPOGRAPHY & TEXT FX ============================== */

import type { MotionValue } from 'framer-motion'

// ---------------------------------------------------------------------------
// HighlightMarker
// ---------------------------------------------------------------------------

export function HighlightMarker({ children, color = 'primary', delay = 0, className }: {
  children?: React.ReactNode; color?: 'primary' | 'accent'; delay?: number; className?: string
}) {
  const reduced = useReducedMotion()
  const markClass = color === 'accent' ? 'bg-accent/35' : 'bg-primary/30'
  return (
    <span className={cn('relative inline-block', className)}>
      <span className="relative z-10">{children}</span>
      <motion.span
        aria-hidden="true"
        className={cn('absolute inset-x-0 bottom-[0.06em] h-[0.4em] origin-left rounded-[2px]', markClass)}
        initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: reduced ? 0 : 0.6, delay, ease: easeOut }}
      />
    </span>
  )
}

// ---------------------------------------------------------------------------
// DropCap
// ---------------------------------------------------------------------------

export function DropCap({ children, className }: {
  children?: string; className?: string
}) {
  if (!children) return null
  const first = children.charAt(0)
  const rest = children.slice(1)
  return (
    <p className={cn('text-base leading-relaxed text-foreground', className)}>
      <span className="float-left mr-2 mt-1 select-none font-display font-bold leading-[0.8] text-primary text-[4.5rem]">
        {first}
      </span>
      {rest}
    </p>
  )
}

// ---------------------------------------------------------------------------
// TextMaskReveal
// ---------------------------------------------------------------------------

function MaskRevealWord({ word, index, total, progress, isLast }: {
  word: string; index: number; total: number; progress: MotionValue<number>; isLast: boolean
}) {
  const start = total > 1 ? index / total : 0
  const end = total > 1 ? (index + 1) / total : 1
  const opacity = useTransform(progress, [start, end], [0.16, 1])
  const blurAmount = useTransform(progress, [start, end], [7, 0])
  const filter = useTransform(blurAmount, (b) => 'blur(' + b.toFixed(2) + 'px)')
  return (
    <motion.span
      className="inline-block"
      style={{ opacity, filter, marginRight: isLast ? 0 : '0.28em' }}
    >
      {word}
    </motion.span>
  )
}

export function TextMaskReveal({ text, className }: {
  text: string; className?: string
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'start 0.2'] })
  const words = useMemo(() => text.split(' '), [text])
  return (
    <p ref={ref} className={cn('text-foreground', className)}>
      {words.map((w, i) => (
        <MaskRevealWord key={i} word={w} index={i} total={words.length} progress={scrollYProgress} isLast={i === words.length - 1} />
      ))}
    </p>
  )
}

// ---------------------------------------------------------------------------
// RotatingBadgeText
// ---------------------------------------------------------------------------

function rotatingBadgeId(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return 'rbt-' + h.toString(36)
}

export function RotatingBadgeText({ text, icon, size = 96, duration = 12, className }: {
  text: string; icon?: React.ReactNode; size?: number; duration?: number; className?: string
}) {
  const reduced = useReducedMotion()
  const pathId = useMemo(() => rotatingBadgeId(text + String(size)), [text, size])
  const radius = size / 2 - 10
  const cx = size / 2
  const cy = size / 2
  const d = 'M ' + cx + ',' + cy + ' m -' + radius + ',0 a ' + radius + ',' + radius + ' 0 1,1 ' + (radius * 2) + ',0 a ' + radius + ',' + radius + ' 0 1,1 -' + (radius * 2) + ',0'
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <motion.svg
        viewBox={'0 0 ' + size + ' ' + size}
        width={size}
        height={size}
        className="absolute inset-0"
        animate={reduced ? undefined : { rotate: 360 }}
        transition={reduced ? undefined : { duration, repeat: Infinity, ease: 'linear' }}
      >
        <defs>
          <path id={pathId} d={d} fill="none" />
        </defs>
        <text className="fill-muted-foreground font-mono uppercase" style={{ fontSize: size * 0.09, letterSpacing: '0.15em' }}>
          <textPath href={'#' + pathId} startOffset="0%">
            {text}
          </textPath>
        </text>
      </motion.svg>
      <div className="relative z-10 flex items-center justify-center rounded-full bg-primary/10 text-primary" style={{ width: size * 0.4, height: size * 0.4 }}>
        {icon ?? <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// KineticHeadline
// ---------------------------------------------------------------------------

export function KineticHeadline({ text, by = 'word', delay = 0, as = 'h2', className }: {
  text: string; by?: 'word' | 'letter'; delay?: number; as?: 'h1' | 'h2' | 'h3'; className?: string
}) {
  const reduced = useReducedMotion()
  const Tag = as
  const units = by === 'letter' ? text.split('') : text.split(' ')
  return (
    <Tag className={cn('font-display font-bold tracking-tight text-foreground', className)}>
      {units.map((u, i) => (
        <motion.span
          key={i}
          className="inline-block will-change-transform"
          style={{ marginRight: by === 'word' ? '0.28em' : 0 }}
          initial={reduced ? undefined : { opacity: 0, scale: 0.4, rotate: i % 2 === 0 ? -14 : 14, y: 24 }}
          whileInView={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 0, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ ...springFast, delay: delay + i * 0.045 }}
        >
          {u === ' ' && by === 'letter' ? ' ' : u}
        </motion.span>
      ))}
    </Tag>
  )
}

// ---------------------------------------------------------------------------
// BlurReveal
// ---------------------------------------------------------------------------

export function BlurReveal({ children, blur = 12, delay = 0, className }: {
  children?: React.ReactNode; blur?: number; delay?: number; className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, filter: 'blur(' + blur + 'px)', y: 16 }}
      whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      viewport={{ once: true, margin: '-15%' }}
      transition={{ duration: 0.7, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// GradientUnderline
// ---------------------------------------------------------------------------

export function GradientUnderline({ children, href, className }: {
  children?: React.ReactNode; href?: string; className?: string
}) {
  const content = (
    <span className="group relative inline-block cursor-pointer text-foreground">
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-[-0.14em] h-[2px] origin-left scale-x-0 rounded-full transition-transform duration-300 ease-out group-hover:scale-x-100"
        style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))' }}
      />
    </span>
  )
  if (href) {
    return (
      <a href={href} className={cn('no-underline', className)}>
        {content}
      </a>
    )
  }
  return <span className={className}>{content}</span>
}

// ---------------------------------------------------------------------------
// NumberTicker
// ---------------------------------------------------------------------------

function TickerDigit({ digit, height }: { digit: string; height: number }) {
  const reduced = useReducedMotion()
  return (
    <span className="relative inline-block overflow-hidden align-bottom" style={{ height, width: '0.62em' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
          className="absolute inset-0 flex items-center justify-center tabular-nums"
          initial={reduced ? { opacity: 0 } : { y: height, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { y: -height, opacity: 0 }}
          transition={springFast}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function NumberTicker({ value, prefix = '', suffix = '', decimals = 0, fontSize = 40, className }: {
  value: number; prefix?: string; suffix?: string; decimals?: number; fontSize?: number; className?: string
}) {
  const formatted = value.toFixed(decimals)
  const chars = formatted.split('')
  const height = fontSize * 1.1
  return (
    <span
      className={cn('inline-flex items-baseline font-display font-bold tabular-nums text-foreground', className)}
      style={{ fontSize }}
    >
      {prefix ? <span className="mr-0.5">{prefix}</span> : null}
      {chars.map((c, i) => (
        /[0-9]/.test(c) ? (
          <TickerDigit key={i} digit={c} height={height} />
        ) : (
          <span key={i} className="inline-block" style={{ width: '0.32em' }}>
            {c}
          </span>
        )
      ))}
      {suffix ? <span className="ml-0.5">{suffix}</span> : null}
    </span>
  )
}

// ---------------------------------------------------------------------------
// QuoteMark
// ---------------------------------------------------------------------------

export function QuoteMark({ position = 'top-left', size = 120, className }: {
  position?: 'top-left' | 'top-right'; size?: number; className?: string
}) {
  return (
    <svg
      viewBox="0 0 100 80"
      width={size}
      height={size * 0.8}
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute select-none text-primary/10',
        position === 'top-left' ? '-left-4 -top-8' : '-right-4 -top-8 scale-x-[-1]',
        className
      )}
      fill="currentColor"
    >
      <path d="M14 0C6 6 0 16 0 30c0 14 10 24 22 24 10 0 18-8 18-18S32 20 24 20c-2 0-4 .4-6 1.2C20 12 28 4 38 0zM66 0c-8 6-14 16-14 30 0 14 10 24 22 24 10 0 18-8 18-18s-8-16-16-16c-2 0-4 .4-6 1.2C72 12 80 4 90 0z" />
    </svg>
  )
}

/* ============================== FORMS & INPUTS ============================== */

export function FloatingLabelInput({
  label,
  value,
  onChange,
  type = 'text',
  name,
  id,
  required,
  disabled,
  error,
  className,
  ...rest
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  name?: string
  id?: string
  required?: boolean
  disabled?: boolean
  error?: string
  className?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onFocus' | 'onBlur' | 'id' | 'name' | 'type' | 'required' | 'disabled'>) {
  const [focused, setFocused] = useState(false)
  const reduceMotion = useReducedMotion()
  const active = focused || value.length > 0
  const inputId = id || name || label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={cn('relative', className)}>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-invalid={!!error}
        aria-describedby={error ? inputId + '-error' : undefined}
        className={cn(
          'peer h-12 w-full rounded-lg border bg-background px-3 pt-3 text-sm text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
          error ? 'border-destructive' : 'border-input'
        )}
        {...rest}
      />
      <motion.label
        htmlFor={inputId}
        initial={false}
        animate={reduceMotion ? undefined : {
          y: active ? -21 : 0,
          scale: active ? 0.82 : 1,
        }}
        transition={springFast}
        style={reduceMotion ? { transform: active ? 'translateY(-21px) scale(0.82)' : 'none' } : undefined}
        className={cn(
          'pointer-events-none absolute left-3 top-1/2 origin-left -translate-y-1/2 text-sm text-muted-foreground transition-colors',
          active && 'text-primary'
        )}
      >
        {label}{required ? ' *' : ''}
      </motion.label>
      {error && (
        <p id={inputId + '-error'} className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled,
  className,
}: {
  length?: number
  value: string
  onChange: (code: string) => void
  disabled?: boolean
  className?: string
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = useMemo(() => {
    const arr = new Array(length).fill('')
    for (let i = 0; i < length; i++) arr[i] = value[i] || ''
    return arr
  }, [value, length])

  const setDigit = (index: number, digit: string) => {
    const chars = value.split('')
    chars[index] = digit
    const next = chars.join('').slice(0, length)
    onChange(next)
  }

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/[^0-9]/g, '').slice(-1)
    setDigit(index, digit)
    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        refs.current[index - 1]?.focus()
        setDigit(index - 1, '')
      } else {
        setDigit(index, '')
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length)
    onChange(pasted)
    const focusIndex = Math.min(pasted.length, length - 1)
    refs.current[focusIndex]?.focus()
  }

  return (
    <div className={cn('flex items-center gap-2', className)} role="group" aria-label="One-time passcode">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { refs.current[index] = el }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          aria-label={'Digit ' + (index + 1)}
          className={cn(
            'h-12 w-10 rounded-lg border border-input bg-background text-center text-lg font-medium text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
            digit && 'border-primary'
          )}
        />
      ))}
    </div>
  )
}

const PASSWORD_STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']

export function PasswordStrengthMeter({
  score,
  segments = 4,
  className,
}: {
  score: number
  segments?: number
  className?: string
}) {
  const clamped = Math.max(0, Math.min(segments, score))
  const labelIndex = Math.max(0, Math.min(PASSWORD_STRENGTH_LABELS.length - 1, score))
  const label = PASSWORD_STRENGTH_LABELS[labelIndex]
  const filledColor = clamped <= 1 ? 'bg-destructive' : clamped === 2 ? 'bg-accent' : 'bg-primary'

  return (
    <div className={cn('w-full', className)}>
      <div className="flex gap-1.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <motion.div
              className={cn('h-full rounded-full', i < clamped ? filledColor : '')}
              initial={false}
              animate={{ width: i < clamped ? '100%' : '0%' }}
              transition={springFast}
            />
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function RangeSlider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  formatValue,
  disabled,
  className,
}: {
  min?: number
  max?: number
  step?: number
  value: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
  disabled?: boolean
  className?: string
}) {
  const [dragging, setDragging] = useState(false)
  const percent = ((value - min) / (max - min)) * 100
  const display = formatValue ? formatValue(value) : String(value)

  return (
    <div className={cn('relative w-full pt-6', className)}>
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.85 }}
            transition={springFast}
            className="absolute -top-1 -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-sm"
            style={{ left: percent + '%' }}
          >
            {display}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative h-1.5 w-full rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: percent + '%' }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onFocus={() => setDragging(true)}
          onBlur={() => setDragging(false)}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
        />
        <motion.div
          className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full bg-primary shadow ring-2 ring-background"
          animate={{ left: percent + '%' }}
          transition={springFast}
        />
      </div>
    </div>
  )
}

export function ChipToggleGroup({
  options,
  value,
  onChange,
  className,
}: {
  options: { id: string; label: string }[]
  value: string[]
  onChange: (next: string[]) => void
  className?: string
}) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="group">
      {options.map((option) => {
        const selected = value.includes(option.id)
        return (
          <motion.button
            key={option.id}
            type="button"
            role="checkbox"
            aria-checked={selected}
            onClick={() => toggle(option.id)}
            whileTap={{ scale: 0.94 }}
            initial={false}
            animate={{ scale: selected ? 1.02 : 1 }}
            transition={springFast}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-secondary text-secondary-foreground hover:border-input'
            )}
          >
            {option.label}
          </motion.button>
        )
      })}
    </div>
  )
}

export function SearchWithSuggestions({
  value,
  onChange,
  suggestions,
  onSelect,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  suggestions: { id: string; label: string; description?: string }[]
  onSelect: (suggestion: { id: string; label: string; description?: string }) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setActiveIndex(0)
  }, [suggestions])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const picked = suggestions[activeIndex]
      if (picked) {
        onSelect(picked)
        setOpen(false)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={value}
          placeholder={placeholder || 'Search...'}
          onChange={(e) => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls="search-suggestions-list"
          className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            id="search-suggestions-list"
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={springFast}
            className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg"
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => { onSelect(suggestion); setOpen(false) }}
                className={cn(
                  'cursor-pointer rounded-md px-3 py-2 text-sm transition-colors',
                  index === activeIndex ? 'bg-accent text-accent-foreground' : 'text-popover-foreground'
                )}
              >
                <div className="font-medium">{suggestion.label}</div>
                {suggestion.description && (
                  <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FileDropzone({
  onFiles,
  accept,
  multiple = true,
  disabled,
  className,
}: {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  className?: string
}) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFiles(files)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) inputRef.current?.click() }}
      aria-disabled={disabled}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all',
        dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border bg-muted/30 hover:border-input',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      style={dragOver ? { boxShadow: '0 0 0 4px hsl(var(--primary) / 0.12)' } : undefined}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : []
          if (files.length) onFiles(files)
          e.target.value = ''
        }}
      />
      <motion.div
        animate={{ y: dragOver ? -2 : 0, scale: dragOver ? 1.08 : 1 }}
        transition={springFast}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground"
      >
        <UploadCloud className="h-5 w-5" />
      </motion.div>
      <div>
        <p className="text-sm font-medium text-foreground">Drop files here or click to browse</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{accept ? accept : 'Any file type'}{multiple ? '' : ' - single file'}</p>
      </div>
    </div>
  )
}

export function StepperWizard({
  steps,
  currentIndex,
  className,
}: {
  steps: { id: string; label: string }[]
  currentIndex: number
  className?: string
}) {
  return (
    <ol className={cn('flex w-full items-center', className)}>
      {steps.map((step, index) => {
        const completed = index < currentIndex
        const active = index === currentIndex
        return (
          <li key={step.id} className={cn('flex items-center', index < steps.length - 1 ? 'flex-1' : '')}>
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={{ scale: active ? 1.1 : 1 }}
                transition={springFast}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold',
                  completed
                    ? 'border-primary bg-primary text-primary-foreground'
                    : active
                    ? 'border-primary text-primary'
                    : 'border-border text-muted-foreground'
                )}
              >
                {completed ? <Check className="h-4 w-4" /> : index + 1}
              </motion.div>
              <span className={cn('text-xs font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="relative mx-2 h-px flex-1 bg-border">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary"
                  initial={false}
                  animate={{ width: completed ? '100%' : '0%' }}
                  transition={springFast}
                />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export function ColorSwatchPicker({
  colors,
  value,
  onChange,
  className,
}: {
  colors: string[]
  value: string
  onChange: (color: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap gap-2.5', className)} role="radiogroup">
      {colors.map((color) => {
        const selected = value === color
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color}
            onClick={() => onChange(color)}
            className="relative flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-105"
          >
            <span className="h-6 w-6 rounded-full border border-border/50" style={{ backgroundColor: color }} />
            {selected && (
              <motion.span
                layoutId="swatch-ring"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={springFast}
                className="absolute inset-0 rounded-full ring-2 ring-ring ring-offset-2 ring-offset-background"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

export function CustomCheckbox({
  checked,
  onChange,
  label,
  id,
  disabled,
  className,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  id?: string
  disabled?: boolean
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <label htmlFor={checkboxId} className={cn('inline-flex items-center gap-2.5 select-none', disabled ? 'opacity-50' : 'cursor-pointer', className)}>
      <button
        id={checkboxId}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(!checked) } }}
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          checked ? 'border-primary bg-primary' : 'border-input bg-background'
        )}
      >
        <motion.svg
          viewBox="0 0 16 16"
          className="h-3 w-3 text-primary-foreground"
          initial={false}
          animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={reduceMotion ? { duration: 0 } : springFast}
        >
          <path
            d="M3 8.5L6.5 12L13 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </button>
      {label && <span className="text-sm text-foreground">{label}</span>}
    </label>
  )
}

export function CustomRadio({
  name,
  value,
  checkedValue,
  onChange,
  label,
  id,
  disabled,
  className,
}: {
  name: string
  value: string
  checkedValue: string
  onChange: (value: string) => void
  label?: string
  id?: string
  disabled?: boolean
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const checked = value === checkedValue
  const radioId = id || (name + '-' + value)

  return (
    <label htmlFor={radioId} className={cn('inline-flex items-center gap-2.5 select-none', disabled ? 'opacity-50' : 'cursor-pointer', className)}>
      <button
        id={radioId}
        type="button"
        role="radio"
        name={name}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(value)}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(value) } }}
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          checked ? 'border-primary' : 'border-input bg-background'
        )}
      >
        <motion.span
          initial={false}
          animate={{ scale: checked ? 1 : 0 }}
          transition={reduceMotion ? { duration: 0 } : springFast}
          className="h-2.5 w-2.5 rounded-full bg-primary"
        />
      </button>
      {label && <span className="text-sm text-foreground">{label}</span>}
    </label>
  )
}

export function NewsletterInline({
  value,
  onChange,
  onSubmit,
  placeholder,
  buttonLabel,
  className,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: (email: string) => void | Promise<void>
  placeholder?: string
  buttonLabel?: string
  className?: string
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value || status === 'loading') return
    setStatus('loading')
    await onSubmit(value)
    setStatus('success')
  }

  return (
    <div className={cn('relative min-h-[2.75rem] w-full', className)}>
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={springFast}
            className="flex h-11 items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 text-sm font-medium text-primary"
          >
            <Check className="h-4 w-4" />
            Subscribed. Check your inbox.
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={springFast}
            className="flex h-11 w-full items-stretch overflow-hidden rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring"
          >
            <input
              type="email"
              required
              value={value}
              disabled={status === 'loading'}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || 'you@example.com'}
              aria-label="Email address"
              className="min-w-0 flex-1 bg-transparent px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex items-center gap-1.5 whitespace-nowrap bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {status === 'loading' ? 'Sending...' : (buttonLabel || 'Subscribe')}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ============================== DATA DISPLAY ============================== */

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  label,
  showValue = true,
  decimals = 0,
  suffix = '%',
  className,
}: {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  showValue?: boolean
  decimals?: number
  suffix?: string
  className?: string
}) {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduceMotion = useReducedMotion()
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg ref={ref} width={size} height={size} viewBox={'0 0 ' + size + ' ' + size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: inView ? offset : circumference }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.1, ease: easeOut }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        {showValue && (
          <AnimatedNumber
            value={clamped}
            decimals={decimals}
            suffix={suffix}
            duration={1100}
            className="text-xl font-bold tracking-tight text-foreground"
          />
        )}
        {label && <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>}
      </div>
    </div>
  )
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  strokeWidth = 1.5,
  area = true,
  className,
}: {
  data: number[]
  width?: number
  height?: number
  strokeWidth?: number
  area?: boolean
  className?: string
}) {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })
  const reduceMotion = useReducedMotion()
  const points = useMemo(() => {
    if (!data.length) return [] as { x: number; y: number }[]
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const step = data.length > 1 ? width / (data.length - 1) : width
    return data.map((d, i) => ({ x: i * step, y: height - ((d - min) / range) * height }))
  }, [data, width, height])
  const linePath = useMemo(() => {
    if (!points.length) return ''
    return points.map((p, i) => (i === 0 ? 'M ' + p.x + ' ' + p.y : 'L ' + p.x + ' ' + p.y)).join(' ')
  }, [points])
  const areaPath = useMemo(() => {
    if (!points.length || !linePath) return ''
    const last = points[points.length - 1]
    const first = points[0]
    return linePath + ' L ' + last.x + ' ' + height + ' L ' + first.x + ' ' + height + ' Z'
  }, [linePath, points, height])
  const trendUp = data.length > 1 && data[data.length - 1] >= data[0]
  const strokeColor = trendUp ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'
  return (
    <svg ref={ref} width={width} height={height} viewBox={'0 0 ' + width + ' ' + height} className={cn('overflow-visible', className)}>
      {area && areaPath && (
        <motion.path
          d={areaPath}
          fill={strokeColor}
          fillOpacity={0.12}
          stroke="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: inView ? 1 : 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        />
      )}
      <motion.path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: inView ? 1 : 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.9, ease: easeOut }}
      />
    </svg>
  )
}

export function MiniBarChart({
  data,
  labels,
  height = 64,
  gap = 4,
  className,
}: {
  data: number[]
  labels?: string[]
  height?: number
  gap?: number
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const max = data.length ? Math.max(...data, 0.0001) : 1
  return (
    <div className={cn('flex items-end', className)} style={{ height, gap }}>
      {data.map((d, i) => {
        const barHeight = Math.max(4, (d / max) * height)
        return (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.5" style={{ height }}>
            <motion.div
              className="w-full min-w-[3px] rounded-t-sm bg-primary/70 transition-colors hover:bg-primary"
              initial={{ height: 0 }}
              animate={{ height: barHeight }}
              transition={reduceMotion ? { duration: 0 } : { ...springFast, delay: i * 0.05 }}
            />
            {labels && labels[i] && (
              <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{labels[i]}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function AvatarStack({
  avatars,
  max = 4,
  size = 32,
  className,
}: {
  avatars: { name: string; src?: string }[]
  max?: number
  size?: number
  className?: string
}) {
  const [hovered, setHovered] = useState(false)
  const visible = avatars.slice(0, max)
  const overflow = avatars.length - visible.length
  const overlap = size * 0.38
  return (
    <div
      className={cn('flex items-center', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ height: size }}
    >
      {visible.map((a, i) => (
        <motion.div
          key={a.name + i}
          className="relative flex items-center justify-center overflow-hidden rounded-full border-2 border-background bg-secondary text-secondary-foreground shadow-sm"
          style={{ width: size, height: size, marginLeft: i === 0 ? 0 : -overlap, zIndex: visible.length - i }}
          animate={{ x: hovered ? i * (size * 0.16) : 0 }}
          transition={springFast}
          whileHover={{ scale: 1.08, zIndex: 50 }}
          title={a.name}
        >
          {a.src ? (
            <img src={a.src} alt={a.name} className="h-full w-full object-cover" />
          ) : (
            <span className="font-semibold" style={{ fontSize: size * 0.34 }}>
              {a.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
            </span>
          )}
        </motion.div>
      ))}
      {overflow > 0 && (
        <motion.div
          className="relative flex items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground shadow-sm"
          style={{ width: size, height: size, marginLeft: -overlap, zIndex: 0 }}
          animate={{ x: hovered ? visible.length * (size * 0.16) : 0 }}
          transition={springFast}
        >
          <span className="text-[10px] font-semibold">{'+' + overflow}</span>
        </motion.div>
      )}
    </div>
  )
}

export function FilterChipBar({
  filters,
  onRemove,
  onClearAll,
  className,
}: {
  filters: { id: string; label: string }[]
  onRemove?: (id: string) => void
  onClearAll?: () => void
  className?: string
}) {
  if (!filters.length) return null
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <AnimatePresence initial={false}>
        {filters.map(f => (
          <motion.span
            key={f.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={springFast}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 py-1 pl-3 pr-1.5 text-xs font-medium text-secondary-foreground"
          >
            {f.label}
            <button
              type="button"
              onClick={() => onRemove && onRemove(f.id)}
              aria-label={'Remove ' + f.label}
              className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      {filters.length > 1 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  )
}

export function StickyTable({
  columns,
  rows,
  maxHeight = 360,
  className,
}: {
  columns: { key: string; label: string; align?: 'left' | 'right' | 'center' }[]
  rows: Record<string, React.ReactNode>[]
  maxHeight?: number
  className?: string
}) {
  return (
    <div className={cn('overflow-auto rounded-xl border border-border', className)} style={{ maxHeight }}>
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
          <tr>
            {columns.map(c => (
              <th
                key={c.key}
                className={cn(
                  'border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-widest text-muted-foreground',
                  c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="group transition-colors hover:bg-accent/40">
              {columns.map(c => (
                <td
                  key={c.key}
                  className={cn(
                    'border-b border-border px-4 py-2.5 text-foreground last:border-b-0',
                    c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                  )}
                >
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function KanbanCard({
  title,
  description,
  tags = [],
  assignee,
  className,
}: {
  title: string
  description?: string
  tags?: string[]
  assignee?: { name: string; src?: string }
  className?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={springFast}
      className={cn(
        'group relative flex cursor-grab flex-col gap-3 rounded-lg border border-border bg-card p-3.5 shadow-sm transition-shadow hover:shadow-lg hover:shadow-foreground/5 active:cursor-grabbing',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-foreground">{title}</p>
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      {description && <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => (
            <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {t}
            </span>
          ))}
        </div>
      )}
      {assignee && (
        <div className="flex items-center gap-1.5 pt-1">
          <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-secondary text-secondary-foreground">
            {assignee.src ? (
              <img src={assignee.src} alt={assignee.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[9px] font-semibold">{assignee.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">{assignee.name}</span>
        </div>
      )}
    </motion.div>
  )
}

function ScrollTimelineEntry({ item }: { item: { title: string; description?: string; date?: string } }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-30% 0px -30% 0px' })
  return (
    <div ref={ref} className="relative">
      <motion.span
        className={cn(
          'absolute -left-[27px] top-0.5 flex h-[19px] w-[19px] items-center justify-center rounded-full border-2 border-background transition-colors duration-300',
          inView ? 'bg-primary' : 'bg-muted',
        )}
        animate={{ scale: inView ? 1.1 : 1 }}
        transition={springFast}
      >
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full bg-background transition-opacity duration-200',
            inView ? 'opacity-100' : 'opacity-0',
          )}
        />
      </motion.span>
      <div className="flex flex-col gap-0.5">
        {item.date && <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{item.date}</span>}
        <span className="text-sm font-medium text-foreground">{item.title}</span>
        {item.description && <span className="text-xs text-muted-foreground">{item.description}</span>}
      </div>
    </div>
  )
}

export function ScrollTimeline({
  items,
  className,
}: {
  items: { title: string; description?: string; date?: string }[]
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start 0.85', 'end 0.4'] })
  const reduceMotion = useReducedMotion()
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  return (
    <div ref={containerRef} className={cn('relative pl-8', className)}>
      <div className="absolute left-[9px] top-1 bottom-1 w-px bg-border" />
      <motion.div className="absolute left-[9px] top-1 w-px bg-primary" style={{ height: reduceMotion ? '100%' : lineHeight }} />
      <div className="flex flex-col gap-8">
        {items.map((item, i) => (
          <ScrollTimelineEntry key={i} item={item} />
        ))}
      </div>
    </div>
  )
}

export function ComparisonTable({
  plans,
  features,
  highlightIndex,
  className,
}: {
  plans: string[]
  features: { name: string; values: (boolean | string)[] }[]
  highlightIndex?: number
  className?: string
}) {
  return (
    <div className={cn('overflow-auto rounded-xl border border-border', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-border bg-card px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Feature
            </th>
            {plans.map((p, i) => (
              <th
                key={p}
                className={cn(
                  'border-b border-border px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest',
                  i === highlightIndex ? 'bg-primary/10 text-primary' : 'bg-card text-muted-foreground',
                )}
              >
                {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map(f => (
            <tr key={f.name} className="transition-colors hover:bg-accent/30">
              <td className="border-b border-border px-4 py-3 font-medium text-foreground last:border-b-0">{f.name}</td>
              {f.values.map((v, ci) => (
                <td
                  key={ci}
                  className={cn(
                    'border-b border-border px-4 py-3 text-center last:border-b-0',
                    ci === highlightIndex ? 'bg-primary/5' : '',
                  )}
                >
                  {typeof v === 'boolean' ? (
                    v ? (
                      <Check className="mx-auto h-4 w-4 text-primary" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
                    )
                  ) : (
                    <span className="text-sm text-foreground">{v}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function RatingStars({
  value,
  max = 5,
  size = 18,
  readOnly = false,
  onChange,
  className,
}: {
  value: number
  max?: number
  size?: number
  readOnly?: boolean
  onChange?: (value: number) => void
  className?: string
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const display = hoverValue === null ? value : hoverValue
  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      onMouseLeave={() => setHoverValue(null)}
      role={readOnly ? undefined : 'radiogroup'}
    >
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1
        const filled = starValue <= display
        return (
          <motion.button
            key={i}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHoverValue(starValue)}
            onClick={() => !readOnly && onChange && onChange(starValue)}
            whileHover={readOnly ? undefined : { scale: 1.15 }}
            whileTap={readOnly ? undefined : { scale: 0.9 }}
            transition={springFast}
            className={cn('text-muted-foreground/40', readOnly ? 'cursor-default' : 'cursor-pointer')}
            aria-label={'Rate ' + starValue + ' out of ' + max}
          >
            <Star
              className={cn('transition-colors duration-150', filled ? 'fill-primary text-primary' : 'fill-transparent')}
              style={{ width: size, height: size }}
            />
          </motion.button>
        )
      })}
    </div>
  )
}

export function StatCounterGrid({
  stats,
  columns = 3,
  className,
}: {
  stats: { value: number; label: string; delta?: number; prefix?: string; suffix?: string; decimals?: number }[]
  columns?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      className={cn('grid gap-6', className)}
      style={{ gridTemplateColumns: 'repeat(' + columns + ', minmax(0, 1fr))' }}
    >
      {stats.map((s, i) => (
        <motion.div
          key={i}
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } } }}
          className="space-y-1 rounded-xl border border-border bg-card p-4"
        >
          <AnimatedNumber
            value={s.value}
            prefix={s.prefix}
            suffix={s.suffix}
            decimals={s.decimals}
            className="text-2xl font-bold tracking-tight text-foreground"
          />
          <div className="text-sm text-muted-foreground">{s.label}</div>
          {s.delta !== undefined && (
            <div className={cn('text-xs font-medium', s.delta >= 0 ? 'text-primary' : 'text-destructive')}>
              {(s.delta >= 0 ? '+' : '') + s.delta + '%'}
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}

/* ============================== FEEDBACK & OVERLAYS ============================== */

export function ToastStack({ toasts, onDismiss, position = 'bottom-right', className }: {
  toasts: { id: string; title?: string; message: string; variant?: 'default' | 'success' | 'error' | 'warning'; duration?: number }[]
  onDismiss: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className?: string
}) {
  const positionClasses =
    position === 'top-right' ? 'top-4 right-4 items-end' :
    position === 'top-left' ? 'top-4 left-4 items-start' :
    position === 'bottom-left' ? 'bottom-4 left-4 items-start' :
    'bottom-4 right-4 items-end'
  const fromX = position.indexOf('right') !== -1 ? 80 : -80

  return (
    <div className={cn('pointer-events-none fixed z-50 flex w-full max-w-sm flex-col gap-2 p-4', positionClasses, className)}>
      <AnimatePresence initial={false}>
        {toasts.map(t => (
          <ToastCard key={t.id} toast={t} fromX={fromX} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastCard({ toast, fromX, onDismiss }: {
  toast: { id: string; title?: string; message: string; variant?: 'default' | 'success' | 'error' | 'warning'; duration?: number }
  fromX: number
  onDismiss: (id: string) => void
}) {
  const [hovering, setHovering] = useState(false)
  const remaining = useRef(toast.duration === undefined ? 4000 : toast.duration)

  useEffect(() => {
    if (hovering || remaining.current === Infinity) return
    const start = Date.now()
    const timer = window.setTimeout(() => onDismiss(toast.id), remaining.current)
    return () => {
      window.clearTimeout(timer)
      remaining.current = Math.max(0, remaining.current - (Date.now() - start))
    }
  }, [hovering, toast.id, onDismiss])

  const variant = toast.variant || 'default'
  const iconClass =
    variant === 'success' ? 'text-primary bg-primary/10' :
    variant === 'error' ? 'text-destructive bg-destructive/10' :
    variant === 'warning' ? 'text-accent-foreground bg-accent/40' :
    'text-foreground bg-muted'
  const Icon = variant === 'success' ? CheckCircle2 : variant === 'error' ? XCircle : variant === 'warning' ? AlertTriangle : Info

  return (
    <motion.div
      layout
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      initial={{ opacity: 0, x: fromX, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: fromX, scale: 0.9, transition: { duration: 0.15 } }}
      transition={springFast}
      className="pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-border bg-card/95 p-3.5 text-card-foreground shadow-2xl backdrop-blur-md"
    >
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', iconClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        {toast.title && <div className="text-sm font-semibold text-foreground">{toast.title}</div>}
        <div className="text-sm text-muted-foreground">{toast.message}</div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

export function ConfirmModal({
  open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'default', loading = false, className,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, loading])

  const Icon = variant === 'destructive' ? AlertTriangle : Info

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !loading && onClose()}
          />
          <motion.div
            className={cn('relative w-full max-w-sm rounded-xl border border-border bg-card p-6 text-card-foreground shadow-2xl', className)}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={springFast}
          >
            <div className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full',
              variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="mt-4 text-base font-semibold text-foreground">{title}</div>
            {description && <div className="mt-1.5 text-sm text-muted-foreground">{description}</div>}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <motion.button
                onClick={onConfirm}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-60',
                  variant === 'destructive' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'
                )}
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function Drawer({ open, onClose, title, children, side = 'right', className }: {
  open: boolean; onClose: () => void; title?: string; children?: React.ReactNode; side?: 'left' | 'right'; className?: string
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
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'relative flex h-full w-full max-w-sm flex-col bg-card p-6 text-card-foreground shadow-2xl',
              side === 'right' ? 'ml-auto border-l border-border' : 'mr-auto border-r border-border',
              className
            )}
            initial={{ x: side === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? '100%' : '-100%' }}
            transition={springFast}
          >
            <div className="mb-4 flex items-center justify-between">
              {title && <div className="text-lg font-semibold text-foreground">{title}</div>}
              <button
                onClick={onClose}
                className="ml-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function Tooltip({ content, children, side = 'top', delay = 300, className }: {
  content: React.ReactNode; children: React.ReactNode; side?: 'top' | 'bottom' | 'left' | 'right'; delay?: number; className?: string
}) {
  const [visible, setVisible] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const show = () => { timer.current = window.setTimeout(() => setVisible(true), delay) }
  const hide = () => { window.clearTimeout(timer.current); setVisible(false) }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const sideClass =
    side === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' :
    side === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' :
    side === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' :
    'left-full top-1/2 -translate-y-1/2 ml-2'

  const initialOffset =
    side === 'top' ? { y: 4 } : side === 'bottom' ? { y: -4 } : side === 'left' ? { x: 4 } : { x: -4 }

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.span
            role="tooltip"
            className={cn('pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-lg', sideClass, className)}
            initial={{ opacity: 0, scale: 0.92, ...initialOffset }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, ...initialOffset }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

export function PopoverMenu({ trigger, items, align = 'start', className }: {
  trigger: React.ReactNode
  items: { label: string; onClick?: () => void; icon?: React.ReactNode; destructive?: boolean; disabled?: boolean }[]
  align?: 'start' | 'end'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-block">
      <span onClick={() => setOpen(o => !o)}>{trigger}</span>
      <AnimatePresence>
        {open && (
          <motion.div
            className={cn(
              'absolute z-50 mt-2 w-56 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-2xl backdrop-blur-md',
              align === 'end' ? 'right-0' : 'left-0',
              className
            )}
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={springFast}
          >
            {items.map((item, i) => (
              <button
                key={i}
                disabled={item.disabled}
                onClick={() => { item.onClick && item.onClick(); setOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors disabled:opacity-40',
                  item.destructive ? 'text-destructive hover:bg-destructive/10' : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ContextMenu({ children, items, className }: {
  children: React.ReactNode
  items: { label: string; onClick?: () => void; icon?: React.ReactNode; destructive?: boolean; disabled?: boolean }[]
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  const onContext = (e: React.MouseEvent) => {
    e.preventDefault()
    setPos({ x: e.clientX, y: e.clientY })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open || !menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const overflowX = rect.right - window.innerWidth
    const overflowY = rect.bottom - window.innerHeight
    if (overflowX > 0 || overflowY > 0) {
      setPos(p => ({ x: overflowX > 0 ? p.x - overflowX - 8 : p.x, y: overflowY > 0 ? p.y - overflowY - 8 : p.y }))
    }
  }, [open])

  return (
    <div onContextMenu={onContext} className="relative">
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            style={{ left: pos.x, top: pos.y }}
            className={cn('fixed z-50 w-52 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-2xl backdrop-blur-md', className)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
          >
            {items.map((item, i) => (
              <button
                key={i}
                disabled={item.disabled}
                onClick={() => { item.onClick && item.onClick(); setOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors disabled:opacity-40',
                  item.destructive ? 'text-destructive hover:bg-destructive/10' : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Lightbox({ images, open, onClose, index, onIndexChange, className }: {
  images: string[]; open: boolean; onClose: () => void; index: number; onIndexChange: (i: number) => void; className?: string
}) {
  const [direction, setDirection] = useState(1)

  const goPrev = () => { setDirection(-1); onIndexChange(index === 0 ? images.length - 1 : index - 1) }
  const goNext = () => { setDirection(1); onIndexChange(index === images.length - 1 ? 0 : index + 1) }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-background/95 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <button
            onClick={onClose}
            className="absolute right-5 top-5 z-10 rounded-full border border-border bg-card/80 p-2 text-foreground shadow-lg transition-colors hover:bg-accent"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          {images.length > 1 && (
            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-card/80 p-2.5 text-foreground shadow-lg transition-colors hover:bg-accent"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {images.length > 1 && (
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-card/80 p-2.5 text-foreground shadow-lg transition-colors hover:bg-accent"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          <div className={cn('relative flex max-h-[85vh] max-w-[85vw] items-center justify-center', className)} onClick={e => e.stopPropagation()}>
            <AnimatePresence mode="wait">
              <motion.img
                key={index}
                src={images[index]}
                alt=""
                initial={{ opacity: 0, x: direction * 40, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: direction * -40, scale: 0.98 }}
                transition={springFast}
                className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain shadow-2xl"
              />
            </AnimatePresence>
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > index ? 1 : -1); onIndexChange(i) }}
                  aria-label={'Go to image ' + (i + 1)}
                  className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70')}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  )
}

export function BeforeAfterSlider({ beforeImage, afterImage, beforeLabel = 'Before', afterLabel = 'After', initialPosition = 50, className }: {
  beforeImage: string; afterImage: string; beforeLabel?: string; afterLabel?: string; initialPosition?: number; className?: string
}) {
  const [position, setPosition] = useState(initialPosition)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const updateFromClientX = (clientX: number) => {
    const rect = containerRef.current ? containerRef.current.getBoundingClientRect() : null
    if (!rect) return
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.min(100, Math.max(0, pct)))
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: PointerEvent) => updateFromClientX(e.clientX)
    const onUp = () => setDragging(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging])

  return (
    <div
      ref={containerRef}
      onPointerDown={e => { setDragging(true); updateFromClientX(e.clientX) }}
      className={cn('relative aspect-video w-full select-none overflow-hidden rounded-xl border border-border shadow-2xl', className)}
    >
      <img src={afterImage} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0 h-full w-full overflow-hidden" style={{ clipPath: 'inset(0 ' + (100 - position) + '% 0 0)' }}>
        <img src={beforeImage} alt={beforeLabel} className="h-full w-full object-cover" draggable={false} />
      </div>

      <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-background/80 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm">{beforeLabel}</div>
      <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-background/80 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm">{afterLabel}</div>

      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-background/90" style={{ left: position + '%' }} />
      <motion.div
        className="absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-border bg-card text-foreground shadow-2xl"
        style={{ left: position + '%' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        transition={springFast}
      >
        <ChevronLeft className="h-3.5 w-3.5 -mr-1" />
        <ChevronRight className="h-3.5 w-3.5 -ml-1" />
      </motion.div>
    </div>
  )
}

export function CookieConsentBar({
  message = 'We use cookies to improve your experience and analyze site traffic.',
  acceptLabel = 'Accept', declineLabel = 'Decline', onAccept, onDecline, className,
}: {
  message?: string; acceptLabel?: string; declineLabel?: string; onAccept?: () => void; onDecline?: () => void; className?: string
}) {
  const [dismissed, setDismissed] = useState(false)

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          className={cn('fixed inset-x-4 bottom-4 z-50 flex flex-col items-start gap-3 rounded-xl border border-border bg-card/95 p-4 text-card-foreground shadow-2xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between', className)}
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={springFast}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Cookie className="h-4 w-4" />
            </div>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          <div className="flex w-full shrink-0 gap-2 sm:w-auto">
            <button
              onClick={() => { onDecline && onDecline(); setDismissed(true) }}
              className="flex-1 rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent sm:flex-none"
            >
              {declineLabel}
            </button>
            <button
              onClick={() => { onAccept && onAccept(); setDismissed(true) }}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 sm:flex-none"
            >
              {acceptLabel}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function NotificationBell({ count = 0, notifications, onItemClick, className }: {
  count?: number
  notifications: { id: string; title: string; description?: string; time?: string; read?: boolean }[]
  onItemClick?: (id: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [ringKey, setRingKey] = useState(0)
  const prevCount = useRef(count)
  const rootRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (count > prevCount.current) setRingKey(k => k + 1)
    prevCount.current = count
  }, [count])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const displayCount = count > 9 ? '9+' : String(count)

  return (
    <div ref={rootRef} className={cn('relative inline-block', className)}>
      <motion.button
        key={ringKey}
        onClick={() => setOpen(o => !o)}
        animate={reducedMotion ? {} : { rotate: ringKey === 0 ? 0 : [0, -14, 11, -7, 3, 0] }}
        transition={{ duration: 0.5 }}
        className="relative rounded-full p-2 text-foreground transition-colors hover:bg-accent"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              key={displayCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={springFast}
              className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 py-0.5 text-[10px] font-semibold leading-none text-destructive-foreground"
            >
              {displayCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl backdrop-blur-md"
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={springFast}
          >
            <div className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">Notifications</div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">You are all caught up.</div>
              )}
              {notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => onItemClick && onItemClick(n.id)}
                  className="flex w-full items-start gap-2.5 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent"
                >
                  <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-primary')} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{n.title}</span>
                    {n.description && <span className="mt-0.5 block text-xs text-muted-foreground">{n.description}</span>}
                    {n.time && <span className="mt-1 block text-[10px] text-muted-foreground/70">{n.time}</span>}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ============================== MARKETING SECTIONS ============================== */

export function LogoCloud({ logos, columns = 5, className }: {
  logos: { name: string; src?: string; icon?: React.ReactNode }[];
  columns?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div
      className={cn('grid items-center gap-px overflow-hidden rounded-xl border border-border bg-border', className)}
      style={{ gridTemplateColumns: 'repeat(' + columns + ', minmax(0, 1fr))' }}
    >
      {logos.map((logo, i) => (
        <motion.div
          key={logo.name + '-' + i}
          initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ ...springFast, delay: i * 0.04 }}
          className="group flex h-20 items-center justify-center bg-background px-6"
        >
          {logo.icon ? (
            <span className="grayscale opacity-50 transition duration-300 group-hover:grayscale-0 group-hover:opacity-100">
              {logo.icon}
            </span>
          ) : logo.src ? (
            <img
              src={logo.src}
              alt={logo.name}
              className="max-h-8 w-auto grayscale opacity-50 transition duration-300 group-hover:grayscale-0 group-hover:opacity-100"
            />
          ) : (
            <span className="text-sm font-semibold tracking-wide text-muted-foreground opacity-50 transition duration-300 group-hover:opacity-100 group-hover:text-foreground">
              {logo.name}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  )
}

export function PlanComparisonMatrix({ plans, rows, className }: {
  plans: { name: string; price?: string; featured?: boolean }[];
  rows: { label: string; values: (boolean | string)[] }[];
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-border', className)}>
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="w-1/3 p-4 text-sm font-medium text-muted-foreground"> </th>
            {plans.map((plan, i) => (
              <th
                key={plan.name + '-' + i}
                className={cn('relative p-4 align-bottom', plan.featured && 'bg-primary/5')}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Popular
                  </span>
                )}
                <div className="text-sm font-semibold text-foreground">{plan.name}</div>
                {plan.price && <div className="mt-1 text-lg font-bold text-foreground">{plan.price}</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row.label + '-' + ri} className={cn('border-b border-border last:border-0', ri % 2 === 1 && 'bg-muted/30')}>
              <td className="p-4 text-sm text-foreground">{row.label}</td>
              {row.values.map((val, ci) => (
                <td key={ci} className={cn('p-4 text-center', plans[ci]?.featured && 'bg-primary/5')}>
                  {typeof val === 'boolean' ? (
                    val ? <Check className="mx-auto h-4 w-4 text-primary" /> : <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
                  ) : (
                    <span className="text-sm text-foreground">{val}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function FAQAccordionIcon({ items, defaultOpenIndex, className }: {
  items: { question: string; answer: string }[];
  defaultOpenIndex?: number;
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex ?? null);
  const reduceMotion = useReducedMotion();
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.question + '-' + i} className="overflow-hidden rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-medium text-foreground">{item.question}</span>
              <motion.span
                animate={reduceMotion ? undefined : { rotate: isOpen ? 45 : 0 }}
                transition={springFast}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: easeOut }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

export function SocialProofRow({ avatarUrls = [], rating = 5, maxRating = 5, teamCount, label, className }: {
  avatarUrls?: string[];
  rating?: number;
  maxRating?: number;
  teamCount?: number | string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {avatarUrls.length > 0 && (
        <div className="flex -space-x-3">
          {avatarUrls.slice(0, 5).map((src, i) => (
            <img
              key={src + '-' + i}
              src={src}
              alt=""
              className="h-9 w-9 rounded-full border-2 border-background object-cover"
              style={{ zIndex: avatarUrls.length - i }}
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-1">
        {Array.from({ length: maxRating }).map((_, i) => (
          <Star
            key={i}
            className={cn('h-4 w-4 fill-current', i < Math.round(rating) ? 'text-primary' : 'text-muted-foreground/30')}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {label || ('Trusted by ' + teamCount + '+ teams')}
      </span>
    </div>
  )
}

export function StickyCTABar({ message, ctaLabel = 'Get started', onCta, threshold = 400, className }: {
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
  threshold?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > threshold);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: reduceMotion ? 0 : 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: reduceMotion ? 0 : 80, opacity: 0 }}
          transition={springFast}
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t border-border bg-card/95 px-6 py-4 shadow-[0_-8px_24px_hsl(var(--foreground)/0.08)] backdrop-blur',
            className
          )}
        >
          <span className="text-sm font-medium text-foreground">{message}</span>
          <button
            onClick={onCta}
            className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            {ctaLabel}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function PricingToggle({ value, onChange, savePercent = 20, className }: {
  value: 'monthly' | 'yearly';
  onChange: (value: 'monthly' | 'yearly') => void;
  savePercent?: number;
  className?: string;
}) {
  const isYearly = value === 'yearly';
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div className="relative flex rounded-full border border-border bg-muted p-1">
        <motion.div
          layout
          transition={springFast}
          className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-background shadow-sm"
          style={{ left: isYearly ? 'calc(50% + 2px)' : 4 }}
        />
        <button
          type="button"
          onClick={() => onChange('monthly')}
          className={cn('relative z-10 rounded-full px-4 py-1.5 text-sm font-medium transition', !isYearly ? 'text-foreground' : 'text-muted-foreground')}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange('yearly')}
          className={cn('relative z-10 rounded-full px-4 py-1.5 text-sm font-medium transition', isYearly ? 'text-foreground' : 'text-muted-foreground')}
        >
          Yearly
        </button>
      </div>
      <AnimatePresence>
        {isYearly && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8, x: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -6 }}
            transition={springFast}
            className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
          >
            {'Save ' + savePercent + '%'}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

export function TestimonialWall({ testimonials, columns = 3, className }: {
  testimonials: { quote: string; name: string; role?: string; avatarUrl?: string }[];
  columns?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div
      className={cn('grid gap-4', className)}
      style={{ gridTemplateColumns: 'repeat(' + columns + ', minmax(0, 1fr))' }}
    >
      {testimonials.map((t, i) => (
        <motion.figure
          key={t.name + '-' + i}
          initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ ...springFast, delay: (i % columns) * 0.06 }}
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
        >
          <blockquote className="text-sm leading-relaxed text-foreground">{'“' + t.quote + '”'}</blockquote>
          <figcaption className="mt-auto flex items-center gap-2.5 pt-1">
            {t.avatarUrl ? (
              <img src={t.avatarUrl} alt={t.name} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {t.name.charAt(0)}
              </span>
            )}
            <div className="leading-tight">
              <div className="text-xs font-medium text-foreground">{t.name}</div>
              {t.role && <div className="text-xs text-muted-foreground">{t.role}</div>}
            </div>
          </figcaption>
        </motion.figure>
      ))}
    </div>
  )
}

export function IntegrationGrid({ integrations, columns = 4, className }: {
  integrations: { name: string; icon?: React.ReactNode; iconSrc?: string }[];
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('grid gap-px overflow-hidden rounded-xl border border-border bg-border', className)}
      style={{ gridTemplateColumns: 'repeat(' + columns + ', minmax(0, 1fr))' }}
    >
      {integrations.map((item, i) => (
        <motion.div
          key={item.name + '-' + i}
          whileHover={{ y: -3 }}
          transition={springFast}
          className="flex flex-col items-center justify-center gap-2 bg-card px-4 py-6"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground">
            {item.icon ? item.icon : item.iconSrc ? (
              <img src={item.iconSrc} alt={item.name} className="h-5 w-5 object-contain" />
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">{item.name.charAt(0)}</span>
            )}
          </div>
          <span className="text-xs font-medium text-muted-foreground">{item.name}</span>
        </motion.div>
      ))}
    </div>
  )
}

export function ChangelogTimeline({ entries, className }: {
  entries: { version: string; date: string; tag?: string; description: string }[];
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div className={cn('relative flex flex-col gap-10 pl-8', className)}>
      <div className="absolute bottom-0 left-[7px] top-1 w-px bg-border" aria-hidden="true" />
      {entries.map((entry, i) => (
        <motion.div
          key={entry.version + '-' + i}
          initial={reduceMotion ? undefined : { opacity: 0, x: -12 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ ...springFast, delay: i * 0.05 }}
          className="relative"
        >
          <span className="absolute -left-8 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-primary" />
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-sm font-semibold text-foreground">{entry.version}</span>
            {entry.tag && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{entry.tag}</span>
            )}
            <span className="text-xs text-muted-foreground">{entry.date}</span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{entry.description}</p>
        </motion.div>
      ))}
    </div>
  )
}

export function StatsBanner({ stats, className }: {
  stats: { value: string; label: string }[];
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div className={cn('flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card sm:flex-row sm:divide-x sm:divide-y-0', className)}>
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label + '-' + i}
          initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ ...springFast, delay: i * 0.06 }}
          className="flex flex-1 flex-col items-center gap-1 px-6 py-8 text-center"
        >
          <span className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{stat.value}</span>
          <span className="text-sm text-muted-foreground">{stat.label}</span>
        </motion.div>
      ))}
    </div>
  )
}

export function CTAGradientBanner({ title, description, ctaLabel = 'Get started', onCta, className }: {
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div className={cn('relative isolate overflow-hidden rounded-2xl border border-border bg-background px-8 py-20 text-center sm:py-28', className)}>
      <div
        className={cn('pointer-events-none absolute inset-0 -z-10 opacity-60', !reduceMotion && 'animate-gradient-spin')}
        style={{
          backgroundImage:
            'conic-gradient(from 180deg at 50% 50%, ' +
            'hsl(var(--primary) / 0.35), ' +
            'hsl(var(--accent) / 0.25), ' +
            'hsl(var(--primary) / 0.1), ' +
            'hsl(var(--accent) / 0.3), ' +
            'hsl(var(--primary) / 0.35))',
          filter: 'blur(60px)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-background/40" />
      <motion.h2
        initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={springFast}
        className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
      >
        {title}
      </motion.h2>
      {description && (
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">{description}</p>
      )}
      <div className="mt-9 flex items-center justify-center">
        <button
          onClick={onCta}
          className="rounded-lg bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_hsl(var(--primary)/0.35)] transition hover:opacity-90"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  )
}

/* ============================== SHOWCASE & MOCKUP FRAMES ============================== */

export interface WindowControlsProps {
  size?: number
  gap?: number
  className?: string
}

export function WindowControls({ size = 10, gap = 6, className }: WindowControlsProps) {
  const dotClass = 'rounded-full shrink-0'
  return (
    <div className={cn('flex items-center', className)} style={{ gap: gap }}>
      <span className={cn(dotClass, 'bg-destructive/70')} style={{ width: size, height: size }} />
      <span className={cn(dotClass, 'bg-accent/70')} style={{ width: size, height: size }} />
      <span className={cn(dotClass, 'bg-primary/40')} style={{ width: size, height: size }} />
    </div>
  )
}

export interface CodeBlockProps {
  code: string
  filename?: string
  language?: string
  highlightLines?: number[]
  showLineNumbers?: boolean
  className?: string
}

export function CodeBlock({ code, filename, language, highlightLines = [], showLineNumbers = true, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const lines = code.split('\n')

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {})
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_32px_hsl(var(--foreground)/0.08)]', className)}>
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <WindowControls size={8} gap={5} />
          {filename && <span className="font-mono text-xs text-muted-foreground">{filename}</span>}
          {language && !filename && <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{language}</span>}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={springFast}
                className="flex items-center gap-1.5"
              >
                <Check className="h-3 w-3" /> Copied
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={springFast}
                className="flex items-center gap-1.5"
              >
                <Copy className="h-3 w-3" /> Copy
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
      <div className="overflow-x-auto px-4 py-3">
        <pre className="font-mono text-[13px] leading-6">
          <code>
            {lines.map((line, i) => {
              const n = i + 1
              const isHighlighted = highlightLines.includes(n)
              return (
                <div key={n} className={cn('-mx-2 flex gap-4 rounded px-2', isHighlighted && 'bg-primary/10')}>
                  {showLineNumbers && (
                    <span className="w-6 shrink-0 select-none text-right text-muted-foreground/50">{n}</span>
                  )}
                  <span className={cn('whitespace-pre', isHighlighted ? 'text-primary' : 'text-foreground/90')}>{line || ' '}</span>
                </div>
              )
            })}
          </code>
        </pre>
      </div>
    </div>
  )
}

export interface ChatBubbleProps {
  message: React.ReactNode
  variant?: 'sent' | 'received'
  avatar?: string
  name?: string
  timestamp?: string
  className?: string
}

export function ChatBubble({ message, variant = 'received', avatar, name, timestamp, className }: ChatBubbleProps) {
  const isSent = variant === 'sent'
  return (
    <div className={cn('flex items-end gap-2', isSent ? 'flex-row-reverse' : 'flex-row', className)}>
      {avatar && (
        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
          <img src={avatar} alt={name || 'avatar'} className="h-full w-full object-cover" />
        </div>
      )}
      <div className={cn('flex max-w-[75%] flex-col gap-1', isSent ? 'items-end' : 'items-start')}>
        {name && <span className="px-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{name}</span>}
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={springFast}
          className={cn(
            'rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm',
            isSent ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-muted text-foreground'
          )}
        >
          {message}
        </motion.div>
        {timestamp && <span className="px-1 font-mono text-[10px] text-muted-foreground/70">{timestamp}</span>}
      </div>
    </div>
  )
}

export interface DeviceFrameSetProps {
  laptopSrc?: string
  phoneSrc?: string
  laptopContent?: React.ReactNode
  phoneContent?: React.ReactNode
  className?: string
}

export function DeviceFrameSet({ laptopSrc, phoneSrc, laptopContent, phoneContent, className }: DeviceFrameSetProps) {
  return (
    <div className={cn('relative w-full max-w-2xl pb-10 pr-6', className)}>
      <div className="relative mx-auto overflow-hidden rounded-t-xl border border-border bg-card shadow-[0_24px_64px_hsl(var(--foreground)/0.14)]">
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
          <WindowControls size={7} gap={5} />
        </div>
        <div className="aspect-[16/10] w-full overflow-hidden bg-muted/30">
          {laptopContent ? laptopContent : laptopSrc ? <img src={laptopSrc} alt="App on laptop" className="h-full w-full object-cover" /> : null}
        </div>
      </div>
      <div className="mx-auto h-3 w-[112%] max-w-none -translate-x-[6%] rounded-b-2xl border border-t-0 border-border bg-card" />
      <div className="mx-auto h-1.5 w-24 rounded-b-md bg-border/60" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={springFast}
        className="absolute bottom-0 right-0 w-[30%] min-w-[104px] max-w-[188px] overflow-hidden rounded-[1.4rem] border-[6px] border-card bg-card shadow-[0_20px_48px_hsl(var(--foreground)/0.18)]"
        style={{ aspectRatio: '9/19' }}
      >
        <div className="absolute left-1/2 top-1.5 h-1 w-8 -translate-x-1/2 rounded-full bg-border" />
        <div className="h-full w-full overflow-hidden bg-muted/30">
          {phoneContent ? phoneContent : phoneSrc ? <img src={phoneSrc} alt="App on phone" className="h-full w-full object-cover" /> : null}
        </div>
      </motion.div>
    </div>
  )
}

export interface VideoFrameProps {
  src: string
  poster?: string
  className?: string
  videoClassName?: string
}

export function VideoFrame({ src, poster, className, videoClassName }: VideoFrameProps) {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
    setPlaying(true)
  }

  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-border bg-card shadow-[0_16px_48px_hsl(var(--foreground)/0.12)]', className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls={playing}
        playsInline
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className={cn('h-full w-full object-cover', videoClassName)}
      />
      <AnimatePresence>
        {!playing && (
          <motion.button
            type="button"
            onClick={handlePlay}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[1px]"
            aria-label="Play video"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-border/60 bg-card/90 shadow-[0_8px_24px_hsl(var(--foreground)/0.16)] backdrop-blur-md transition-transform hover:scale-105">
              <Play className="ml-1 h-6 w-6 fill-foreground text-foreground" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export interface ScreenshotTiltProps {
  src: string
  alt?: string
  tilt?: number
  className?: string
}

export function ScreenshotTilt({ src, alt = '', tilt = 10, className }: ScreenshotTiltProps) {
  const prefersReduced = useReducedMotion()
  const appliedTilt = prefersReduced ? 0 : tilt

  return (
    <div className={cn('relative mx-auto w-full max-w-xl', className)}>
      <div aria-hidden="true" className="absolute inset-x-6 bottom-0 top-10 -z-10 rounded-[2rem] bg-primary/20 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 24, rotateX: appliedTilt + 6 }}
        whileInView={{ opacity: 1, y: 0, rotateX: appliedTilt }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ ...springFast, duration: 0.6 }}
        style={{ transformPerspective: 1200, transformOrigin: 'top center' }}
        className="overflow-hidden rounded-xl border border-border shadow-[0_32px_80px_hsl(var(--foreground)/0.22)]"
      >
        <img src={src} alt={alt} className="block h-full w-full object-cover" />
      </motion.div>
    </div>
  )
}

export interface QRFrameProps {
  src: string
  alt?: string
  caption?: string
  size?: number
  className?: string
}

export function QRFrame({ src, alt = 'QR code', caption, size = 160, className }: QRFrameProps) {
  const tick = 'absolute h-3 w-3 border-primary'
  return (
    <div className={cn('inline-flex flex-col items-center gap-3', className)}>
      <div className="relative border border-border bg-card p-4" style={{ width: size, height: size }}>
        <span className={cn(tick, 'left-0 top-0 border-l-2 border-t-2')} />
        <span className={cn(tick, 'right-0 top-0 border-r-2 border-t-2')} />
        <span className={cn(tick, 'bottom-0 left-0 border-b-2 border-l-2')} />
        <span className={cn(tick, 'bottom-0 right-0 border-b-2 border-r-2')} />
        <img src={src} alt={alt} className="h-full w-full object-contain" />
      </div>
      {caption && <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{caption}</span>}
    </div>
  )
}

export interface AppStoreBadgeRowProps {
  iosHref?: string
  androidHref?: string
  iosEyebrow?: string
  iosLabel?: string
  androidEyebrow?: string
  androidLabel?: string
  className?: string
}

export function AppStoreBadgeRow({
  iosHref = '#',
  androidHref = '#',
  iosEyebrow = 'Download on the',
  iosLabel = 'App Store',
  androidEyebrow = 'GET IT ON',
  androidLabel = 'Google Play',
  className,
}: AppStoreBadgeRowProps) {
  const badgeClass = 'flex items-center gap-2.5 rounded-lg border border-border bg-foreground px-4 py-2.5 text-background transition-transform hover:scale-[1.02]'
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <a href={iosHref} className={badgeClass} aria-label={iosEyebrow + ' ' + iosLabel}>
        <Smartphone className="h-6 w-6 shrink-0" />
        <span className="flex flex-col leading-tight">
          <span className="text-[9px] uppercase tracking-wide opacity-80">{iosEyebrow}</span>
          <span className="text-sm font-semibold">{iosLabel}</span>
        </span>
      </a>
      <a href={androidHref} className={badgeClass} aria-label={androidEyebrow + ' ' + androidLabel}>
        <PlayCircle className="h-6 w-6 shrink-0" />
        <span className="flex flex-col leading-tight">
          <span className="text-[9px] uppercase tracking-wide opacity-80">{androidEyebrow}</span>
          <span className="text-sm font-semibold">{androidLabel}</span>
        </span>
      </a>
    </div>
  )
}

/* ============================== PREMIUM INTERACTIONS ============================== */

export function MagneticButton({ children, className, strength = 0.5, radius = 120, ...rest }: {
  children?: React.ReactNode
  className?: string
  strength?: number
  radius?: number
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  const ref = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, springFast)
  const sy = useSpring(my, springFast)
  useEffect(() => {
    if (reduced) return
    const handleMove = (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < radius) {
        const pull = (1 - dist / radius) * strength
        mx.set(dx * pull)
        my.set(dy * pull)
      } else {
        mx.set(0)
        my.set(0)
      }
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [reduced, radius, strength, mx, my])
  return (
    <motion.button
      ref={ref}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.96 }}
      transition={springFast}
      className={cn('inline-flex select-none items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground', className)}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </motion.button>
  )
}

export function DraggableCarousel({ children, className, itemClassName, gap = 16 }: {
  children?: React.ReactNode
  className?: string
  itemClassName?: string
  gap?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [constraint, setConstraint] = useState(0)
  useEffect(() => {
    const measure = () => {
      const container = containerRef.current
      const track = trackRef.current
      if (!container || !track) return
      const diff = track.scrollWidth - container.clientWidth
      setConstraint(diff > 0 ? diff : 0)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [children])
  const items = React.Children.toArray(children)
  return (
    <div ref={containerRef} className={cn('overflow-hidden', className)}>
      <motion.div
        ref={trackRef}
        drag="x"
        dragConstraints={{ left: -constraint, right: 0 }}
        dragElastic={0.08}
        dragTransition={{ power: 0.3, timeConstant: 200 }}
        className="flex w-max cursor-grab active:cursor-grabbing"
        style={{ gap }}
      >
        {items.map((child, i) => (
          <div key={i} className={cn('shrink-0', itemClassName)}>
            {child}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export function InfiniteLogoMarquee({ logos, speed = 28, className, itemClassName }: {
  logos: Array<{ id: string; content: React.ReactNode }>
  speed?: number
  className?: string
  itemClassName?: string
}) {
  const reduced = useReducedMotion()
  const loop = [...logos, ...logos]
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div
        className={cn('flex w-max items-center', reduced ? '' : 'animate-marquee')}
        style={{ animationDuration: speed + 's' }}
      >
        {loop.map((logo, i) => (
          <div
            key={logo.id + '-' + i}
            className={cn('mx-6 flex shrink-0 items-center justify-center grayscale opacity-50 transition-all duration-300 hover:grayscale-0 hover:opacity-100', itemClassName)}
          >
            {logo.content}
          </div>
        ))}
      </div>
    </div>
  )
}

export type ConfettiBurstHandle = { burst: (x?: number, y?: number) => void }

export const ConfettiBurst = React.forwardRef<ConfettiBurstHandle, {
  count?: number
  className?: string
  triggerOnClick?: boolean
}>(function ConfettiBurst({ count = 24, className, triggerOnClick = true }, ref) {
  const reduced = useReducedMotion()
  const [bursts, setBursts] = useState<Array<{
    id: number
    x: number
    y: number
    particles: Array<{ angle: number; distance: number; size: number; token: string; delay: number }>
  }>>([])
  const idRef = useRef(0)
  const tokens = ['bg-primary', 'bg-accent', 'bg-secondary']
  const fire = useCallback((x = 50, y = 50) => {
    if (reduced) return
    const id = idRef.current++
    const particles = Array.from({ length: count }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      distance: 40 + Math.random() * 90,
      size: 4 + Math.random() * 5,
      token: tokens[Math.floor(Math.random() * tokens.length)],
      delay: Math.random() * 0.08,
    }))
    setBursts((prev) => [...prev, { id, x, y, particles }])
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id))
    }, 1200)
  }, [count, reduced])
  React.useImperativeHandle(ref, () => ({ burst: fire }), [fire])
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!triggerOnClick) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    fire(x, y)
  }
  return (
    <div onClick={handleClick} className={cn('relative overflow-visible', className)}>
      {bursts.map((b) => (
        <div key={b.id} className="pointer-events-none absolute inset-0" aria-hidden="true">
          {b.particles.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{
                opacity: 0,
                x: Math.cos(p.angle) * p.distance,
                y: Math.sin(p.angle) * p.distance,
                scale: 0.4,
              }}
              transition={{ duration: 0.8, delay: p.delay, ease: easeOut }}
              className={cn('absolute rounded-sm', p.token)}
              style={{ left: b.x + '%', top: b.y + '%', width: p.size, height: p.size }}
            />
          ))}
        </div>
      ))}
    </div>
  )
})

export function ShimmerSkeletonCard({ lines = 3, showAvatar = true, className }: {
  lines?: number
  showAvatar?: boolean
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-border bg-card p-5', className)}>
      <div className="flex items-center gap-3">
        {showAvatar && <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />}
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-muted" />
          <div className="h-3 w-1/4 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={cn('h-3 rounded bg-muted', i === lines - 1 ? 'w-2/3' : 'w-full')} />
        ))}
      </div>
      {!reduced && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-shimmer-sweep"
          style={{
            background: 'linear-gradient(75deg, transparent 40%, hsl(var(--foreground) / 0.08) 50%, transparent 60%)',
          }}
        />
      )}
    </div>
  )
}

export function SpinnerRing({ variant = 'ring', size = 24, className }: {
  variant?: 'ring' | 'dots' | 'bars'
  size?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  if (variant === 'dots') {
    return (
      <div className={cn('inline-flex items-center gap-1.5', className)} role="status" aria-label="Loading">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="rounded-full bg-primary"
            style={{ width: size / 4, height: size / 4 }}
            animate={reduced ? {} : { y: [0, -size / 4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: easeOut, delay: i * 0.12 }}
          />
        ))}
      </div>
    )
  }
  if (variant === 'bars') {
    return (
      <div className={cn('inline-flex items-end gap-1', className)} style={{ height: size }} role="status" aria-label="Loading">
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="w-1 rounded-full bg-primary"
            animate={reduced ? {} : { scaleY: [0.3, 1, 0.3] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: easeOut, delay: i * 0.1 }}
            style={{ height: size, originY: 1 }}
          />
        ))}
      </div>
    )
  }
  return (
    <motion.span
      role="status"
      aria-label="Loading"
      className={cn('inline-block rounded-full border-2', reduced ? '' : 'animate-spin', className)}
      style={{
        width: size,
        height: size,
        borderColor: 'hsl(var(--primary) / 0.15)',
        borderTopColor: 'hsl(var(--primary))',
      }}
    />
  )
}

export function ProgressBar({ value = 0, max = 100, indeterminate = false, className, barClassName }: {
  value?: number
  max?: number
  indeterminate?: boolean
  className?: string
  barClassName?: string
}) {
  const reduced = useReducedMotion()
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      {indeterminate ? (
        <motion.div
          className={cn('absolute inset-y-0 w-1/3 rounded-full bg-primary', barClassName)}
          animate={reduced ? { left: '0%' } : { left: ['-33%', '100%'] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: easeOut }}
        />
      ) : (
        <motion.div
          className={cn('absolute inset-y-0 left-0 rounded-full bg-primary', barClassName)}
          initial={{ width: 0 }}
          animate={{ width: pct + '%' }}
          transition={springFast}
        />
      )}
    </div>
  )
}

export function HoverImageGrid({ images, columns = 3, className, imageClassName }: {
  images: Array<{ id: string; src: string; alt?: string }>
  columns?: number
  className?: string
  imageClassName?: string
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  return (
    <div
      className={cn('grid gap-3', className)}
      style={{ gridTemplateColumns: 'repeat(' + columns + ', minmax(0, 1fr))' }}
    >
      {images.map((img) => {
        const isHovered = hovered === img.id
        const isDimmed = hovered !== null && !isHovered
        return (
          <motion.div
            key={img.id}
            className="relative cursor-pointer overflow-hidden rounded-lg"
            onMouseEnter={() => setHovered(img.id)}
            onMouseLeave={() => setHovered(null)}
            animate={{
              scale: isHovered ? 1.04 : 1,
              opacity: isDimmed ? 0.45 : 1,
              filter: isDimmed ? 'grayscale(0.6)' : 'grayscale(0)',
            }}
            transition={springFast}
            style={{ zIndex: isHovered ? 1 : 0 }}
          >
            <img src={img.src} alt={img.alt || ''} className={cn('h-full w-full object-cover', imageClassName)} />
          </motion.div>
        )
      })}
    </div>
  )
}

export function CursorFollowBlob({ size = 220, color = 'primary', className }: {
  size?: number
  color?: 'primary' | 'accent' | 'secondary'
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { type: 'spring', stiffness: 90, damping: 18, mass: 0.6 })
  const sy = useSpring(my, { type: 'spring', stiffness: 90, damping: 18, mass: 0.6 })
  const [active, setActive] = useState(false)
  useEffect(() => {
    if (reduced) return
    const el = ref.current?.parentElement
    if (!el) return
    const move = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      mx.set(e.clientX - rect.left - size / 2)
      my.set(e.clientY - rect.top - size / 2)
      setActive(true)
    }
    const leave = () => setActive(false)
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    return () => {
      el.removeEventListener('mousemove', move)
      el.removeEventListener('mouseleave', leave)
    }
  }, [reduced, size, mx, my])
  const tokenVar = color === 'accent' ? '--accent' : color === 'secondary' ? '--secondary' : '--primary'
  if (reduced) return null
  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      className={cn('pointer-events-none absolute rounded-full blur-2xl', className)}
      style={{
        width: size,
        height: size,
        x: sx,
        y: sy,
        background: 'hsl(var(' + tokenVar + ') / 0.25)',
        opacity: active ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    />
  )
}

export function ScrollHorizontalGallery({ children, className, trackClassName, distance }: {
  children?: React.ReactNode
  className?: string
  trackClassName?: string
  distance?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const items = React.Children.toArray(children)
  const travel = distance ?? Math.max(400, items.length * 260)
  const x = useTransform(scrollYProgress, [0, 1], [0, -travel])
  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <motion.div style={{ x }} className={cn('flex w-max gap-6', trackClassName)}>
        {items.map((child, i) => (
          <div key={i} className="shrink-0">
            {child}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
`

// Map merged into both build pipelines (user files always win).
export const WYBER_UI_KIT_FILES: Record<string, string> = {
  [WYBER_UI_KIT_PATH]: WYBER_UI_KIT_SOURCE,
}

// Project-type routing hint — injected ABOVE the full WYBER_UI_KIT_PROMPT
// catalog (never in place of it) so the model's attention lands on the ~35-45
// components most relevant to what it's actually building before it scans the
// full 158-component list. Keys match the `projectType` values used throughout
// route.ts; 'mobile' is deliberately absent — the kit is never injected into
// buildMobileSystemPrompt at all (React Native has no DOM/Tailwind to run it).
// Every name below is cross-checked against WYBER_UI_KIT_SOURCE exports by the
// same test that guards WYBER_UI_KIT_PROMPT.
export const WYBER_UI_KIT_PRIMARY_BY_TYPE: Record<'website' | 'saas' | 'webapp', string> = {
  website: `PRIORITIZE THESE for this build (marketing/landing site) — reach for them before scanning the full catalog below; it's still there for anything not covered here.
Hero & motion: HeroHeadline, TextScramble, GradientText, HeroOrbit, SplitHero
Backgrounds: AuroraBackground, MeshGradient, GlowOrbsField, SpotlightSection
Sections: Navbar, Footer, CTASection, CTAGradientBanner, PricingCard, PricingToggle, TestimonialWall, LogoCloud, FAQAccordionIcon, StickyCTABar, StatsBanner
Text & scroll FX: SplitTextReveal, HighlightMarker, KineticHeadline, StickyShowcase, ScrollStack, Parallax, PinnedStory
Feature showcases: BentoGrid, BentoCard, FeatureCard, HolographicCard, GlowOrbCard, SpotlightCard, TiltCard, DeviceFrameSet, ScreenshotTilt
Interactions: MagneticButton, InfiniteLogoMarquee, HoverImageGrid`,
  saas: `PRIORITIZE THESE for this build (SaaS dashboard/app) — reach for them before scanning the full catalog below; it's still there for anything not covered here.
Navigation: SidebarNav, Breadcrumbs, CommandPalette, PillTabNav, NotificationBell, BackToTop
Data display: StickyTable, KanbanCard, ProgressRing, Sparkline, MiniBarChart, AvatarStack, FilterChipBar, ComparisonTable, RatingStars, StatCounterGrid, DataRow, StatBlock, AnimatedNumber
Forms: FloatingLabelInput, OtpInput, StepperWizard, ChipToggleGroup, CustomCheckbox, CustomRadio, SearchWithSuggestions, RangeSlider
Feedback & overlays: ToastStack, ConfirmModal, Drawer, Tooltip, PopoverMenu, ContextMenu, Dialog, EmptyState, ShimmerSkeletonCard, SpinnerRing, ProgressBar
Surfaces & basics: Card, GlassPanel, SpotlightCard, ExpandableCard, Button, Badge, Switch, Tabs`,
  webapp: `PRIORITIZE THESE for this build (general web app) — reach for them before scanning the full catalog below; it's still there for anything not covered here.
Core: Button, Card, GlassPanel, SpotlightCard, EmptyState, Tabs, Dialog, Accordion, Switch, Input, Textarea
Data: DataRow, StatBlock, AnimatedNumber, ProgressRing, Sparkline, AvatarStack, FilterChipBar
Feedback: ToastStack, ConfirmModal, Drawer, Tooltip, PopoverMenu, AnnouncementBar
Forms: StepperWizard, CustomCheckbox, CustomRadio, RangeSlider
Layout & hero: AuroraBackground, BackgroundGrid, HeroHeadline, SectionHeading, FeatureCard, BentoGrid, BentoCard, Navbar, Footer, CTASection`,
}

// Compact API reference injected into the generation system prompt — the ONLY
// view of the kit the model gets. Kept next to the source so they can't drift:
// if you change an export or prop above, update this block in the same commit
// (the test cross-checks every export name listed here exists in the source).
export const WYBER_UI_KIT_PROMPT = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WYBER UI KIT — PRE-BUILT PREMIUM COMPONENTS (USE THESE — do NOT hand-write equivalents)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The platform injects src/wyber-ui.tsx into every build: ~155 production-grade, motion-enabled components already themed by YOUR design tokens. Import them instead of writing your own buttons/cards/heroes — they make the app feel premium at zero token cost. Unused imports are tree-shaken.

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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPANDED LIBRARY — 112 more components across 11 categories (same import path './wyber-ui', same token rules as above; grouped by category, one-liner API per component)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HERO & HEADLINE FX:
- <TextScramble text="Ship faster" as="h1" /> — headline text that decodes in from randomized glyphs to the final string as it scrolls into view; use for hero eyebrows or a punchy reveal moment.
- <GradientText as="span" speed={6}>the future</GradientText> — wraps inline text in a continuously sweeping primary-to-accent gradient fill; nest inside HeroHeadline to highlight the key phrase.
- <Typewriter text={["ship fast", "ship safe", "ship once"]} loop /> — types a string (or cycles an array with delete/retype) character by character with a blinking caret; use for hero subheads or CLI-flavored taglines.
- <WordCycler words={["speed", "scale", "teams"]} interval={2200} /> — swaps a single word on an interval with a vertical slide-and-blur transition while reserving layout width so nothing shifts; drop mid-sentence, e.g. "Built for <WordCycler .../>".
- <SplitFlapCounter value={128000} /> — animates digits through an airport split-flap cascade to their final value; use for hero stats, pricing numbers, or live metrics.
- <AnnouncementBar message="New: v2 is live" ctaLabel="Read more" ctaHref="/changelog" /> — slim dismissible top bar with optional marquee scroll and a CTA link; dismissal persists across visits via localStorage.
- <HeroOrbit center={<Logo />} items={[{ icon: <Icon /> }]} radius={140} /> — icons revolve slowly around a center logo/avatar on a circular path, evenly staggered; use above the fold to visualize an ecosystem or integrations.
- <BrowserFrame url="app.yourproduct.com">{content}</BrowserFrame> — macOS-style browser chrome (mono traffic lights + address bar) wrapping any content as the page; use to frame product screenshots or live embeds in a hero.
- <TerminalFrame lines={["npm install", { text: "done in 1.2s", output: true }]} /> — mock terminal window that types out command lines with a blinking cursor and dims output lines; use for dev-tool or CLI-product heroes.
- <PhoneFrame statusBar>{screen}</PhoneFrame> — mobile device bezel with notch and status bar wrapping app-screen content; use for mobile product showcases in a hero or feature section.
- <SplitHero left={content} right={visual} /> — two-column hero layout primitive with a scroll-linked parallax plus scale-in entrance on the right visual slot; use as the top-level layout for a standard hero section.

CARDS & SURFACES:
- <HolographicCard intensity={0.6}>...</HolographicCard> — iridescent foil sheen that tracks the cursor with a subtle tilt/parallax, using layered primary/accent/secondary gradients; use for premium feature cards, pricing highlights, or hero product callouts that should feel tactile and expensive.
- <ClayCard tone="raised">...</ClayCard> — soft claymorphic surface with dual inset/outset shadows for a puffy, tactile 3D look; tone="pressed" gives an inset/pushed-in variant; use for playful dashboards, toggles-as-cards, or settings panels that want warmth over sharp edges.
- <FlipCard front={...} back={...} height={280} flipOnClick={false} /> — true 3D perspective flip (hover by default, or click via flipOnClick) revealing a back face; use for before/after, stat-then-detail, or team-member bio cards.
- <ExpandableCard title="..." summary="..." defaultExpanded={false}>...</ExpandableCard> — click-to-expand card with a smooth height animation and a rotating chevron; use for FAQs, changelog entries, or collapsible spec/detail rows.
- <StackedDepthCards depth={3} offset={10}>...</StackedDepthCards> — front card sits atop 2-3 rotated, offset cards peeking out behind it like a deck; lifts and tilts further on hover; use to imply a collection (templates, saved items, decks) behind the visible card.
- <ImageRevealCard image={...} title="..." subtitle="..." aspect="aspect-[4/5]" /> — image is partially masked until hover, when it scales up and unmasks fully while the title/subtitle slide up over a gradient scrim; use for portfolio tiles, case-study thumbnails, or gallery grids.
- <GlowOrbCard orbPosition="top-right" orbColor="primary">...</GlowOrbCard> — ambient blurred color orb glows behind a corner of the card and intensifies on hover; use for feature cards or CTAs that need an atmospheric, premium glow without a busy background.
- <MasonryGrid columns={3} gap={16}>...</MasonryGrid> — CSS-columns masonry wrapper for variable-height children, Pinterest-style; use for image galleries, testimonial walls, or mixed-height content feeds.
- <RibbonCard ribbonText="Popular" ribbonSide="right">...</RibbonCard> — diagonal corner ribbon badge pinned across a card corner; use for pricing tiers, product cards, or plan comparisons that need a "Popular"/"New"/"Best value" flag.
- <CheckerboardGrid columns={3} offset={32}>...</CheckerboardGrid> — grid where alternating cells are vertically offset for an editorial, non-uniform rhythm; use for team grids, feature grids, or logo walls that shouldn't look like a plain uniform grid.
- <NotchCard notchCorner="top-right" notchSize={24}>...</NotchCard> — brutalist card with a clip-path cut corner instead of a rounded corner; use for technical/engineering-flavored UI, badges, or accent cards that want a sharp, deliberate, non-default silhouette.

NAVIGATION:
<FloatingDockNav items={[{ id: 'home', icon: <Home className="h-4 w-4" />, label: 'Home', href: '/' }]} /> — macOS Dock-style floating pill nav bar fixed to the bottom of the viewport; icons magnify as the cursor approaches them. Use for app-like tool bars, creative portfolios, or as a playful primary nav alternative.
<CommandPalette open={open} onClose={() => setOpen(false)} items={[{ id: 'new', label: 'New Project', group: 'Actions', onSelect: () => {} }]} /> — Cmd+K style search/command modal with backdrop, filterable grouped list, and full keyboard navigation (arrows, enter, escape); parent owns the open boolean and wires the keybind. Use for power-user quick actions, global search, or app command menus.
<MegaMenu label="Products" sections={[{ heading: 'Platform', links: [{ label: 'Overview', href: '/platform' }] }]} /> — nav item that reveals a wide multi-column dropdown panel of link sections on hover or click. Use for marketing sites and dashboards with deep, categorized navigation.
<BottomTabBar items={[{ id: 'home', label: 'Home', icon: <Home className="h-5 w-5" /> }]} active="home" onChange={setTab} /> — fixed mobile bottom tab bar with icon+label items and an active indicator bar that slides between tabs via layoutId. Use as primary navigation on mobile-first app layouts.
<Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]} /> — simple breadcrumb trail with chevron separators and a subtly bolder current-page treatment. Use at the top of nested pages to show hierarchy and let users jump back up.
<SidebarNav items={[{ id: 'overview', label: 'Overview', icon: <Home className="h-4 w-4" /> }]} active="overview" onChange={setActive} collapsed={collapsed} onCollapsedChange={setCollapsed} /> — collapsible vertical sidebar nav list with an animated active-item fill and indicator bar that slide via layoutId. Use as the primary navigation rail in dashboards and admin panels.
<PillTabNav tabs={[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }]} active="day" onChange={setRange} /> — horizontal segmented pill tab switcher with a sliding background pill behind the active tab. Use for compact view/filter toggles like time ranges or billing period switches.
<BackToTop threshold={400} /> — floating circular scroll-to-top button that fades and scales in once the page scrolls past the threshold. Use on long-form content pages, blogs, or docs.
<ProgressTabNav tabs={[{ id: 'intro', label: 'Intro' }]} active="intro" onChange={setSection} progress={0.4} /> — tab nav whose active tab's underline width tracks a 0-1 progress value, driven by scroll position or step progress. Use for reading-progress indicators or multi-step in-page navigation.
<CondensingNavbar brand="Acme" links={[{ label: 'Features', href: '/features' }]} cta={<Button>Sign in</Button>} condensedAt={80} /> — navbar that visibly shrinks height and padding, blurs its background, and scales its logo down once scrolled past the threshold. Use as the primary site navbar on marketing and landing pages for a pronounced premium scroll effect.

BACKGROUNDS & AMBIENT FX:
<MeshGradient blobCount={4} intensity={0.22} speed="slow" /> — Dense, colorful layered blob mesh (primary/accent/secondary) that slowly drifts and scales; use as the primary ambient backdrop for hero sections that need more visual richness than AuroraBackground.
<StarField count={60} color="foreground" /> — Deterministically seeded dots scattered across the section, each gently twinkling on a staggered delay; use for dark, moody, or "space/night" themed hero and footer sections.
<SpotlightSection size={520} dotColor="foreground" /> — Dim dot-grid that lights up brightly in a soft radius around the cursor and fades elsewhere; use on interactive hero/feature sections to reward mouse movement without a full CursorGlow.
<AnimatedGridLines size={48} opacity={0.08} direction="diagonal" /> — Thin grid lines that continuously pan across the section; use behind technical/product sections (dashboards, docs, pricing) for subtle motion without color.
<LiquidBlob size={420} opacity={0.35} /> — Single large organic blob with a primary/accent gradient that continuously morphs shape; use as a focal glow behind a hero headline or CTA card.
<DiagonalStripes animated={true} stripeWidth={14} opacity={0.06} /> — Repeating diagonal stripe pattern, optionally slow-scrolling; use as a low-key texture behind banners, callouts, or CTA bands.
<WavesBackground layers={3} /> — Two to three layered SVG wave shapes anchored to the bottom of a section, each drifting horizontally at a different speed for parallax depth; use to close out a hero or transition into a footer.
<VignetteOverlay strength={0.65} mode="dark" /> — Radial vignette using background/card tokens that darkens or lightens toward the section edges; stack ABOVE other background layers to focus attention on centered content.
<DottedSpotlight rows={9} cols={14} radius={140} dotColor="foreground" /> — Grid of small dots that individually scale up as the cursor passes near them ("magnetic" feel); use on interactive/product sections where SpotlightSection's brightness-only effect feels too subtle.
<GlowOrbsField count={6} size={90} opacity={0.28} /> — Five to eight small blurred glow orbs at fixed seeded positions, each floating up and down independently at a different speed; use for a soft, lively ambient layer behind pricing, testimonial, or feature-grid sections.

TYPOGRAPHY & TEXT FX:
<HighlightMarker color="primary" delay={0.1}>text</HighlightMarker> — wraps inline text with a highlighter-pen underline/background band that sweeps in from the left (scaleX 0 to 1) the moment it scrolls into view; use to call out a key phrase inside a sentence or headline.
<DropCap>Full opening paragraph text as a string.</DropCap> — renders an oversized floated first-letter (editorial drop cap) followed by the rest of the paragraph; use once, on the first paragraph of a long-form article, blog post, or manifesto section.
<TextMaskReveal text="A full sentence or paragraph." /> — splits text into words that individually sharpen from low-opacity/blurred to fully opaque/sharp as the reader scrolls past the block, so the passage appears to "write itself in"; use for a manifesto line, feature explainer, or any paragraph you want to feel scroll-driven rather than static.
<RotatingBadgeText text="ESTABLISHED 2026 • TRUSTED BY TEAMS •" size={96} duration={12} icon={<Star />} /> — small circular badge with the text curved along a circular SVG path that rotates slowly and continuously, with an icon or dot centered inside; use for a seal-of-approval badge, trust stamp, or decorative rotating chip near a hero or footer.
<KineticHeadline text="Ship products that feel alive" by="word" as="h1" /> — headline whose words (or letters, via by="letter") spring in with a scale+rotate+rise entrance, more energetic than a simple rise reveal; use for hero headlines or section titles that need a punchier, more kinetic first impression.
<BlurReveal blur={14} delay={0.05}><p>...</p></BlurReveal> — wraps any block and transitions it from blurred+faded to sharp+visible as it scrolls into view; use for images, cards, or paragraphs that should feel like they're "focusing in" rather than just fading up.
<GradientUnderline href="/pricing">See pricing</GradientUnderline> — inline link or text whose underline is invisible at rest and sweeps in as a primary-to-accent gradient bar on hover; use for inline links or text CTAs inside paragraphs and nav items.
<NumberTicker value={4821} prefix="$" decimals={0} fontSize={48} /> — odometer-style number where each digit column independently rolls/flips into place (distinct from AnimatedNumber's single count-up string); use for stat panels, pricing, or dashboard metrics that should feel mechanical and precise.
<QuoteMark position="top-left" size={140} className="text-primary/10" /> — large decorative oversized quotation-mark SVG glyph, positioned absolutely as a low-opacity background accent; place inside a relative-positioned wrapper behind a pull-quote or testimonial block for editorial texture.

FORMS & INPUTS:
<FloatingLabelInput label="Email" value={email} onChange={setEmail} /> - A text input whose label sits inline at rest and springs up above the border on focus or once filled; use for any labeled form field where you want a premium, non-generic input instead of a plain placeholder-only field.

<OtpInput length={6} value={code} onChange={setCode} /> - A row of individually boxed single-digit inputs with auto-advance on type, backspace-to-previous, arrow-key navigation and paste support; use for phone/email verification codes and 2FA flows.

<PasswordStrengthMeter score={2} /> - A segmented bar that fills and shifts token color (destructive to accent to primary) based on a 0-4 strength score, with a text label underneath; use next to a password field during signup or password change.

<RangeSlider min={0} max={1000} value={price} onChange={setPrice} formatValue={(v) => "$" + v} /> - A custom-styled range input with a floating value bubble that appears above the thumb while dragging; use for price ranges, quantity, volume, or any single numeric range selection.

<ChipToggleGroup options={tagOptions} value={selectedTags} onChange={setSelectedTags} /> - A row of pill-shaped multi-select chips that scale in with a spring when selected and switch to a filled primary treatment; use for tag/category/filter multi-select instead of a checkbox list.

<SearchWithSuggestions value={query} onChange={setQuery} suggestions={results} onSelect={handleSelect} /> - A search input with an animated, keyboard-navigable suggestion dropdown (arrow keys, Enter, Escape, hover highlight); use for command palettes, autocomplete search, or address/entity lookup fields.

<FileDropzone onFiles={handleFiles} accept="image/*" multiple /> - A dashed-border drop target that scales and glows on drag-over, with an icon and instructional text, plus click-to-browse fallback; use for image/document uploads instead of a bare native file input.

<StepperWizard steps={wizardSteps} currentIndex={step} /> - A horizontal multi-step progress indicator with connected circles showing completed (checkmark), active, and upcoming states; use atop multi-step forms, onboarding flows, or checkout.

<ColorSwatchPicker colors={swatchColors} value={selectedColor} onChange={setSelectedColor} /> - A row of circular color swatches (colors supplied via props) with an animated selection ring; use for theme, variant, or product color pickers.

<CustomCheckbox checked={agreed} onChange={setAgreed} label="I agree to the terms" /> - A custom checkbox with a spring-animated checkmark draw-in, full keyboard and aria support; use anywhere a native checkbox would look too plain, e.g. terms acceptance or settings toggles.

<CustomRadio name="plan" value="pro" checkedValue={selectedPlan} onChange={setSelectedPlan} label="Pro" /> - A custom radio button with a spring-animated inner dot, grouped by a shared name/value/onChange contract; use for plan pickers, single-choice settings, or survey options.

<NewsletterInline value={email} onChange={setEmail} onSubmit={handleSubscribe} /> - An inline email-capture row that swaps to a checkmark success state on submit; use for footer/hero newsletter signup and lightweight lead-capture rows.

DATA DISPLAY:
<ProgressRing value={72} label="Complete" /> — circular SVG progress indicator with an animated stroke fill that draws in when scrolled into view and an animated percentage counter centered inside; use for completion %, quota usage, or health scores.
<Sparkline data={[4,9,6,12,10,18,14]} /> — tiny inline line/area chart with no axes that draws itself in on mount, colored primary when trending up and destructive when trending down; use inside table rows, cards, or stat tiles to show a trend at a glance.
<MiniBarChart data={[12,30,18,44,26]} labels={['Mon','Tue','Wed','Thu','Fri']} /> — compact bar chart whose bars spring up to height with a staggered per-bar delay on mount; use for daily/weekly breakdowns in cards or dashboard widgets, not full analytics charts.
<AvatarStack avatars={[{name:'Ada Lovelace'},{name:'Grace Hopper', src:'/a.png'}]} max={4} /> — overlapping circular avatar/initials group with a "+N" overflow badge that gently spreads apart on hover; use for assignees, collaborators, or team members on a card/row.
<FilterChipBar filters={[{id:'1',label:'Status: Active'}]} onRemove={fn} onClearAll={fn} /> — row of removable pill chips representing active filters, each with an x button, plus a "Clear all" link when more than one filter is active; use above tables/lists to show current filter state.
<StickyTable columns={[{key:'name',label:'Name'}]} rows={[{name:'Row 1'}]} maxHeight={360} /> — data table whose header row stays pinned while the body scrolls inside a bounded height, with hover-highlighted rows; use for medium-length data lists that need a fixed header (logs, transactions, records).
<KanbanCard title="Ship v2 onboarding" tags={['Design','P1']} assignee={{name:'Ada Lovelace'}} /> — single kanban board card unit (title, tag badges, assignee avatar, drag handle that fades in on hover) with real elevation/shadow depth on hover; use as the repeating card inside a kanban/board column, not a full board.
<ScrollTimeline items={[{title:'Order placed', date:'Jan 3'},{title:'Shipped', date:'Jan 5'}]} /> — vertical timeline whose connecting line fills as the viewer scrolls through it (useScroll/useTransform), with each dot switching to primary color as it's scrolled past; use for order status, changelogs, or step-by-step history.
<ComparisonTable plans={['Free','Pro','Team']} features={[{name:'Custom domain', values:[false,true,true]}]} highlightIndex={1} /> — feature-by-plan matrix table rendering boolean cells as Check/X icons and string cells as text, with one plan column optionally highlighted; use for pricing/plan comparison sections.
<RatingStars value={4} onChange={fn} /> — star rating control with hover-preview and click-to-set in interactive mode, or a static filled display when readOnly is true; use for reviews, feedback prompts, or displaying an average rating.
<StatCounterGrid stats={[{value:128400, label:'Revenue', delta:12, prefix:'$'}]} columns={3} /> — responsive grid layout wrapper that staggers a set of AnimatedNumber-driven stat tiles into view together; use for dashboard KPI rows/summary sections (it composes AnimatedNumber, it does not reimplement the counting animation).

FEEDBACK & OVERLAYS:
- <ToastStack toasts={[...]} onDismiss={(id) => {}} position="bottom-right" /> — controlled stack of toast notifications that slide in from a screen corner, auto-dismiss after a per-toast duration (pauses on hover), and reflow smoothly when one is removed; variant prop (default/success/error/warning) swaps the icon and accent color; use for save confirmations, background job results, or system alerts.
- <ConfirmModal open={bool} onClose={() => {}} onConfirm={() => {}} title="..." description="..." variant="destructive" loading={bool} /> — Dialog-style confirm/cancel prompt with a tinted icon badge (destructive or default) and a loading spinner state on the confirm button; use for delete confirmations, irreversible actions, or any decision that needs a deliberate second step.
- <Drawer open={bool} onClose={() => {}} title="..." side="right">...</Drawer> — side sheet panel that springs in from the right or left edge with a blurred backdrop, Escape-to-close, and its own scrollable content area; use for filters, item details, settings panels, or secondary flows that shouldn't leave the current page.
- <Tooltip content="..." side="top" delay={300}>...</Tooltip> — small delayed hover/focus tooltip that fades and scales in near its trigger, positioned above/below/left/right via the side prop; use for icon-only buttons, truncated labels, or brief inline help.
- <PopoverMenu trigger={...} items={[{ label: '...', onClick: () => {}, icon: <Icon />, destructive: false }]} align="start" /> — click-triggered floating menu anchored under its trigger, closes on outside click or Escape; use for kebab menus, action lists, or compact dropdown actions attached to a button.
- <ContextMenu items={[{ label: '...', onClick: () => {} }]}>...</ContextMenu> — right-click menu that appears at the exact cursor position (auto-clamped to stay on screen), closes on outside click or Escape; use for canvas/table row actions, custom copy-paste menus, or power-user right-click shortcuts.
- <Lightbox images={[...]} open={bool} onClose={() => {}} index={i} onIndexChange={(i) => {}} /> — full-screen image viewer with a blurred scrim, directional slide transitions between images, prev/next arrow controls, keyboard arrow/Escape support, and dot indicators for position; use for portfolio galleries, product image sets, or any click-to-expand image grid.
- <BeforeAfterSlider beforeImage="..." afterImage="..." beforeLabel="Before" afterLabel="After" /> — two stacked images revealed by a draggable divider handle (click-to-jump or drag), using clip-path so both images stay pixel-aligned; use for before/after transformations, redesign comparisons, or editing/filter demos.
- <CookieConsentBar message="..." acceptLabel="Accept" declineLabel="Decline" onAccept={() => {}} onDecline={() => {}} /> — bottom-fixed consent bar that springs up from off-screen with a message and two actions, then dismisses itself; use for cookie/tracking consent or any dismissible bottom-of-page notice.
- <NotificationBell count={n} notifications={[{ id: '1', title: '...', description: '...', time: '2m ago', read: false }]} onItemClick={(id) => {}} /> — bell icon button with a spring-pop unread-count badge that wobbles on new arrivals, opening a scrollable dropdown list of notifications on click; use for app header notification centers or activity indicators.

MARKETING SECTIONS:
<LogoCloud logos={[{name:'Acme',src:'/logos/acme.svg'}]} columns={5} /> — animated grid/row of partner logo slots, grayscale and muted by default, full color on hover; use for "backed by" or "works with" strips.
<PlanComparisonMatrix plans={[{name:'Pro',price:'$29',featured:true}]} rows={[{label:'Seats',values:[true,'Unlimited']}]} /> — pricing-specific feature comparison table across 2-4 plan columns with check/x icons per row and a highlighted featured plan column; use instead of a generic comparison table when comparing pricing tiers.
<FAQAccordionIcon items={[{question:'Is there a free trial?',answer:'Yes, 14 days.'}]} /> — FAQ list styled as individual bordered cards where each item's plus icon rotates into an x on open; use for FAQ sections that need more visual weight than a plain divider list.
<SocialProofRow avatarUrls={['/a1.jpg','/a2.jpg']} rating={5} teamCount={1200} /> — compact horizontal avatar cluster plus star rating plus "trusted by N+ teams" line; use under a hero or CTA for lightweight credibility.
<StickyCTABar message="Ready to ship faster?" ctaLabel="Start free" threshold={400} /> — bottom-fixed bar that slides up once the user scrolls past a pixel threshold; use as a persistent conversion nudge on long landing pages.
<PricingToggle value="monthly" onChange={setBillingPeriod} savePercent={20} /> — monthly/yearly segmented sliding-pill switch with an animated "save X%" badge next to yearly; use above pricing cards to let users toggle billing period.
<TestimonialWall testimonials={[{quote:'Great product.',name:'Jane Doe',role:'CTO'}]} columns={3} /> — dense masonry-style grid wall of many compact testimonial snippets with staggered scroll-in entrance; use when you have many short quotes rather than a few long ones.
<IntegrationGrid integrations={[{name:'Slack',iconSrc:'/icons/slack.svg'}]} columns={4} /> — grid of bordered cells each holding an integration/tool icon with a subtle hover lift; use for "integrates with" sections.
<ChangelogTimeline entries={[{version:'v2.4.0',date:'Sep 2026',tag:'New',description:'Added dark mode.'}]} /> — vertical list of version entries with date, tag/badge and description connected by a hairline, editorial spacing, scroll-in entrance; use for a product changelog or release notes page.
<StatsBanner stats={[{value:'12K+',label:'Active teams'},{value:'99.99%',label:'Uptime'}]} /> — full-width horizontal strip of 3-5 big stat numbers divided by hairlines (stacks vertically on mobile); use for a "by the numbers" proof section.
<CTAGradientBanner title="Start building today" description="No credit card required." ctaLabel="Get started free" /> — bold full-bleed CTA section with an animated conic-gradient mesh background, large headline and a single strong button; use as a dramatic closing section instead of the plain CTASection.

SHOWCASE & MOCKUP FRAMES:
- <WindowControls size={10} gap={6} /> — decorative macOS-style traffic-light dot cluster built from semantic tokens (not literal red/yellow/green); drop into any custom frame/header composition that needs window chrome.
- <CodeBlock code={"..."} filename="app.tsx" highlightLines={[3,4]} /> — styled code block with a filename header bar, copy button that flashes a brief "Copied" confirmation, optional line numbers, and a highlightLines prop that tints specific lines; use for docs, changelogs, or "here's the code" product sections.
- <ChatBubble message="Hey there" variant="sent" name="You" timestamp="2:41 PM" /> — chat message bubble, right-aligned/primary-colored for variant="sent" and left-aligned/muted for variant="received", with optional avatar and timestamp; use for messaging-app demos, AI-assistant transcripts, or testimonial-as-DM sections.
- <DeviceFrameSet laptopSrc="/hero-laptop.png" phoneSrc="/hero-phone.png" /> — laptop window frame with a smaller phone frame overlapping its bottom-right corner, each wrapping an image or custom children; use for "your app on every device" hero showcases.
- <VideoFrame src="/demo.mp4" poster="/demo-poster.jpg" /> — framed video player with a centered circular play-button overlay that fades out once playback starts; use for product-demo clips or feature walkthroughs instead of a bare <video> tag.
- <ScreenshotTilt src="/dashboard.png" tilt={10} /> — product screenshot rendered at a fixed dramatic 3D perspective tilt with a soft ambient glow beneath it; use as a hero product shot above the fold.
- <QRFrame src="/qr-code.png" caption="Scan to open on mobile" size={160} /> — small square frame with corner-tick decorations around a QR/code image plus a caption line beneath; use for mobile-handoff prompts or event/ticket codes.
- <AppStoreBadgeRow iosHref="#" androidHref="#" iosLabel="App Store" androidLabel="Google Play" /> — row of two generic dark pill "download" buttons (device icon + two-line eyebrow/label text stack) built entirely from semantic tokens and generic icons, not real Apple/Google logos; use in footers or mobile-app landing sections.

PREMIUM INTERACTIONS:
<MagneticButton strength={0.5} radius={120}>Get started</MagneticButton> — a button that pulls itself slightly toward the cursor whenever the pointer comes within radius pixels of it and snaps back with a spring on mouse-leave; use for hero CTAs and other single high-emphasis actions you want to feel alive.
<DraggableCarousel gap={16}>{cards}</DraggableCarousel> — wraps a row of children in a horizontally drag-scrollable track with momentum/elastic physics and auto-computed drag bounds; use for testimonial rows, product cards, or any horizontal collection wider than its container.
<InfiniteLogoMarquee logos={[{ id: 'a', content: <Logo/> }]} speed={28} /> — an infinitely looping horizontal strip of logos/icons that sit desaturated and dimmed until individually hovered, at which point that one logo reveals full color; use for "trusted by" / partner logo rows.
<ConfettiBurst ref={confettiRef} count={24} triggerOnClick>{content}</ConfettiBurst> — click anywhere inside it (or call ref.current.burst(xPercent, yPercent) from code) to fire a one-shot burst of small primary/accent/secondary colored particles exploding outward and fading; use for success states, checkout confirmations, milestone/achievement moments.
<ShimmerSkeletonCard lines={3} showAvatar /> — a composed loading placeholder card (avatar circle + heading bar + a few text-line bars) with a diagonal light-sweep animation passing across it; use as the loading state for card-shaped content like list rows, profile cards, or feed items.
<SpinnerRing variant="ring" size={24} /> — a small inline loading indicator with three styles (variant="ring" for a spinning ring, "dots" for three bouncing dots, "bars" for pulsing bars), all token-colored; use inside buttons, inline loading rows, or anywhere you need a compact spinner.
<ProgressBar value={62} max={100} /> — a linear progress bar whose fill animates to its target width with a spring; pass indeterminate to switch to a sweeping gradient segment for unknown-duration loading (uploads, processing steps, page transitions).
<HoverImageGrid images={[{ id: '1', src: '/a.jpg', alt: 'A' }]} columns={3} /> — an image grid gallery where hovering one image scales it up slightly while the rest dim and desaturate, all with spring transitions; use for portfolio grids, photo galleries, or media showcases.
<CursorFollowBlob size={220} color="primary" /> — place inside a relatively-positioned container to get a soft blurred glow blob that trails the cursor with spring lag (distinct from CursorGlow, which snaps to the exact pointer position); use behind hero content or interactive panels for an ambient premium feel.
<ScrollHorizontalGallery distance={1200}>{items}</ScrollHorizontalGallery> — pins a horizontal row of children and translates it sideways as the user scrolls vertically past the section (scroll-jacked gallery); use for case-study showcases, image galleries, or step sequences you want to reveal horizontally during normal page scroll.

RULES:
- PREFER kit components over hand-rolled ones for: nav, footer, pricing, testimonials, FAQ, stats, feature grids, CTAs, modals, tabs.
- Landing pages: hero gets <AuroraBackground/> or <BackgroundGrid/> behind it; every section wrapped in <Reveal> or <Stagger>; use <BentoGrid> for feature showcases.
- You may still write custom components for app-specific UI (tables, kanban, calendars) — style them with the same tokens.
- Do NOT create src/wyber-ui.tsx yourself, do NOT re-export from it, do NOT import it in index.css.`
