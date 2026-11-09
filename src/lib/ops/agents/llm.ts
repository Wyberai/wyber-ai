import Anthropic from '@anthropic-ai/sdk'
import { createAnthropic } from '@/lib/ai-usage'
import { CHEAP_MODEL, CHEAP_THINKING, CODE_MODEL } from '@/lib/models'

// The one place company agents call a model. Only the two approved models:
// Haiku 5.5 (cheap) for short drafts, Sonnet 5.5 (code) for longer documents.
// `webSearch` lets the research agent look things up on the web (at most 3 searches per call).
export type CallModel = (a: { system: string; user: string; tier: 'cheap' | 'code'; maxTokens: number; webSearch?: boolean }) => Promise<{
  text: string; inputTokens: number; outputTokens: number; model: string
}>

export const MAX_WEB_SEARCHES = 3

/** Web search answers wrap quoted facts in cite tags with an index attribute. That is markup for the API, not part of the brief. */
const CITE_TAG = new RegExp('\\u003c/?cite\\b[^>]*>', 'gi')
export const stripCitations = (s: string): string => s.replace(CITE_TAG, '')
const MAX_CONTINUATIONS = 2

export function anthropicCaller(apiKey: string | undefined = process.env.ANTHROPIC_API_KEY): CallModel {
  return async ({ system, user, tier, maxTokens, webSearch }) => {
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    const client = createAnthropic('lib/ops/agents/llm', { apiKey })
    const model = tier === 'cheap' ? CHEAP_MODEL : CODE_MODEL
    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: user }]
    let text = '', inputTokens = 0, outputTokens = 0

    // A search can pause the turn; continue it a couple of times at most.
    for (let i = 0; i <= (webSearch ? MAX_CONTINUATIONS : 0); i++) {
      const res = await client.messages.create(
        {
          model,
          max_tokens: maxTokens,
          system,
          messages,
          ...(tier === 'cheap' ? { thinking: CHEAP_THINKING } : {}),
          ...(webSearch ? { tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: MAX_WEB_SEARCHES }] } : {}),
        },
        { timeout: webSearch ? 120_000 : 60_000 },
      )
      inputTokens += res.usage?.input_tokens ?? 0
      outputTokens += res.usage?.output_tokens ?? 0
      // Only the model's own words after its searches count as the answer.
      text = stripCitations(res.content.map(b => (b.type === 'text' ? b.text : '')).join(''))
      if (res.stop_reason !== 'pause_turn') break
      messages.push({ role: 'assistant', content: res.content })
    }
    return { text, inputTokens, outputTokens, model }
  }
}
