// Live agent-team state for the CURRENT turn. ChatPanel is the sole writer
// (it composes accumulated events from finished passes + the streaming pass);
// the agent-team feed components read from here so nothing threads through
// ChatPanel's render props. Reset at the start of every visible user turn.

import { create } from 'zustand'
import type { AgentEvent } from '@/lib/agents/events'

/** Autonomy dial: 'auto' = the team fixes issues without asking (default);
 * 'ask' = optional fix passes (runtime self-heal, QA structural fixes) post an
 * offer chip instead. Build-completion passes always run regardless. */
export type AgentAutonomy = 'auto' | 'ask'

const AUTONOMY_KEY = 'wyber-agent-autonomy'

function loadAutonomy(): AgentAutonomy {
  if (typeof window === 'undefined') return 'auto'
  try { return window.localStorage.getItem(AUTONOMY_KEY) === 'ask' ? 'ask' : 'auto' } catch { return 'auto' }
}

interface AgentTurnState {
  /** Full event list for the current turn (all passes so far, in order). */
  events: AgentEvent[]
  /** Internal passes used / budget for the current turn (0/0 = not agentic). */
  passesUsed: number
  passesMax: number
  /** User preference, persisted in localStorage. */
  autonomy: AgentAutonomy
  setEvents: (events: AgentEvent[]) => void
  setPasses: (used: number, max: number) => void
  setAutonomy: (autonomy: AgentAutonomy) => void
  resetTurn: () => void
}

export const useAgentTurnStore = create<AgentTurnState>((set) => ({
  events: [],
  passesUsed: 0,
  passesMax: 0,
  autonomy: loadAutonomy(),
  setEvents: (events) => set({ events }),
  setPasses: (passesUsed, passesMax) => set({ passesUsed, passesMax }),
  setAutonomy: (autonomy) => {
    try { window.localStorage.setItem(AUTONOMY_KEY, autonomy) } catch { /* private mode */ }
    set({ autonomy })
  },
  resetTurn: () => set({ events: [], passesUsed: 0, passesMax: 0 }),
}))
