import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Cheap, fast model for both the (optional) classification step and the chat reply.
const CHAT_MODEL = 'claude-haiku-4-5-20251001'

/**
 * Conversational assist endpoint for the builder.
 *
 * This is the CHAT lane of the intent router. Unlike /api/generate it:
 *   - deducts NO credits (questions and confirmations are free),
 *   - parses NO <file>/<edit> blocks (it never touches the user's code),
 *   - streams a short, human reply about the project.
 *
 * When the client is unsure (AMBIGUOUS), it passes `forceChat:false` and we run
 * a one-token Haiku classification first. If the message is really an action
 * ("add a settings page"), we return immediately with `X-Assist-Intent: action`
 * and the client routes it to /api/generate instead. Otherwise we stream chat
 * and return `X-Assist-Intent: chat`.
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'API not configured' }), { status: 500 })
    }

    const body = await req.json()
    const {
      prompt,
      fileContext = '',
      history = [],
      hasFiles = false,
      forceChat = true,
    }: {
      prompt: string
      fileContext?: string
      history?: Array<{ role: string; content: string }>
      hasFiles?: boolean
      forceChat?: boolean
    } = body

    if (!prompt || !prompt.trim()) {
      return new Response(JSON.stringify({ error: 'prompt required' }), { status: 400 })
    }

    // Auth (no credit work — just confirm a session exists).
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // ── Step 1: classify (only when the client wasn't sure) ──────────────
    if (!forceChat) {
      const intent = await classifyWithHaiku(prompt, hasFiles, history)
      if (intent === 'ACTION') {
        // Hand back to the build lane. No body needed.
        return new Response('', {
          headers: { 'X-Assist-Intent': 'action', 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }
    }

    // ── Step 2: stream a conversational reply ────────────────────────────
    const system = buildChatSystemPrompt(fileContext, hasFiles)
    const messages: Anthropic.MessageParam[] = [
      ...history
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: prompt },
    ]

    const encoder = new TextEncoder()
    const stream = await client.messages.stream({
      model: CHAT_MODEL,
      max_tokens: 800,
      system,
      messages,
    })

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } catch (err) {
          console.error('[assist] stream error', err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Assist-Intent': 'chat',
      },
    })
  } catch (err) {
    console.error('[assist] error', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

/**
 * One-token classification: is this message a request to change/build the app
 * (ACTION) or a conversational message (CHAT)? Defaults to CHAT on any failure
 * so we never charge for a misfire.
 *
 * Takes the recent turns so a bare confirmation ("go ahead", "yes please")
 * can be read against whatever the assistant just proposed — without history,
 * a short reply like that is indistinguishable from an idle "ok, thanks" and
 * silently drops the change the user thinks they just confirmed.
 */
async function classifyWithHaiku(prompt: string, hasFiles: boolean, history: Array<{ role: string; content: string }>): Promise<'ACTION' | 'CHAT'> {
  try {
    const contextMessages: Anthropic.MessageParam[] = [
      ...history
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-4)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: prompt },
    ]
    const res = await client.messages.create({
      model: CHAT_MODEL,
      max_tokens: 5,
      system: `You are an intent classifier for an AI app builder. The user ${hasFiles ? 'already has an app with code' : 'has no app yet'}. Given the conversation so far, decide if the user's LATEST message is:
- ACTION: a request to build, create, change, add, remove, fix, or otherwise modify the app's code — including a short confirmation ("go ahead", "yes please", "do it") when the assistant's immediately preceding message proposed a specific change and asked the user to confirm it.
- CHAT: a question, a confirmation/acknowledgment that isn't approving a proposed change, a greeting, thanks, a status check, or anything else conversational that does NOT ask for or approve a code change.
Reply with EXACTLY one word: ACTION or CHAT.`,
      messages: contextMessages,
    })
    const text = res.content.filter(b => b.type === 'text').map(b => (b.type === 'text' ? b.text : '')).join('').toUpperCase()
    return text.includes('ACTION') ? 'ACTION' : 'CHAT'
  } catch {
    return 'CHAT'
  }
}

function buildChatSystemPrompt(fileContext: string, hasFiles: boolean): string {
  return `You are the assistant inside WyberAi, an AI app builder. The user is talking to you about ${hasFiles ? 'an app they are building with you' : 'building an app'}.

You are in CONVERSATION mode, not build mode. Rules:
- Answer the user's question or respond to their message directly and concisely (1-3 short sentences).
- NEVER output code, <file> blocks, <edit> blocks, or file contents. You are not editing anything right now.
- If they ask "is it done?", "does it work?", or similar — answer based on what exists, and suggest the next step.
- If they seem to want a change to the app, briefly confirm what you'll do and tell them to send it — don't write code here.
- Be warm, plain-spoken, and brief. No preamble like "Great question!".
${fileContext ? `\nHere is the current project so you can answer accurately:\n${fileContext.slice(0, 8000)}` : ''}`
}
