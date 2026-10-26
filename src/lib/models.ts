import type Anthropic from '@anthropic-ai/sdk'

/**
 * The only two models WyberAi runs. Founder policy (2026-10-26): no model
 * options, no Opus/Fable — one fast coding model and one cheap model.
 *
 * CODE_MODEL  — anything that writes or plans app code (builds, edits,
 *               plan mode, parallel page generation).
 * CHEAP_MODEL — everything else: classifiers, naming, summaries, chat
 *               replies, suggestions, GTM/agent helpers.
 *
 * Change a model here, not at call sites.
 */
export const CODE_MODEL = 'claude-sonnet-5-5'
export const CHEAP_MODEL = 'claude-haiku-5-5'

/**
 * Haiku 5.5 thinks by default (unlike Haiku 4.5). Every CHEAP_MODEL call is a
 * short, latency-sensitive helper — several use max_tokens of 5–20, where
 * thinking would eat the whole budget and return no text — so thinking is
 * always off. Haiku 5.5 also rejects non-default temperature/top_p/top_k and
 * assistant-turn prefill (400), so don't send those either.
 */
export const CHEAP_THINKING: Anthropic.ThinkingConfigParam = { type: 'disabled' }
