'use client'
import Link from 'next/link'
import { useState } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { track } from '@/lib/track'
import type { RlsScanReport } from '@/lib/rls-scan'
import type { SeoReport } from '@/lib/seo-audit'

const SKY = '#0EA5E9'
const sevColor = (s: string) =>
  s === 'critical' ? '#EF4444' : s === 'high' ? '#F59E0B' : s === 'medium' ? '#EAB308' : '#10B981'

type Tab = 'security' | 'seo'

export default function ToolsClient() {
  const [tab, setTab] = useState<Tab>('security')

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: 'var(--font-display)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo />
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.03em' }}>WyberAi</span>
        </Link>
        <Link href="/dashboard" style={{ padding: '7px 16px', borderRadius: 8, background: SKY, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Build an app →
        </Link>
      </nav>

      <main style={{ flex: 1, padding: 'clamp(36px,6vw,72px) clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 12, fontWeight: 700, color: SKY, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 20 }}>
              Free · No signup
            </div>
            <h1 style={{ fontSize: 'clamp(30px,6vw,46px)', fontWeight: 800, lineHeight: 1.1, margin: 0, letterSpacing: '-0.03em' }}>
              Is your app safe<br />and findable?
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: 16, marginTop: 16, lineHeight: 1.6 }}>
              Two checks every founder should run. A real attacker’s-eye <b style={{ color: '#fafafa' }}>security scan</b> of your
              database, and a full <b style={{ color: '#fafafa' }}>SEO audit</b> of your site. Results in seconds.
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.04)', padding: 5, borderRadius: 14, marginBottom: 20 }}>
            {(['security', 'seo'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: '11px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: tab === t ? '#09090b' : '#a1a1aa', background: tab === t ? SKY : 'transparent', transition: 'all .15s' }}>
                {t === 'security' ? '🛡️ Security Scan' : '🔍 SEO Audit'}
              </button>
            ))}
          </div>

          {tab === 'security' ? <SecurityTool /> : <SeoTool />}

          {/* Funnel CTA */}
          <div style={{ marginTop: 40, padding: 24, borderRadius: 16, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Found problems? Build the fixed version in minutes.</p>
            <p style={{ color: '#a1a1aa', fontSize: 14, margin: '8px 0 16px', lineHeight: 1.6 }}>
              Every app you build on WyberAi is scanned for these leaks <b style={{ color: '#fafafa' }}>before it can publish</b>, and
              ships SEO-ready out of the box. Describe your app, get a working web + mobile version.
            </p>
            <Link href="/?utm_source=tools&utm_campaign=scanner" onClick={() => track('tools_cta_clicked', { tab })}
              style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: SKY, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              Build a safe app free →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 15px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.03)', color: '#fafafa', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
}
const btnStyle: React.CSSProperties = {
  padding: '13px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700,
  background: SKY, color: '#fff',
}
const cardStyle: React.CSSProperties = {
  padding: 20, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
}

const SEV_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, good: 0 }
function worstSev(list: string[]): string | undefined {
  let worst: string | undefined
  for (const s of list) if (worst === undefined || (SEV_RANK[s] ?? 0) > (SEV_RANK[worst] ?? 0)) worst = s
  return worst
}

// Lead magnet: after a scan, let the visitor get the full report by email. This
// honours the "email me the report" promise AND drops them into the funnel — the
// capture posts to /api/tools/lead, which stores the lead + emails the report.
function LeadCapture(props: { tool: Tab; url: string; score: number; findingsCount: number; topSeverity?: string }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setState('error'); return }
    setState('sending')
    track('tools_lead_captured', { tool: props.tool })
    try {
      const res = await fetch('/api/tools/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tool: props.tool, url: props.url, score: props.score, findingsCount: props.findingsCount, topSeverity: props.topSeverity }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch { setState('error') }
  }

  if (state === 'done') {
    return (
      <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#10B981' }}>✓ Sent — check your inbox for the full report.</p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)' }}>
      <p style={{ margin: '0 0 10px', fontSize: 13.5, fontWeight: 700 }}>📩 Email me the full report + how to fix each finding</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 180, padding: '11px 13px' }}
          placeholder="you@company.com" type="email" value={email}
          onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle') }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button style={{ ...btnStyle, padding: '11px 20px', opacity: state === 'sending' ? 0.6 : 1 }} disabled={state === 'sending'} onClick={submit}>
          {state === 'sending' ? 'Sending…' : 'Send report'}
        </button>
      </div>
      {state === 'error' && <p style={{ color: '#EF4444', fontSize: 12, margin: '8px 0 0' }}>Enter a valid email and try again.</p>}
    </div>
  )
}

function ScoreDial({ score }: { score: number }) {
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: 46, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: 13, color: '#a1a1aa' }}>/ 100<br />{score >= 80 ? 'Strong' : score >= 50 ? 'Needs work' : 'At risk'}</div>
    </div>
  )
}

