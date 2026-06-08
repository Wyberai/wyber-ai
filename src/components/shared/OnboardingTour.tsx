'use client'
import { useState, useEffect, useRef } from 'react'

const STEPS = [
  {
    title: 'Welcome to Wyber AI 👋',
    desc: 'Build apps, deploy AI agents, and create workflows — all with AI. Let us show you around.',
    target: null,
  },
  {
    title: 'Start from a Template',
    desc: 'Browse 100+ pre-built apps — CRM, dashboards, e-commerce. Click any to start building instantly.',
    target: '[data-tour="templates"]',
  },
  {
    title: '5,000 AI Agents',
    desc: 'Pick from 5,000 pre-built AI agents. Click any agent to configure and run it automatically.',
    target: '[data-tour="agents"]',
  },
  {
    title: 'Build Your Own App',
    desc: 'Click "New Project" and describe any app in plain English. AI builds the full code instantly.',
    target: '[data-tour="new-project"]',
  },
  {
    title: "You're Ready!",
    desc: 'Start with a template or describe your own idea. Your app will be live in under 60 seconds.',
    target: null,
  },
]

export function OnboardingTour() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    const done = localStorage.getItem('wyber_tour_done')
    if (!done) setTimeout(() => setVisible(true), 1200)
  }, [])

  useEffect(() => {
    if (!visible) return
    const s = STEPS[step]
    if (s.target) {
      const el = document.querySelector(s.target)
      if (el) setRect(el.getBoundingClientRect())
      else setRect(null)
    } else setRect(null)
  }, [step, visible])

  const finish = () => { localStorage.setItem('wyber_tour_done', '1'); setVisible(false) }
  const next = () => step < STEPS.length - 1 ? setStep(s => s + 1) : finish()
  const prev = () => setStep(s => Math.max(0, s - 1))

  if (!visible) return null
  const s = STEPS[step]
  const isCenter = !s.target || !rect

  const cardStyle: React.CSSProperties = isCenter ? {
    position: 'fixed', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
  } : {
    position: 'fixed',
    top: rect ? rect.bottom + 12 : '50%',
    left: rect ? Math.max(16, Math.min(rect.left, window.innerWidth - 340)) : '50%',
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 10000, backdropFilter: 'blur(2px)' }} onClick={finish} />
      {rect && (
        <div style={{ position: 'fixed', top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12, borderRadius: 10, boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)', border: '2px solid #0EA5E9', zIndex: 10001, pointerEvents: 'none' }} />
      )}
      <div style={{ ...cardStyle, zIndex: 10002, width: 320, background: '#111118', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 16, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', gap: 5, marginBottom: 16 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ height: 4, flex: i === step ? 2 : 1, borderRadius: 2, background: i <= step ? '#0EA5E9' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
          ))}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fafafa', marginBottom: 8 }}>{s.title}</div>
        <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6, marginBottom: 20 }}>{s.desc}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {step > 0 && <button onClick={prev} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#71717a', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>}
          <button onClick={next} style={{ flex: 1, padding: '9px 16px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {step === STEPS.length - 1 ? 'Start Building →' : 'Next →'}
          </button>
          <button onClick={finish} style={{ padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#52525b', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Skip</button>
        </div>
      </div>
    </>
  )
}
