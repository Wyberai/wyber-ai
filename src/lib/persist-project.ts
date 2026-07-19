// Shared robust "save files to project" helper for every non-chat save path
// (visual edits, self-heal, theme changes, image regen, version restore).
// Each of these used to fire-and-forget a PATCH with `.catch(() => {})` — a
// network blip silently lost the edit; the file existed only in the browser
// tab's memory and reverted on reload. This mirrors the retry/backoff +
// chat-warning behavior ChatPanel's own saveProject already has for the main
// build flow (see ChatPanel.tsx), reusing the SAME visible-warning channel
// (a chat message) instead of adding yet another topbar status pill — this
// codebase already deliberately avoids stacking multiple build-state
// indicators (see TopBar.tsx's "third indicator was pure noise" note).
//
// Also carries the multi-tab conflict guard: every save sends the
// `updated_at` this tab last saw (project.updated_at in the store). If the
// server's row has since moved — another tab saved in between — the PATCH
// returns 409 instead of silently overwriting the other tab's changes with
// this tab's stale-based edit (the last-writer-wins data-loss bug). A
// conflict is NOT a transient failure, so it does not enter the retry loop —
// retrying with the same stale expectedUpdatedAt would just 409 forever.
import { useEditorStore } from '@/store/editor'

let warned = false
let conflictWarned = false

type AttemptResult = 'ok' | 'conflict' | 'fail'

export async function persistProjectFiles(
  projectId: string,
  files: unknown,
  userId: string | undefined,
): Promise<boolean> {
  const attempt = async (): Promise<AttemptResult> => {
    const project = useEditorStore.getState().project
    const expectedUpdatedAt = project?.id === projectId ? project.updated_at : undefined
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, files, userId: userId || 'auto', expectedUpdatedAt }),
      })
      if (res.status === 409) return 'conflict'
      if (!res.ok) return 'fail'
      const data = await res.json().catch(() => null)
      if (data?.updatedAt) {
        const cur = useEditorStore.getState().project
        if (cur?.id === projectId) useEditorStore.getState().setProject({ ...cur, updated_at: data.updatedAt })
      }
      return 'ok'
    } catch {
      return 'fail'
    }
  }

  const onSaved = () => {
    useEditorStore.getState().setSaveStatus('idle')
    if (warned) {
      warned = false
      useEditorStore.getState().addMessage({
        id: `save-recovered-${Date.now()}`, role: 'assistant',
        content: '✓ Connection restored — all your changes are saved.',
        timestamp: Date.now(), status: 'done',
      })
    }
  }

  const onConflict = () => {
    useEditorStore.getState().setSaveStatus('error')
    if (conflictWarned) return
    conflictWarned = true
    useEditorStore.getState().addMessage({
      id: `save-conflict-${Date.now()}`, role: 'assistant',
      content: "⚠ **This project changed in another tab or session since you loaded it.** To avoid overwriting that work, this change wasn't saved — reload the page to see the latest version before continuing.",
      timestamp: Date.now(), status: 'done',
    })
  }

  for (const delay of [0, 1500, 4000]) {
    if (delay) await new Promise(r => setTimeout(r, delay))
    const result = await attempt()
    if (result === 'ok') { onSaved(); return true }
    if (result === 'conflict') { onConflict(); return false }
  }

  useEditorStore.getState().setSaveStatus('error')
  if (!warned) {
    warned = true
    useEditorStore.getState().addMessage({
      id: `save-warning-${Date.now()}`, role: 'assistant',
      content: "⚠ **I can't reach the server to save your latest change.** Your work is safe in this tab and I'll keep retrying — just don't close it until you see the saved confirmation.",
      timestamp: Date.now(), status: 'done',
    })
  }
  // Keep retrying in the background — a transient outage shouldn't silently
  // lose the edit just because the caller stopped awaiting this promise.
  void (function retryLoop() {
    setTimeout(async () => {
      const result = await attempt()
      if (result === 'ok') { onSaved(); return }
      if (result === 'conflict') { onConflict(); return }
      retryLoop()
    }, 20_000)
  })()
  return false
}
