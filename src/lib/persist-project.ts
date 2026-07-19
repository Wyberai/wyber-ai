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
import { useEditorStore } from '@/store/editor'

let warned = false

export async function persistProjectFiles(
  projectId: string,
  files: unknown,
  userId: string | undefined,
): Promise<boolean> {
  const attempt = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, files, userId: userId || 'auto' }),
      })
      return res.ok
    } catch {
      return false
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

  for (const delay of [0, 1500, 4000]) {
    if (delay) await new Promise(r => setTimeout(r, delay))
    if (await attempt()) { onSaved(); return true }
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
      if (await attempt()) { onSaved(); return }
      retryLoop()
    }, 20_000)
  })()
  return false
}
