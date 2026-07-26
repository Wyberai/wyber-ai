/**
 * OpenAI-backed coding adapter for the 'gpt' model tier (src/lib/credits.ts).
 *
 * This is deliberately a SEPARATE, self-contained code path, not spliced into
 * the Anthropic tool-use loop in src/app/api/generate/route.ts. That loop has
 * years of accumulated production hardening — per-file inline security review
 * (Sentinel), a forced-entry-file retry so a build can never leave the app
 * unmountable, SQL-block extraction/review, continuation handling for
 * truncated turns — all deeply tied to Anthropic SDK response shapes
 * (stop_reason, content blocks, etc.). Reimplementing every one of those
 * behaviors for a second provider in one pass — without the ability to test
 * against a live OpenAI account in this environment — would risk shipping
 * code that LOOKS complete but silently lacks hardening real traffic will
 * eventually need. This adapter instead covers the CORE mechanic honestly:
 * send a system prompt + write_file/edit_file tools, get file writes back,
 * convert them to the SAME <file>/<edit> text-tag wire format the client
 * (ChatPanel's parseGenerationOutput) already parses — so nothing downstream
 * needs to know which provider produced the stream — and loop until the
 * model is done or MAX_ITERATIONS is hit, mirroring the Anthropic path's
 * "iteration 1 writes files, iteration 2 adds the closing recap" shape.
 *
 * ⚠ NOT YET SMOKE-TESTED against a live OpenAI account (no API key available
 * while writing this). The request/response shapes follow OpenAI's documented
 * Chat Completions + function-calling API precisely, but this needs a real
 * test call before any user traffic reaches it — same discipline as the
 * Sonnet-first build rollout (WYBER_SONNET_FIRST_BUILD): verify on staging
 * before it's live for real users. It is already safe to ship as-is because
 * gpt is only reachable via an explicit dropdown choice (credits.ts
 * MODEL_META.gpt), never an automatic default.
 */

// Deliberately a fresh, independently-authored instruction set — NOT a
// copy-paste of generate/route.ts's giant toolUseOutputRule literal (moving
// that string around risked a transcription error in something the model
// treats as load-bearing instructions). Same essential rules, OpenAI voice.
export const OPENAI_OUTPUT_RULE = `
━━━ OUTPUT RULES ━━━
1. To create a new file, call write_file(path, content) once per file with the FULL contents. Never use <file> or <edit> text tags — they don't exist here.
2. To change an existing file, call edit_file(path, search, replace). search must match the existing file EXACTLY (same whitespace) — keep it small, just the changed lines plus a little context. Only use write_file on an existing file for a full rewrite (e.g. a complete theme change).
3. Prefer fewer, larger files: 3-5 files for a fresh build, not 8-10.
4. Call every tool needed for this turn back-to-back, in the same turn — do not wait between calls.
5. If the message is a question or an ambiguous reply, do not call any tool — answer in 1-2 plain sentences.
6. Never promise future work ("sending it now", "one moment") — either call the tool now or state what input you need.
7. After your tool calls, write ONE short recap of what changed and one suggested next step. No more tool calls after that.
8. Never narrate between tool calls — call them silently, save all explanation for the final recap.
`.trim()

export interface OpenAiCodingInput {
  systemPrompt: string
  userPrompt: string
  /** Existing-file context for edits — same string the Anthropic path builds. */
  fileContext?: string
  maxIterations?: number
}

export interface OpenAiCodingResult {
  /** Full <file>/<edit>-tagged output + closing recap text, ready to stream
   * to the client exactly like the legacy (non-tool-use) Anthropic path's output. */
  text: string
  usage: { inputTokens: number; outputTokens: number }
  /** True if the loop hit maxIterations while the model still had pending
   * tool calls (never reached the natural "no more tool calls" turn) — the
   * caller should treat this as a possibly-incomplete build, not a clean
   * finish, even though some real files may already be in `text`. */
  truncated: boolean
}

// Same schema the Anthropic path's writeFileTool/editFileTool describe
// (generate/route.ts), translated from Anthropic's `input_schema` key to
// OpenAI's `parameters` key — the JSON Schema body itself is identical since
// both use plain JSON Schema, so the actual tool CONTRACT the model sees is
// unchanged between providers.
const WRITE_FILE_TOOL = {
  type: 'function' as const,
  function: {
    name: 'write_file',
    description: 'Write one complete NEW file. Call once per file you are creating — never for a file that already exists (use edit_file for those).',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to the project root, e.g. src/components/Sidebar.tsx' },
        content: { type: 'string', description: 'The complete file contents.' },
      },
      required: ['path', 'content'],
    },
  },
}

