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
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([])
  const [csvMap, setCsvMap] = useState<Record<string, string>>({})
  const [csvListName, setCsvListName] = useState('')
  const [csvProgress, setCsvProgress] = useState<{ done: number; total: number } | null>(null)
  const [csvResult, setCsvResult] = useState<{ imported: number; duplicates: number; invalid: number } | null>(null)
  const [csvError, setCsvError] = useState('')
  const CREDIT_COST = 2

  const LEAD_FIELDS = ['email', 'first_name', 'last_name', 'title', 'company_name', 'company_domain', 'company_location', 'phone', 'linkedin_url'] as const

  // RFC-ish CSV parse: quoted fields, escaped quotes, CR/LF
  function parseCsv(text: string): Record<string, string>[] {
    const rows: string[][] = []
    let field = '', row: string[] = [], inQ = false
    for (let i = 0; i < text.length; i++) {
      const c = text[i]
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false }
        else field += c
      } else if (c === '"') inQ = true
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++
        row.push(field); field = ''
        if (row.some(v => v.trim() !== '')) rows.push(row)
        row = []
      } else field += c
    }
    row.push(field)
    if (row.some(v => v.trim() !== '')) rows.push(row)
    if (rows.length < 2) return []
    const headers = rows[0].map(h => h.trim())
    return rows.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] || '').trim()])))
  }

  function autoMap(headers: string[]): Record<string, string> {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const candidates: Record<string, string[]> = {
      email: ['email', 'emailaddress', 'workemail', 'verifiedemail'],
      first_name: ['firstname', 'first', 'fname', 'givenname'],
      last_name: ['lastname', 'last', 'lname', 'surname', 'familyname'],
      title: ['title', 'jobtitle', 'position', 'role', 'designation'],
      company_name: ['companyname', 'company', 'organization', 'organisation', 'org', 'employer'],
      company_domain: ['companydomain', 'domain', 'website', 'companywebsite', 'site'],
      company_location: ['companylocation', 'location', 'city', 'country', 'region'],
      phone: ['phone', 'phonenumber', 'mobile', 'tel'],
      linkedin_url: ['linkedinurl', 'linkedin', 'linkedinprofile', 'liurl'],
    }
    const map: Record<string, string> = {}
    for (const f of LEAD_FIELDS) {
      const hit = headers.find(h => candidates[f].includes(norm(h)))
      if (hit) map[f] = hit
    }
    return map
  }

  function onCsvFile(f: File | null) {
    setCsvFile(f); setCsvRows([]); setCsvMap({}); setCsvResult(null); setCsvError('')
    if (!f) return
    setCsvListName(f.name.replace(/\.csv$/i, '').slice(0, 60))
    f.text().then(text => {
      const rows = parseCsv(text)
      if (rows.length === 0) { setCsvError('Could not parse any rows — is this a valid CSV with a header row?'); return }
      setCsvRows(rows)
      setCsvMap(autoMap(Object.keys(rows[0])))
    }).catch(() => setCsvError('Failed to read file'))
  }

  async function importCsv() {
    if (!csvMap.email) { setCsvError('Map the email column first — it’s required.'); return }
    setImporting(true); setCsvError(''); setCsvResult(null)
    const mapped = csvRows.map(r => Object.fromEntries(LEAD_FIELDS.map(f => [f, csvMap[f] ? r[csvMap[f]] || '' : ''])))
    const BATCH = 500
    const totals = { imported: 0, duplicates: 0, invalid: 0 }
    let listId: string | undefined
    setCsvProgress({ done: 0, total: mapped.length })
    for (let i = 0; i < mapped.length; i += BATCH) {
      const res = await fetch('/api/gtm/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'csv', rows: mapped.slice(i, i + BATCH), listName: csvListName || 'CSV import', listId }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setCsvError(data.error || `Batch failed at row ${i}`); break }
      listId = data.list_id
      totals.imported += data.imported; totals.duplicates += data.duplicates; totals.invalid += data.invalid
      setCsvProgress({ done: Math.min(i + BATCH, mapped.length), total: mapped.length })
    }
    setCsvProgress(null)
    setCsvResult(totals)
    setImporting(false)
  }

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
          <div>
            <div style={{ background: s.card, border: `1px dashed ${s.border}`, borderRadius: 12, padding: csvRows.length ? '24px' : '48px 24px', textAlign: csvRows.length ? 'left' : 'center' }}>
              {!csvRows.length && <>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Upload CSV</div>
                <div style={{ fontSize: 13, color: s.muted, marginBottom: 20 }}>Free for your own data. We auto-map columns like email, first_name, company…</div>
              </>}
              <input type="file" accept=".csv,text/csv" onChange={e => onCsvFile(e.target.files?.[0] || null)} style={{ display: 'none' }} id="csv-upload" />
              <label htmlFor="csv-upload" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {csvFile ? `📄 ${csvFile.name}` : 'Choose CSV file'}
              </label>
              {csvRows.length > 0 && <span style={{ marginLeft: 12, fontSize: 13, color: s.muted }}>{csvRows.length.toLocaleString()} rows parsed</span>}
            </div>

            {csvError && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 13 }}>{csvError}</div>}

            {csvRows.length > 0 && !csvResult && (
              <div style={{ marginTop: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, color: s.muted, marginBottom: 4 }}>Lead list name</label>
                  <input value={csvListName} onChange={e => setCsvListName(e.target.value)} placeholder="e.g. Continuum verified leads"
                    style={{ width: 320, background: s.card, border: `1px solid ${s.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: s.text, fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Column mapping</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 16 }}>
                  {LEAD_FIELDS.map(f => (
                    <div key={f}>
                      <label style={{ display: 'block', fontSize: 11, color: f === 'email' ? s.yellow : s.dim, marginBottom: 3 }}>{f}{f === 'email' ? ' (required)' : ''}</label>
                      <select value={csvMap[f] || ''} onChange={e => setCsvMap(m => ({ ...m, [f]: e.target.value }))}
                        style={{ width: '100%', background: s.card, border: `1px solid ${csvMap[f] ? 'rgba(16,185,129,0.35)' : s.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, color: s.text, fontFamily: 'inherit', outline: 'none' }}>
                        <option value="">— skip —</option>
                        {Object.keys(csvRows[0]).map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, overflow: 'auto', marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: `1px solid ${s.border}`, background: 'rgba(255,255,255,0.02)' }}>
                      {LEAD_FIELDS.filter(f => csvMap[f]).map(f => <th key={f} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: s.dim, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{f}</th>)}
                    </tr></thead>
                    <tbody>
                      {csvRows.slice(0, 3).map((r, i) => (
                        <tr key={i} style={{ borderBottom: i < 2 ? `1px solid ${s.border}` : 'none' }}>
                          {LEAD_FIELDS.filter(f => csvMap[f]).map(f => <td key={f} style={{ padding: '8px 12px', fontSize: 12, color: s.muted, whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r[csvMap[f]] || '—'}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={importCsv} disabled={importing || !csvMap.email} style={{ padding: '10px 20px', borderRadius: 8, background: s.orange, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', opacity: csvMap.email ? 1 : 0.5 }}>
                  {csvProgress ? `Importing… ${csvProgress.done.toLocaleString()} / ${csvProgress.total.toLocaleString()}` : importing ? 'Importing…' : `Import ${csvRows.length.toLocaleString()} leads (free) →`}
                </button>
              </div>
            )}

            {csvResult && (
              <div style={{ marginTop: 20, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.green, marginBottom: 6 }}>Import complete</div>
                <div style={{ fontSize: 13, color: s.muted }}>
                  {csvResult.imported.toLocaleString()} imported · {csvResult.duplicates.toLocaleString()} already existed · {csvResult.invalid.toLocaleString()} invalid/blank emails
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <Link href="/gtm/leads" style={{ padding: '8px 16px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>View leads →</Link>
                  <button onClick={() => onCsvFile(null)} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: `1px solid ${s.border}`, color: s.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Import another</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{` input{color-scheme:dark;}`}</style>
    </div>
  )
}
