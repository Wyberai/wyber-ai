import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CommunityPage() {
  const supabase = await createClient()

  const { data: apps } = await supabase
    .from('projects')
    .select('id, name, description, framework, thumbnail_url, published_url, deployed_url, updated_at, user_id')
    .eq('is_public', true)
    .not('files', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(48)

  const categories = ['All', 'Dashboard', 'CRM', 'E-commerce', 'Analytics', 'Portfolio', 'SaaS', 'Tool']

  return (
    <div style={{ minHeight:'100vh', background:'var(--brand-bg)', color:'var(--brand-text)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{ borderBottom:'1px solid var(--brand-border)', padding:'0 32px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', height:60, gap:24 }}>
          <Link href="/" style={{ fontSize:18, fontWeight:700, color:'var(--brand-text)', textDecoration:'none' }}>WyberAi</Link>
          <span style={{ color:'rgba(255,255,255,0.15)' }}>|</span>
          <span style={{ fontSize:14, color:'var(--brand-text-dim)' }}>Community Gallery</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:12 }}>
            <Link href="/agents" style={{ fontSize:13, color:'var(--brand-text-dim)', textDecoration:'none' }}>Agents</Link>
            <Link href="/gallery" style={{ fontSize:13, color:'var(--brand-text-dim)', textDecoration:'none' }}>Templates</Link>
            <Link href="/dashboard" style={{ fontSize:13, fontWeight:600, color:'var(--brand-accent)', textDecoration:'none' }}>Build yours →</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'40px 32px' }}>
        {/* Hero */}
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.25)', borderRadius:20, padding:'4px 14px', fontSize:12, color:'var(--brand-accent)', marginBottom:16 }}>
            ⚡ {apps?.length || 0} community apps — all cloneable
          </div>
          <h1 style={{ fontSize:44, fontWeight:800, margin:'0 0 12px', letterSpacing:'-0.02em' }}>
            Real apps.<br/>
            <span style={{ color:'var(--brand-accent)' }}>Clone any of them.</span>
          </h1>
          <p style={{ fontSize:16, color:'var(--brand-text-dim)', maxWidth:540, margin:'0 auto' }}>
            Built by the WyberAi community. Browse, clone, and make it yours in seconds.
          </p>
        </div>

        {/* Apps grid */}
        {!apps?.length ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🚀</div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Be the first to share</div>
            <div style={{ fontSize:14, color:'var(--brand-text-faint)', marginBottom:24 }}>Build something amazing and make it public from the editor</div>
            <Link href="/dashboard" style={{ padding:'10px 24px', borderRadius:8, background:'var(--brand-accent)', color:'white', fontWeight:700, fontSize:14, textDecoration:'none' }}>
              Start Building →
            </Link>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:20 }}>
            {apps.map(app => (
              <div key={app.id} style={{ background:'var(--brand-bg-raised)', border:'1px solid var(--brand-border)', borderRadius:14, overflow:'hidden', transition:'border-color 0.15s' }}>
                {/* Thumbnail */}
                <div style={{ height:180, background:'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                  {app.thumbnail_url
                    ? <img src={app.thumbnail_url} alt={app.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ fontSize:40, opacity:0.3 }}>⚡</div>
                  }
                  <div style={{ position:'absolute', top:10, left:10, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:10, background:'rgba(34,197,94,0.2)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.3)' }}>
                    LIVE
                  </div>
                </div>

                <div style={{ padding:18 }}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{app.name}</div>
                  <div style={{ fontSize:12, color:'var(--brand-text-faint)', marginBottom:14 }}>
                    {app.description || 'Built with WyberAi'}
                  </div>

                  <div style={{ display:'flex', gap:8 }}>
                    {app.published_url && (
                      <a href={app.published_url} target="_blank" rel="noreferrer"
                        style={{ flex:1, padding:'7px 0', borderRadius:7, border:'1px solid var(--brand-border)', background:'transparent', color:'var(--brand-text-dim)', fontSize:12, fontWeight:600, cursor:'pointer', textAlign:'center', textDecoration:'none' }}>
                        Preview →
                      </a>
                    )}
                    <Link href={`/dashboard?clone=${app.id}`}
                      style={{ flex:2, padding:'7px 0', borderRadius:7, border:'none', background:'var(--brand-accent)', color:'white', fontSize:12, fontWeight:700, cursor:'pointer', textAlign:'center', textDecoration:'none', display:'block' }}>
                      ⎘ Clone this app
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
