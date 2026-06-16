'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'

const SKY = '#0EA5E9'

interface Org {
  id: string; name: string; slug: string; website?: string; industry?: string
  company_size?: string; description?: string; custom_domain?: string; plan: string; created_at: string
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#111115', border: '1px solid #2a2a35',
  borderRadius: 9, padding: '10px 14px', fontSize: 14, color: '#e4e4e7', outline: 'none', fontFamily: 'inherit',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#71717a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }

export default function OrgPage() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // Create form state
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newIndustry, setNewIndustry] = useState('')
  const [newSize, setNewSize] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newWebsite, setNewWebsite] = useState('')

  // Domain state per org
  const [domainInputs, setDomainInputs] = useState<Record<string, string>>({})
  const [savingDomain, setSavingDomain] = useState<string | null>(null)

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

  const load = async () => {
    const res = await fetch('/api/organizations')
    if (res.ok) { const d = await res.json(); setOrgs(d.organizations ?? []) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, slug: newSlug, website: newWebsite, industry: newIndustry, company_size: newSize, description: newDesc }),
    })
    const d = await res.json()
    if (res.ok) {
      setOrgs(prev => [d.organization, ...prev])
      setShowCreate(false); setNewName(''); setNewSlug(''); setNewIndustry(''); setNewSize(''); setNewDesc(''); setNewWebsite('')
      showToast('Organization created!')
    } else showToast(d.error ?? 'Failed to create', false)
    setCreating(false)
  }

  const handleSaveDomain = async (orgId: string) => {
    const domain = domainInputs[orgId]?.trim()
    if (!domain) return
    setSavingDomain(orgId)
    const res = await fetch(`/api/organizations/${orgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_domain: domain }),
    })
    const d = await res.json()
    if (res.ok) {
      setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, custom_domain: domain } : o))
      setEditing(null)
      showToast('Custom domain saved!')
    } else showToast(d.error ?? 'Failed to save domain', false)
    setSavingDomain(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', fontFamily: "'Space Grotesk', sans-serif", color: '#e4e4e7' }}>
      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:toast.ok?'#0f2a1a':'#2a0f0f', border:`1px solid ${toast.ok?'#22c55e33':'#ef444433'}`, color:toast.ok?'#22c55e':'#ef4444', padding:'12px 20px', borderRadius:10, fontSize:13, fontWeight:600, zIndex:9999, whiteSpace:'nowrap' }}>{toast.msg}</div>
      )}

      <nav style={{ borderBottom:'1px solid #1a1a22', background:'#0d0d11', padding:'0 32px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <Link href="/dashboard" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <div style={{ display:'flex', gap:10 }}>
          <Link href="/ai-employees" style={{ fontSize:12, color:'#52525b', textDecoration:'none', padding:'5px 12px', borderRadius:7, border:'1px solid #1e1e26' }}>AI Employees</Link>
          <button onClick={() => setShowCreate(s => !s)} style={{ fontSize:13, fontWeight:600, color:'#fff', textDecoration:'none', padding:'7px 16px', borderRadius:8, background:SKY, border:'none', cursor:'pointer', fontFamily:'inherit' }}>+ New organization</button>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 32px 80px' }}>
        <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.04em', color:'#fff', margin:'0 0 6px' }}>Organizations</h1>
        <p style={{ color:'#3f3f46', fontSize:14, margin:'0 0 32px' }}>Manage your organizations and custom domains for AI employees.</p>

        {/* Create form */}
        {showCreate && (
          <form onSubmit={handleCreate} style={{ background:'#111115', border:`1px solid ${SKY}33`, borderRadius:14, padding:24, marginBottom:24 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:20 }}>New organization</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <label style={labelStyle}>Organization name *</label>
                <input value={newName} onChange={e => { setNewName(e.target.value); if (!newSlug) setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')) }} required placeholder="Netenrich Inc." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Slug (URL) *</label>
                <input value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} required placeholder="netenrich" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Industry</label>
                <input value={newIndustry} onChange={e => setNewIndustry(e.target.value)} placeholder="Cybersecurity, SaaS…" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Company size</label>
                <select value={newSize} onChange={e => setNewSize(e.target.value)} style={{ ...inputStyle, padding:'10px 12px' }}>
                  <option value="">Select…</option>
                  {['1-10','11-50','51-200','201-500','500-1000','1000+'].map(s => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={labelStyle}>Website</label>
                <input value={newWebsite} onChange={e => setNewWebsite(e.target.value)} placeholder="https://netenrich.com" style={inputStyle} />
              </div>
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={labelStyle}>Description</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What does this organization do?" rows={3} style={{ ...inputStyle, resize:'vertical' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button type="submit" disabled={creating} style={{ padding:'10px 22px', borderRadius:9, background:creating?'#1a1a22':SKY, border:'none', color:creating?'#52525b':'#fff', fontSize:13, fontWeight:700, cursor:creating?'not-allowed':'pointer', fontFamily:'inherit' }}>{creating?'Creating…':'Create organization'}</button>
              <button type="button" onClick={() => setShowCreate(false)} style={{ padding:'10px 16px', borderRadius:9, border:'1px solid #2a2a35', background:'transparent', color:'#52525b', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            </div>
          </form>
        )}

        {/* Org list */}
        {loading ? (
          <div style={{ color:'#3f3f46', textAlign:'center', padding:'40px 0' }}>Loading…</div>
        ) : orgs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ fontSize:48, marginBottom:14 }}>🏢</div>
            <p style={{ color:'#3f3f46', fontSize:14, marginBottom:20 }}>No organizations yet.</p>
            <button onClick={() => setShowCreate(true)} style={{ padding:'10px 22px', borderRadius:9, background:SKY, border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Create your first org</button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {orgs.map(org => (
              <div key={org.id} style={{ background:'#111115', border:'1px solid #1e1e26', borderRadius:14, padding:22 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:3 }}>{org.name}</div>
                    <div style={{ fontSize:12, color:'#3f3f46' }}>wyberai.com/org/{org.slug} · {org.plan} plan</div>
                    {org.industry && <div style={{ fontSize:12, color:'#52525b', marginTop:4 }}>{org.industry}{org.company_size ? ` · ${org.company_size} employees` : ''}</div>}
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:10, background:'rgba(14,165,233,0.08)', color:SKY, textTransform:'uppercase', letterSpacing:'0.05em' }}>{org.plan}</span>
                </div>

                {/* Custom domain section */}
                <div style={{ background:'#0d0d11', borderRadius:10, padding:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#3f3f46', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Custom domain</div>
                  {org.custom_domain ? (
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:'#e4e4e7' }}>{org.custom_domain}</span>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:10, background:'rgba(34,197,94,0.08)', color:'#22c55e' }}>Active</span>
                        <button onClick={() => { setEditing(org.id); setDomainInputs(d => ({ ...d, [org.id]: org.custom_domain ?? '' })) }} style={{ fontSize:11, color:'#52525b', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Edit</button>
                      </div>
                      <div style={{ fontSize:12, color:'#3f3f46', lineHeight:1.6 }}>
                        Employees are accessible at <code style={{ color:SKY }}>{org.custom_domain}/[employee-slug]</code>
                      </div>
                      {editing === org.id && (
                        <div style={{ display:'flex', gap:8, marginTop:10 }}>
                          <input value={domainInputs[org.id] ?? ''} onChange={e => setDomainInputs(d => ({ ...d, [org.id]: e.target.value }))} placeholder="yourdomain.com" style={{ ...inputStyle, flex:1 }} />
                          <button onClick={() => handleSaveDomain(org.id)} disabled={savingDomain === org.id} style={{ padding:'10px 16px', borderRadius:9, background:SKY, border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>{savingDomain === org.id ? 'Saving…' : 'Save'}</button>
                          <button onClick={() => setEditing(null)} style={{ padding:'10px 12px', borderRadius:9, border:'1px solid #2a2a35', background:'transparent', color:'#52525b', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>✕</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize:12, color:'#52525b', margin:'0 0 10px', lineHeight:1.6 }}>
                        Add a custom domain so employees are accessible at <code style={{ color:'#71717a' }}>yourdomain.com/employee-name</code>. Add a CNAME record pointing to <code style={{ color:SKY }}>wyberai.com</code> first.
                      </p>
                      <div style={{ display:'flex', gap:8 }}>
                        <input
                          value={domainInputs[org.id] ?? ''}
                          onChange={e => setDomainInputs(d => ({ ...d, [org.id]: e.target.value }))}
                          placeholder="yourdomain.com"
                          style={{ ...inputStyle, flex:1 }}
                        />
                        <button onClick={() => handleSaveDomain(org.id)} disabled={savingDomain === org.id} style={{ padding:'10px 18px', borderRadius:9, background:SKY, border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                          {savingDomain === org.id ? 'Saving…' : 'Add domain'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* DNS instructions */}
                {!org.custom_domain && (
                  <div style={{ marginTop:12, background:'rgba(14,165,233,0.04)', border:'1px solid rgba(14,165,233,0.1)', borderRadius:9, padding:14 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:SKY, marginBottom:8 }}>DNS Setup</div>
                    <div style={{ fontSize:11, color:'#52525b', lineHeight:1.8, fontFamily:'monospace' }}>
                      Type: CNAME<br/>
                      Name: @ (or your subdomain)<br/>
                      Value: wyberai.com<br/>
                      TTL: 3600
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
