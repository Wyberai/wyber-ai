/**
 * WyberCode — the self-hosted coding-agent provider (see the WyberCode plan:
 * fully self-hosted GPUs, Claude kept as fallback + premium tier, shadow-
 * tested before cutover). Structured the same way openai-coding.ts is: a
 * separate, self-contained adapter wired into generate/route.ts as an
 * ISOLATED branch (own balance check, own credit deduction, own response),
 * never spliced into the Anthropic tool-use loop — see types.ts for why.
 *
 * Two-tier serving (see the plan's Phase 3): a fast small model patches a
 * retrieved template for the common case, a larger model handles genuinely
 * novel pages. Both are reached through the same OpenAI-compatible
 * chat-completions contract (vLLM's built-in endpoint shape), so this file
 * only needs one HTTP call shape parameterized by tier.
 *
 * ⚠ Not runnable yet: WYBERCODE_INFERENCE_URL has no real backend until the
 * GKE + vLLM infra in the plan's Phase 3 is actually provisioned — a real
 * GPU cost / infra decision, deliberately NOT done automatically by any code
 * in this repo (provisioning billable cloud infrastructure isn't something
 * to do without an explicit go-ahead). Every call in this file fails closed
 * with a clearly classified error when unconfigured, which
 * generate/route.ts's wybercode branch treats as an ordinary
 * fallback-to-Claude signal — so this is safe to merge and wire in behind
 * the WYBERCODE_ENABLED kill switch (default off) well before the infra
 * exists.
 */
import { LoopGuard } from '@/lib/agents/loop-guard'
import { planPages, retrieve, fetchTemplateFiles } from '@/lib/template-library'
import type { TemplateFramework, PageSpec, TemplateFiles } from '@/lib/template-library/types'
import { toolCallToTag } from './openai-coding'
import type { CodeGenInput, CodeGenResult } from './types'

export type WyberCodeFailureReason = 'timeout' | 'unreachable' | 'malformed-output' | 'empty-output'

export interface WyberCodeResult extends CodeGenResult {
  pagesFromTemplate: number
  pagesFullGen: number
}

// ── Config ───────────────────────────────────────────────────────────────
const PATCH_URL = process.env.WYBERCODE_PATCH_INFERENCE_URL || process.env.WYBERCODE_INFERENCE_URL
const FULLGEN_URL = process.env.WYBERCODE_FULLGEN_INFERENCE_URL || process.env.WYBERCODE_INFERENCE_URL
const INFERENCE_SECRET = process.env.WYBERCODE_INFERENCE_SECRET
const PATCH_MODEL_ID = process.env.WYBERCODE_PATCH_MODEL_ID || 'wybercode-patch'
const FULLGEN_MODEL_ID = process.env.WYBERCODE_FULLGEN_MODEL_ID || 'wybercode-fullgen'
// Tuned against the plan's ~60s multi-page target, well under route.ts's own
// SOFT_DEADLINE_MS — a single page turn timing out should trigger fallback
// long before the platform-level deadline is a concern.
const TURN_TIMEOUT_MS = Number(process.env.WYBERCODE_TIMEOUT_MS) || 75_000
const MAX_PARALLEL_PAGES = Number(process.env.WYBERCODE_MAX_PARALLEL_PAGES) || 6
// ts_rank scores are small and unbounded above 0 — this needs real
// calibration once the template library has real rows (see plan Phase 5
// shadow-mode data); a low placeholder threshold errs toward "attempt a
// patch" over "assume no match" while the library is still near-empty.
const MATCH_SCORE_THRESHOLD = Number(process.env.WYBERCODE_MATCH_THRESHOLD) || 0.02

export class WyberCodeUnreachableError extends Error {}
export class WyberCodeTimeoutError extends Error {}
export class WyberCodeMalformedOutputError extends Error {}

const WRITE_FILE_TOOL = {
  type: 'function' as const,
  function: {
    name: 'write_file',
    description: 'Write one complete file (new or a full rewrite). Call once per file.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to the project root.' },
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
    description: 'Make one targeted search/replace edit to an EXISTING file.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to the project root — must be an EXISTING file.' },
        search: { type: 'string', description: 'The exact existing lines to find, verbatim.' },
        replace: { type: 'string', description: 'The replacement lines.' },
      },
      required: ['path', 'search', 'replace'],
    },
  },
}

const WYBERCODE_OUTPUT_RULE = `
━━━ OUTPUT RULES ━━━
1. Call write_file(path, content) once per file, with the FULL contents. Never use <file> or <edit> text tags.
2. Call every tool needed for this turn back-to-back, in the same turn.
3. Make no more than one or two tool calls for this specific page — you are generating ONE page/file, not the whole app.
4. After your tool call(s), write nothing else. No recap, no explanation.
5. Never narrate between tool calls.
`.trim()

interface OpenAiCompatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[]
  tool_call_id?: string
}

interface OpenAiCompatResponse {
  choices: { message: { content: string | null; tool_calls?: OpenAiCompatMessage['tool_calls'] }; finish_reason: string }[]
  usage?: { prompt_tokens: number; completion_tokens: number }
}

