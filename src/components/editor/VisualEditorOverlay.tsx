'use client'
import { useEffect, useState } from 'react'

interface ClickedElement {
  tag: string
  className: string
  text: string
  element: string
}

interface Props {
  onEdit: (prompt: string) => void
  isGenerating: boolean
}

export function VisualEditorOverlay({ onEdit, isGenerating }: Props) {
  const [clicked, setClicked] = useState<ClickedElement | null>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || e.data.type !== 'wyber-click') return
      setClicked(e.data)
      setPos({ x: 12, y: 12 })
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const send = (prompt: string) => {
    setClicked(null)
    onEdit(prompt)
  }

  if (!clicked || isGenerating) return null

  const el = clicked.text ? `"${clicked.text.slice(0, 30)}"` : clicked.tag

  return (
    <div style={{
      position: 'absolute', bottom: pos.y + 48, left: pos.x, zIndex: 50,
      background: '#111118', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 12, padding: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)', width: 240, animation: 'fadeIn 0.15s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: '#52526a', fontFamily: 'monospace' }}>
          {clicked.tag}{clicked.className ? `.${clicked.className.split(' ')[0]}` : ''}
        </span>
        <button onClick={() => setClicked(null)}
          style={{ background: 'none', border: 'none', color: '#52526a', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[
          { label: '✏️ Edit text', prompt: `Change the text of ${el} to ` },
          { label: '🎨 Change color', prompt: `Change the color of ${el} to ` },
          { label: '📐 Adjust size', prompt: `Make ${el} larger` },
          { label: '🗑️ Remove it', prompt: `Remove the ${el} element from the UI` },
          { label: '✨ Make it pop', prompt: `Make ${el} more visually prominent and eye-catching` },
        ].map(({ label, prompt }) => (
          <button key={label} onClick={() => send(prompt)}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 7, padding: '7px 10px', color: '#c4c4d4', fontSize: 12,
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {label}
          </button>
        ))}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
