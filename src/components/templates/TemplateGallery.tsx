'use client'
import { useState, useEffect } from 'react'
import { EXTENDED_GALLERY, ALL_CATEGORIES } from '@/lib/templates/gallery'
import { getPrebuilt } from '@/lib/templates/prebuilt'
import { SLOT_FILLS, getNearestSkeleton } from '@/lib/templates/slot-fill'
import { useEditorStore } from '@/store/editor'
import { STARTER_TEMPLATES } from '@/lib/starter-templates'
import * as Icons from 'lucide-react'

interface Props { onClose?: () => void }

function TemplateIcon({ name, size = 16, color = 'currentColor' }: { name: string; size?: number; color?: string }) {
  const IC = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>>)[name]
  if (!IC) { const F = Icons.Layout; return <F size={size} color={color} strokeWidth={1.5} /> }
  return <IC size={size} color={color} strokeWidth={1.5} />
}

const CAT_COLORS: Record<string, { bg: string; icon: string; border: string }> = {
  'SaaS':          { bg: 'rgba(14,165,233,0.1)',  icon: '#0EA5E9', border: 'rgba(14,165,233,0.2)' },
  'Healthcare':    { bg: 'rgba(16,185,129,0.1)',  icon: '#10b981', border: 'rgba(16,185,129,0.2)' },
  'Fintech':       { bg: 'rgba(16,185,129,0.1)',  icon: '#10b981', border: 'rgba(16,185,129,0.2)' },
  'Finance':       { bg: 'rgba(16,185,129,0.1)',  icon: '#10b981', border: 'rgba(16,185,129,0.2)' },
  'Education':     { bg: 'rgba(245,158,11,0.1)',  icon: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  'Marketing':     { bg: 'rgba(239,68,68,0.1)',   icon: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  'HR':            { bg: 'rgba(139,92,246,0.1)',  icon: '#8b5cf6', border: 'rgba(139,92,246,0.2)' },
  'Real Estate':   { bg: 'rgba(245,158,11,0.1)',  icon: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  'Legal':         { bg: 'rgba(100,116,139,0.1)', icon: '#94a3b8', border: 'rgba(100,116,139,0.2)' },
  'Logistics':     { bg: 'rgba(249,115,22,0.1)',  icon: '#f97316', border: 'rgba(249,115,22,0.2)' },
  'Hospitality':   { bg: 'rgba(236,72,153,0.1)',  icon: '#ec4899', border: 'rgba(236,72,153,0.2)' },
  'Manufacturing': { bg: 'rgba(100,116,139,0.1)', icon: '#64748b', border: 'rgba(100,116,139,0.2)' },
  'Retail':        { bg: 'rgba(14,165,233,0.1)',  icon: '#0EA5E9', border: 'rgba(14,165,233,0.2)' },
  'Government':    { bg: 'rgba(100,116,139,0.1)', icon: '#64748b', border: 'rgba(100,116,139,0.2)' },
  'Security':      { bg: 'rgba(239,68,68,0.1)',   icon: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  'DevOps':        { bg: 'rgba(14,165,233,0.1)',  icon: '#0EA5E9', border: 'rgba(14,165,233,0.2)' },
  'Sports':        { bg: 'rgba(16,185,129,0.1)',  icon: '#10b981', border: 'rgba(16,185,129,0.2)' },
  'E-commerce':    { bg: 'rgba(249,115,22,0.1)',  icon: '#f97316', border: 'rgba(249,115,22,0.2)' },
  'Productivity':  { bg: 'rgba(14,165,233,0.1)',  icon: '#0EA5E9', border: 'rgba(14,165,233,0.2)' },
  'Dev Tools':     { bg: 'rgba(100,116,139,0.1)', icon: '#94a3b8', border: 'rgba(100,116,139,0.2)' },
  'Business':      { bg: 'rgba(14,165,233,0.1)',  icon: '#0EA5E9', border: 'rgba(14,165,233,0.2)' },
  'Communication': { bg: 'rgba(139,92,246,0.1)',  icon: '#8b5cf6', border: 'rgba(139,92,246,0.2)' },
  'Health':        { bg: 'rgba(16,185,129,0.1)',  icon: '#10b981', border: 'rgba(16,185,129,0.2)' },
  'Personal':      { bg: 'rgba(245,158,11,0.1)',  icon: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  'Games':         { bg: 'rgba(139,92,246,0.1)',  icon: '#8b5cf6', border: 'rgba(139,92,246,0.2)' },
}
const DEFAULT_COLOR = { bg: 'rgba(14,165,233,0.1)', icon: '#0EA5E9', border: 'rgba(14,165,233,0.2)' }

export function TemplateGallery({ onClose }: Props) {
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [loadingPhase, setLoadingPhase] = useState<'instant' | 'customizing'>('instant')

  const {
    setFiles, setFramework, addMessage, updateMessage,
    setIsGenerating, setHasGeneratedFiles,
    appendStreamingContent, clearStreamingContent,
  } = useEditorStore()

  const filtered = EXTENDED_GALLERY.filter(t => {
    const matchCat = category === 'All' || t.category === category
    const matchSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const useTemplate = async (template: typeof EXTENDED_GALLERY[0]) => {
    if (loading) return
    setLoading(template.name)
    setLoadingPhase('instant')

    const fw = template.framework as 'react-vite' | 'vue' | 'vanilla' | 'next'
    setFramework(fw)
    onClose?.()

    // ── PHASE 1: Load skeleton instantly (< 1 second) ──────────
    const slotFill = SLOT_FILLS[template.id]
    const skeletonKey = slotFill?.skeleton ?? getNearestSkeleton(template.id, template.category)
    const prebuilt = getPrebuilt(skeletonKey) ?? getPrebuilt(template.id)

    const starters = STARTER_TEMPLATES[fw]
    const baseFiles: Record<string, { path: string; content: string; language: string }> = { ...starters }

    if (prebuilt) {
      for (const [path, code] of Object.entries(prebuilt)) {
        const ext = path.split('.').pop() ?? ''
        const langMap: Record<string, string> = { ts: 'typescript', tsx: 'typescript', js: 'javascript', css: 'css', html: 'html', json: 'json' }
        baseFiles[path] = { path, content: code, language: langMap[ext] ?? 'plaintext' }
      }
    }

    setFiles(baseFiles)
    setHasGeneratedFiles(true)

    const msgId = Date.now().toString()
    addMessage({ id: msgId, role: 'user', content: `Use template: ${template.name}`, timestamp: Date.now(), status: 'done' })
    const aId = (Date.now() + 1).toString()
    addMessage({ id: aId, role: 'assistant', content: `⚡ ${template.name} loaded instantly. Customizing for ${template.category}...`, timestamp: Date.now(), status: 'streaming' })

    // ── PHASE 2: Customize domain-specific content (~10s) ──────
    if (slotFill) {
      setLoadingPhase('customizing')
      setIsGenerating(true)
      clearStreamingContent()

      try {
        const res = await fetch('/api/customize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: baseFiles,
            customPrompt: slotFill.customPrompt,
            accent: slotFill.accent,
            appName: slotFill.appName,
          }),
        })

        if (!res.body) throw new Error('No stream')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let raw = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          raw += chunk
          appendStreamingContent(chunk)
        }

        // Parse and merge only the changed files
        const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g
        let match
        const updated = { ...baseFiles }
        let changedCount = 0

        while ((match = fileRegex.exec(raw)) !== null) {
          const [, path, content] = match
          const trimmed = content.replace(/^\n/, '').replace(/\n$/, '')
          if (trimmed.length > 30) {
            const ext = path.split('.').pop() ?? ''
            const langMap: Record<string, string> = { ts: 'typescript', tsx: 'typescript', js: 'javascript', css: 'css', html: 'html' }
            updated[path] = { path, content: trimmed, language: langMap[ext] ?? 'plaintext' }
            changedCount++
          }
        }

        if (changedCount > 0) {
          setFiles(updated)
          setHasGeneratedFiles(true)
        }

        updateMessage(aId, {
          content: `✓ ${template.name} ready — ${changedCount > 0 ? `customized ${changedCount} files for ${template.category}` : 'loaded from template'}. Start editing to make it yours.`,
          status: 'done',
          filesChanged: Object.keys(updated),
        })

      } catch (err) {
        updateMessage(aId, {
          content: `✓ ${template.name} loaded. Customize it by typing what to change.`,
          status: 'done',
        })
      }

      setIsGenerating(false)
      clearStreamingContent()
    } else {
      // No slot-fill config — just the skeleton, still instant
      updateMessage(aId, {
        content: `✓ ${template.name} loaded. Customize it by typing what to change.`,
        status: 'done',
      })
    }

    setLoading(null)
  }

  const colors = (cat?: string) => CAT_COLORS[cat ?? ''] ?? DEFAULT_COLOR

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>

      {/* Search */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--ide-border)', flexShrink: 0 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search 80+ templates..."
          style={{ width: '100%', padding: '6px 10px', borderRadius: 7, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
        />
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 5, padding: '6px 10px', borderBottom: '1px solid var(--ide-border)', overflowX: 'auto', flexShrink: 0 }}>
        {['All', ...ALL_CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            style={{ padding: '3px 9px', borderRadius: 20, border: `1px solid ${category === cat ? '#0EA5E9' : 'var(--ide-border)'}`, background: category === cat ? 'rgba(14,165,233,0.1)' : 'transparent', color: category === cat ? '#0EA5E9' : 'var(--text-secondary)', fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Count + instant badge */}
      <div style={{ padding: '5px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>{filtered.length} templates</span>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', letterSpacing: '0.04em' }}>⚡ INSTANT LOAD</span>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 10px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {filtered.map(t => {
            const c = colors(t.category)
            const isLoading = loading === t.name
            const hasSlotFill = !!SLOT_FILLS[t.id]
            const hasPrebuilt = !!getPrebuilt(t.id) || !!getPrebuilt(SLOT_FILLS[t.id]?.skeleton)

            return (
              <button key={t.id} onClick={() => useTemplate(t)} disabled={!!loading}
                style={{
                  textAlign: 'left', padding: '11px 10px', borderRadius: 10,
                  border: `1px solid ${isLoading ? '#0EA5E9' : 'var(--ide-border)'}`,
                  background: isLoading ? 'rgba(14,165,233,0.05)' : 'var(--bg-surface)',
                  cursor: loading ? 'wait' : 'pointer', transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', gap: 7,
                  opacity: loading && !isLoading ? 0.45 : 1,
                }}
                onMouseEnter={e => { if (!loading) { const el = e.currentTarget as HTMLElement; el.style.borderColor = c.icon; el.style.background = 'var(--bg-elevated)'; el.style.transform = 'translateY(-1px)' } }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = isLoading ? '#0EA5E9' : 'var(--ide-border)'; el.style.background = isLoading ? 'rgba(14,165,233,0.05)' : 'var(--bg-surface)'; el.style.transform = 'none' }}
              >
                {/* Icon row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isLoading
                      ? <div style={{ width: 13, height: 13, border: `2px solid ${c.icon}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      : <TemplateIcon name={t.icon ?? 'Layout'} size={15} color={c.icon} />
                    }
                  </div>
                  {/* Speed badge */}
                  <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: hasPrebuilt ? 'rgba(34,197,94,0.1)' : 'rgba(14,165,233,0.1)', color: hasPrebuilt ? '#22c55e' : '#0EA5E9', border: `1px solid ${hasPrebuilt ? 'rgba(34,197,94,0.2)' : 'rgba(14,165,233,0.2)'}`, letterSpacing: '0.03em' }}>
                    {isLoading ? (loadingPhase === 'instant' ? 'LOADING' : 'STYLING') : hasPrebuilt ? '< 1s' : '~15s'}
                  </span>
                </div>

                {/* Text */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 2, lineHeight: 1.2 }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.description}</div>
                </div>

                {/* Category */}
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: c.bg, color: c.icon, border: `1px solid ${c.border}`, textTransform: 'uppercase', letterSpacing: '0.04em', alignSelf: 'flex-start' }}>
                  {t.category}
                </span>
              </button>
            )
          })}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 12 }}>
            No templates match "{search}"
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
