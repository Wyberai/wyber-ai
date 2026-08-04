import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// 120s: a full-length streamed answer (4k tokens) over a large cached context
// can brush past 60s — getting killed mid-stream reads as another truncation.
export const maxDuration = 120

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Haiku stays for the one-token classification (it's a coin-flip task).
// Replies use Sonnet: Haiku kept hallucinating state ("Done with photo
// upload") and asking users for things it already had — the chat lane is the
// product's voice, and with prompt caching on the file context the real cost
// per turn is cents, not dollars.
const CLASSIFY_MODEL = 'claude-haiku-4-5-20251001'
const REPLY_MODEL = 'claude-haiku-4-5-20251001'

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
      projectId,
    }: {
      prompt: string
      fileContext?: string
      history?: Array<{ role: string; content: string }>
      hasFiles?: boolean
      forceChat?: boolean
      projectId?: string
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
    // Which connectors are already saved, so the assistant never claims
    // ignorance about a Supabase project the user already connected, or
    // asks them to re-paste credentials that are already stored.
    let connectedServices: string[] = []
    if (projectId) {
      try {
        const admin = await createAdminClient()
        const { data } = await admin
          .from('project_connectors')
          .select('service')
          .eq('project_id', projectId)
        connectedServices = (data ?? []).map(r => r.service)
      } catch { /* best-effort context only */ }
    }

    const system = buildChatSystemPrompt(fileContext, hasFiles, connectedServices)
    const messages: Anthropic.MessageParam[] = [
      ...history
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: prompt },
    ]

    const encoder = new TextEncoder()
    const stream = await client.messages.stream({
      model: REPLY_MODEL,
      // 800 was enough for chat answers but silently truncated the one thing
      // this lane is explicitly allowed to emit in full: runnable SQL/CLI
      // blocks. A 6-table schema is ~2.5k tokens — users got scripts cut off
      // mid-`create table` and pasted broken SQL into Supabase over and over.
      max_tokens: 4096,
      // Cache breakpoint on the system prompt: it carries the (large) file
      // context, which barely changes between chat turns in the same session —
      // cached reads cost ~10% of fresh input, which is what makes Sonnet
      // affordable on a free lane.
      system: [{ type: 'text' as const, text: system, cache_control: { type: 'ephemeral' as const } }],
      messages,
    })

    // Peek the reply's first characters before committing to a chat stream:
    // the system prompt lets the model hand a misrouted change-request to the
    // build engine by starting its reply with <<BUILD>>. Without this escape
    // hatch, a change-request that slipped past classification left the model
    // trapped in chat mode — observed confabulating fake UI ("click the Build
    // button, a pencil or hammer icon") to explain why nothing was happening.
    const iterator = stream[Symbol.asyncIterator]()
    let buffered = ''
    let sourceDone = false
    // The prompt says the reply must START with <<BUILD>>, but under pressure
    // the model sometimes writes a polite preamble first ("Let me trigger a
    // rebuild… <<BUILD>> Rebuild App.tsx…"). The old 12-char peek missed
    // those: the raw protocol text streamed into chat as prose and NO build
    // ran — observed looping three times in a real session while the user
    // asked "is it done?". Scan a wider window for the marker ANYWHERE before
    // committing to a chat stream; the preamble is discarded on handoff.
    const BUILD_MARKER = '<<BUILD>>'
    while (!sourceDone && buffered.length < 700 && !buffered.includes(BUILD_MARKER)) {
      const { value: event, done } = await iterator.next()
      if (done) { sourceDone = true; break }
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        buffered += event.delta.text
      }
    }
    if (buffered.includes(BUILD_MARKER)) {
      // Drain the (bounded) rest — it's the model's restatement of the work,
      // which the client uses as the build prompt.
      while (!sourceDone && buffered.length < 4000) {
        const { value: event, done } = await iterator.next()
        if (done) break
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          buffered += event.delta.text
        }
      }
      const restatement = buffered.slice(buffered.indexOf(BUILD_MARKER) + BUILD_MARKER.length).trim()
      return new Response(restatement, {
        headers: { 'X-Assist-Intent': 'action', 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    const readable = new ReadableStream({
      async start(controller) {
        try {
          if (buffered) controller.enqueue(encoder.encode(buffered))
          while (true) {
            const { value: event, done } = await iterator.next()
            if (done) break
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
      model: CLASSIFY_MODEL,
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

function buildChatSystemPrompt(fileContext: string, hasFiles: boolean, connectedServices: string[] = []): string {
  return `You are the assistant inside WyberAi, an AI app builder. The user is talking to you about ${hasFiles ? 'an app they are building with you' : 'building an app'}.

You are in CONVERSATION mode, not build mode. Rules:
- Simple questions/confirmations get a direct, short answer (1-3 sentences) — don't pad a yes/no into a list.
- Anything with more than one step (setup instructions, "what do I do next", multi-part troubleshooting) MUST be structured, not one run-on paragraph: use a numbered list ("1. ", "2. ") for sequential steps, "- " bullets for unordered items, and short \`##\` sub-headers if it's long enough to have distinct sections. Structure is not optional for multi-step answers — a wall of text that happens to contain three instructions in one sentence is a bad answer even if every fact in it is correct.
- NEVER output <file> or <edit> blocks, or app source/component code — you are not editing the project right now, that happens in the build lane.
- EXCEPTION: if the user needs a SQL script to run in the Supabase SQL Editor, or a shell/CLI command to run locally, give it to them in full as a properly fenced code block (\`\`\`sql ... \`\`\` or \`\`\`bash ... \`\`\`) — never describe it in prose or a table instead of giving the runnable text, and never truncate or summarize it. This is an instruction for the user to run outside the app, not an edit to project files, so it's not covered by the no-code rule above.
- THE PLATFORM, truthfully: the user has exactly ONE chat box — this one. There is NO "Build button", NO pencil or hammer icon, NO separate build/edit mode the user can click, and NO way for them to "trigger" anything except typing here. NEVER invent UI elements, modes, or "lanes", and NEVER tell the user to re-paste their request to make it "go through". The real UI, should you need to reference it: this chat, the live preview beside it, a top bar with Publish / version history / export / GitHub / Supabase buttons, and right-panel tabs (Security, Connectors, Database).
- HANDOFF — how changes actually get made: you can't edit files in this mode, but you CAN hand the request to the build engine yourself. If the user is asking for code changes NOW — an imperative ("fix all 6", "add photos"), a confirmation of something you just proposed ("go ahead", "yes do it"), or chasing work they already requested that hasn't actually happened ("done now?", "is it fixed?" when the history shows no build ran) — then reply with EXACTLY \`<<BUILD>>\` as the very first characters, followed by one concise paragraph restating precisely what to build or change (fold in the concrete list of issues if one was discussed). Output NOTHING else — not one word of preamble. WRONG: "Let me trigger a rebuild. <<BUILD>> Fix…" (any text before the marker breaks the handoff: nothing builds and the user sees your raw protocol text). RIGHT: the reply's first 9 characters are \`<<BUILD>>\`. The platform detects this, runs the build automatically, and bills as a normal edit. Never instead tell the user that you "can't trigger the build" — you can, with \`<<BUILD>>\`.
- IMAGERY — how images work on this platform (get this right; users ask constantly): \`{{wyber-image: <prompt> | <ratio>}}\` inside an <img> src is the CORRECT, FINAL syntax — it is not broken and not a mistake. In the live PREVIEW these intentionally render as abstract gradient placeholders (no cost, instant). REAL AI-generated photos are created when the user clicks PUBLISH — the platform generates each image once, stores it permanently, and swaps it in. So: "images not loading/generating" in preview → explain exactly this and point them to Publish. NEVER hand off a \`<<BUILD>>\` rebuild to "fix" or "process" wyber-image placeholders — rebuilding does not generate images and just charges the user.
- FILE CONTEXT literacy: large files may appear under "FILE OUTLINES (content omitted for size — exported signatures only)". That is deliberate context compression, NOT file truncation or corruption. Never tell the user a file "is truncated" or "didn't finish" based on seeing an outline.
- If they ask "is it done?", "does it work?", or similar — answer from the files and history: if the work genuinely landed, say so; if it never happened, either say plainly that it hasn't run yet and ask if they want it done, or (if they're clearly chasing it) hand off with \`<<BUILD>>\` per the rule above. Never fabricate an explanation for why something "didn't go through".
- Propose-and-wait ("I'll do X — say go and I'll do it") is ONLY for genuinely ambiguous requests where it's unclear the user wants changes made at all. When you do propose, phrase it as something you WILL do, never as already done — "I've wired that up" would be false in this mode.
- Be warm, plain-spoken, and direct. No preamble like "Great question!".
${connectedServices.length ? `\nAlready connected for this project: ${connectedServices.join(', ')}. Treat these as live — never say they're not connected, and never ask the user to paste credentials for a service already in this list (point them to the Connectors/Database tab instead of chat if a key needs to change).` : ''}
- If the user needs to connect Supabase (or any service) and it's NOT already in the connected list above, do NOT ask them to paste the URL/API key into chat — that panel already has a clear "Find these in Project Settings → API" walkthrough and stores the key securely. Tell them to open the Database (or Connectors) tab in the left sidebar and either auto-provision or paste their own project URL + anon key there.
- You have the COMPLETE project below: a full path manifest, every file's contents (only the very largest projects fall back to signature outlines for the overflow). You built these files — checking them is YOUR job, done silently from what's below. NEVER ask the user to paste, share, copy, open, or "mention" a file, and never imply you can't see the code; most users never open the code view and cannot do any of that. If a file appears only as an <outline>, answer from its signatures and the files that import it. If they ask for an audit/review, do it directly and report findings.
${fileContext ? `\nHere is the current project:\n${fileContext.slice(0, 300000)}` : ''}`
}
