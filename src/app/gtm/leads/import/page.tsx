'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { useRouter } from 'next/navigation'

const s = {
  bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)',
  text: '#fafafa', muted: '#71717a', dim: '#52525b',
  orange: '#f97316', green: '#10b981', yellow: '#f59e0b', sky: '#0EA5E9', violet: '#8b5cf6',
}

export default function ImportLeadsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'apollo' | 'csv'>('apollo')
  const [profile, setProfile] = useState<any>(null)
  const [apolloConnected, setApolloConnected] = useState(false)
  const [search, setSearch] = useState({ titles: '', industries: '', locations: '', company_sizes: '' })
  const [results, setResults] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const CREDIT_COST = 2

  useEffect(() => {
    fetch('/api/gtm/profile').then(r => r.json()).then(d => setProfile(d.profile))
    fetch('/api/gtm/connectors').then(r => r.json()).then(d => setApolloConnected(!!d.connected?.apollo_api_key))
  }, [])

  async function searchApollo() {
    setSearching(true)
    const res = await fetch('/api/gtm/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'search', ...search }),
    })
    const data = await res.json()
    setResults(data.people || [])
    setTotal(data.total || 0)
    setSearching(false)
  }

  async function importSelected() {
    setImporting(true)
    await fetch('/api/gtm/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'import', people: results }),
    })
    setImporting(false)
    router.push('/gtm/leads')
  }

  const estimatedCost = results.length * CREDIT_COST

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/gtm" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <Link href="/gtm/leads" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>← Leads</Link>
      </nav>

      <div style={{ maxWidth: 840, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Import leads</h1>
          <p style={{ fontSize: 13, color: s.muted }}>Each imported contact costs {CREDIT_COST} credits.</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#111', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {(['apollo', 'csv'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', borderRadius: 7, border: 'none', background: tab === t ? s.card : 'transparent', color: tab === t ? s.text : s.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t === 'apollo' ? '🔍 Apollo search' : '📄 CSV upload'}
            </button>
          ))}
        </div>

        {tab === 'apollo' ? (
          <div>
            {!apolloConnected && (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, color: s.yellow }}>⚠️ Apollo not connected — <a href="https://app.apollo.io" target="_blank" rel="noopener noreferrer" style={{ color: s.yellow }}>get a free key</a>, then add it in settings</div>
                <Link href="/gtm/settings" style={{ fontSize: 12, padding: '6px 12px', borderRadius: 7, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: s.yellow, textDecoration: 'none', fontWeight: 700 }}>Connect →</Link>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { field: 'titles', label: 'Job titles', placeholder: 'CEO, Founder, Head of Marketing', hint: 'From ICP: ' + (profile?.icp_seniorities?.join(', ') || 'not set') },
                { field: 'industries', label: 'Industries', placeholder: 'SaaS, Fintech, Healthcare', hint: 'From ICP: ' + (profile?.icp_industries?.join(', ') || 'not set') },
                { field: 'locations', label: 'Locations', placeholder: 'United States, United Kingdom', hint: 'From ICP: ' + (profile?.icp_geographies?.join(', ') || 'not set') },
                { field: 'company_sizes', label: 'Company sizes', placeholder: '11-50, 51-200', hint: 'From ICP: ' + (profile?.icp_company_sizes?.join(', ') || 'not set') },
              ].map(({ field, label, placeholder, hint }) => (
                <div key={field}>
                  <label style={{ display: 'block', fontSize: 11, color: s.muted, marginBottom: 4 }}>{label}</label>
                  <input
                    value={(search as any)[field]}
                    onChange={e => setSearch(s => ({ ...s, [field]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', background: s.card, border: `1px solid ${s.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: s.text, fontFamily: 'inherit', outline: 'none' }}
                  />
                  <div style={{ fontSize: 10, color: s.dim, marginTop: 3 }}>{hint}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <button onClick={searchApollo} disabled={searching || !apolloConnected} style={{ padding: '10px 20px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', opacity: apolloConnected ? 1 : 0.5 }}>
                {searching ? 'Searching...' : 'Search Apollo'}
              </button>
              <button onClick={() => {
                const icpSearch = {
                  titles: profile?.icp_seniorities?.join(', ') || '',
                  industries: profile?.icp_industries?.join(', ') || '',
                  locations: profile?.icp_geographies?.join(', ') || '',
                  company_sizes: profile?.icp_company_sizes?.join(', ') || '',
                }
                setSearch(icpSearch)
              }} style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: s.violet, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                ✦ Fill from ICP
              </button>
            </div>

            {results.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: s.muted }}>Showing {results.length} of {total.toLocaleString()} matches</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: s.yellow, fontWeight: 700 }}>Cost: {estimatedCost} credits</span>
                    <button onClick={importSelected} disabled={importing} style={{ padding: '8px 16px', borderRadius: 8, background: s.orange, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
                      {importing ? 'Importing...' : `Import ${results.length} contacts →`}
                    </button>
                  </div>
                </div>
                <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: `1px solid ${s.border}`, background: 'rgba(255,255,255,0.02)' }}>
                      {['Name', 'Title', 'Company', 'Location'].map(h => (
                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: s.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {results.map((p: any, i: number) => (
                        <tr key={i} style={{ borderBottom: i < results.length - 1 ? `1px solid ${s.border}` : 'none' }}>
                          <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{p.name}<div style={{ fontSize: 11, color: s.muted, fontWeight: 400 }}>{p.email || '—'}</div></td>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: s.muted }}>{p.title || '—'}</td>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: s.muted }}>{p.organization?.name || '—'}</td>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: s.muted }}>{p.city || p.country || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: s.card, border: `1px dashed ${s.border}`, borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Upload CSV</div>
            <div style={{ fontSize: 13, color: s.muted, marginBottom: 20 }}>Columns: first_name, last_name, email, company_name, title, linkedin_url</div>
            <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} style={{ display: 'none' }} id="csv-upload" />
            <label htmlFor="csv-upload" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {csvFile ? csvFile.name : 'Choose CSV file'}
            </label>
            {csvFile && (
              <div style={{ marginTop: 16 }}>
                <button style={{ padding: '10px 20px', borderRadius: 8, background: s.orange, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
                  Upload & import
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{` input{color-scheme:dark;}`}</style>
    </div>
  )
}
