'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

const s = {
  bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)',
  text: '#fafafa', muted: '#71717a', dim: '#52525b',
  sky: '#0EA5E9', orange: '#f97316', green: '#10b981', violet: '#8b5cf6',
}

const CONNECTORS = [
  {
    group: 'Lead Sources',
    items: [
      { id: 'apollo_api_key', label: 'Apollo.io', icon: '🔍', desc: 'Lead search, enrichment, dialer', referral: 'https://app.apollo.io', referralLabel: 'Get Apollo free →', color: '#f59e0b' },
      { id: 'zoominfo_api_key', label: 'ZoomInfo', icon: '📊', desc: 'Enterprise B2B database', referral: 'https://zoominfo.com', referralLabel: 'Get ZoomInfo →', color: '#0EA5E9' },
      { id: 'lusha_api_key', label: 'Lusha', icon: '👤', desc: 'Email + direct dial finder', referral: 'https://lusha.com', referralLabel: 'Get Lusha →', color: '#8b5cf6' },
      { id: 'hunter_api_key', label: 'Hunter.io', icon: '✉️', desc: 'Email finder & verifier', referral: 'https://hunter.io', referralLabel: 'Get Hunter →', color: '#10b981' },
    ]
  },
  {
    group: 'Email Outreach',
    items: [
      { id: 'smartlead_api_key', label: 'Smartlead', icon: '📤', desc: 'Cold email sequences + warmup', referral: 'https://smartlead.ai', referralLabel: 'Get Smartlead →', color: '#0EA5E9' },
      { id: 'instantly_api_key', label: 'Instantly.ai', icon: '⚡', desc: 'High-volume cold email', referral: 'https://instantly.ai', referralLabel: 'Get Instantly →', color: '#f59e0b' },
      { id: 'outreach_api_key', label: 'Outreach.io', icon: '🎯', desc: 'Enterprise sales engagement', referral: null, referralLabel: null, color: '#8b5cf6' },
      { id: 'salesloft_api_key', label: 'Salesloft', icon: '📞', desc: 'Sales cadence platform', referral: null, referralLabel: null, color: '#10b981' },
    ]
  },
  {
    group: 'Calling',
    items: [
      { id: 'justcall_api_key', label: 'JustCall', icon: '📞', desc: 'Cloud calling + SMS for sales', referral: 'https://justcall.io', referralLabel: 'Get JustCall →', color: '#f97316' },
      { id: 'aircall_api_key', label: 'Aircall', icon: '☎️', desc: 'Call center & dialer', referral: 'https://aircall.io', referralLabel: 'Get Aircall →', color: '#0EA5E9' },
    ]
  },
  {
    group: 'CRM',
    items: [
      { id: 'hubspot_api_key', label: 'HubSpot', icon: '🧲', desc: 'CRM + sequences sync', referral: 'https://hubspot.com', referralLabel: 'Get HubSpot →', color: '#f97316' },
      { id: 'salesforce_api_key', label: 'Salesforce', icon: '☁️', desc: 'Enterprise CRM sync', referral: null, referralLabel: null, color: '#0EA5E9' },
      { id: 'attio_api_key', label: 'Attio', icon: '✨', desc: 'Modern CRM for startups', referral: 'https://attio.com', referralLabel: 'Get Attio →', color: '#8b5cf6' },
    ]
  },
]

export default function GTMSettingsPage() {
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const [connected, setConnected] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/gtm/connectors').then(r => r.json()).then(d => {
      setConnected(d.connected || {})
    })
  }, [])

  async function saveKey(id: string) {
    if (!keys[id]) return
    await fetch('/api/gtm/connectors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key_name: id, key_value: keys[id] }) })
    setConnected(c => ({ ...c, [id]: true }))
    setSaved(s => ({ ...s, [id]: true }))
    setEditing(e => ({ ...e, [id]: false }))
    setTimeout(() => setSaved(s => ({ ...s, [id]: false })), 2000)
  }

  async function removeKey(id: string) {
    await fetch('/api/gtm/connectors', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key_name: id }) })
    setConnected(c => ({ ...c, [id]: false }))
    setKeys(k => ({ ...k, [id]: '' }))
  }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/gtm" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <Link href="/gtm" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>← GTM</Link>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: s.orange, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>GTM Connectors</div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Connect your tools</h1>
          <p style={{ fontSize: 14, color: s.muted }}>Bring your existing stack. Connect whatever you have — Wyber adapts to it. Keys are encrypted and never shared.</p>
        </div>

        {CONNECTORS.map(group => (
          <div key={group.group} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>{group.group}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.items.map(item => {
                const isConnected = connected[item.id]
                const isEditing = editing[item.id]
                return (
                  <div key={item.id} style={{ background: s.card, border: `1px solid ${isConnected ? item.color + '30' : s.border}`, borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isEditing ? 12 : 0 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 8, background: item.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: s.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {item.label}
                          {isConnected && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: s.green + '15', border: `1px solid ${s.green}30`, color: s.green, fontWeight: 700 }}>Connected</span>}
                        </div>
                        <div style={{ fontSize: 12, color: s.muted }}>{item.desc}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {!isConnected && item.referral && (
                          <a href={item.referral} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 11px', borderRadius: 7, background: item.color + '15', border: `1px solid ${item.color}30`, color: item.color, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>{item.referralLabel}</a>
                        )}
                        {isConnected
                          ? <button onClick={() => removeKey(item.id)} style={{ padding: '6px 12px', borderRadius: 7, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                          : <button onClick={() => setEditing(e => ({ ...e, [item.id]: !e[item.id] }))} style={{ padding: '6px 12px', borderRadius: 7, background: s.bg, border: `1px solid ${s.border}`, color: s.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Connect</button>
                        }
                      </div>
                    </div>
                    {isEditing && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="password"
                          placeholder={`Paste your ${item.label} API key`}
                          value={keys[item.id] || ''}
                          onChange={e => setKeys(k => ({ ...k, [item.id]: e.target.value }))}
                          style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 7, padding: '8px 12px', fontSize: 13, color: s.text, fontFamily: 'inherit', outline: 'none' }}
                        />
                        <button onClick={() => saveKey(item.id)} style={{ padding: '8px 16px', borderRadius: 7, background: item.color, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
                          {saved[item.id] ? '✓ Saved' : 'Save'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap'); input{color-scheme:dark;}`}</style>
    </div>
  )
}
