'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { WyberLogo } from '@/components/shared/WyberLogo'

const CATEGORIES = [
  'All','Sales & Revenue','Customer Support','Finance','Marketing',
  'HR & People','IT & Security','Operations','Legal & Compliance',
  'Executive','Healthcare','Real Estate','Insurance','Ecommerce',
  'Education','Nonprofit','Government','Hospitality','Professional Services'
]

const COMPLEXITY_COLOR: Record<string,string> = {
  Enterprise: '#8b5cf6', Growth: '#22c55e', Ready: '#0EA5E9'
}

const CATEGORY_ICON: Record<string, { emoji: string; color: string }> = {
  'Sales & Revenue': { emoji: '🎯', color: '#10b981' },
  'Customer Support': { emoji: '🎧', color: '#f59e0b' },
  'Finance': { emoji: '💰', color: '#22c55e' },
  'Marketing': { emoji: '📣', color: '#e879f9' },
  'HR & People': { emoji: '👥', color: '#6366f1' },
  'IT & Security': { emoji: '🔒', color: '#ef4444' },
  'Operations': { emoji: '⚙️', color: '#0EA5E9' },
  'Legal & Compliance': { emoji: '⚖️', color: '#8b5cf6' },
  'Executive': { emoji: '👔', color: '#f97316' },
  'Healthcare': { emoji: '🏥', color: '#14b8a6' },
  'Real Estate': { emoji: '🏠', color: '#06b6d4' },
  'Insurance': { emoji: '🛡️', color: '#3b82f6' },
  'Ecommerce': { emoji: '🛒', color: '#ec4899' },
  'Education': { emoji: '📚', color: '#a855f7' },
  'Nonprofit': { emoji: '💚', color: '#22c55e' },
  'Government': { emoji: '🏛️', color: '#64748b' },
  'Hospitality': { emoji: '🏨', color: '#f59e0b' },
  'Professional Services': { emoji: '💼', color: '#0EA5E9' },
}

interface Agent {
  id: string; agent_id: string; name: string; category: string;
  primary_buyer: string; problem: string; outcome: string;
  complexity: string; is_featured: boolean;
}

