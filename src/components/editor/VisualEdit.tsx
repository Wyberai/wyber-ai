'use client'
import { useState, useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editor'

// Visual Edit overlay - shows element inspector on hover in preview iframe
// User clicks an element → Claude edits exactly that element

interface ElementInfo {
  tag: string
  text: string
  classes: string
  styles: Record<string, string>
  x: number
  y: number
  width: number
  height: number
  path: string
}

export function VisualEdit({ iframeRef, enabled, onDisable }: {
  iframeRef: React.RefObject<HTMLIFrameElement>
  enabled: boolean
  onDisable: () => void
}) {
  const [hover, setHover] = useState<ElementInfo | null>(null)
  const [selected, setSelected] = useState<ElementInfo | null>(null)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { files, setFiles, setHasGeneratedFiles, addMessage, updateMessage, setIsGenerating } = useEditorStore()

  useEffect(() => {
    if (!enabled) { setHover(null); setSelected(null); setPrompt(''); return }

    const iframe = iframeRef.current
    if (!iframe?.contentDocument) return

    const doc = iframe.contentDocument

    // Inject highlight styles into iframe
    const style = doc.createElement('style')
    style.id = 'wyber-visual-edit'
    style.textContent = `
      [data-wyber-hover] { outline: 2px solid #0EA5E9 !important; outline-offset: 2px !important; cursor: crosshair !important; }
      [data-wyber-selected] { outline: 2px solid #0EA5E9 !important; outline-offset: 2px !important; background: rgba(14,165,233,0.05) !important; }
    `
    doc.head.appendChild(style)

    let hoveredEl: Element | null = null

    const onMouseMove = (e: MouseEvent) => {
      const el = e.target as Element
      if (el === hoveredEl) return
      if (hoveredEl) hoveredEl.removeAttribute('data-wyber-hover')
      hoveredEl = el
      el.setAttribute('data-wyber-hover', '1')

      const rect = el.getBoundingClientRect()
      const iRect = iframe.getBoundingClientRect()

      setHover({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim().slice(0, 60) || '',
        classes: el.className?.toString() || '',
        styles: {},
        x: iRect.left + rect.left,
        y: iRect.top + rect.top,
        width: rect.width,
        height: rect.height,
        path: getPath(el),
      })
    }

    const onClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const el = e.target as Element
      const rect = el.getBoundingClientRect()
      const iRect = iframe.getBoundingClientRect()

      // Get computed styles for context
      const cs = window.getComputedStyle(el)
      const styles: Record<string, string> = {
        color: cs.color,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        background: cs.backgroundColor,
        padding: cs.padding,
        margin: cs.margin,
        borderRadius: cs.borderRadius,
      }

      const info: ElementInfo = {
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim().slice(0, 100) || '',
        classes: el.className?.toString() || '',
        styles,
        x: iRect.left + rect.left,
        y: iRect.top + rect.top,
        width: rect.width,
        height: rect.height,
        path: getPath(el),
      }

      setSelected(info)
      setTimeout(() => inputRef.current?.focus(), 100)
    }

    doc.addEventListener('mousemove', onMouseMove)
    doc.addEventListener('click', onClick, true)

    return () => {
      doc.removeEventListener('mousemove', onMouseMove)
      doc.removeEventListener('click', onClick, true)
      doc.getElementById('wyber-visual-edit')?.remove()
      hoveredEl?.removeAttribute('data-wyber-hover')
    }
  }, [enabled, iframeRef])

  const applyEdit = async () => {
    if (!selected || !prompt.trim() || loading) return
    setLoading(true)

    const editPrompt = `Make this specific change to the ${selected.tag} element:
Element: <${selected.tag}> containing "${selected.text}"
CSS path: ${selected.path}
Current styles: ${JSON.stringify(selected.styles)}

Change requested: ${prompt}

IMPORTANT: Only modify the specific element described. Keep everything else identical. Output only the files that contain this element.`

    const aId = Math.random().toString(36).slice(2)
    addMessage({ id: aId, role: 'assistant', content: `✏️ Editing ${selected.tag} element...`, timestamp: 0, status: 'streaming' })
    setIsGenerating(true)

    try {
      const fileContext = Object.entries(files)
        .filter(([, f]) => f.content && f.content.length > 30)
        .map(([, f]) => `<file path="${f.path}">\n${f.content?.slice(0, 2000)}\n</file>`)
        .join('\n\n')

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: editPrompt, fileContext, modelTier: 'fast', history: [] }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let raw = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        raw += decoder.decode(value, { stream: true })
      }

      const { parseGenerationOutput } = await import('@/lib/file-parser')
      const { files: edited } = parseGenerationOutput(raw)

      if (edited.length > 0) {
        const updated = { ...files }
        for (const { path, content } of edited) {
          const ext = path.split('.').pop() ?? ''
          const lang: Record<string, string> = { tsx: 'typescript', ts: 'typescript', css: 'css', js: 'javascript' }
          updated[path] = { path, content, language: lang[ext] ?? 'plaintext' }
        }
        setFiles(updated)
        setHasGeneratedFiles(true)
        updateMessage(aId, { content: `✓ ${selected.tag} updated — "${prompt}"`, status: 'done', filesChanged: edited.map(f => f.path) })
      } else {
        updateMessage(aId, { content: 'Could not apply the edit. Try being more specific.', status: 'error' })
      }
    } catch (err) {
      updateMessage(aId, { content: `Edit failed: ${String(err)}`, status: 'error' })
    }

    setIsGenerating(false)
    setLoading(false)
    setSelected(null)
    setPrompt('')
  }

  if (!enabled) return null

  return (
    <>
      {/* Crosshair cursor indicator */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'crosshair', zIndex: 10, pointerEvents: 'none' }} />

      {/* Visual edit toolbar */}
      <div style={{
        position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 8, zIndex: 20,
        background: 'rgba(14,165,233,0.95)', backdropFilter: 'blur(12px)',
        padding: '6px 12px', borderRadius: 20,
        fontSize: 11, fontWeight: 600, color: '#fff',
        boxShadow: '0 4px 20px rgba(14,165,233,0.4)',
        fontFamily: 'var(--font-display)',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        Click any element to edit it
        <button onClick={onDisable} style={{ marginLeft: 4, background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', borderRadius: 9999, width: 18, height: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>×</button>
      </div>

      {/* Element tooltip on hover */}
      {hover && !selected && (
        <div style={{
          position: 'fixed', left: hover.x, top: hover.y - 28,
          background: '#0EA5E9', color: '#fff', padding: '2px 8px',
          borderRadius: 5, fontSize: 10, fontWeight: 700,
          pointerEvents: 'none', zIndex: 9999,
          fontFamily: 'var(--font-display)',
          whiteSpace: 'nowrap',
        }}>
          &lt;{hover.tag}&gt; {hover.text ? `"${hover.text.slice(0, 30)}"` : ''}
        </div>
      )}

      {/* Edit prompt when element is selected */}
      {selected && (
        <div style={{
          position: 'fixed',
          left: Math.min(selected.x, window.innerWidth - 340),
          top: selected.y + selected.height + 8,
          zIndex: 9999,
          background: '#111113',
          border: '1px solid #0EA5E9',
          borderRadius: 12,
          padding: 12,
          width: 320,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          fontFamily: 'var(--font-display)',
        }}>
          <div style={{ fontSize: 11, color: '#0EA5E9', fontWeight: 700, marginBottom: 8 }}>
            ✏️ Edit &lt;{selected.tag}&gt; {selected.text ? `"${selected.text.slice(0, 30)}"` : ''}
          </div>
          <input
            ref={inputRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyEdit(); if (e.key === 'Escape') { setSelected(null); setPrompt('') } }}
            placeholder={`e.g. "make it larger", "change to red", "bold text"`}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#18181b', color: '#fafafa', fontSize: 12,
              outline: 'none', fontFamily: 'inherit', marginBottom: 8,
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={applyEdit} disabled={!prompt.trim() || loading}
              style={{ flex: 1, padding: '7px', borderRadius: 7, border: 'none', background: prompt.trim() && !loading ? '#0EA5E9' : '#27272a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Applying...' : 'Apply ↵'}
            </button>
            <button onClick={() => { setSelected(null); setPrompt('') }}
              style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#a1a1aa', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function getPath(el: Element): string {
  const parts: string[] = []
  let current: Element | null = el
  while (current && parts.length < 4) {
    const tag = current.tagName.toLowerCase()
    const id = current.id ? `#${current.id}` : ''
    const cls = current.className ? `.${String(current.className).split(' ')[0]}` : ''
    parts.unshift(`${tag}${id || cls}`)
    current = current.parentElement
  }
  return parts.join(' > ')
}
