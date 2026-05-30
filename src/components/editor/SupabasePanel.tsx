'use client'
import { useState, useEffect } from 'react'
import { useEditorStore } from '@/store/editor'

interface SupabaseProject {
  supabaseUrl: string
  anonKey: string
  projectId: string
  status: 'provisioning' | 'active'
}

export function SupabasePanel({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<SupabaseProject | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const { addMessage } = useEditorStore()

  // Check if already provisioned
  useEffect(() => {
    if (!projectId) return
    const saved = localStorage.getItem(`supabase_${projectId}`)
    if (saved) {
      try { setProject(JSON.parse(saved)) } catch {}
    }
  }, [projectId])

  const provision = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/provision-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, projectName: 'My App' }),
      })
      const data = await res.json()

      if (data.error) {
        addMessage({ id: Math.random().toString(36).slice(2), role: 'assistant', content: `Supabase: ${data.error}`, timestamp: 0, status: 'error' })
        setLoading(false)
        return
      }

      const proj: SupabaseProject = {
        supabaseUrl: data.supabaseUrl,
        anonKey: data.anonKey,
        projectId: data.projectId,
        status: 'provisioning',
      }
      setProject(proj)
      localStorage.setItem(`supabase_${projectId}`, JSON.stringify(proj))

      // Poll for active status
      pollStatus(data.projectId, proj)
    } catch (err) {
      addMessage({ id: Math.random().toString(36).slice(2), role: 'assistant', content: `Failed to provision: ${String(err)}`, timestamp: 0, status: 'error' })
    }
    setLoading(false)
  }

  const pollStatus = async (sbProjectId: string, proj: SupabaseProject) => {
    setChecking(true)
    let attempts = 0
    const poll = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`https://api.supabase.com/v1/projects/${sbProjectId}`, {
          headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'ACTIVE_HEALTHY') {
            clearInterval(poll)
            const updated = { ...proj, status: 'active' as const }
            setProject(updated)
            localStorage.setItem(`supabase_${projectId}`, JSON.stringify(updated))
            setChecking(false)
          }
        }
      } catch {}
      if (attempts > 20) { clearInterval(poll); setChecking(false) }
    }, 5000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const injectIntoApp = () => {
    if (!project) return
    // Fire a customization prompt that adds Supabase to the generated app
    window.dispatchEvent(new CustomEvent('wyber:chat-prompt', {
      detail: `Add Supabase integration to this app. Use these credentials:
VITE_SUPABASE_URL=${project.supabaseUrl}
VITE_SUPABASE_ANON_KEY=${project.anonKey}

Import createClient from @supabase/supabase-js. Add auth with email/password login. Add a database table for the main entity in this app. Show real data from Supabase instead of hardcoded arrays.`
    }))
  }

  if (!project) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, height: '100%', background: 'var(--bg-base)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add Database</div>

        <div style={{ background: 'rgba(63,207,142,0.06)', border: '1px solid rgba(63,207,142,0.2)', borderRadius: 10, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(63,207,142,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🗄</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#3FCF8E' }}>Supabase</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Real database + auth + storage</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            Add a real Postgres database, authentication, and file storage to your app in one click. Your app becomes fully full-stack.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            {['✓ Postgres database', '✓ Email & social auth', '✓ File storage', '✓ Real-time subscriptions', '✓ Auto-generated API'].map(f => (
              <div key={f}>{f}</div>
            ))}
          </div>
          <button onClick={provision} disabled={loading}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: loading ? 'rgba(63,207,142,0.2)' : '#3FCF8E', color: loading ? '#3FCF8E' : '#000', fontSize: 13, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? (
              <><span style={{ width: 12, height: 12, border: '2px solid #3FCF8E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Provisioning...</>
            ) : '⚡ Add Supabase — Free'}
          </button>
        </div>

        <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          Creates a free Supabase project automatically. No account needed.
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, height: '100%', background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Database</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: project.status === 'active' ? '#3FCF8E' : '#f59e0b', animation: project.status === 'provisioning' ? 'pulse 1.5s infinite' : 'none' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: project.status === 'active' ? '#3FCF8E' : '#f59e0b' }}>
            {project.status === 'active' ? 'ACTIVE' : 'PROVISIONING'}
          </span>
        </div>
      </div>

      {project.status === 'provisioning' && (
        <div style={{ padding: 12, borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: '#f59e0b', lineHeight: 1.5 }}>
          Setting up your database... This takes about 30 seconds.
          {checking && <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>Checking status...</div>}
        </div>
      )}

      {[
        { label: 'Project URL', value: project.supabaseUrl },
        { label: 'Anon Key', value: project.anonKey, truncate: true },
      ].map(({ label, value, truncate }) => (
        <div key={label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--ide-border)', borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <code style={{ flex: 1, fontSize: 10, color: '#3FCF8E', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {truncate ? value.slice(0, 20) + '...' : value}
            </code>
            <button onClick={() => copyToClipboard(value)}
              style={{ padding: '2px 7px', borderRadius: 5, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
              Copy
            </button>
          </div>
        </div>
      ))}

      <button onClick={injectIntoApp}
        style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#3FCF8E', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        ⚡ Wire into my app
      </button>

      <a href={`https://supabase.com/dashboard/project/${project.projectId}`} target="_blank" rel="noopener noreferrer"
        style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
        Open Supabase Dashboard ↗
      </a>

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
