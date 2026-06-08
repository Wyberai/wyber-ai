'use client'
import { useState, useEffect } from 'react'

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Wyber AI 👋',
    description: 'Build apps, deploy AI agents, and create workflows — all with AI. Let us show you around in 60 seconds.',
    target: null,
    position: 'center',
  },
  {
    id: 'new-project',
    title: 'Start Building',
    description: 'Click "New Project" to describe any app in plain English. Wyber AI will generate the full code instantly.',
    target: '[data-tour="new-project"]',
    position: 'bottom',
  },
  {
    id: 'templates',
    title: '130+ Ready-Made Templates',
    description: 'Browse our gallery of pre-built apps — CRM, dashboards, e-commerce, and more. Zero credits to preview.',
    target: '[data-tour="templates"]',
    position: 'right',
  },
  {
    id: 'agents',
    title: '5,000 AI Agents',
    description: 'Pick from 5,000 pre-built AI agents across 18 industries. Click any agent to open it in the visual canvas builder.',
    target: '[data-tour="agents"]',
    position: 'right',
  },
  {
    id: 'flows',
    title: 'Workflow Builder',
    description: 'Connect apps and automate workflows with drag-and-drop nodes. No code required.',
    target: '[data-tour="flows"]',
    position: 'right',
  },
  {
    id: 'credits',
    title: 'You\'re Ready!',
    description: 'Each generation uses 1 credit. You have plenty to get started. Describe your first app and watch it build in real time.',
    target: null,
    position: 'center',
  },
]

export function OnboardingTour() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    const done = localStorage.getItem('wyber_onboarding_done')
    const isNewUser = !localStorage.getItem('wyber_has_visited')
    if (!done && isNewUser) {
      setTimeout(() => setVisible(true), 1500)
    }
    localStorage.setItem('wyber_has_visited', '1')
  }, [])

  useEffect(() => {
    if (!visible) return
    const current = STEPS[step]
    if (current.target) {
      const el = document.querySelector(current.target)
      if (el) setTargetRect(el.getBoundingClientRect())
      else setTargetRect(null)
    } else {
      setTargetRect(null)
    }
  }, [step, visible])

  const finish = () => {
    localStorage.setItem('wyber_onboarding_done', '1')
    setVisible(false)
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  const prev = () => setStep(s => Math.max(0, s - 1))

  if (!visible) return null

  const current = STEPS[step]
  const isCenter = current.position === 'center'

  return (
    <>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, backdropFilter: 'blur(2px)' }} onClick={finish} />

      {/* Spotlight on target */}
      {targetRect && (
        <div style={{
          position: 'fixed',
          top: targetRect.top - 6,
          left: targetRect.left - 6,
          width: targetRect.width + 12,
          height: targetRect.height + 12,
          borderRadius: 10,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
          border: '2px solid #0EA5E9',
          zIndex: 10001,
          pointerEvents: 'none',
          transition: 'all 0.3s ease',
        }} />
      )}

      {/* Tooltip card */}
      <div style={{
        position: 'fixed',
        zIndex: 10002,
        ...(isCenter ? {
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
        } : targetRect ? {
          top: targetRect.bottom + 16,
          left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 340)),
        } : {
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
        }),
        width: 320,
        background: '#111118',
        border: '1px solid rgba(14,165,233,0.3)',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(14,165,233,0.1)',
        animation: 'tourIn 0.25s ease',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 6, height: 6,
              borderRadius: 999,
              background: i === step ? '#0EA5E9' : i < step ? 'rgba(14,165,233,0.4)' : 'rgba(255,255,255,0.1)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, color: '#fafafa', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>
          {current.title}
        </div>
        <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6, marginBottom: 20 }}>
          {current.description}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {step > 0 && (
            <button onClick={prev} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#71717a', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Back
            </button>
          )}
          <button onClick={next} style={{ flex: 1, padding: '9px 16px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {step === STEPS.length - 1 ? 'Start Building →' : 'Next →'}
          </button>
          <button onClick={finish} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: '#52525b', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            Skip
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tourIn {
          from { opacity: 0; transform: ${isCenter ? 'translate(-50%, -48%) scale(0.97)' : 'translateY(-4px)'} }
          to { opacity: 1; transform: ${isCenter ? 'translate(-50%, -50%) scale(1)' : 'translateY(0)'} }
        }
      `}</style>
    </>
  )
}
