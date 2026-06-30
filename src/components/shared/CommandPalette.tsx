'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface CommandItem {
  id: string
  label: string
  desc?: string
  icon: string
  action: () => void
  category: string
  keywords?: string[]
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const nav = useCallback((path: string) => { setOpen(false); router.push(path) }, [router])

  const items: CommandItem[] = [
    // Build
    { id: 'new-web', label: 'New web app', desc: 'Start building a React app', icon: '🌐', category: 'Build', action: () => nav('/dashboard?new=app'), keywords: ['create', 'webapp', 'react'] },
    { id: 'new-mobile', label: 'New mobile app', desc: 'React Native + Expo', icon: '📱', category: 'Build', action: () => nav('/dashboard?new=mobile'), keywords: ['ios', 'android', 'expo'] },
    // Navigate
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', category: 'Navigate', action: () => nav('/dashboard') },
    { id: 'settings', label: 'Settings', icon: '⚙️', category: 'Navigate', action: () => nav('/settings') },
    { id: 'employees', label: 'AI Employees', desc: 'Coming soon', icon: '🤖', category: 'Navigate', action: () => nav('/coming-soon?product=AI+Employees') },
    { id: 'workflows', label: 'Workflows', desc: 'Coming soon', icon: '🔀', category: 'Navigate', action: () => nav('/coming-soon?product=Workflows') },
    { id: 'pricing', label: 'Pricing', icon: '💳', category: 'Navigate', action: () => nav('/pricing') },
    { id: 'community', label: 'Community', icon: '🌍', category: 'Navigate', action: () => nav('/community') },
    { id: 'changelog', label: 'Changelog', icon: '📋', category: 'Navigate', action: () => nav('/changelog') },

    // Quick actions
    { id: 'connectors', label: 'Connect tools', desc: 'Supabase, Stripe, GitHub...', icon: '🔗', category: 'Quick actions', action: () => nav('/connectors'), keywords: ['integration', 'supabase', 'stripe'] },
    { id: 'deploy', label: 'Deploy to Vercel', icon: '🚀', category: 'Quick actions', action: () => nav('/dashboard'), keywords: ['publish', 'ship', 'live'] },
    { id: 'github', label: 'Push to GitHub', icon: '🐙', category: 'Quick actions', action: () => nav('/settings'), keywords: ['git', 'repo', 'code'] },
    { id: 'support', label: 'Contact support', icon: '💬', category: 'Quick actions', action: () => nav('/contact') },
    { id: 'referral', label: 'Refer a friend', desc: 'Earn free credits', icon: '🎁', category: 'Quick actions', action: () => nav('/settings?tab=referral'), keywords: ['invite', 'share'] },
  ]

  const filtered = query.trim()
    ? items.filter(item => {
        const q = query.toLowerCase()
        return item.label.toLowerCase().includes(q)
          || item.desc?.toLowerCase().includes(q)
          || item.category.toLowerCase().includes(q)
          || item.keywords?.some(k => k.includes(q))
      })
    : items

  useEffect(() => { setSelected(0) }, [query])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
        setQuery('')
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && filtered[selected]) { filtered[selected].action() }
  }

  if (!open) return null

  const categories = [...new Set(filtered.map(i => i.category))]

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 'clamp(80px, 15vh, 160px)',
        animation: 'cmdFadeIn 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          background: '#111115', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          animation: 'cmdSlideIn 0.2s ease',
        }}
      >
        {/* Search input */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, pages, templates..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#fafafa', fontSize: 15, fontFamily: 'var(--font-display)',
            }}
          />
          <kbd style={{
            fontSize: 10, color: '#52525b', background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5,
            padding: '2px 6px', fontFamily: 'monospace',
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '8px 0' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: '#3f3f46', fontSize: 13 }}>
              No results for "{query}"
            </div>
          )}
          {categories.map(cat => {
            const catItems = filtered.filter(i => i.category === cat)
            return (
              <div key={cat}>
                <div style={{ padding: '8px 20px 4px', fontSize: 10, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {cat}
                </div>
                {catItems.map(item => {
                  const idx = filtered.indexOf(item)
                  const isSelected = idx === selected
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelected(idx)}
                      style={{
                        width: '100%', padding: '10px 20px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: isSelected ? 'rgba(14,165,233,0.08)' : 'transparent',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                        fontFamily: 'var(--font-display)',
                        transition: 'background 0.1s',
                      }}
                    >
                      <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? '#0EA5E9' : '#e4e4e7' }}>{item.label}</div>
                        {item.desc && <div style={{ fontSize: 11, color: '#52525b', marginTop: 1 }}>{item.desc}</div>}
                      </div>
                      {isSelected && (
                        <span style={{ fontSize: 10, color: '#3f3f46', fontFamily: 'monospace' }}>Enter ↵</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 11, color: '#3f3f46',
        }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>⌘</kbd>
            <kbd style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>K</kbd>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cmdFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cmdSlideIn { from { opacity: 0; transform: scale(0.98) translateY(-8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  )
}