async function callInferenceEndpoint(tier: 'patch' | 'fullgen', messages: OpenAiCompatMessage[]): Promise<OpenAiCompatResponse> {
  const url = tier === 'patch' ? PATCH_URL : FULLGEN_URL
  const model = tier === 'patch' ? PATCH_MODEL_ID : FULLGEN_MODEL_ID
  if (!url || !INFERENCE_SECRET) {
    throw new WyberCodeUnreachableError(`WyberCode ${tier} inference is not configured (WYBERCODE_${tier === 'patch' ? 'PATCH_' : 'FULLGEN_'}INFERENCE_URL / WYBERCODE_INFERENCE_SECRET missing)`)
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TURN_TIMEOUT_MS)
  try {
    const res = await fetch(`${url}/v1/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${INFERENCE_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, tools: [WRITE_FILE_TOOL, EDIT_FILE_TOOL], tool_choice: 'auto' }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new WyberCodeUnreachableError(`WyberCode ${tier} inference returned ${res.status}: ${errText.slice(0, 300)}`)
    }
    return await res.json() as OpenAiCompatResponse
  } catch (e) {
    if (e instanceof WyberCodeUnreachableError) throw e
    if (e instanceof Error && e.name === 'AbortError') throw new WyberCodeTimeoutError(`WyberCode ${tier} inference timed out after ${TURN_TIMEOUT_MS}ms`)
    throw new WyberCodeUnreachableError(`WyberCode ${tier} inference unreachable: ${String(e)}`)
  } finally {
    clearTimeout(timer)
  }
}

/** One page turn: system + user message in, `<file>`/`<edit>` tagged text out. */
async function runPageTurn(
  tier: 'patch' | 'fullgen',
  systemPrompt: string,
  userPrompt: string,
  guard: LoopGuard,
): Promise<CodeGenResult> {
  const messages: OpenAiCompatMessage[] = [
    { role: 'system', content: `${systemPrompt}\n\n${WYBERCODE_OUTPUT_RULE}` },
    { role: 'user', content: userPrompt },
  ]
  const res = await callInferenceEndpoint(tier, messages)
  const choice = res.choices[0]
  if (!choice) throw new WyberCodeUnreachableError(`WyberCode ${tier} inference returned no choices`)
  const toolCalls = choice.message.tool_calls ?? []
  let output = ''
  for (const call of toolCalls) {
    const tag = toolCallToTag(call.function.name, call.function.arguments)
    if (!tag) {
      // Malformed tool-call JSON — repeating twice for the same shape means
      // the model isn't going to self-correct; stop burning turns on it and
      // let the caller fall back to Claude instead.
      const n = guard.record(`malformed:${call.function.name}:${tier}`)
      if (n >= 2) throw new WyberCodeMalformedOutputError(`Repeated malformed ${call.function.name} tool call from WyberCode ${tier} tier`)
      continue
    }
    output += tag
  }
  return {
    text: output,
    usage: { inputTokens: res.usage?.prompt_tokens ?? 0, outputTokens: res.usage?.completion_tokens ?? 0 },
    truncated: choice.finish_reason === 'length',
  }
}

function archetypeToPagePath(archetype: string, framework: TemplateFramework): string {
  const name = archetype.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join('')
  return framework === 'react-native' ? `screens/${name}Screen.tsx` : `src/pages/${name}.tsx`
}

/**
 * Runs the full retrieve-then-patch (or full-gen) pipeline for one build/edit
 * turn: plans pages, retrieves a template per page where one exists, patches
 * or full-generates each in parallel (bounded concurrency), and — for a new
 * build — additionally full-generates a shell/entry pass wiring the planned
 * pages together (each page's file path is deterministic from its archetype,
 * so the shell pass doesn't need to wait for the other pages to finish).
 */
export async function runWyberCode(input: CodeGenInput): Promise<WyberCodeResult> {
  const framework: TemplateFramework = input.projectType === 'mobile' ? 'react-native' : 'react-web'
  const pages = planPages(input.userPrompt, framework)
  const guard = new LoopGuard()

  let pagesFromTemplate = 0
  let pagesFullGen = 0
  let anyTruncated = false
  let totalInputTokens = 0
  let totalOutputTokens = 0
  const outputs = new Array<string>(pages.length).fill('')

  async function runOnePage(page: PageSpec, index: number) {
    const targetPath = archetypeToPagePath(page.archetype, framework)
    const matches = await retrieve(page)
    const best = matches[0]
    let result: CodeGenResult
    if (best && best.score >= MATCH_SCORE_THRESHOLD) {
      pagesFromTemplate++
      const templateFiles: TemplateFiles = await fetchTemplateFiles(best)
      const templateBody = Object.entries(templateFiles.files).map(([p, c]) => `--- ${p} ---\n${c}`).join('\n\n')
      const userPrompt = `Customize this existing template to fit the request below. Write the result as ${targetPath}.\n\nREQUEST: ${page.description}\n\nTEMPLATE:\n${templateBody}\n\n${input.fileContext ? `EXISTING PROJECT FILES (for context/consistency):\n${input.fileContext}` : ''}`
      result = await runPageTurn('patch', input.systemPrompt, userPrompt, guard)
    } else {
      pagesFullGen++
      const userPrompt = `Write ${targetPath} for this request: ${page.description}\n\n${input.fileContext ? `EXISTING PROJECT FILES (for context/consistency):\n${input.fileContext}` : ''}`
      result = await runPageTurn('fullgen', input.systemPrompt, userPrompt, guard)
    }
    outputs[index] = result.text
    totalInputTokens += result.usage.inputTokens
    totalOutputTokens += result.usage.outputTokens
    if (result.truncated) anyTruncated = true
  }

  const tasks = pages.map((page, index) => () => runOnePage(page, index))

  // New builds also need a shell/entry pass wiring the planned pages
  // together — always full-gen (it's specific to this exact page list, never
  // a template match), but runnable in parallel with the pages themselves
  // since their file paths are already known from planPages().
  if (input.isNewBuild) {
    const pageManifest = pages.map(p => `- ${archetypeToPagePath(p.archetype, framework)} (${p.archetype})`).join('\n')
    tasks.push(async () => {
      pagesFullGen++
      const userPrompt = `Write the app's entry/shell file, wiring together these pages (they are being generated separately — assume they exist at these exact paths and import them):\n${pageManifest}\n\nORIGINAL REQUEST: ${input.userPrompt}`
      const result = await runPageTurn('fullgen', input.systemPrompt, userPrompt, guard)
      outputs.push(result.text)
      totalInputTokens += result.usage.inputTokens
      totalOutputTokens += result.usage.outputTokens
      if (result.truncated) anyTruncated = true
    })
  }

  // Bounded-concurrency worker pool — a shared cursor over `tasks`, not
  // Promise.all(tasks.map(...)), so a build with more pages than
  // MAX_PARALLEL_PAGES doesn't fire them all at once.
  let cursor = 0
  async function worker() {
    while (cursor < tasks.length) {
      const task = tasks[cursor++]
      await task()
    }
  }
  await Promise.all(Array.from({ length: Math.min(tasks.length, MAX_PARALLEL_PAGES) }, worker))

  return {
    text: outputs.join('\n'),
    usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
    truncated: anyTruncated,
    pagesFromTemplate,
    pagesFullGen,
  }
}

