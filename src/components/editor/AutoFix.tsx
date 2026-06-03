'use client'
import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editor'

/**
 * AutoFix — listens for errors from preview iframe via postMessage
 * When error detected: adds it to chat + auto-triggers a fix request
 */
export function AutoFix() {
  const lastError = useRef('')
  const cooldown = useRef(false)
  const { isGenerating, addMessage, setInput, hasGeneratedFiles } = useEditorStore()

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (isGenerating || cooldown.current || !hasGeneratedFiles) return
      const data = event.data
      if (!data || typeof data !== 'object') return
      if (data.type !== 'wyber-error') return

      const msg = String(data.message || '').trim()
      if (!msg || msg.length < 5 || msg === lastError.current) return

      lastError.current = msg
      cooldown.current = true
      setTimeout(() => { cooldown.current = false }, 20000)

      // Add error message to chat
      addMessage({
        id: `autofix-${Date.now()}`,
        role: 'assistant',
        content: \`⚠️ Preview error detected:

\\`\\`\\`
\${msg.slice(0, 300)}
\\`\\`\\`

Fixing now...\`,
        timestamp: Date.now(),
        status: 'done',
      })

      // Auto-trigger fix via a synthetic click on the send button
      // We set the input then programmatically send
      setTimeout(() => {
        const btn = document.querySelector('[data-send-button]') as HTMLButtonElement
        if (btn && !btn.disabled) {
          // Set a fix prompt via custom event
          window.dispatchEvent(new CustomEvent('wyber-autofix', {
            detail: { prompt: \`Fix this error in the app: \${msg.slice(0, 200)}\` }
          }))
        }
      }, 500)
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [isGenerating, hasGeneratedFiles, addMessage, setInput])

  return null
}