export default function AgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [featured, setFeatured] = useState(false)
  const [openingId, setOpeningId] = useState<string | null>(null)

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '24',
        ...(category !== 'All' && { category }),
        ...(search && { search }),
        ...(featured && { featured: 'true' }),
      })
      const res = await fetch(`/api/agents?${params}`)
      if (res.status === 401) { router.push('/login?next=/agents'); return }
      const data = await res.json()
      setAgents(data.agents || [])
      setTotal(data.total || 0)
    } catch { /* network error — loading state clears in finally */ } finally { setLoading(false) }
  }, [page, category, search, featured])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  const handleSearch = () => { setSearch(searchInput); setPage(1) }
  const handleCategory = (cat: string) => { setCategory(cat); setPage(1) }

  const handleOpenAgent = async (agentId: string) => {
    if (openingId) return
    setOpeningId(agentId)
    try {
      const res = await fetch('/api/build-from-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      })
      const data = await res.json()
      if (data.projectId) {
        // Store canvas data so AgentCanvas can hydrate from it on first load
        if (data.canvasData) sessionStorage.setItem(`wyber_canvas_${data.projectId}`, data.canvasData)
        router.push(`/project/${data.projectId}?type=agent`)
      } else if (res.status === 401) {
        router.push('/login')
      } else {
        alert('Failed to open agent: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Failed to open agent')
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#09090b', color:'#fafafa', fontFamily: 'var(--font-display)' }}>

      {/* Header */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 32px', background: '#0d0d0f' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', height:60, gap:24 }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
            <WyberLogo markSize={24} wordmarkSize={13} />
          </Link>
          <span style={{ color:'rgba(255,255,255,0.15)' }}>|</span>
          <span style={{ fontSize:13, color:'#71717a', fontWeight:500 }}>Agent Library</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:12 }}>
            <Link href="/gallery" style={{ fontSize:13, color:'#71717a', textDecoration:'none', fontWeight:500 }}>Apps</Link>
            <Link href="/dashboard" style={{ fontSize:13, color:'#0EA5E9', textDecoration:'none', fontWeight:700 }}>Dashboard →</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 32px' }}>
        {/* Hero */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:20, padding:'4px 14px', fontSize:12, color:'#f59e0b', marginBottom:10, fontWeight:700 }}>
            Coming soon
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.2)', borderRadius:20, padding:'4px 14px', fontSize:12, color:'#0EA5E9', marginBottom:16, fontWeight:700 }}>
            ⚡ {total === null ? '…' : total.toLocaleString()} AI Agents Available
          </div>
          <h1 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:800, margin:'0 0 12px', letterSpacing:'-0.03em', fontFamily: 'var(--font-display)' }}>
            Deploy AI agents for<br />
            <span style={{ color:'#0EA5E9' }}>any business workflow</span>
          </h1>
          <p style={{ fontSize:15, color:'#71717a', maxWidth:520, margin:'0 auto 28px', lineHeight:1.65 }}>
            Browse {total === null ? '' : `${total.toLocaleString()}+`} pre-built AI agents across 18 industries. Click any agent to open it in the visual canvas builder — no setup required.
          </p>

          {/* Search */}
          <div style={{ display:'flex', gap:8, maxWidth:480, margin:'0 auto' }}>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search agents... e.g. 'invoice processing'"
              style={{ flex:1, padding:'11px 16px', background:'#111118', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#fafafa', fontSize:14, outline:'none', fontFamily:'inherit' }}
            />
            <button onClick={handleSearch}
              style={{ padding:'11px 20px', background:'#0EA5E9', border:'none', borderRadius:10, color:'white', fontSize:14, fontWeight:600, cursor:'pointer' }}>
              Search
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:24, alignItems:'center' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => handleCategory(cat)}
              style={{
                padding:'5px 13px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:'1px solid',
                background: category === cat ? '#0EA5E9' : 'transparent',
                borderColor: category === cat ? '#0EA5E9' : 'rgba(255,255,255,0.08)',
                color: category === cat ? 'white' : '#71717a',
                transition: 'all 0.15s',
              }}>
              {cat}
            </button>
          ))}
          <button onClick={() => { setFeatured(!featured); setPage(1) }}
            style={{
              marginLeft:'auto', padding:'5px 13px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:'1px solid',
              background: featured ? 'rgba(245,158,11,0.1)' : 'transparent',
              borderColor: featured ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)',
              color: featured ? '#f59e0b' : '#71717a',
            }}>
            ⭐ Featured
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <span style={{ fontSize:12, color:'#52525b' }}>
            {loading ? 'Loading...' : `${total.toLocaleString()} agents${search ? ` matching "${search}"` : ''}${category !== 'All' ? ` in ${category}` : ''}`}
          </span>
          <div style={{ display:'flex', gap:12, fontSize:11, color:'#52525b' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#8b5cf6', display:'inline-block' }}/>Enterprise
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', display:'inline-block' }}/>Growth
            </span>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:12 }}>
            {Array(12).fill(0).map((_,i) => (
              <div key={i} style={{ height:180, background:'#111118', borderRadius:14, border:'1px solid rgba(255,255,255,0.06)', animation:'pulse 1.5s ease-in-out infinite' }}/>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'#52525b' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🤖</div>
            <div style={{ fontSize:16, fontWeight:600, marginBottom:8, color:'#a1a1aa' }}>No agents found</div>
            <div style={{ fontSize:13 }}>Try a different search or category</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:12 }}>
            {agents.map(agent => (
              <div key={agent.id}
                style={{ background:'#111118', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:20, cursor:'pointer', transition:'all 0.15s', position:'relative', display:'flex', flexDirection:'column' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor='rgba(14,165,233,0.25)'; (e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 32px rgba(0,0,0,0.3)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor='rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform='none'; (e.currentTarget as HTMLDivElement).style.boxShadow='none' }}
              >
                {agent.is_featured && (
                  <div style={{ position:'absolute', top:12, right:12, fontSize:10, fontWeight:700, color:'#f59e0b', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10, padding:'2px 8px', letterSpacing:'0.05em' }}>
                    FEATURED
                  </div>
                )}

                {/* Agent header */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                  {(() => { const ci = CATEGORY_ICON[agent.category] || { emoji: '🤖', color: '#0EA5E9' }; return (
                  <div style={{ width:40, height:40, borderRadius:10, background:`${ci.color}12`, border:`1px solid ${ci.color}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                    {ci.emoji}
                  </div>
                  ) })()}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#fafafa', marginBottom:3, lineHeight:1.3 }}>{agent.name}</div>
                    <div style={{ fontSize:11, color:'#52525b' }}>{agent.agent_id} · {agent.category}</div>
                  </div>
                </div>

                <div style={{ fontSize:12, color:'#a1a1aa', marginBottom:10, lineHeight:1.55, flex:1, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                  {agent.problem}
                </div>

                <div style={{ fontSize:11, color:'#52525b', marginBottom:16, display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                  → {agent.outcome}
                </div>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:`${COMPLEXITY_COLOR[agent.complexity] || '#0EA5E9'}15`, color:COMPLEXITY_COLOR[agent.complexity] || '#0EA5E9', border:`1px solid ${COMPLEXITY_COLOR[agent.complexity] || '#0EA5E9'}30` }}>
                    {agent.complexity}
                  </span>
                  <button
                    onClick={() => handleOpenAgent(agent.agent_id)}
                    disabled={openingId === agent.agent_id}
                    style={{ fontSize:12, fontWeight:700, color: openingId === agent.agent_id ? '#52525b' : '#0EA5E9', border:`1px solid ${openingId === agent.agent_id ? 'rgba(255,255,255,0.08)' : 'rgba(14,165,233,0.3)'}`, borderRadius:8, background: openingId === agent.agent_id ? 'transparent' : 'rgba(14,165,233,0.08)', padding:'6px 14px', cursor: openingId === agent.agent_id ? 'wait' : 'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', gap:5 }}>
                    {openingId === agent.agent_id
                      ? <><div style={{ width:10, height:10, border:'1.5px solid rgba(14,165,233,0.3)', borderTopColor:'#0EA5E9', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />Opening...</>
                      : 'Open in Canvas →'
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 24 && (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginTop:32 }}>
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page === 1}
              style={{ padding:'8px 16px', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color: page===1 ? '#3f3f46' : '#fafafa', cursor: page===1 ? 'not-allowed':'pointer', fontSize:13 }}>
              ← Prev
            </button>
            <span style={{ fontSize:13, color:'#52525b' }}>Page {page} of {Math.ceil(total/24)}</span>
            <button onClick={() => setPage(p => p+1)} disabled={page >= Math.ceil(total/24)}
              style={{ padding:'8px 16px', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color: page>=Math.ceil(total/24) ? '#3f3f46' : '#fafafa', cursor: page>=Math.ceil(total/24) ? 'not-allowed':'pointer', fontSize:13 }}>
              Next →
            </button>
          </div>
        )}
      </div>

      <style>{`
        
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input::placeholder{color:#52525b}
      `}</style>
    </div>
  )
}

