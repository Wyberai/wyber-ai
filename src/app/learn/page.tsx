'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'
import { createClient } from '@/lib/supabase/client'

// ── Types ───────────────────────────────────────────────────────────────────
interface Step {
  id: string
  title: string
  description: string
  prompt: string | null
  builderLink: string
  builderLabel: string
}
interface Track {
  id: string
  title: string
  color: string
  accent: string
  icon: React.ReactNode
  tagline: string
  steps: Step[]
}

// ── Icons ────────────────────────────────────────────────────────────────────
const IconWeb = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
)
const IconPhone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
)
const IconAgent = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 20c0-3-1.8-5.4-4-6.4"/>
  </svg>
)
const IconFlow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4h4v4H5zM15 16h4v4h-4z"/>
    <path d="M9 6h3a3 3 0 013 3v6a3 3 0 003 3"/>
    <path d="M9 6a3 3 0 00-3 3v2"/>
  </svg>
)
const IconEmployee = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
)
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)
const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

// ── Track data ────────────────────────────────────────────────────────────────
const TRACKS: Track[] = [
  {
    id: 'web',
    title: 'Web Apps',
    color: '#0EA5E9',
    accent: 'rgba(14,165,233,0.12)',
    icon: <IconWeb />,
    tagline: 'Build, iterate, and ship production-ready web apps in plain English.',
    steps: [
      {
        id: 'web-0',
        title: 'Build your first app',
        description: 'Describe what you want and Wyber generates every file, component, and realistic data record in a single pass. No scaffolding, no boilerplate.',
        prompt: 'Build a CRM dashboard with a leads table, pipeline columns (New → Contacted → Qualified → Closed Won / Lost), and four KPI cards showing total pipeline value, win rate, average deal size, and monthly revenue.',
        builderLink: '/dashboard?new=app',
        builderLabel: 'Open Web Builder',
      },
      {
        id: 'web-1',
        title: 'Iterate in chat',
        description: 'Follow-up messages refine only what changed — no full rebuild. Wyber uses precise diffs so your work accumulates instead of resetting.',
        prompt: 'Add a slide-out "Add Lead" drawer with fields for name, company, email, deal size, close date, and stage. Open it from the top-right button. Validate the email field.',
        builderLink: '/dashboard',
        builderLabel: 'Open your project',
      },
      {
        id: 'web-2',
        title: 'Click-to-edit any element',
        description: 'Click anything in the live preview to select it, then describe the change. No selector hunting. No CSS spelunking.',
        prompt: 'Change the sidebar nav so the active item shows a 2px left accent bar in the brand color instead of a background fill. Add a subtle hover state to inactive items.',
        builderLink: '/dashboard',
        builderLabel: 'Open your project',
      },
      {
        id: 'web-3',
        title: 'Connect a real database',
        description: 'Paste your Supabase URL and anon key in Settings → Connectors. Wyber rewrites the app to use live auth, RLS-scoped queries, and real data.',
        prompt: 'Connect my Supabase project so leads are stored in a database table, each user only sees their own leads, and new leads added in the modal save immediately.',
        builderLink: '/settings?tab=connectors',
        builderLabel: 'Connect Supabase',
      },
      {
        id: 'web-4',
        title: 'Deploy to a live URL',
        description: 'One click publishes to Vercel. Your app gets a free wyberai.app subdomain in under 60 seconds. Connect a custom domain any time.',
        prompt: null,
        builderLink: '/dashboard',
        builderLabel: 'Open your project → Deploy',
      },
    ],
  },
  {
    id: 'mobile',
    title: 'Mobile Apps',
    color: '#8b5cf6',
    accent: 'rgba(139,92,246,0.12)',
    icon: <IconPhone />,
    tagline: 'Generate full React Native apps that run on iOS and Android via Expo.',
    steps: [
      {
        id: 'mobile-0',
        title: 'Build your first mobile app',
        description: 'Wyber generates a complete React Native + Expo project — screens, navigation, components, and realistic data — ready to run on your device.',
        prompt: 'Build a fitness tracker app with a Home screen showing today\'s workout, a History screen with a weekly chart, and a Profile screen with streak count and total workouts. Use a bottom tab navigator.',
        builderLink: '/dashboard?new=mobile',
        builderLabel: 'Open Mobile Builder',
      },
      {
        id: 'mobile-1',
        title: 'Add screens and navigation',
        description: 'Describe new screens in plain English. Wyber adds them with proper navigation wiring — no react-navigation boilerplate to write.',
        prompt: 'Add a Workout Detail screen that shows sets, reps, and weight for each exercise. Link it from the Home screen when you tap a workout card.',
        builderLink: '/dashboard',
        builderLabel: 'Open your project',
      },
      {
        id: 'mobile-2',
        title: 'Preview on a real device',
        description: 'Scan the Expo QR code in your project to load the app on your iPhone or Android phone instantly. No Xcode or Android Studio required.',
        prompt: 'Add haptic feedback on the "Complete Workout" button and a confetti animation when a 7-day streak is hit.',
        builderLink: '/dashboard',
        builderLabel: 'Open your project → Preview',
      },
      {
        id: 'mobile-3',
        title: 'Export to Expo / App Store',
        description: 'Export the full source code as a zip. Open it in Expo Go or run `npx expo start`. Submit to the App Store with EAS Build.',
        prompt: null,
        builderLink: '/dashboard',
        builderLabel: 'Open your project → Export',
      },
    ],
  },
  {
    id: 'agents',
    title: 'AI Agents',
    color: '#10b981',
    accent: 'rgba(16,185,129,0.12)',
    icon: <IconAgent />,
    tagline: 'Build agents that monitor, decide, and act — on a schedule or a trigger.',
    steps: [
      {
        id: 'agents-0',
        title: 'Create your first agent',
        description: 'Describe what you want the agent to watch and what it should do. Wyber generates the node graph, selects the right tools, and writes the AI instructions.',
        prompt: 'Build an agent that monitors my Gmail inbox every morning, summarizes any emails from investors or enterprise prospects, and sends me the summary as a Slack DM at 8 AM.',
        builderLink: '/dashboard?new=agent',
        builderLabel: 'Open Agent Builder',
      },
      {
        id: 'agents-1',
        title: 'Connect your tools',
        description: 'Go to Settings → Integrations and connect the apps your agent needs. Wyber uses Composio for 250+ integrations — no API keys to manage per-tool.',
        prompt: 'Add a condition node: if the email contains words like "urgent" or "demo request", also post to a #leads Slack channel with a high-priority tag.',
        builderLink: '/settings?tab=integrations',
        builderLabel: 'Connect integrations',
      },
      {
        id: 'agents-2',
        title: 'Set a schedule or trigger',
        description: 'Agents run on cron schedules, webhooks, or manual triggers. Combine both — for example: poll every 15 minutes AND allow manual runs.',
        prompt: 'Change the trigger so the agent runs every 15 minutes during business hours (9 AM–6 PM on weekdays) and immediately when I click "Run now".',
        builderLink: '/agents',
        builderLabel: 'Open Agents',
      },
      {
        id: 'agents-3',
        title: 'Test and activate',
        description: 'Hit Run in the canvas to execute a live test. Each node logs its output inline. When everything looks right, activate the agent to run automatically.',
        prompt: null,
        builderLink: '/agents',
        builderLabel: 'Open Agents → Run',
      },
    ],
  },
  {
    id: 'workflows',
    title: 'Workflows',
    color: '#f59e0b',
    accent: 'rgba(245,158,11,0.12)',
    icon: <IconFlow />,
    tagline: 'Automate multi-step processes between apps with trigger → action chains.',
    steps: [
      {
        id: 'workflows-0',
        title: 'Build your first workflow',
        description: 'Describe a "when X happens, do Y" scenario. Wyber generates the trigger node, action nodes, and data mappings between them.',
        prompt: 'When a new row is added to my Airtable "Leads" base, create a contact in HubSpot, send a welcome email via Gmail, and post a message in the #new-leads Slack channel with the lead\'s name and company.',
        builderLink: '/dashboard?new=workflow',
        builderLabel: 'Open Workflow Builder',
      },
      {
        id: 'workflows-1',
        title: 'Add conditions and branching',
        description: 'Condition nodes let the workflow take different paths based on the data. Branch on field values, API responses, or AI decisions.',
        prompt: 'Add a condition: if the lead\'s company size is over 100 employees, also assign them to an enterprise rep in HubSpot and add the "Enterprise" tag.',
        builderLink: '/flows',
        builderLabel: 'Open Workflows',
      },
      {
        id: 'workflows-2',
        title: 'Use an AI decision node',
        description: 'Drop an AI Agent node into your workflow to classify, summarize, or decide — then route the output to the next action.',
        prompt: 'Before creating the HubSpot contact, add an AI node that reads the lead\'s LinkedIn bio (from Airtable) and scores them 1–10 for enterprise fit. Only create the contact if the score is 7 or higher.',
        builderLink: '/flows',
        builderLabel: 'Open Workflows',
      },
      {
        id: 'workflows-3',
        title: 'Test, then activate',
        description: 'Run a test with sample data to confirm every node executes correctly. When the run log shows all green, activate the workflow to run automatically.',
        prompt: null,
        builderLink: '/flows',
        builderLabel: 'Open Workflows → Activate',
      },
    ],
  },
  {
    id: 'employees',
    title: 'AI Employees',
    color: '#38bdf8',
    accent: 'rgba(56,189,248,0.12)',
    icon: <IconEmployee />,
    tagline: 'Hire AI employees that run on a schedule and execute real tasks autonomously.',
    steps: [
      {
        id: 'employees-0',
        title: 'Browse the role catalog',
        description: 'Explore 100 roles across Sales, Marketing, Engineering, Finance, and more. Each is the AI equivalent of a senior specialist — they run on a schedule, complete real tasks, and report back.',
        prompt: null,
        builderLink: '/employees',
        builderLabel: 'Browse Role Catalog',
      },
      {
        id: 'employees-1',
        title: 'Hire your first employee',
        description: 'Pick a role, customize the instructions, and connect your tools via Composio. Your AI Employee runs on your schedule and emails you what it did.',
        prompt: 'I want to hire a Lead Qualification Specialist. They should check our HubSpot pipeline daily, score leads 1–10 based on company size and intent signals, and send a prioritized list to Slack every morning at 8 AM.',
        builderLink: '/ai-employees/new',
        builderLabel: 'Hire an Employee',
      },
      {
        id: 'employees-2',
        title: 'Set a schedule',
        description: 'Configure when your AI Employee runs — hourly, daily, weekly, or on a webhook trigger. The employee autonomously executes up to 15 tool calls per run.',
        prompt: 'Set the Lead Qualification Specialist to run at 7:30 AM Monday through Friday. Also allow manual runs from the dashboard.',
        builderLink: '/ai-employees',
        builderLabel: 'Open AI Employees',
      },
      {
        id: 'employees-3',
        title: 'Review the run digest',
        description: 'After each run, your employee generates a structured digest: actions taken, tool calls made, and outcomes. Review it in the dashboard or receive it via Slack.',
        prompt: null,
        builderLink: '/ai-employees',
        builderLabel: 'Open AI Employees → Runs',
      },
    ],
  },
]

