import { describe, it, expect } from 'vitest'
import { parseGenerationOutput, cleanStreamingDisplay, extractProgressLines } from './file-parser'
import { formatAgentEvent } from './agents/events'

const MARKER = formatAgentEvent({ agent: 'security', status: 'fixed', detail: 'removed key', findingId: 'sec-1' }).trim()

describe('agent markers never render as chat text', () => {
  it('parseGenerationOutput strips [agent:{...}] markers', () => {
    // Deliberately NOT "Here is..." — that opener matches the NARRATION_PATTERNS
    // list (parseGenerationOutput strips model-narration lines like "here's
    // your app" on purpose, see file-parser.ts) and would be stripped for a
    // reason unrelated to what this test actually checks: agent-marker
    // stripping specifically.
    const raw = `Thanks for waiting!\n${MARKER}\n<file path="src/App.tsx">code</file>\nDone!`
    const { chatText, files } = parseGenerationOutput(raw)
    expect(chatText).not.toContain('[agent:')
    expect(chatText).toContain('Thanks for waiting!')
    expect(files).toHaveLength(1)
  })

  it('cleanStreamingDisplay strips complete markers', () => {
    const out = cleanStreamingDisplay(`building...\n${MARKER}\nstill building`)
    expect(out).not.toContain('[agent:')
    expect(out).toContain('still building')
  })

  it('cleanStreamingDisplay cuts a partial marker at the buffer tail', () => {
    const out = cleanStreamingDisplay(`building...\n[agent:{"agent":"security","st`)
    expect(out).not.toContain('[agent:')
    expect(out).toContain('building...')
  })

  it('cleanStreamingDisplay strips [progress:] markers from the chat text (they render via the separate progress-steps UI, never as raw text — see extractProgressLines)', () => {
    const out = cleanStreamingDisplay(`[progress: Writing components]\ntext`)
    expect(out).not.toContain('[progress:')
    expect(out).toContain('text')
  })

  it('extractProgressLines pulls the same marker out for the checklist UI', () => {
    const lines = extractProgressLines(`[progress: Writing components]\ntext`)
    expect(lines).toEqual(['Writing components'])
  })
})
