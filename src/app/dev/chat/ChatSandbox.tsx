'use client'
import { useEffect, useState } from 'react'
import { useEditorStore, type ChatMessage } from '@/store/editor'
import { ChatPanel } from '@/components/editor/ChatPanel'

const now = Date.now()
const SEED: ChatMessage[] = [
  { id: 'u1', role: 'user', content: 'Build an invoice tracker for my shop with a dashboard and reminders', timestamp: now - 600000, status: 'done' },
  { id: 'a1', role: 'assistant', content: 'Built it. Dashboard, invoices, customers and follow-ups are in place.\n\nI added a payments table and a reminder list. Tell me what to change next.', timestamp: now - 590000, status: 'done', filesChanged: ['src/App.tsx', 'src/pages/Invoices.tsx', 'src/pages/Customers.tsx'] },
  { id: 'u2', role: 'user', content: 'Make overdue invoices red and add a button to send a WhatsApp reminder', timestamp: now - 300000, status: 'done' },
  { id: 'a2', role: 'assistant', content: 'Something went wrong while editing Invoices.tsx.', timestamp: now - 290000, status: 'error', retryPrompt: 'Make overdue invoices red and add a button to send a WhatsApp reminder', retryLane: 'build' },
  { id: 'u3', role: 'user', content: 'Try again but keep the layout', timestamp: now - 100000, status: 'done' },
  { id: 'a3', role: 'assistant', content: 'Done. Overdue rows are now red and each row has a Send reminder button.', timestamp: now - 90000, status: 'done', filesChanged: ['src/pages/Invoices.tsx'] },
]

/** Fake data only. ?state=generating|nocredits|empty and ?w=full (phone width) change what the panel shows. */
export function ChatSandbox() {
  const [state, setState] = useState('')
  const [w, setW] = useState('')
  useEffect(() => {
    const q = new URLSearchParams(location.search)
    const s = q.get('state') || ''
    setState(s); setW(q.get('w') || '')
    ;(window as unknown as { __store: typeof useEditorStore }).__store = useEditorStore // sandbox-only, for manual testing
    const st = useEditorStore.getState()
    st.setMessages(s === 'empty' ? [] : SEED)
    st.setCredits(s === 'nocredits' ? 0 : 100)
    st.setIsGenerating(s === 'generating')
    if (s === 'generating') {
      st.addMessage({ id: 'a4', role: 'assistant', content: 'Adding the reminder button and wiring it to WhatsApp…', timestamp: Date.now(), status: 'streaming' })
    }
  }, [])
  return (
    <div style={{ height: '100dvh', display: 'flex', background: '#05080d', color: '#e8eef7' }}>
      <div style={{ width: w === 'full' ? '100%' : 380, borderRight: '1px solid #1b2a3b', display: 'flex', flexDirection: 'column', minWidth: 0 }} data-sandbox-state={state}>
        <ChatPanel projectId="sandbox" userId="sandbox" projectType="web" />
      </div>
      {w !== 'full' && <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: '#8797ab', fontSize: 14 }}>Preview area (sandbox)</div>}
    </div>
  )
}