const EDIT_FILE_TOOL = {
  type: 'function' as const,
  function: {
    name: 'edit_file',
    description: 'Make one targeted search/replace edit to an EXISTING file. Call once per distinct change — call it again (or call it multiple times) for multiple changes in the same or different files.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to the project root — must be an EXISTING file.' },
        search: { type: 'string', description: 'The exact existing lines to find, copied verbatim including indentation/whitespace. Keep this small — just the lines that change plus a little surrounding context.' },
        replace: { type: 'string', description: 'The replacement lines.' },
      },
      required: ['path', 'search', 'replace'],
    },
  },
}

/** Converts one OpenAI tool call into the same <file>/<edit> tag shape the
 * client's parseGenerationOutput already understands from the legacy Anthropic
 * text path. Malformed tool-call JSON is skipped, never emitted as a broken
 * tag the client can't parse. Exported for unit testing. */
export function toolCallToTag(name: string, argsJson: string): string {
  let args: Record<string, string>
  try {
    args = JSON.parse(argsJson)
  } catch {
    return ''
  }
  // A literal `"` in a model-supplied path would break the `path="..."`
  // attribute boundary that downstream FILE_BLOCK_RE parsing relies on —
  // reject rather than let a malformed tag corrupt parsing (a real path
  // never legitimately contains a quote character).
  if (typeof args.path === 'string' && args.path.includes('"')) return ''
  if (name === 'write_file' && typeof args.path === 'string' && typeof args.content === 'string') {
    return `<file path="${args.path}">\n${args.content}\n</file>\n`
  }
  if (name === 'edit_file' && typeof args.path === 'string' && typeof args.search === 'string' && typeof args.replace === 'string') {
    return `<edit path="${args.path}">\n<<<<<<< SEARCH\n${args.search}\n=======\n${args.replace}\n>>>>>>> REPLACE\n</edit>\n`
  }
  return ''
}

type OpenAiMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string; tool_calls?: OpenAiToolCall[] }
  | { role: 'tool'; content: string; tool_call_id: string }

interface OpenAiToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

interface OpenAiChatCompletionResponse {
  choices: {
    message: { role: string; content: string | null; tool_calls?: OpenAiToolCall[] }
    finish_reason: string
  }[]
  usage?: { prompt_tokens: number; completion_tokens: number }
}

export async function generateWithOpenAiCoding(input: OpenAiCodingInput): Promise<OpenAiCodingResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')
  const model = process.env.OPENAI_CODING_MODEL_ID || 'gpt-5.1'
  const maxIterations = input.maxIterations ?? 6

  const messages: OpenAiMessage[] = [
    { role: 'system', content: input.systemPrompt },
    { role: 'user', content: input.fileContext ? `${input.fileContext}\n\n${input.userPrompt}` : input.userPrompt },
  ]

  let output = ''
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let truncated = true

  for (let iter = 0; iter < maxIterations; iter++) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        tools: [WRITE_FILE_TOOL, EDIT_FILE_TOOL],
        tool_choice: 'auto',
      }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`OpenAI API error (${res.status}): ${errText.slice(0, 500)}`)
    }
    const data = await res.json() as OpenAiChatCompletionResponse
    const choice = data.choices[0]
    if (!choice) throw new Error('OpenAI API returned no choices')
    if (data.usage) {
      totalInputTokens += data.usage.prompt_tokens ?? 0
      totalOutputTokens += data.usage.completion_tokens ?? 0
    }
    const msg = choice.message
    const toolCalls = msg.tool_calls ?? []

    if (toolCalls.length === 0) {
      // No more tool calls — this is the closing recap turn (mirrors the
      // Anthropic loop's final non-tool_use stop).
      output += (msg.content ?? '').trim()
      truncated = false
      break
    }

    for (const call of toolCalls) {
      output += toolCallToTag(call.function.name, call.function.arguments)
    }

    // Feed the assistant's tool_calls + trivial tool results back so the next
    // turn can add the closing recap — same 2-pass shape as the Anthropic loop.
    messages.push({ role: 'assistant', content: msg.content ?? '', tool_calls: toolCalls })
    for (const call of toolCalls) {
      messages.push({ role: 'tool', tool_call_id: call.id, content: 'File written.' })
    }
  }

  return { text: output, usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens }, truncated }
}
