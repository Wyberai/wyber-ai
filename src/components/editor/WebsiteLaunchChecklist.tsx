'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useEditorStore } from '@/store/editor'
import { websiteLaunchEstimate, WEBSITE_LAUNCH_PHOTOS } from '@/lib/credits'
import { track } from '@/lib/track'

// "Launch your website" — pinned above the chat on Website projects. Walks
// the user through what a complete site needs (and what /websites charged
// for upfront): build → professional photos → SEO + AI-search pass →
// publish → own domain. Each step opens the real feature; progress is read
// from the site itself (its files and publish status), not from what was
// clicked, so a step only ticks when the site actually has it.

type Status = { is_public: boolean; custom_domain: string | null; custom_domain_verified: boolean }

const GENERATED_IMG = /\/storage\/v1\/object\/public\/generated-images\/[^"')\s]+/g
const openTab = (tab: string) => window.dispatchEvent(new CustomEvent('wyber-open-panel-tab', { detail: tab }))
const openPublish = () => window.dispatchEvent(new Event('wyber-open-publish'))

export function WebsiteLaunchChecklist({ projectId }: { projectId: string }) {
  const files = useEditorStore(s => s.files)
  const [status, setStatus] = useState<Status | null>(null)
  const [open, setOpen] = useState(true)
  const est = useMemo(() => websiteLaunchEstimate(), [])
  const credits = (key: string) => est.steps.find(s => s.key === key)?.credits

  // Collapsed/expanded is remembered per project.
  const KEY = `wyber-launch-checklist:${projectId}`
  useEffect(() => { try { if (localStorage.getItem(KEY) === 'closed') setOpen(false) } catch { /* */ } }, [KEY])
  const toggle = () => { setOpen(o => { try { localStorage.setItem(KEY, o ? 'closed' : 'open') } catch { /* */ } return !o }) }

  const loadStatus = useCallback(async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const { data } = await createClient().from('projects').select('is_public, custom_domain, custom_domain_verified').eq('id', projectId).single()
      if (data) setStatus({ is_public: !!data.is_public, custom_domain: data.custom_domain ?? null, custom_domain_verified: !!data.custom_domain_verified })
    } catch { /* keep last */ }
  }, [projectId])

  useEffect(() => {
    loadStatus()
    const onPublished = () => setTimeout(loadStatus, 1500)
    window.addEventListener('wyber-published', onPublished)
    window.addEventListener('focus', loadStatus)
    return () => { window.removeEventListener('wyber-published', onPublished); window.removeEventListener('focus', loadStatus) }
  }, [loadStatus])

  const derived = useMemo(() => {
    const all = Object.values(files ?? {}).map(f => f?.content ?? '').join('\n')
    const photos = new Set(all.match(GENERATED_IMG) ?? []).size
    const html = files?.['index.html']?.content ?? ''
    const has = (p: string) => Object.keys(files ?? {}).some(k => k === p || k.endsWith(`/${p}`))
    const seoReady = /name=["']description["']/i.test(html) && /application\/ld\+json/i.test(html) && has('llms.txt')
    const built = Object.keys(files ?? {}).length >= 3
    return { photos, seoReady, built }
  }, [files])

  const steps = [
    { key: 'build', title: 'Build your website', done: derived.built, detail: 'Your pages, menu or services, WhatsApp and contact.', action: null as null | { label: string; run: () => void } },
    {
      key: 'photos', title: `Add ${WEBSITE_LAUNCH_PHOTOS} professional photos`, done: derived.photos >= WEBSITE_LAUNCH_PHOTOS,
      detail: `${Math.min(derived.photos, WEBSITE_LAUNCH_PHOTOS)}/${WEBSITE_LAUNCH_PHOTOS} on your site · use “Hero quality” in Images · ${credits('photos')! / WEBSITE_LAUNCH_PHOTOS} credits each`,
      action: { label: 'Open Images', run: () => openTab('images') },
    },
    {
      key: 'seo', title: 'Make it readable by Google and AI', done: derived.seoReady,
      detail: `SEO + AI-search pass: 18 checks with auto-fixes, incl. llms.txt · ${credits('seo')} credits`,
      action: { label: 'Run the pass', run: () => openTab('seo') },
    },
    {
      key: 'publish', title: 'Publish it', done: !!status?.is_public,
      detail: 'Free. Published websites get an AI-readable copy of every page.',
      action: { label: status?.is_public ? 'Republish' : 'Publish', run: openPublish },
    },
    {
      key: 'domain', title: 'Put it on your own domain', done: !!status?.custom_domain_verified,
      detail: status?.custom_domain && !status.custom_domain_verified ? `${status.custom_domain} — waiting for DNS` : 'Connect a domain you own (any paid plan) · then add the link to your Instagram bio',
      action: { label: 'Connect domain', run: openPublish },
    },
  ]
  const doneCount = steps.filter(s => s.done).length
  const next = steps.find(s => !s.done)

  return (
    <div style={wrap}>
      <button onClick={toggle} style={headBtn} aria-expanded={open}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ide-text)' }}>Launch your website</span>
        <span style={{ fontSize: 11, color: doneCount === steps.length ? '#22c55e' : 'var(--ide-text3)', marginLeft: 'auto' }}>{doneCount}/{steps.length}</span>
        <span style={{ fontSize: 11, color: 'var(--ide-text3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▾</span>
      </button>
      <div style={{ height: 3, borderRadius: 3, background: 'var(--ide-border)', overflow: 'hidden', margin: '0 12px' }}>
        <div style={{ width: `${(doneCount / steps.length) * 100}%`, height: '100%', background: '#0EA5E9', transition: 'width .3s' }} />
      </div>
      {open && (
        <ol style={{ listStyle: 'none', margin: 0, padding: '8px 12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {steps.map(s => {
            const isNext = s === next
            return (
              <li key={s.key} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', opacity: s.done ? 0.62 : 1 }}>
                <span aria-hidden style={{ flexShrink: 0, width: 16, height: 16, marginTop: 1, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', background: s.done ? '#22c55e' : 'transparent', border: s.done ? 'none' : `1.5px solid ${isNext ? '#0EA5E9' : 'var(--ide-border)'}` }}>{s.done ? '✓' : ''}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ide-text)', textDecoration: s.done ? 'line-through' : 'none' }}>{s.title}</div>
                  {!s.done && <div style={{ fontSize: 11, color: 'var(--ide-text3)', lineHeight: 1.45, marginTop: 1 }}>{s.detail}</div>}
                </div>
                {s.action && !s.done && (
                  <button
                    onClick={() => { track('launch_checklist_action', { step: s.key, projectId }); s.action!.run() }}
                    style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, borderRadius: 7, padding: '4px 9px', cursor: 'pointer', fontFamily: 'inherit', border: isNext ? 'none' : '1px solid var(--ide-border)', background: isNext ? '#0EA5E9' : 'transparent', color: isNext ? '#fff' : 'var(--ide-text2)' }}
                  >
                    {s.action.label}
                  </button>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

const wrap: React.CSSProperties = { margin: '8px 12px 0', borderRadius: 10, border: '1px solid var(--ide-border)', background: 'var(--bg-elevated, rgba(255,255,255,0.02))' }
const headBtn: React.CSSProperties = { width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: '9px 12px 7px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }
