'use client'
import { useEffect, useRef, useState } from 'react'

// Animation 1: Prompt → Code streaming
export function GenerateAnimation() {
  const [phase, setPhase] = useState(0) // 0: typing, 1: streaming, 2: done
  const [typed, setTyped] = useState('')
  const [code, setCode] = useState('')
  const prompt = 'Build a CRM dashboard for NestFinder real estate'
  const codeLines = [
    '<file path="src/App.tsx">',
    "import Sidebar from './Sidebar'",
    "import Dashboard from './Dashboard'",
    '',
    'export default function App() {',
    '  return (',
    '    <div style={{display:"flex"}}>',
    '      <Sidebar />',
    '      <Dashboard />',
    '    </div>',
    '  )',
    '}',
    '</file>',
  ]

  useEffect(() => {
    let timeout: NodeJS.Timeout
    // Phase 0: type prompt
    if (phase === 0) {
      if (typed.length < prompt.length) {
        timeout = setTimeout(() => setTyped(prompt.slice(0, typed.length + 1)), 40)
      } else {
        timeout = setTimeout(() => setPhase(1), 600)
      }
    }
    // Phase 1: stream code
    if (phase === 1) {
      const full = codeLines.join('\n')
      if (code.length < full.length) {
        timeout = setTimeout(() => setCode(full.slice(0, code.length + 3)), 18)
      } else {
        timeout = setTimeout(() => setPhase(2), 800)
      }
    }
    // Phase 2: reset
    if (phase === 2) {
      timeout = setTimeout(() => { setPhase(0); setTyped(''); setCode('') }, 2500)
    }
    return () => clearTimeout(timeout)
  }, [phase, typed, code])

  const highlighted = code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(import|export|default|return|from|const|function)/g, '<span style="color:#8b5cf6">$1</span>')
    .replace(/(&lt;[^&]*&gt;)/g, '<span style="color:#0EA5E9">$1</span>')
    .replace(/('[^']*')/g, '<span style="color:#10b981">$1</span>')

  return (
    <div style={{ background: '#0d0d0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', height: 280 }}>
      {/* Window chrome */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.6 }} />)}
        <div style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#3f3f46', fontFamily: 'monospace' }}>wyberai.com/project</div>
      </div>
      {/* Prompt input */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(14,165,233,0.3)', background: 'rgba(14,165,233,0.05)', fontSize: 12, color: '#fafafa', fontFamily: 'inherit', minHeight: 20 }}>
          {typed}{typed.length < prompt.length && phase === 0 && <span style={{ animation: 'blink 1s step-end infinite', borderLeft: '2px solid #0EA5E9', marginLeft: 1 }}>&nbsp;</span>}
        </div>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: phase === 0 ? '#0EA5E9' : '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
          {phase === 1
            ? <div style={{ width: 10, height: 10, border: '2px solid #52525b', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            : <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 19V5M5 12l7-7 7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/></svg>
          }
        </div>
      </div>
      {/* Code output */}
      <div style={{ padding: '12px 14px', flex: 1 }}>
        {phase >= 1 && (
          <pre style={{ margin: 0, fontSize: 11, lineHeight: 1.7, color: '#71717a', fontFamily: "'Fira Code', monospace", whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'hidden' }}
            dangerouslySetInnerHTML={{ __html: highlighted + (phase === 1 ? '<span style="display:inline-block;width:6px;height:12px;background:#0EA5E9;animation:blink 1s step-end infinite;vertical-align:middle;border-radius:1px"/>' : '') }}
          />
        )}
        {phase === 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
            Built in 12s · 3 files · 0 errors
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  )
}

// Animation 2: Deploy flow
export function DeployAnimation() {
  const [step, setStep] = useState(0)
  const steps = [
    { label: 'Pushing to GitHub...', color: '#52525b', done: false },
    { label: 'Building on Vercel...', color: '#f59e0b', done: false },
    { label: 'Deployed successfully!', color: '#22c55e', done: true },
  ]

  useEffect(() => {
    const t = setInterval(() => setStep(s => s < 3 ? s + 1 : 0), step === 2 ? 3000 : 1400)
    return () => clearInterval(t)
  }, [step])

  return (
    <div style={{ background: '#0d0d0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', height: 280, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.6 }} />)}
        <div style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#3f3f46', fontFamily: 'monospace' }}>Deploy to Vercel</div>
      </div>

      <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: i <= step ? 1 : 0.3, transition: 'opacity 0.4s' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${i < step ? '#22c55e' : i === step ? '#0EA5E9' : 'rgba(255,255,255,0.1)'}`, background: i < step ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.4s' }}>
                {i < step
                  ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>
                  : i === step
                    ? <div style={{ width: 8, height: 8, border: '2px solid #0EA5E9', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    : null
                }
              </div>
              <div style={{ fontSize: 13, color: i < step ? '#22c55e' : i === step ? '#fafafa' : '#52525b', fontWeight: i === step ? 600 : 400, transition: 'all 0.3s' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* URL */}
        {step >= 3 && (
          <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live URL</div>
            <div style={{ fontSize: 12, color: '#fafafa', fontFamily: 'monospace' }}>https://nestfinder.wyberai.app</div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  )
}

// Animation 3: Visual Edit (click to edit)
export function VisualEditAnimation() {
  const [selected, setSelected] = useState(false)
  const [changed, setChanged] = useState(false)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setHovering(true), 1000)
    const t2 = setTimeout(() => { setSelected(true); setHovering(false) }, 2200)
    const t3 = setTimeout(() => setChanged(true), 3800)
    const t4 = setTimeout(() => { setSelected(false); setChanged(false); setHovering(false) }, 6000)
    return () => [t1,t2,t3,t4].forEach(clearTimeout)
  }, [changed])

  return (
    <div style={{ background: '#0d0d0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', height: 280 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.6 }} />)}
        <div style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#0EA5E9', fontFamily: 'monospace', fontWeight: 700 }}>✏️ Visual Edit Mode</div>
      </div>

      {/* Mock app preview */}
      <div style={{ padding: 14, position: 'relative' }}>
        {/* Fake app */}
        <div style={{ background: '#111113', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 11, color: '#52525b', marginBottom: 10 }}>NestFinder CRM</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            {['12 Leads', '4 Deals', '$840K'].map((s, i) => (
              <div key={i} style={{ padding: '8px', borderRadius: 7, background: '#18181b', textAlign: 'center', fontSize: 11, color: i === 0 && (hovering || selected) ? '#0EA5E9' : '#a1a1aa', border: i === 0 ? `1px solid ${hovering ? '#0EA5E9' : selected ? '#0EA5E9' : 'rgba(255,255,255,0.05)'}` : '1px solid rgba(255,255,255,0.05)', outline: i === 0 && hovering ? '2px solid rgba(14,165,233,0.4)' : 'none', transition: 'all 0.3s', cursor: 'crosshair' }}>
                {s}
              </div>
            ))}
          </div>
          {/* Hover tooltip */}
          {hovering && <div style={{ position: 'absolute', top: 60, left: 30, background: '#0EA5E9', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, pointerEvents: 'none' }}>&lt;div&gt; "12 Leads"</div>}
        </div>

        {/* Edit prompt */}
        {selected && !changed && (
          <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, background: '#111113', border: '1px solid #0EA5E9', borderRadius: 10, padding: 12, animation: 'fadeUp 0.2s ease' }}>
            <div style={{ fontSize: 10, color: '#0EA5E9', fontWeight: 700, marginBottom: 6 }}>✏️ Edit &lt;div&gt; "12 Leads"</div>
            <div style={{ fontSize: 12, color: '#fafafa', fontFamily: 'monospace' }}>
              make the text green and bold
              <span style={{ borderLeft: '2px solid #0EA5E9', marginLeft: 1, animation: 'blink 1s step-end infinite' }}>&nbsp;</span>
            </div>
          </div>
        )}
        {changed && (
          <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: 10, animation: 'fadeUp 0.2s ease' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
            <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>Element updated — 1 file changed</span>
          </div>
        )}
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
    </div>
  )
}

// Animation 4: Supabase one-click
export function DatabaseAnimation() {
  const [step, setStep] = useState(0)
  // 0: idle, 1: provisioning, 2: done
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1200)
    const t2 = setTimeout(() => setStep(2), 3500)
    const t3 = setTimeout(() => setStep(0), 7000)
    return () => [t1,t2,t3].forEach(clearTimeout)
  }, [step])

  return (
    <div style={{ background: '#0d0d0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', height: 280, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.6 }} />)}
        <div style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#3f3f46', fontFamily: 'monospace' }}>🗄 Database</div>
      </div>

      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Supabase card */}
        <div style={{ padding: 14, borderRadius: 10, background: 'rgba(63,207,142,0.06)', border: '1px solid rgba(63,207,142,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(63,207,142,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🗄</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#3FCF8E' }}>Supabase</div>
              <div style={{ fontSize: 10, color: '#52525b' }}>Postgres · Auth · Storage</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              {step === 0 && (
                <div style={{ padding: '5px 14px', borderRadius: 20, background: '#3FCF8E', fontSize: 11, fontWeight: 700, color: '#000', cursor: 'pointer' }}>⚡ Add free</div>
              )}
              {step === 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#f59e0b' }}>
                  <div style={{ width: 10, height: 10, border: '2px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Setting up...
                </div>
              )}
              {step === 2 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#22c55e', fontWeight: 700 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>
                  Active
                </div>
              )}
            </div>
          </div>

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, animation: 'fadeIn 0.4s ease' }}>
              {['✓ Postgres database created', '✓ Auth configured', '✓ Wired into your app'].map(l => (
                <div key={l} style={{ fontSize: 11, color: '#3FCF8E' }}>{l}</div>
              ))}
            </div>
          )}
        </div>

        {step === 2 && (
          <div style={{ padding: '9px 12px', borderRadius: 9, background: '#18181b', border: '1px solid rgba(255,255,255,0.07)', animation: 'fadeIn 0.5s ease 0.2s both' }}>
            <div style={{ fontSize: 10, color: '#52525b', marginBottom: 4, fontFamily: 'monospace' }}>Project URL</div>
            <div style={{ fontSize: 11, color: '#3FCF8E', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>https://xkzjpqrs.supabase.co</div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  )
}
