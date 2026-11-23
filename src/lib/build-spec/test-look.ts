// Test helper: a fake model call that answers the art director's question (so counting tests only see the calls they care about)
// and passes everything else to the wrapped fake.
import type { ModelCall, ModelReply } from './types'

export const LOOK_REPLY: ModelReply = {
  text: JSON.stringify({ mode: 'light', groups: ['human'], palette: 'teal', type: 'geometric', mood: ['calm', 'clear', 'trusting'], why: 'test' }),
  inputTokens: 0,
  outputTokens: 0,
}

export const isLookQuestion = (system: string) => /^You are the art director/.test(system)

export function withLook(fn: ModelCall): ModelCall {
  return (system, user) => (isLookQuestion(system) ? Promise.resolve(LOOK_REPLY) : fn(system, user))
}
