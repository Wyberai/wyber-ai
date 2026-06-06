'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Flow { id: string; name: string; description: string; is_active: boolean; run_count: number; updated_at: string; nodes: unknown[] }

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/flows').then(r => r.json()).then(d => { setFlows(d.flows || []); setLoading(false) })
  }, [])

  const createFlow = async () => {
    const res = await fetch('/api/flows', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: 'New Automation', description: '' }) })
    const data = await res.json()
    if (data.flow?.id) router.push('/flows/' + data.flow.id)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', color:'#f0f0f5', fontFamily:'Inter,-apple-system,sans-serif' }}>
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 32px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', height:60, gap:16 }}>
          <Link href="/dashboard" style={{ fontSize:13, color:'#52526a', textDecoration:'none' }}>← Dashboard</Link>
          <span style={{ color:'rgba(255,255,255,0.12)' }}>|</span>
          <span style={{ fontSize:15, fontWeight:700 }}>Automations</span>
          <button onClick={createFlow} style={{ marginLeft:'auto', padding:'7px 18px', borderRadius:8, border:'none', background:'#0EA5E9', color:'white', fontSize:13, fontWeight:700, cursor:'pointer' }}>+ New Flow</button>
        </div>
      </div>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:32 }}>
        {loading ? <div style={{ color:'#52526a' }}>Loading...</div> : flows.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>⚡</div>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Build your first automation</div>
            <div style={{ fontSize:14, color:'#52526a', marginBottom:24 }}>Connect triggers, AI steps, and actions into powerful workflows</div>
            <button onClick={createFlow} style={{ padding:'11px 28px', borderRadius:8, border:'none', background:'#0EA5E9', color:'white', fontSize:14, fontWeight:700, cursor:'pointer' }}>Create automation →</button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
            {flows.map(flow => (
              <Link key={flow.id} href={'/flows/'+flow.id} style={{ textDecoration:'none' }}>
                <div style={{ background:'#111118', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:20, cursor:'pointer' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:18 }}>⚡</span>
                    <span style={{ fontSize:14, fontWeight:700, color:'#f0f0f5' }}>{flow.name}</span>
                    <span style={{ marginLeft:'auto', fontSize:10, padding:'2px 7px', borderRadius:8, background:flow.is_active?'rgba(34,197,94,0.1)':'rgba(255,255,255,0.04)', color:flow.is_active?'#22c55e':'#52526a', fontWeight:700 }}>{flow.is_active?'ACTIVE':'DRAFT'}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#52526a', marginBottom:12 }}>{flow.description || 'No description'}</div>
                  <div style={{ fontSize:11, color:'#3f3f46' }}>{(flow.nodes||[]).length} steps · {flow.run_count} runs</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