/**
 * Fallback-to-Claude gate for a call that completed without throwing.
 * Thrown errors (WyberCodeUnreachableError/TimeoutError/MalformedOutputError)
 * are the other half of this contract — generate/route.ts's wybercode branch
 * catches those directly. This only covers the "came back clean but useless"
 * case: a turn with zero real `<file>`/`<edit>` blocks, which is exactly as
 * bad as a thrown error (nothing shippable) but wouldn't otherwise surface as
 * one, so it needs its own check.
 */
export function classifyWyberCodeFailure(result: WyberCodeResult): WyberCodeFailureReason | null {
  if (!/<(file|edit) path="/.test(result.text)) return 'empty-output'
  return null
}

/**
 * Gradual-rollout gate for automatic (non-dropdown) routing to WyberCode.
 * Built on the existing tier system rather than a parallel mechanism — this
 * only decides whether an otherwise-Claude-routed request gets diverted;
 * generate/route.ts still applies its own tierAllowedForPlan check and the
 * always-available fallback-to-Claude safety net on top of this.
 *
 * Checked cheaply and first: the kill switch (WYBERCODE_ENABLED, default
 * off) means every other check below is skipped entirely when unset — a
 * request never even evaluates plan/percentage logic, let alone reaches
 * wybercode.ts's HTTP calls, unless someone has deliberately turned this on.
 */
export function shouldAutoRouteToWyberCode(opts: {
  userId: string
  plan: string
  stage: string
  selfHeal: boolean
  isInternalPass: boolean
}): boolean {
  if (process.env.WYBERCODE_ENABLED !== 'true') return false
  // Only real, priced build/edit turns — plan output, self-heal, and
  // internal agent-fix passes must stay on the already-reliable Claude path
  // regardless of rollout state.
  if (opts.stage !== 'full' || opts.selfHeal || opts.isInternalPass) return false
  const allowedPlans = (process.env.WYBERCODE_ROLLOUT_PLANS || 'free,spark').split(',').map(s => s.trim()).filter(Boolean)
  if (!allowedPlans.includes(opts.plan)) return false
  const pct = Math.max(0, Math.min(100, Number(process.env.WYBERCODE_ROLLOUT_PCT) || 0))
  if (pct <= 0) return false
  if (pct >= 100) return true
  return hashToBucket(opts.userId) < pct
}

/** Deterministic 0-99 bucket for a user id — same user always lands in the
 * same bucket, so a rollout percentage doesn't flip-flop per request. */
function hashToBucket(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  return hash % 100
}
