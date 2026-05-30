'use client'
import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '@/store/editor'

// Listens for preview errors via postMessage from Sandpack iframe
// When an error is detected, fires a focused repair call to Claude
export function AutoFix() {
  const [fixing, setFixing] = useState(false)
  const lastError = useRef('')
  const fixAttempts = useRef(0)

  const {
    files, framework, setFiles, setHasGeneratedFiles,
    addMessage, setIsGenerating, isGenerating,
  } = useEditorStore()

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Sandpack sends error messages via postMessage
      const data = event.data
      if (!data || typeof data !== 'object') return

      const errorMsg: string =
        data?.type === 'compile-error' ? data.message :
        data?.type === 'runtime-error' ? data.error?.message :
        data?.error ? String(data.error) : ''

      if (!errorMsg || isGenerating || fixing) return
      if (errorMsg === lastError.current) return
      if (fixAttempts.current >= 2) return // Max 2 auto-fix attempts

      // Only auto-fix known fixable errors
      const isFixable =
        errorMsg.includes('Cannot find module') ||
        errorMsg.includes('Could not find module') ||
        errorMsg.includes('is not defined') ||
        errorMsg.includes('is not a function') ||
        errorMsg.includes('Unexpected token') ||
        errorMsg.includes('SyntaxError')

      if (!isFixable) return

      lastError.current = errorMsg
      fixAttempts.current++
      autoFix(errorMsg)
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [files, isGenerating, fixing])

  // Reset fix attempts when new generation starts
  useEffect(() => {
    if (isGenerating) {
      fixAttempts.current = 0
      lastError.current = ''
    }
  }, [isGenerating])

  const autoFix = async (errorMsg: string) => {
    setFixing(true)
    setIsGenerating(true)

    const aId = Math.random().toString(36).slice(2)
    addMessage({
      id: aId,
      role: 'assistant',
      content: `🔧 Auto-fixing: ${errorMsg.split('\n')[0].slice(0, 80)}...`,
      timestamp: 0,
      status: 'streaming',
    })

    try {
      // Build compact file snapshot
      const fileContext = Object.entries(files)
        .filter(([, f]) => (f.content?.length ?? 0) > 30)
        .slice(0, 6)
        .map(([, f]) => `<file path="${f.path}">\n${(f.content ?? '').slice(0, 1000)}\n</file>`)
        .join('\n\n')

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Fix this runtime error and output only the corrected files:\n\nERROR: ${errorMsg}\n\nFix the error. Keep all existing functionality. Output only the files that need changing.`,
          framework,
          fileContext,
          history: [],
          modelTier: 'fast',
        }),
      })

      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let raw = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        raw += decoder.decode(value, { stream: true })
      }

      const { parseGenerationOutput } = await import('@/lib/file-parser')
      const { files: fixed } = parseGenerationOutput(raw)

      if (fixed.length > 0) {
        const updated = { ...files }
        for (const { path, content } of fixed) {
          const ext = path.split('.').pop() ?? ''
          const langMap: Record<string, string> = { tsx: 'typescript', ts: 'typescript', js: 'javascript', css: 'css' }
          updated[path] = { path, content, language: langMap[ext] ?? 'plaintext' }
        }
        setFiles(updated)
        setHasGeneratedFiles(true)

        // Update message
        const msgs = useEditorStore.getState().messages
        const msg = msgs.find(m => m.id === aId)
        if (msg) {
          useEditorStore.getState().updateMessage(aId, {
            content: `✓ Fixed automatically — ${fixed.length} file${fixed.length > 1 ? 's' : ''} corrected.`,
            status: 'done',
            filesChanged: fixed.map(f => f.path),
          })
        }
      } else {
        useEditorStore.getState().updateMessage(aId, {
          content: 'Could not auto-fix. Try rephrasing or regenerate.',
          status: 'error',
        })
      }
    } catch {
      useEditorStore.getState().updateMessage(aId, {
        content: 'Auto-fix failed. Try regenerating.',
        status: 'error',
      })
    }

    setIsGenerating(false)
    setFixing(false)
  }

  return null // No UI — runs silently
}
