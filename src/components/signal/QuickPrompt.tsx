'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { pickIdeaKind } from '@/lib/signal/guide'
import { FREE_CREDITS, projectTypeFor, saveCtx, stashPending } from '@/lib/signal/handoff'
import { startPath } from './goStart'

/** For the visitor who already knows what they want: skip the question, describe it, go. */
export function QuickPrompt() {
  const router = useRouter()
  const [v, setV] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const idea = v.trim()
    if (idea.length < 8) { setNote('Tell us a little more, in your own words.'); return }
    setNote(''); setBusy(true)
    const kind = pickIdeaKind(idea)
    saveCtx({ src: 'quick', title: idea.slice(0, 70), kindLabel: kind, chips: [], answers: [], idea, cost: FREE_CREDITS })
    stashPending(idea, projectTypeFor(kind), '')
    router.push(await startPath())
  }

  return (
    <>
      <form className="sg-quick" onSubmit={submit} noValidate>
        <label className="sg-sr" htmlFor="sg-qi">Describe what you want to build</label>
        <input id="sg-qi" type="text" value={v} onChange={e => setV(e.target.value)} placeholder="Or just describe it, for example: track my invoices and see who has not paid" autoComplete="off" />
        <button className="sg-btn" type="submit" disabled={busy}>{busy ? 'One moment…' : <>Start free <span aria-hidden="true">→</span></>}</button>
      </form>
      <p className="sg-note" role="status">{note}</p>
    </>
  )
}
