'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

const CATEGORIES = [
  'All','Sales & Revenue','Customer Support','Finance','Marketing',
  'HR & People','IT & Security','Operations','Legal & Compliance',
  'Executive','Healthcare','Real Estate','Insurance','Ecommerce',
  'Education','Nonprofit','Government','Hospitality','Professional Services'
]

const COMPLEXITY_COLOR: Record<string,string> = {
  Enterprise: '#6366f1', Growth: '#22c55e', Ready: '#0EA5E9'
}

interface Agent {
  id: string; agent_id: string; name: string; category: string;
  primary_buyer: string; problem: string; outcome: string;
  complexity: string; is_featured: boolean;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [featured, setFeatured] = useState(false)

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
      const data = await res.json()
      setAgents(data.agents || [])
      setTotal(data.total || 0)
    } finally { setLoading(false) }
  }, [page, category, search, featured])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  const handleSearch = () => { setSearch(searchInput); setPage(1) }
  const handleCategory = (cat: string) => { setCategory(cat); setPage(1) }

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', color:'#f0f0f5', fontFamily:'Inter,-apple-system,sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 32px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', height:60, gap:24 }}>
          <Link href="/" style={{ fontSize:18, fontWeight:700, color:'#f0f0f5', textDecoration:'none' }}>
            Wyber AI
          </Link>
          <span style={{ color:'rgba(255,255,255,0.15)' }}>|</span>
          <span style={{ fontSize:14, color:'#8b8b9a' }}>Agent Library</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:12 }}>
            <Link href="/gallery" style={{ fontSize:13, color:'#8b8b9a', textDecoration:'none' }}>Apps</Link>
            <Link href="/dashboard" style={{ fontSize:13, color:'#6366f1', textDecoration:'none', fontWeight:600 }}>Build →</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 32px' }}>
        {/* Hero */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:20, padding:'4px 14px', fontSize:12, color:'#6366f1', marginBottom:16 }}>
            ⚡ {total.toLocaleString()} AI Agents Available
          </div>
          <h1 style={{ fontSize:40, fontWeight:800, margin:'0 0 12px', letterSpacing:'-0.02em' }}>
            Deploy AI agents for<br />
            <span style={{ color:'#6366f1' }}>any business workflow</span>
          </h1>
          <p style={{ fontSize:16, color:'#8b8b9a', maxWidth:560, margin:'0 auto 28px' }}>
            Browse 5,000+ pre-built AI agents across 18 industries. Configure any agent in one prompt. Deploy with approval controls.
          </p>

          {/* Search */}
          <div style={{ display:'flex', gap:8, maxWidth:480, margin:'0 auto' }}>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search agents... e.g. 'invoice processing'"
              style={{ flex:1, padding:'11px 16px', background:'#111118', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#f0f0f5', fontSize:14, outline:'none' }}
            />
            <button onClick={handleSearch}
              style={{ padding:'11px 20px', background:'#6366f1', border:'none', borderRadius:10, color:'white', fontSize:14, fontWeight:600, cursor:'pointer' }}>
              Search
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24, alignItems:'center' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => handleCategory(cat)}
              style={{
                padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer', border:'1px solid',
                background: category === cat ? '#6366f1' : 'transparent',
                borderColor: category === cat ? '#6366f1' : 'rgba(255,255,255,0.1)',
                color: category === cat ? 'white' : '#8b8b9a',
              }}>
              {cat}
            </button>
          ))}
          <button onClick={() => { setFeatured(!featured); setPage(1) }}
            style={{
              marginLeft:'auto', padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer', border:'1px solid',
              background: featured ? 'rgba(245,158,11,0.1)' : 'transparent',
              borderColor: featured ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)',
              color: featured ? '#f59e0b' : '#8b8b9a',
            }}>
            ⭐ Featured only
          </button>
        </div>

        {/* Stats bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <span style={{ fontSize:13, color:'#52526a' }}>
            {loading ? 'Loading...' : `${total.toLocaleString()} agents${search ? ` matching "${search}"` : ''}${category !== 'All' ? ` in ${category}` : ''}`}
          </span>
          <div style={{ display:'flex', gap:12, fontSize:12, color:'#52526a' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#6366f1', display:'inline-block' }}/>Enterprise
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', display:'inline-block' }}/>Growth
            </span>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
            {Array(12).fill(0).map((_,i) => (
              <div key={i} style={{ height:180, background:'#111118', borderRadius:12, border:'1px solid rgba(255,255,255,0.06)', animation:'pulse 1.5s ease-in-out infinite' }}/>
            ))}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
            {agents.map(agent => (
              <div key={agent.id}
                style={{ background:'#111118', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:20, cursor:'pointer', transition:'all 0.15s', position:'relative' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor='rgba(99,102,241,0.3)'; (e.currentTarget as HTMLDivElement).style.background='#15151f' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor='rgba(255,255,255,0.06)'; (e.currentTarget as HTMLDivElement).style.background='#111118' }}
              >
                {agent.is_featured && (
                  <div style={{ position:'absolute', top:12, right:12, fontSize:10, fontWeight:700, color:'#f59e0b', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10, padding:'2px 8px', letterSpacing:'0.05em' }}>
                    FEATURED
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                    🤖
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:'#f0f0f5', marginBottom:2, lineHeight:1.3 }}>{agent.name}</div>
                    <div style={{ fontSize:11, color:'#52526a' }}>{agent.agent_id}</div>
                  </div>
                </div>

                <div style={{ fontSize:12, color:'#8b8b9a', marginBottom:12, lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                  {agent.problem}
                </div>

                <div style={{ fontSize:11, color:'#52526a', marginBottom:14, display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                  → {agent.outcome}
                </div>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', gap:6 }}>
                    <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:10, background:`${COMPLEXITY_COLOR[agent.complexity] || '#6366f1'}18`, color:COMPLEXITY_COLOR[agent.complexity] || '#6366f1', border:`1px solid ${COMPLEXITY_COLOR[agent.complexity] || '#6366f1'}30` }}>
                      {agent.complexity}
                    </span>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:'rgba(255,255,255,0.04)', color:'#52526a', border:'1px solid rgba(255,255,255,0.06)' }}>
                      {agent.category}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      localStorage.setItem('wyber_pending_agent', JSON.stringify({
                        agent_id: agent.agent_id,
                        name: agent.name,
                        category: agent.category,
                        problem: agent.problem,
                        outcome: agent.outcome,
                        buyer: agent.primary_buyer,
                        complexity: agent.complexity,
                        tools: agent.required_tools,
                      }))
                      window.location.href = '/dashboard'
                    }}
                    style={{ fontSize:12, fontWeight:600, color:'#6366f1', border:'1px solid rgba(99,102,241,0.3)', borderRadius:6, background:'rgba(99,102,241,0.06)', padding:'4px 12px', cursor:'pointer' }}>
                    Configure →
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
              style={{ padding:'8px 16px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color: page===1 ? '#3f3f46' : '#f0f0f5', cursor: page===1 ? 'not-allowed':'pointer', fontSize:13 }}>
              ← Prev
            </button>
            <span style={{ fontSize:13, color:'#52526a' }}>Page {page} of {Math.ceil(total/24)}</span>
            <button onClick={() => setPage(p => p+1)} disabled={page >= Math.ceil(total/24)}
              style={{ padding:'8px 16px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color: page>=Math.ceil(total/24) ? '#3f3f46' : '#f0f0f5', cursor: page>=Math.ceil(total/24) ? 'not-allowed':'pointer', fontSize:13 }}>
              Next →
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
