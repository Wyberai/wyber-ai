'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

const s = {
  bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)',
  text: '#fafafa', muted: '#71717a', dim: '#52525b',
  sky: '#0EA5E9', orange: '#f97316', green: '#10b981', violet: '#8b5cf6',
}

export default function GTMMarketPage() {
  const [profile, setProfile] = useState<any>(null)
  const [tam, setTam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [noKey, setNoKey] = useState(false)

  useEffect(() => {
    fetch('/api/gtm/profile').then(r => r.json()).then(d => {
      setProfile(d.profile)
      if (d.profile) fetchTAM(d.profile)
      else setLoading(false)
    })
  }, [])

  async function fetchTAM(p: any) {
    setLoading(true)
    const res = await fetch('/api/gtm/tam', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: p }) })
    const data = await res.json()
    if (data.no_key) setNoKey(true)
    setTam(data)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/gtm" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <Link href="/gtm" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>← GTM</Link>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: s.orange, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Market Intelligence</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Your Total Addressable Market</h1>
          <p style={{ fontSize: 14, color: s.muted }}>Based on your ICP — companies and contacts matching your ideal customer profile.</p>
        </div>

        {!profile && !loading && (
          <div style={{ padding: '32px', textAlign: 'center', background: s.card, borderRadius: 12, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Set up your ICP first</div>
            <p style={{ fontSize: 13, color: s.muted, marginBottom: 20 }}>We need your ideal customer profile to calculate your market.</p>
            <Link href="/gtm/setup" style={{ padding: '10px 20px', borderRadius: 8, background: s.orange, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Set up ICP →</Link>
          </div>
        )}

        {noKey && (
          <div style={{ marginBottom: 24, padding: '16px 20px', borderRadius: 10, background: 'rgba(249,115,22,0.08)', border: `1px solid ${s.orange}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Connect Apollo to get real market data</div>
              <div style={{ fontSize: 12, color: s.muted }}>Showing estimated figures. Connect your Apollo API key for live counts.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <a href="https://app.apollo.io/#/settings/integrations/api" target="_blank" rel="noopener noreferrer" style={{ padding: '7px 14px', borderRadius: 7, background: '#f59e0b', color: '#000', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Get Apollo key ↗</a>
              <Link href="/gtm/settings" style={{ padding: '7px 14px', borderRadius: 7, background: s.card, border: `1px solid ${s.border}`, color: s.muted, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Connect →</Link>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, padding: 24, animation: 'pulse 1.5s infinite' }}>
                <div style={{ height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 6, marginBottom: 12, width: '60%' }} />
                <div style={{ height: 40, background: 'rgba(255,255,255,0.04)', borderRadius: 6, width: '80%' }} />
              </div>
            ))}
          </div>
        )}

        {tam && (
          <>
            {/* Big numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'Companies in ICP', value: (tam.companies || 0).toLocaleString(), color: s.sky, icon: '🏢' },
                { label: 'Contacts reachable', value: (tam.contacts || 0).toLocaleString(), color: s.orange, icon: '👤' },
                { label: 'Est. email credits', value: `${((tam.contacts || 0) * 2).toLocaleString()} cr`, color: s.violet, icon: '⚡' },
              ].map(stat => (
                <div key={stat.label} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '24px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                  <div style={{ fontSize: 38, fontWeight: 800, color: stat.color, letterSpacing: '-0.04em', fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: 6 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: s.muted }}>{stat.label}</div>
                  {noKey && <div style={{ fontSize: 10, color: s.dim, marginTop: 4 }}>estimated</div>}
                </div>
              ))}
            </div>

            {/* Breakdown */}
            {tam.breakdown && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
                {Object.entries(tam.breakdown).map(([key, items]: any) => (
                  <div key={key} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, padding: '16px 18px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: s.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>{key}</div>
                    {items.map((item: any) => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: s.text }}>{item.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 80, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${item.pct}%`, background: s.sky, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 12, color: s.muted, minWidth: 40, textAlign: 'right' }}>{item.count?.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Top companies */}
            {tam.top_companies?.length > 0 && (
              <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, padding: '16px 18px', marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Top matching companies</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
                  {tam.top_companies.map((co: any) => (
                    <div key={co.name} style={{ padding: '10px 12px', borderRadius: 8, background: '#0b0d12', border: `1px solid rgba(255,255,255,0.05)` }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{co.name}</div>
                      <div style={{ fontSize: 11, color: s.muted }}>{co.industry} · {co.size}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/gtm/leads/import" style={{ flex: 1, padding: '12px 20px', borderRadius: 9, background: s.orange, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>Import leads from this market →</Link>
              <Link href="/gtm/campaigns/new" style={{ padding: '12px 20px', borderRadius: 9, background: s.card, border: `1px solid ${s.border}`, color: s.text, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Build campaign</Link>
            </div>
          </>
        )}
      </div>
      <style>{` @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  )
}
