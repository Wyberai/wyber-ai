import type Anthropic from '@anthropic-ai/sdk'

type MsgParam = Anthropic.MessageParam

/**
 * Returns a copy of `messages` with a cache_control breakpoint on the last
 * content block of the last message. Use this right before each call in an
 * agentic tool-use loop so the growing history is read from cache on every
 * iteration after the first, instead of being resent as fresh input tokens.
 *
 * Does not mutate the input array — safe to call on every iteration even as
 * `messages` keeps growing via push().
 */
export function withCacheBreakpoint(messages: MsgParam[]): MsgParam[] {
  if (messages.length === 0) return messages
  const last = messages[messages.length - 1]
  const content = typeof last.content === 'string'
    ? [{ type: 'text' as const, text: last.content, cache_control: { type: 'ephemeral' as const } }]
    : last.content.map((block, i, arr) =>
        i === arr.length - 1 ? { ...block, cache_control: { type: 'ephemeral' as const } } : block
      )
  return [...messages.slice(0, -1), { ...last, content }]
}
