'use client'
import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editor'
import { useT } from '@/lib/i18n/useT'
import { EDITOR_TOOLS_STRINGS } from '@/lib/i18n/dict/editor-tools'

export function AutoFix() {
  const t = useT(EDITOR_TOOLS_STRINGS)
  const lastError = useRef('')
  const cooldown = useRef(false)
  const { isGenerating, addMessage, hasGeneratedFiles } = useEditorStore()

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

      addMessage({
        id: 'autofix-' + Date.now(),
        role: 'assistant',
        content: t('autoFixMessagePrefix') + ' ' + msg.slice(0, 100),
        timestamp: Date.now(),
        status: 'done',
      })

      setTimeout(() => {
        const btn = document.querySelector('[data-send-button]') as HTMLButtonElement
        if (btn && !btn.disabled) {
          window.dispatchEvent(new CustomEvent('wyber-autofix', {
            // `error` carries the raw message so ChatPanel's loop guard can
            // signature-match repeats independent of the prompt wording.
            detail: { prompt: 'Fix this JavaScript error in the app: ' + msg.slice(0, 200), error: msg.slice(0, 300) }
          }))
        }
      }, 500)
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [isGenerating, hasGeneratedFiles, addMessage])

  return null
}
