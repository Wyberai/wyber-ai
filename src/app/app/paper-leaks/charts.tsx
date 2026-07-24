'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export interface BarDatum {
  key: string
  label: string
  value: number
  color?: string
  icon?: string
}

interface TooltipState {
  x: number
  y: number
  datum: BarDatum
}

function ChartTooltip({ x, y, datum, color }: { x: number; y: number; datum: BarDatum; color: string }) {
  return (
    <div
      role="status"
      style={{
        position: 'fixed', left: x + 14, top: y - 14, zIndex: 200, pointerEvents: 'none',
        background: 'var(--brand-bg-overlay)', border: '1px solid var(--brand-border-strong)',
        borderRadius: 8, padding: '7px 11px', boxShadow: '0 10px 30px rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 10, height: 2, background: color, display: 'inline-block', borderRadius: 1, flexShrink: 0 }} />
      <span style={{ fontFamily: 'var(--brand-mono)', fontSize: 12.5, fontWeight: 700, color: 'var(--brand-text)' }}>{datum.value}</span>
      <span style={{ fontSize: 11.5, color: 'var(--brand-text-dim)' }}>{datum.label}</span>
    </div>
  )
}

/** Horizontal bar: label column, thin pill track, rounded data-end (tip), value at the tip. */
export function HorizontalBarChart({ data, defaultColor }: { data: BarDatum[]; defaultColor: string }) {
  const [tip, setTip] = useState<TooltipState | null>(null)
  const max = Math.max(1, ...data.map(d => d.value))
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {data.map(d => {
          const pct = Math.max(3, (d.value / max) * 100)
          const color = d.color ?? defaultColor
          const active = tip?.datum.key === d.key
          return (
            <div key={d.key} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,150px) 1fr 26px', alignItems: 'center', gap: 10 }}>
              <div
                title={d.label}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: active ? 'var(--brand-text)' : 'var(--brand-text-dim)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', transition: 'color 0.15s' }}
              >
                {d.icon && <span aria-hidden style={{ fontSize: 12, flexShrink: 0 }}>{d.icon}</span>}
                {d.label}
              </div>
              <div
                role="img"
                aria-label={`${d.label}: ${d.value}`}
                tabIndex={0}
                onMouseMove={e => setTip({ x: e.clientX, y: e.clientY, datum: d })}
                onMouseEnter={e => setTip({ x: e.clientX, y: e.clientY, datum: d })}
                onMouseLeave={() => setTip(null)}
                onFocus={e => { const r = e.currentTarget.getBoundingClientRect(); setTip({ x: r.right, y: r.top, datum: d }) }}
                onBlur={() => setTip(null)}
                style={{ position: 'relative', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', cursor: 'default', outline: 'none' }}
              >
                <div
                  style={{
                    position: 'absolute', inset: 0, width: `${pct}%`, borderRadius: '0 4px 4px 0', background: color,
                    transition: 'width 0.6s var(--brand-ease), box-shadow 0.15s',
                    boxShadow: active ? `0 0 10px ${color}` : 'none',
                  }}
                />
              </div>
              <div style={{ fontSize: 11.5, color: active ? 'var(--brand-text)' : 'var(--brand-text-faint)', textAlign: 'right', fontFamily: 'var(--brand-mono)', fontVariantNumeric: 'tabular-nums' }}>{d.value}</div>
            </div>
          )
        })}
      </div>
      {tip && <ChartTooltip x={tip.x} y={tip.y} datum={tip.datum} color={tip.datum.color ?? defaultColor} />}
    </div>
  )
}

/** Vertical column chart: value on the cap, category label under the baseline. */
export function VerticalBarChart({ data, defaultColor, height = 132 }: { data: BarDatum[]; defaultColor: string; height?: number }) {
  const [tip, setTip] = useState<TooltipState | null>(null)
  const max = Math.max(1, ...data.map(d => d.value))
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height }}>
        {data.map(d => {
          const pct = Math.max(5, (d.value / max) * 100)
          const color = d.color ?? defaultColor
          const active = tip?.datum.key === d.key
          return (
            <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 6, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--brand-mono)', color: active ? color : 'var(--brand-text-faint)', transition: 'color 0.15s' }}>{d.value}</div>
              <div
                role="img"
                aria-label={`${d.label}: ${d.value}`}
                tabIndex={0}
                onMouseMove={e => setTip({ x: e.clientX, y: e.clientY, datum: d })}
                onMouseEnter={e => setTip({ x: e.clientX, y: e.clientY, datum: d })}
                onMouseLeave={() => setTip(null)}
                onFocus={e => { const r = e.currentTarget.getBoundingClientRect(); setTip({ x: r.left + r.width / 2, y: r.top, datum: d }) }}
                onBlur={() => setTip(null)}
                style={{
                  width: '100%', maxWidth: 22, height: `${pct}%`, minHeight: 4, borderRadius: '4px 4px 0 0', background: color,
                  outline: 'none', cursor: 'default', transition: 'height 0.6s var(--brand-ease), box-shadow 0.15s',
                  boxShadow: active ? `0 0 12px ${color}` : 'none',
                }}
              />
              <div style={{ fontSize: 10, fontFamily: 'var(--brand-mono)', color: 'var(--brand-text-faint)' }}>{d.label}</div>
            </div>
          )
        })}
      </div>
      {tip && <ChartTooltip x={tip.x} y={tip.y} datum={tip.datum} color={tip.datum.color ?? defaultColor} />}
    </div>
  )
}

