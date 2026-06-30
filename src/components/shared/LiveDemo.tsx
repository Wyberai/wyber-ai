'use client'
import { useState, useRef, useEffect } from 'react'

const EXAMPLE_PROMPTS = [
  'Build a SaaS analytics dashboard called NexusMetrics with MRR, churn rate, customer health scores and 12-month growth chart',
  'Build a VC portfolio management platform called Meridian Capital with deal pipeline, fund analytics and LP tracking',
  'Build a revenue operations dashboard with pipeline scoring, stale deal alerts and forecast analytics',
  'Build an HR platform with employee onboarding tracker, team org chart and performance reviews',
  'Build a customer support hub with ticket queue, SLA tracking, churn risk scores and escalation workflows',
  'Build a sales CRM with lead scoring, email sequences, meeting scheduler and deal forecasting',
]

// Simulated streaming output — shows what generation looks like
const DEMO_OUTPUT = `<file path="src/App.tsx">
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import './index.css'
export default function App() {
  return (
    <div style={{display:'flex',height:'100vh'}}>
      <Sidebar />
      <Dashboard />
    </div>
  )
}</file>

<file path="src/components/Dashboard.tsx">
import StatsGrid from './StatsGrid'
import DataTable from './DataTable'
export default function Dashboard() {
  return (
    <main style={{flex:1,padding:24,overflow:'auto',background:'#09090b'}}>
      <h1 style={{fontFamily: 'var(--font-display)',fontSize:24,fontWeight:800,color:'#fafafa',marginBottom:20}}>
        Overview
      </h1>
      <StatsGrid />
      <DataTable />
    </main>
  )
}</file>`

export function LiveDemo() {
  const [prompt, setPrompt] = useState('')
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState('')
  const [done, setDone] = useState(false)
  const [selected, setSelected] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  // Rotate example prompts
  useEffect(() => {
    const t = setInterval(() => {
      if (!running && !done) setSelected(s => (s + 1) % EXAMPLE_PROMPTS.length)
    }, 3000)
    return () => clearInterval(t)
  }, [running, done])

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight
  }, [output])

  const run = async () => {
    const p = prompt.trim() || EXAMPLE_PROMPTS[selected]
    if (!p || running) return
    setRunning(true)
    setDone(false)
    setOutput('')

    // Stream the demo output character by character
    let i = 0
    const text = `Building: ${p}\n\n` + DEMO_OUTPUT
    intervalRef.current = setInterval(() => {
      if (i < text.length) {
        setOutput(text.slice(0, i + 1))
        i += Math.floor(Math.random() * 8) + 4 // variable speed like real streaming
      } else {
        clearInterval(intervalRef.current!)
        setRunning(false)
        setDone(true)
      }
    }, 20)
  }

  const reset = () => {
    clearInterval(intervalRef.current!)
    setRunning(false)
    setDone(false)
    setOutput('')
    setPrompt('')
  }

  // Syntax highlight the output
  const highlighted = output
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(&lt;file path="[^"]*"&gt;)/g, '<span style="color:#0EA5E9;font-weight:700">$1</span>')
    .replace(/(&lt;\/file&gt;)/g, '<span style="color:#0EA5E9;font-weight:700">$1</span>')
    .replace(/(import|export|default|from|return|const|function)/g, '<span style="color:#8b5cf6">$1</span>')
    .replace(/('[^']*')/g, '<span style="color:#10b981">$1</span>')
    .replace(/(\/\/.*)/g, '<span style="color:#52525b">$1</span>')

  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      background: '#111113',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      fontFamily: 'var(--font-display)',
    }}>
      {/* Window chrome */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, background: '#0d0d0f' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ef4444', '#f59e0b', '#22c55e'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
          ))}
        </div>
        <div style={{ flex: 1, fontSize: 11, color: '#52525b', textAlign: 'center', fontFamily: 'monospace' }}>
          wyberai.com — Live Demo
        </div>
        {done && (
          <button onClick={reset} style={{ fontSize: 11, color: '#71717a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            ↺ Reset
          </button>
        )}
      </div>

      {/* Input area */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#52525b', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Describe your app
            </div>
            <input
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && run()}
              placeholder={EXAMPLE_PROMPTS[selected]}
              disabled={running}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                background: '#18181b',
                color: '#fafafa',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target as HTMLElement).style.borderColor = '#0EA5E9'}
              onBlur={e => (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
          <button
            onClick={done ? reset : run}
            disabled={running}
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              border: 'none',
              background: running ? '#18181b' : done ? '#18181b' : '#0EA5E9',
              color: running ? '#52525b' : done ? '#a1a1aa' : '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: running ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              boxShadow: !running && !done ? '0 4px 20px rgba(14,165,233,0.3)' : 'none',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            {running ? (
              <>
                <div style={{ width: 12, height: 12, border: '2px solid #52525b', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Building...
              </>
            ) : done ? '↺ Try again' : '⚡ Build it free'}
          </button>
        </div>

        {/* Example chips */}
        {!running && !done && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {EXAMPLE_PROMPTS.slice(0, 4).map((ex, i) => (
              <button
                key={i}
                onClick={() => { setPrompt(ex); setSelected(i) }}
                style={{
                  padding: '3px 10px',
                  borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: i === selected ? 'rgba(14,165,233,0.1)' : 'transparent',
                  color: i === selected ? '#0EA5E9' : '#52525b',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {ex.replace('Build a ', '').replace('Create a ', '').replace('Design an ', '')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Output area */}
      <div
        ref={outputRef}
        style={{
          height: output ? 240 : 0,
          overflow: 'auto',
          transition: 'height 0.3s ease',
          background: '#0a0a0b',
        }}
      >
        {output && (
          <pre style={{
            margin: 0,
            padding: '14px 16px',
            fontSize: 12,
            lineHeight: 1.7,
            color: '#a1a1aa',
            fontFamily: "'Fira Code', 'Consolas', monospace",
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
            dangerouslySetInnerHTML={{ __html: highlighted + (running ? '<span style="display:inline-block;width:8px;height:14px;background:#0EA5E9;animation:blink 1s step-end infinite;vertical-align:middle;border-radius:1px;margin-left:1px"/>' : '') }}
          />
        )}
      </div>

      {/* Done state CTA */}
      {done && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(14,165,233,0.04)' }}>
          <div style={{ fontSize: 13, color: '#a1a1aa' }}>
            ✓ App generated — <span style={{ color: '#0EA5E9', fontWeight: 600 }}>3 files, 0 errors</span>
          </div>
          <a href="/signup" style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(14,165,233,0.3)' }}>
            Build yours free →
          </a>
        </div>
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}
