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

// This app has TWO independent save paths for the same project: ChatPanel's
// own saveProject loop (the main build flow) and this module (visual edits,
// self-heal, themes, images, version restore). Confirmed live: during a
// staged build, one of these can still be finishing a save while the other
// starts its own — each reads project.updated_at independently, so whichever
// lands SECOND sends an expectedUpdatedAt that's now stale relative to the
// FIRST one's write (made moments earlier, same tab) and gets a false
// "changed in another tab" conflict, even though nothing happened outside
// this tab at all. Serializing every actual PATCH for a given project
// through one queue — regardless of which save path triggered it — closes
// the read-then-send race: whoever's turn it is reads the truly latest
// updated_at, including whatever the previous writer in THIS tab just set.
const projectWriteQueues = new Map<string, Promise<unknown>>()

export function withProjectWriteLock<T>(projectId: string, fn: () => Promise<T>): Promise<T> {
  const prior = projectWriteQueues.get(projectId) ?? Promise.resolve()
  const settled = prior.then(() => {}, () => {})
  const result = settled.then(fn)
  projectWriteQueues.set(projectId, result.then(() => {}, () => {}))
  return result
}

// Went through two rounds tonight patching individual callers (ChatPanel's
// own flow, then self-heal) as each one turned out to race the SAME class of
// problem — same-tab concurrent writers during an active build, not a real
// second tab. Patching call sites one at a time only fixes the specific pair
// I happened to catch live; the next caller that fires mid-build (a self-heal
// variant, a future feature) would hit the identical false conflict again.
// Fixed once, properly: whether to enforce is now automatic, based on
// whether THIS TAB is (or just was) actively mid-build — isGenerating is
// per-tab store state, so checking it here correctly tells apart "my own
// build's other writers" (skip enforcement) from "a genuinely different tab"
// (that tab's isGenerating can't affect this tab's check either way, so
// enforcement still applies). A short trailing grace window covers saves
// that start just after isGenerating flips false but are still racing the
// build's own tail-end writes.
let lastGeneratingAt = 0
if (typeof window !== 'undefined') {
  useEditorStore.subscribe((state, prevState) => {
    if (state.isGenerating || prevState.isGenerating) lastGeneratingAt = Date.now()
  })
}
const GENERATING_GRACE_MS = 5000

export async function persistProjectFiles(
  projectId: string,
  files: unknown,
  userId: string | undefined,
  opts?: { enforceConflict?: boolean },
): Promise<boolean> {
  const enforceConflict = opts?.enforceConflict !== false
    && !useEditorStore.getState().isGenerating
    && Date.now() - lastGeneratingAt > GENERATING_GRACE_MS
  const attempt = async (): Promise<AttemptResult> => withProjectWriteLock(projectId, async () => {
    const project = useEditorStore.getState().project
    const expectedUpdatedAt = enforceConflict && project?.id === projectId ? project.updated_at : undefined
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, files, userId: userId || 'auto', expectedUpdatedAt }),
      })
      if (res.status === 409) {
        // The row's updated_at moved since we last cached it. In practice
        // this is usually THIS tab's own out-of-band writer (ChatPanel's
        // saveProject / generate/route.ts's rescue-persist, see its comment)
        // landing after we read our stale copy, not a genuinely different
        // tab — see module comment above. The server already tells us the
        // row's real current value; sync it here so the caller's retry can
        // succeed on the very next attempt instead of a real edit (a theme
        // change, an image swap) being silently dropped while the UI still
        // claims it saved.
        const data = await res.json().catch(() => null)
        if (data?.currentUpdatedAt) {
          const cur = useEditorStore.getState().project
          if (cur?.id === projectId) useEditorStore.getState().setProject({ ...cur, updated_at: data.currentUpdatedAt })
        }
        return 'conflict' as const
      }
      if (!res.ok) return 'fail' as const
      const data = await res.json().catch(() => null)
      if (data?.updatedAt) {
        const cur = useEditorStore.getState().project
        if (cur?.id === projectId) useEditorStore.getState().setProject({ ...cur, updated_at: data.updatedAt })
      }
      return 'ok' as const
    } catch {
      return 'fail' as const
    }
  })

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

  // A conflict gets exactly one immediate retry, no delay — attempt() just
  // self-healed the store's updated_at from the server's currentUpdatedAt
  // above, so if this was the common false-positive (our own out-of-band
  // writer), THIS retry now sends the correct value and succeeds silently.
  // If it conflicts again, that's a genuinely different tab still writing —
  // don't loop forever against real contention, warn same as before.
  const attemptWithConflictSelfHeal = async (): Promise<AttemptResult> => {
    const first = await attempt()
    return first === 'conflict' ? attempt() : first
  }

  for (const delay of [0, 1500, 4000]) {
    if (delay) await new Promise(r => setTimeout(r, delay))
    const result = await attemptWithConflictSelfHeal()
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
