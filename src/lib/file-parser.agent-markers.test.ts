import { describe, it, expect } from 'vitest'
import { parseGenerationOutput, cleanStreamingDisplay } from './file-parser'
import { formatAgentEvent } from './agents/events'

const MARKER = formatAgentEvent({ agent: 'security', status: 'fixed', detail: 'removed key', findingId: 'sec-1' }).trim()

describe('agent markers never render as chat text', () => {
  it('parseGenerationOutput strips [agent:{...}] markers', () => {
    const raw = `Here is your app.\n${MARKER}\n<file path="src/App.tsx">code</file>\nDone!`
    const { chatText, files } = parseGenerationOutput(raw)
    expect(chatText).not.toContain('[agent:')
    expect(chatText).toContain('Here is your app.')
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

  it('leaves [progress:] markers alone for the existing checklist path', () => {
    const out = cleanStreamingDisplay(`[progress: Writing components]\ntext`)
    expect(out).toContain('[progress: Writing components]')
  })
})
