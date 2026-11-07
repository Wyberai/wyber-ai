import Anthropic from '@anthropic-ai/sdk'
import { CHEAP_MODEL, CHEAP_THINKING, CODE_MODEL } from '@/lib/models'

// The one place company agents call a model. Only the two approved models:
// Haiku 5.5 (cheap) for short drafts, Sonnet 5.5 (code) for longer documents.
export type CallModel = (a: { system: string; user: string; tier: 'cheap' | 'code'; maxTokens: number }) => Promise<{
  text: string; inputTokens: number; outputTokens: number; model: string
}>

export function anthropicCaller(apiKey: string | undefined = process.env.ANTHROPIC_API_KEY): CallModel {
  return async ({ system, user, tier, maxTokens }) => {
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    const client = new Anthropic({ apiKey })
    const model = tier === 'cheap' ? CHEAP_MODEL : CODE_MODEL
    const res = await client.messages.create(
      {
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
        ...(tier === 'cheap' ? { thinking: CHEAP_THINKING } : {}),
      },
      { timeout: 60_000 },
    )
    return {
      text: res.content.map(b => (b.type === 'text' ? b.text : '')).join(''),
      inputTokens: res.usage?.input_tokens ?? 0,
      outputTokens: res.usage?.output_tokens ?? 0,
      model,
    }
  }
}
