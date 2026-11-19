'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SignalFrame } from '@/components/signal/SignalFrame'
import { readCtx, type SignalCtx } from '@/lib/signal/handoff'

// The ids are what is stored in profiles.persona, so they stay as they were; only the words changed.
const PERSONAS = [
  { id: 'solo', label: 'Solo founder', desc: 'Building alone. Speed and simplicity.' },
  { id: 'team', label: 'Small team', desc: '2 to 10 people building together.' },
  { id: 'agency', label: 'Agency or freelancer', desc: 'Building for clients.' },
  { id: 'enterprise', label: 'Growing business', desc: 'Fixing how the business runs.' },
]

const PRODUCTS = [
  { id: 'web', label: 'Web app', desc: 'Dashboards, internal tools, CRMs.' },
  { id: 'mobile', label: 'Mobile app', desc: 'iOS and Android with React Native and Expo.' },
  { id: 'website', label: 'Website', desc: 'Landing pages, portfolios, marketing sites.' },
  { id: 'saas', label: 'SaaS product', desc: 'Sign-in, dashboard, billing and settings.' },
]

const ROUTES: Record<string, string> = { web: '/dashboard', mobile: '/dashboard?new=mobile', website: '/dashboard?new=website', saas: '/dashboard?new=saas' }

/**
 * Onboarding in the Signal design. If the visitor already described what they want on the homepage, there is nothing
 * to ask about the product: after their name (and an optional role) they go straight to the dashboard, where the saved
 * brief starts the first build. Otherwise it asks what they are building, as before.
 */
export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [persona, setPersona] = useState('')
  const [product, setProduct] = useState('')
  const [loading, setLoading] = useState(false)
  const [ctx, setCtx] = useState<SignalCtx | null>(null)
  const router = useRouter()
  const supabase = createClient()
  useEffect(() => { setCtx(readCtx()) }, [])
  // Someone who builds for clients does not need to pick a product first: they start from their client desk.
  const total = ctx || persona === 'agency' ? 2 : 3

  const finish = async (chosen: string, skipPersona = false) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ full_name: name, ...(skipPersona || !persona ? {} : { persona }), onboarded: true }).eq('id', user.id)
    }
    // Someone who builds for clients lands on their client desk; everyone else goes where they asked to build.
    router.push(ctx ? '/dashboard' : persona === 'agency' && !skipPersona ? '/clients?welcome=1' : ROUTES[chosen] ?? '/dashboard')
  }

  return (
    <SignalFrame bare>
      <div className="sg-wrap">
        <div className="sg-auth" style={{ gridTemplateColumns: 'minmax(0, 560px)', justifyContent: 'center' }}>
          <div className="sg-acard">
            <div style={{ display: 'flex', gap: 6, marginBottom: 22 }} aria-hidden="true">
              {Array.from({ length: total }, (_, i) => <i key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: step > i ? 'var(--sg-hot)' : 'var(--sg-line)' }} />)}
            </div>
            <p className="sg-mono sg-lbl" style={{ margin: '0 0 8px' }}>Step {step} of {total}</p>

            {step === 1 && (
              <form onSubmit={e => { e.preventDefault(); if (name.trim()) setStep(2) }}>
                <h1>Welcome. What should we call you?</h1>
                {ctx && <p className="sg-sub2">Your {ctx.kindLabel.toLowerCase()}, <b>{ctx.title}</b>, is ready to start.</p>}
                <label className="sg-lb" htmlFor="sg-name">Your name</label>
                <input id="sg-name" className="sg-field" value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" autoFocus />
                <button className="sg-btn" type="submit" style={{ width: '100%', marginTop: 18 }} disabled={!name.trim()}>Continue</button>
              </form>
            )}

            {step === 2 && (
              <>
                <h1>What describes you best?</h1>
                <p className="sg-sub2">Optional. It helps us show the features that matter most to you first.</p>
                <div className="sg-tiles">
                  {PERSONAS.map(p => (
                    <button key={p.id} type="button" className="sg-tile" aria-pressed={persona === p.id} onClick={() => setPersona(persona === p.id ? '' : p.id)}>
                      <b>{p.label}</b><span>{p.desc}</span>
                    </button>
                  ))}
                </div>
                {ctx ? (
                  <>
                    <button className="sg-btn" type="button" style={{ width: '100%' }} disabled={loading} onClick={() => finish('web')}>{loading ? 'Setting up…' : 'Start my build'}</button>
                    <p className="sg-hint">The dashboard opens with your brief and starts building.</p>
                  </>
                ) : (
                  <button className="sg-btn" type="button" style={{ width: '100%' }} onClick={() => (persona === 'agency' ? finish('web') : setStep(3))}>{persona === 'agency' ? (loading ? 'Setting up…' : 'Open my client desk') : 'Continue'}</button>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <h1>What are you building?</h1>
                <p className="sg-sub2">Pick one to start. You can make any mix from the dashboard.</p>
                <div className="sg-tiles">
                  {PRODUCTS.map(p => (
                    <button key={p.id} type="button" className="sg-tile" aria-pressed={product === p.id} onClick={() => setProduct(p.id)}>
                      <b>{p.label}</b><span>{p.desc}</span>
                    </button>
                  ))}
                </div>
                <button className="sg-btn" type="button" style={{ width: '100%' }} disabled={loading || !product} onClick={() => finish(product)}>{loading ? 'Setting up…' : 'Start building'}</button>
                <button type="button" className="sg-linkbtn" style={{ display: 'block', margin: '8px auto 0' }} onClick={() => finish('web', true)}>Skip for now</button>
              </>
            )}
          </div>
        </div>
      </div>
    </SignalFrame>
  )
}