function SecurityTool() {
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [report, setReport] = useState<RlsScanReport | null>(null)

  const run = async () => {
    setLoading(true); setErr(null); setReport(null)
    track('tools_security_scan')
    try {
      const res = await fetch('/api/tools/security-scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, anonKey: key }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Scan failed.'); return }
      setReport(data)
    } catch { setErr('Network error — try again.') } finally { setLoading(false) }
  }

  return (
    <div style={cardStyle}>
      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15 }}>Probe your live database the way an attacker would.</p>
      <p style={{ margin: '0 0 16px', color: '#a1a1aa', fontSize: 13, lineHeight: 1.6 }}>
        We use your <b style={{ color: '#fafafa' }}>public</b> anon key (safe to share — it ships in every built app) to try reading each
        table with nobody logged in. We show table names and row counts only, never your actual data. Scan apps you own.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input style={inputStyle} placeholder="Supabase Project URL — https://abcd1234.supabase.co" value={url} onChange={(e) => setUrl(e.target.value)} />
        <input style={inputStyle} placeholder="Public anon key (starts with eyJ…)" value={key} onChange={(e) => setKey(e.target.value)} />
        <button style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={run}>
          {loading ? 'Scanning…' : 'Run security scan'}
        </button>
      </div>
      {err && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 12 }}>{err}</p>}
      {report && (
        <div style={{ marginTop: 20 }}>
          {!report.reachable ? (
            <p style={{ color: '#10B981', fontSize: 14 }}>✓ {report.note || 'Nothing was reachable with the anon key.'}</p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <ScoreDial score={report.score} />
                <div style={{ textAlign: 'right', fontSize: 13, color: '#a1a1aa' }}>
                  {report.tablesScanned} tables scanned<br />
                  <b style={{ color: report.findings.length ? '#EF4444' : '#10B981' }}>{report.findings.length} leak{report.findings.length === 1 ? '' : 's'}</b>
                </div>
              </div>
              {report.findings.length === 0 ? (
                <p style={{ color: '#10B981', fontSize: 14 }}>✓ No anon-readable data found. Your RLS is holding.</p>
              ) : report.findings.map((f) => (
                <div key={f.table} style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10, borderLeft: `3px solid ${sevColor(f.severity)}` }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: sevColor(f.severity), letterSpacing: '0.05em' }}>{f.severity}</span>
                    <code style={{ fontSize: 13, fontWeight: 700 }}>{f.table}</code>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: '#d4d4d8', lineHeight: 1.5 }}>{f.issue}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#71717a' }}>{f.evidence}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}
      {report && (
        <LeadCapture tool="security" url={url} score={report.score ?? 0} findingsCount={report.findings?.length ?? 0} topSeverity={worstSev((report.findings ?? []).map((f) => f.severity))} />
      )}
    </div>
  )
}

function SeoTool() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [report, setReport] = useState<SeoReport | null>(null)

  const run = async () => {
    setLoading(true); setErr(null); setReport(null)
    track('tools_seo_audit')
    try {
      const res = await fetch('/api/tools/seo-audit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Audit failed.'); return }
      setReport(data)
    } catch { setErr('Network error — try again.') } finally { setLoading(false) }
  }

  return (
    <div style={cardStyle}>
      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15 }}>Can Google find and rank your site?</p>
      <p style={{ margin: '0 0 16px', color: '#a1a1aa', fontSize: 13, lineHeight: 1.6 }}>
        We fetch your page and grade the on-page signals that decide rankings and how your links look when shared.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input style={{ ...inputStyle, flex: 1, minWidth: 200 }} placeholder="yourcompany.com" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run()} />
        <button style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={run}>
          {loading ? 'Auditing…' : 'Audit SEO'}
        </button>
      </div>
      {err && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 12 }}>{err}</p>}
      {report && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <ScoreDial score={report.score} />
            <div style={{ textAlign: 'right', fontSize: 13, color: '#a1a1aa' }}>{report.passed}/{report.total} checks passed</div>
          </div>
          {report.checks.map((c) => (
            <div key={c.id} style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10, borderLeft: `3px solid ${sevColor(c.severity)}` }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13 }}>{c.severity === 'good' ? '✓' : '✕'}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{c.label}</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#d4d4d8', lineHeight: 1.5 }}>{c.detail}</p>
              {c.fix && <p style={{ margin: '4px 0 0', fontSize: 12, color: SKY }}>Fix: {c.fix}</p>}
            </div>
          ))}
        </div>
      )}
      {report && (
        <LeadCapture tool="seo" url={url} score={report.score ?? 0} findingsCount={(report.total ?? 0) - (report.passed ?? 0)} topSeverity={worstSev((report.checks ?? []).filter((c) => c.severity !== 'good').map((c) => c.severity))} />
      )}
    </div>
  )
}