// ── Progress helpers ──────────────────────────────────────────────────────────
const LS_KEY = 'wyber_learn_progress'

interface Progress {
  completedSteps: string[]
  completedTracks: string[]
  certificateAt: string | null
  userName: string | null
}

function loadLocal(): Progress {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { completedSteps: [], completedTracks: [], certificateAt: null, userName: null }
}

function saveLocal(p: Progress) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(p)) } catch {}
}

// ── Copy button component ─────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy prompt'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
        border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.12)'}`,
        background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
        color: copied ? '#10b981' : 'var(--text3, #71717a)',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
    >
      <IconCopy />
      {copied ? 'Copied!' : 'Copy prompt'}
    </button>
  )
}

// ── Certificate card ──────────────────────────────────────────────────────────
function CertificateCard({ name, date }: { name: string; date: string }) {
  const shareText = encodeURIComponent(`I just earned my Wyber Certified — All Five Pillars certificate 🎓\n\nI can now build web apps, mobile apps, AI agents, workflows, and AI employees in plain English with @wyberai.\n\nwww.wyberai.com/learn`)
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://wyberai.com/learn')}&summary=${shareText}`
  const ogUrl = `/api/og/certificate?name=${encodeURIComponent(name)}&date=${encodeURIComponent(date)}`

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(14,165,233,0.08) 50%, rgba(139,92,246,0.08) 100%)',
      border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: 20, padding: 'clamp(24px,4vw,40px)',
      textAlign: 'center',
    }}>
      {/* Seal */}
      <div style={{
        width: 80, height: 80, margin: '0 auto 20px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #0EA5E9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 8px rgba(99,102,241,0.12)',
      }}>
        <span style={{ fontSize: 36 }}>🎓</span>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 10 }}>
        Certificate of Completion
      </div>
      <h2 style={{
        fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.03em',
        color: 'var(--text, #f0f0f5)', margin: '0 0 8px',
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        Wyber Certified
      </h2>
      <div style={{ fontSize: 14, color: 'var(--text2, #8b8b9a)', marginBottom: 4 }}>All Five Pillars</div>
      <div style={{ fontSize: 13, color: 'var(--text3, #52526a)', marginBottom: 6 }}>Web Apps · Mobile · AI Agents · Workflows · AI Employees</div>

      <div style={{ margin: '20px auto', padding: '12px 24px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', display: 'inline-block' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text, #f0f0f5)' }}>{name}</div>
        <div style={{ fontSize: 12, color: 'var(--text3, #52526a)', marginTop: 2 }}>{date}</div>
      </div>

      {/* Stars */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 24, color: '#f59e0b' }}>
        {[0,1,2,3,4].map(i => <IconStar key={i} />)}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        <a href={ogUrl} download="wyber-certificate.png" target="_blank" rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '10px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
            background: 'linear-gradient(135deg, #6366f1, #0EA5E9)',
            color: '#fff', textDecoration: 'none', border: 'none', cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}>
          <IconDownload /> Download Certificate
        </a>
        <a href={linkedinUrl} target="_blank" rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '10px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
            background: 'rgba(10,102,194,0.12)', border: '1px solid rgba(10,102,194,0.3)',
            color: '#0a66c2', textDecoration: 'none', transition: 'all 0.15s',
          }}>
          Share on LinkedIn
        </a>
        <a href={twitterUrl} target="_blank" rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '10px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
            background: 'rgba(29,161,242,0.08)', border: '1px solid rgba(29,161,242,0.2)',
            color: '#1da1f2', textDecoration: 'none', transition: 'all 0.15s',
          }}>
          Share on X
        </a>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LearnPage() {
  const [activeTrack, setActiveTrack] = useState<string>('web')
  const [progress, setProgress] = useState<Progress>({ completedSteps: [], completedTracks: [], certificateAt: null, userName: null })
  const [synced, setSynced] = useState(false)
  const supabase = createClient()

  // Load progress: DB first, fall back to localStorage
  useEffect(() => {
    const local = loadLocal()
    setProgress(local)

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setSynced(true); return }
      const res = await fetch('/api/learn/progress')
      if (res.ok) {
        const data = await res.json()
        if (data.progress) {
          setProgress(data.progress)
          saveLocal(data.progress)
        }
      }
      setSynced(true)
    })
  }, [])

  const syncProgress = useCallback(async (next: Progress) => {
    saveLocal(next)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await fetch('/api/learn/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: next }),
    })
  }, [])

  const toggleStep = useCallback(async (stepId: string) => {
    const track = TRACKS.find(t => t.steps.some(s => s.id === stepId))
    if (!track) return

    setProgress(prev => {
      const already = prev.completedSteps.includes(stepId)
      const completedSteps = already
        ? prev.completedSteps.filter(s => s !== stepId)
        : [...prev.completedSteps, stepId]

      // Check if track is now complete
      const trackDone = track.steps.every(s => completedSteps.includes(s.id))
      const completedTracks = trackDone
        ? [...new Set([...prev.completedTracks, track.id])]
        : prev.completedTracks.filter(t => t !== track.id || !already)

      // Check if ALL five tracks are complete
      const allDone = TRACKS.every(t => completedTracks.includes(t.id))
      const certificateAt = allDone && !prev.certificateAt
        ? new Date().toISOString()
        : (allDone ? prev.certificateAt : null)

      const next = { ...prev, completedSteps, completedTracks, certificateAt }
      syncProgress(next)
      return next
    })
  }, [syncProgress])

  const track = TRACKS.find(t => t.id === activeTrack)!
  const allComplete = TRACKS.every(t => progress.completedTracks.includes(t.id))
  const totalSteps = TRACKS.reduce((s, t) => s + t.steps.length, 0)
  const completedCount = progress.completedSteps.length

  return (
    <>
      <Navbar />
      <style>{`
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
        .learn-track-btn:focus-visible { outline: 2px solid var(--focus, #6366f1); outline-offset: 2px; }
        .learn-step-check:focus-visible { outline: 2px solid var(--focus, #6366f1); outline-offset: 2px; }
        .learn-step-check { cursor: pointer; }
        @media (max-width: 767px) { .learn-layout { flex-direction: column !important; } .learn-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid var(--border, rgba(255,255,255,0.06)) !important; flex-direction: row !important; gap: 4px !important; padding: 12px !important; overflow-x: auto !important; } .learn-sidebar-inner { flex-direction: row !important; gap: 4px !important; } .learn-track-btn { flex-direction: column !important; align-items: center !important; min-width: 80px !important; padding: 10px 8px !important; font-size: 11px !important; gap: 4px !important; } }
      `}</style>

      <main style={{ minHeight: '100vh', background: 'var(--bg, #0a0a0f)', color: 'var(--text, #f0f0f5)', fontFamily: "'Inter', -apple-system, sans-serif" }}>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: 'clamp(48px,8vw,80px) clamp(20px,5vw,40px) clamp(32px,5vw,56px)', borderBottom: '1px solid var(--border, rgba(255,255,255,0.06))' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 14 }}>
            Interactive Learning
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, letterSpacing: '-0.04em',
            color: 'var(--text, #f0f0f5)', margin: '0 0 16px', lineHeight: 1.1,
          }}>
            Learn to build with Wyber
          </h1>
          <p style={{ fontSize: 'clamp(14px,2vw,18px)', color: 'var(--text2, #8b8b9a)', maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.65 }}>
            Five tracks. Copy a prompt, open the builder, mark it done. Finish all five and earn your Wyber Certified certificate.
          </p>

          {/* Overall progress bar */}
          <div style={{ maxWidth: 320, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text3, #52526a)', fontWeight: 600 }}>Overall progress</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: completedCount === totalSteps ? '#10b981' : 'var(--text2, #8b8b9a)' }}>
                {completedCount}/{totalSteps} steps
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 9999, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{
                height: '100%', borderRadius: 9999,
                background: 'linear-gradient(90deg, #6366f1, #0EA5E9)',
                width: `${(completedCount / totalSteps) * 100}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="learn-layout" style={{ display: 'flex', maxWidth: 1200, margin: '0 auto', minHeight: '70vh' }}>

          {/* Track sidebar */}
          <aside className="learn-sidebar" style={{
            width: 240, flexShrink: 0,
            borderRight: '1px solid var(--border, rgba(255,255,255,0.06))',
            padding: '24px 12px',
            position: 'sticky', top: 0, alignSelf: 'flex-start', maxHeight: '100vh', overflowY: 'auto',
          }}>
            <div className="learn-sidebar-inner" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {TRACKS.map(t => {
                const trackComplete = progress.completedTracks.includes(t.id)
                const trackStepsDone = t.steps.filter(s => progress.completedSteps.includes(s.id)).length
                const isActive = t.id === activeTrack
                return (
                  <button
                    key={t.id}
                    className="learn-track-btn"
                    onClick={() => setActiveTrack(t.id)}
                    aria-pressed={isActive}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      background: isActive ? t.accent : 'transparent',
                      border: `1px solid ${isActive ? t.color + '40' : 'transparent'}`,
                      color: isActive ? t.color : 'var(--text2, #8b8b9a)',
                      fontWeight: isActive ? 600 : 400,
                      fontSize: 13, transition: 'all 0.15s', textAlign: 'left', fontFamily: 'inherit',
                      width: '100%',
                    }}
                  >
                    <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }}>{t.icon}</span>
                    <span style={{ flex: 1 }}>{t.title}</span>
                    {trackComplete
                      ? <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' }}><IconCheck /></span>
                      : trackStepsDone > 0
                        ? <span style={{ fontSize: 10, fontWeight: 700, color: t.color, flexShrink: 0 }}>{trackStepsDone}/{t.steps.length}</span>
                        : null
                    }
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Steps */}
          <section style={{ flex: 1, padding: 'clamp(20px,4vw,40px)', minWidth: 0 }}>

            {/* Track header */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ color: track.color }}>{track.icon}</span>
                <h2 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, letterSpacing: '-0.03em',
                  color: 'var(--text, #f0f0f5)', margin: 0,
                }}>
                  {track.title}
                </h2>
                {progress.completedTracks.includes(track.id) && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                    Complete ✓
                  </span>
                )}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text2, #8b8b9a)', margin: 0, lineHeight: 1.65 }}>{track.tagline}</p>
            </div>

            {/* Steps list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {track.steps.map((step, idx) => {
                const done = progress.completedSteps.includes(step.id)
                return (
                  <article
                    key={step.id}
                    style={{
                      background: done ? `${track.color}08` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${done ? track.color + '30' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 14, padding: 'clamp(16px,3vw,24px)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      {/* Checkbox */}
                      <button
                        className="learn-step-check"
                        onClick={() => toggleStep(step.id)}
                        aria-label={done ? `Mark step ${idx + 1} incomplete` : `Mark step ${idx + 1} complete`}
                        aria-checked={done}
                        role="checkbox"
                        style={{
                          width: 24, height: 24, borderRadius: 7, flexShrink: 0, marginTop: 2,
                          border: `2px solid ${done ? track.color : 'rgba(255,255,255,0.2)'}`,
                          background: done ? track.color : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', transition: 'all 0.15s', fontFamily: 'inherit',
                        }}
                      >
                        {done && <IconCheck />}
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: track.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            Step {idx + 1}
                          </span>
                          <h3 style={{
                            fontSize: 'clamp(14px,2vw,16px)', fontWeight: 700, letterSpacing: '-0.01em',
                            color: done ? 'var(--text2, #8b8b9a)' : 'var(--text, #f0f0f5)', margin: 0,
                            textDecoration: done ? 'line-through' : 'none', textDecorationColor: 'rgba(255,255,255,0.2)',
                          }}>
                            {step.title}
                          </h3>
                        </div>

                        <p style={{ fontSize: 13, color: 'var(--text2, #8b8b9a)', lineHeight: 1.65, margin: '0 0 16px' }}>
                          {step.description}
                        </p>

                        {step.prompt && (
                          <div style={{
                            background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 10, padding: '12px 14px', marginBottom: 14,
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3, #52526a)' }}>
                                Try this prompt
                              </span>
                              <CopyButton text={step.prompt} />
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text2, #8b8b9a)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                              &ldquo;{step.prompt}&rdquo;
                            </p>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <Link
                            href={step.builderLink}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                              background: track.accent, border: `1px solid ${track.color}35`,
                              color: track.color, textDecoration: 'none', transition: 'all 0.15s',
                            }}
                          >
                            {step.builderLabel} <IconArrow />
                          </Link>
                          {!done && (
                            <button
                              onClick={() => toggleStep(step.id)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--text3, #52526a)', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                              }}
                            >
                              Mark complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Track done nudge */}
            {progress.completedTracks.includes(track.id) && (
              <div style={{ marginTop: 24, padding: '16px 20px', borderRadius: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>🎉</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981', marginBottom: 2 }}>{track.title} complete!</div>
                  <div style={{ fontSize: 13, color: 'var(--text2, #8b8b9a)' }}>
                    {progress.completedTracks.length < 5
                      ? `${5 - progress.completedTracks.length} track${5 - progress.completedTracks.length !== 1 ? 's' : ''} to go for your certificate.`
                      : 'All five tracks done — you earned the certificate!'}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Certificate section */}
        {allComplete && progress.certificateAt && (
          <section style={{
            maxWidth: 700, margin: '0 auto',
            padding: 'clamp(32px,5vw,60px) clamp(20px,5vw,40px)',
            borderTop: '1px solid var(--border, rgba(255,255,255,0.06))',
          }}>
            <CertificateCard
              name={progress.userName || 'Wyber Builder'}
              date={new Date(progress.certificateAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            />
          </section>
        )}

        {/* All-done teaser (not yet complete) */}
        {!allComplete && (
          <section style={{
            textAlign: 'center',
            padding: 'clamp(32px,5vw,60px) clamp(20px,5vw,40px)',
            borderTop: '1px solid var(--border, rgba(255,255,255,0.06))',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎓</div>
            <h3 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(16px,2.5vw,22px)', fontWeight: 800, letterSpacing: '-0.02em',
              color: 'var(--text, #f0f0f5)', margin: '0 0 8px',
            }}>
              Complete all five tracks to earn your certificate
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text2, #8b8b9a)', margin: 0 }}>
              {TRACKS.filter(t => !progress.completedTracks.includes(t.id)).map(t => t.title).join(', ')} remaining
            </p>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