/** Proportional mosaic strip: tile width ∝ value (flex-grow), sequential-hue
 * intensity ∝ value, wraps into rows. A denser, more visual alternative to a
 * bar list for a magnitude-by-category breakdown with many small slots. */
export function MosaicStrip({ data, defaultColor }: { data: BarDatum[]; defaultColor: string }) {
  const [tip, setTip] = useState<TooltipState | null>(null)
  const maxVal = Math.max(1, ...data.map(d => d.value))
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {data.map(d => {
          const intensity = 0.32 + 0.68 * (d.value / maxVal)
          const active = tip?.datum.key === d.key
          const showLabel = d.value / maxVal >= 0.3
          return (
            <div
              key={d.key}
              role="img"
              aria-label={`${d.label}: ${d.value}`}
              tabIndex={0}
              onMouseMove={e => setTip({ x: e.clientX, y: e.clientY, datum: d })}
              onMouseEnter={e => setTip({ x: e.clientX, y: e.clientY, datum: d })}
              onMouseLeave={() => setTip(null)}
              onFocus={e => { const r = e.currentTarget.getBoundingClientRect(); setTip({ x: r.left, y: r.top, datum: d }) }}
              onBlur={() => setTip(null)}
              style={{
                flex: `${d.value} 1 0px`, minWidth: 44, height: 68, borderRadius: 8,
                background: defaultColor, opacity: intensity,
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2,
                cursor: 'default', outline: 'none', padding: '0 6px',
                boxShadow: active ? `0 10px 24px ${defaultColor}66, 0 0 0 2px ${defaultColor}` : 'none',
                transform: active ? 'translateY(-3px)' : 'none',
                transition: 'transform 0.2s var(--brand-ease), box-shadow 0.2s var(--brand-ease), opacity 0.4s',
              }}
            >
              {d.icon && <span aria-hidden style={{ fontSize: 13 }}>{d.icon}</span>}
              <div style={{ fontFamily: 'var(--brand-mono)', fontWeight: 700, fontSize: 15, color: '#fff', lineHeight: 1 }}>{d.value}</div>
              {showLabel && (
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.9)', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '100%' }}>{d.label}</div>
              )}
            </div>
          )
        })}
      </div>
      {tip && <ChartTooltip x={tip.x} y={tip.y} datum={tip.datum} color={defaultColor} />}
    </div>
  )
}

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
    let timer: ReturnType<typeof setTimeout>
    const start = Date.now()
    const duration = 850
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setValue(Math.round(eased * target))
      if (t < 1) timer = setTimeout(tick, 16)
    }
    timer = setTimeout(tick, 16)
    return () => clearTimeout(timer)
  }, [target, active])
  return active ? value : target
}

/** The single big number a dashboard leads with — one per view. */
export function HeroNumber({ value, label }: { value: number; label: string }) {
  const reduceMotion = useReducedMotion()
  const display = useCountUp(value, !reduceMotion)
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--brand-mono)', fontWeight: 700, fontSize: 'clamp(68px,11vw,136px)', lineHeight: 0.9,
          color: 'var(--brand-text)', letterSpacing: '-0.03em', textShadow: '0 0 80px var(--brand-glow)',
        }}
      >
        {display.toLocaleString()}
      </div>
      <div className="mk-stat-label" style={{ marginTop: 8 }}>{label}</div>
    </div>
  )
}

export function StatTile({ label, value, delay = 0 }: { label: string; value: number | string; delay?: number }) {
  const reduceMotion = useReducedMotion()
  const numeric = typeof value === 'number'
  const display = useCountUp(numeric ? value : 0, numeric && !reduceMotion)
  return (
    <motion.div
      className="mk-card"
      initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ padding: '16px 18px' }}
    >
      <div className="mk-stat">{numeric ? display.toLocaleString() : value}</div>
      <div className="mk-stat-label" style={{ marginTop: 4 }}>{label}</div>
    </motion.div>
  )
}

export function BreakdownTable({ groups }: { groups: { title: string; rows: BarDatum[] }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 16 }}>
      {groups.map(g => (
        <div key={g.title} className="mk-card" style={{ padding: 18 }}>
          <div className="mk-stat-label" style={{ marginBottom: 12 }}>{g.title}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0 0 6px', color: 'var(--brand-text-faint)', fontWeight: 500, borderBottom: '1px solid var(--brand-border)' }}>Label</th>
                <th style={{ textAlign: 'right', padding: '0 0 6px', color: 'var(--brand-text-faint)', fontWeight: 500, borderBottom: '1px solid var(--brand-border)', fontFamily: 'var(--brand-mono)' }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {g.rows.map(r => (
                <tr key={r.key}>
                  <td style={{ padding: '6px 0', color: 'var(--brand-text-dim)' }}>{r.label}</td>
                  <td style={{ padding: '6px 0', textAlign: 'right', fontFamily: 'var(--brand-mono)', color: 'var(--brand-text)', fontVariantNumeric: 'tabular-nums' }}>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
