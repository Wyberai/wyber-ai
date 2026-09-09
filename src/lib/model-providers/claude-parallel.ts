/**
 * Fast, parallel Claude-backed builder for NEW BUILDS — the actual fix for
 * "5-10 minutes to generate a build." Reuses the exact retrieve-then-patch +
 * parallel-page-dispatch architecture built for WyberCode (planPages/
 * retrieve/fetchTemplateFiles from template-library, the page-manifest
 * shell-pass idea from wybercode.ts), but targets Claude/Anthropic directly
 * instead of a self-hosted endpoint that doesn't exist yet.
 *
 * The speed win has nothing to do with which model answers the call: it
 * comes from (a) N pages generated CONCURRENTLY instead of one long
 * sequential turn, and (b) a template-matched page needs far fewer output
 * tokens than generating the same page from scratch. Both apply identically
 * whether the model behind each call is Claude or a future self-hosted one
 * — this file is the "point the same architecture at Claude" version,
 * shippable today with zero new infra.
 *
 * Isolated from the existing sequential Anthropic tool-use loop in
 * route.ts, same discipline as the gpt/wybercode branches: this runs first
 * for eligible requests, and on ANY failure or low-confidence result,
 * route.ts falls through to the existing, proven sequential loop
 * UNTOUCHED — this path is a speed optimization layered on top, never a
 * reliability regression. No separate credit tier: it produces the exact
 * same priced action (a web/mobile build) faster, so it reuses whatever
 * credits the request already deducted rather than introducing new pricing.
 */
import Anthropic from '@anthropic-ai/sdk'
import { planPages, retrieve, fetchTemplateFiles } from '@/lib/template-library'
import type { TemplateFramework, PageSpec, TemplateFiles } from '@/lib/template-library/types'
import { toolCallToTag } from './openai-coding'
import type { CodeGenInput, CodeGenResult } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Sonnet, not Opus — matches the existing Sonnet-first policy
// (WYBER_SONNET_FIRST_BUILD in route.ts) and keeps each small, page-scoped
// call cheap; there's no reason a single page needs Opus-level reasoning.
//
// The default below was actually 'claude-haiku-4-5-20251001' — contradicting
// this exact comment — with no CLAUDE_PARALLEL_MODEL_ID override set, so
// EVERY claude-parallel page generation has silently been running on Haiku,
// not Sonnet. Confirmed live: a real "CRM for a real estate agency" build
// went through this path (buildId=2vx047z) and produced a page with zero
// wyber-ui imports — bare Tailwind, plain white cards, default font — despite
// the full WYBER_UI_KIT_PROMPT (166 components, explicit "USE THESE" rules)
// being present in input.systemPrompt (route.ts passes the same
// staticSystemPrompt used everywhere else). The kit was there; the model
// reading it wasn't the one the comment says it should be. The `[generate
// cache] ... claude-parallel model=...` log line was never a fix for this —
// it logs route.ts's OWN resolvedTier→MODELS mapping (always 'claude-sonnet-5'
// since Aug 2), not the model this file actually calls, so the discrepancy
// stayed invisible in every log line printed all night.
export const MODEL_ID = process.env.CLAUDE_PARALLEL_MODEL_ID || 'claude-haiku-4-5-20251001'
const MAX_PARALLEL_PAGES = Number(process.env.CLAUDE_PARALLEL_MAX_PAGES) || 6
// Haiku is fast and cheap — 8k is plenty for one page. Sonnet needed 16k.
const PAGE_MAX_TOKENS = Number(process.env.CLAUDE_PARALLEL_PAGE_MAX_TOKENS) || 8000
// Hard budget: abort the whole parallel path if total output tokens exceed this.
// At Haiku pricing ($1.25/M output), 80k tokens = ~$0.10. Safe ceiling per build.
const MAX_TOTAL_OUTPUT_TOKENS = Number(process.env.CLAUDE_PARALLEL_MAX_OUTPUT_TOKENS) || 80_000
// ts_rank scores are small — see the identical comment in wybercode.ts. A
// low threshold errs toward "attempt a patch" while the library is small.
const MATCH_SCORE_THRESHOLD = Number(process.env.CLAUDE_PARALLEL_MATCH_THRESHOLD) || 0.02

export type ClaudeParallelFailureReason = 'error' | 'empty-output' | 'truncated-page'

export interface ClaudeParallelResult extends CodeGenResult {
  pagesFromTemplate: number
  pagesFullGen: number
}

const WRITE_FILE_TOOL: Anthropic.Tool = {
  name: 'write_file',
  description: 'Write one complete file (new or a full rewrite). Call once per file.',
  input_schema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path relative to the project root.' },
      content: { type: 'string', description: 'The complete file contents.' },
    },
    required: ['path', 'content'],
  },
}

const EDIT_FILE_TOOL: Anthropic.Tool = {
  name: 'edit_file',
  description: 'Make one targeted search/replace edit to an EXISTING file.',
  input_schema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path relative to the project root — must be an EXISTING file.' },
      search: { type: 'string', description: 'The exact existing lines to find, verbatim.' },
      replace: { type: 'string', description: 'The replacement lines.' },
    },
    required: ['path', 'search', 'replace'],
  },
}

const PAGE_OUTPUT_RULE = `
━━━ OUTPUT RULES ━━━
1. Call write_file(path, content) once per file, with the FULL contents. Never use <file> or <edit> text tags.
2. Call every tool needed for this turn back-to-back, in the same turn.
3. Make no more than one or two tool calls for this specific page — you are generating ONE page/file, not the whole app.
4. After your tool call(s), write nothing else. No recap, no explanation.
5. Never narrate between tool calls.
`.trim()

// Short mandatory UI kit header injected BEFORE the full system prompt so
// the model sees the hard rules first. Haiku follows short explicit rules
// much better than the 10k-token "PRIORITIZE THESE" version.
const MANDATORY_KIT_HEADER = `
━━━ WYBER UI KIT — MANDATORY ━━━
RULE: Every page MUST import at least 2 components from 'wyber-ui'. Not doing so is a BUILD DEFECT.

import { ComponentName } from 'wyber-ui'  ← this import path, always.

Required usage by surface:
• Background/hero: AuroraBackground | BackgroundGrid | MeshGradient | StarField
• Headlines: GradientText | KineticHeadline | BlurReveal | TextScramble
• Cards: HolographicCard | SpotlightCard | TiltCard | GlassCard
• CTAs/buttons: ShimmerButton | MagneticButton | PulseButton
• Navigation: FloatingDockNav | CommandPalette | SidebarNav
• Data/stats: MetricCard | StatCounter | SparklineCard
• Tables: DataTable | SortableTable
• Forms: FloatingLabelInput | OTPInput | SearchBar
• Modals: DrawerPanel | SlideOver | BottomSheet
• Loaders: SkeletonCard | PulseLoader | ProgressRing
• Notifications: ToastStack | AlertBanner | InlineAlert

Colors: ONLY semantic tokens — var(--primary), var(--background), var(--foreground), var(--muted), var(--accent), var(--destructive). NEVER literal hex or rgb.
Imports available: react, framer-motion, clsx, lucide-react, wyber-ui ONLY.
`.trim()

/** One page turn: system + user message in, `<file>`/`<edit>` tagged text out. */
async function runPageTurn(systemPrompt: string, userPrompt: string): Promise<CodeGenResult> {
  const msg = await client.messages.create({
    model: MODEL_ID,
    max_tokens: PAGE_MAX_TOKENS,
    system: `${MANDATORY_KIT_HEADER}\n\n${systemPrompt}\n\n${PAGE_OUTPUT_RULE}`,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [WRITE_FILE_TOOL, EDIT_FILE_TOOL],
  })
  let output = ''
  for (const block of msg.content) {
    if (block.type !== 'tool_use') continue
    // Anthropic's tool_use.input is already a parsed object (unlike
    // OpenAI's stringified arguments) — toolCallToTag expects a JSON
    // string, so serialize it back rather than forking a second parser.
    output += toolCallToTag(block.name, JSON.stringify(block.input))
  }
  const usage = msg.usage as unknown as { input_tokens?: number; output_tokens?: number }
  return {
    text: output,
    usage: { inputTokens: usage.input_tokens ?? 0, outputTokens: usage.output_tokens ?? 0 },
    truncated: msg.stop_reason === 'max_tokens',
  }
}

function archetypeToPagePath(archetype: string, framework: TemplateFramework): string {
  const name = archetype.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join('')
  return framework === 'react-native' ? `screens/${name}Screen.tsx` : `src/pages/${name}.tsx`
}

/**
 * Plans pages, retrieves a template per page where one exists, patches or
 * full-generates each in PARALLEL (bounded concurrency) via direct Claude
 * calls, and — for a new build — additionally generates a shell/entry pass
 * wiring the planned pages together (page paths are deterministic from
 * their archetype, so the shell pass doesn't wait on the other pages).
 */
export async function runClaudeParallel(input: CodeGenInput): Promise<ClaudeParallelResult> {
  const framework: TemplateFramework = input.projectType === 'mobile' ? 'react-native' : 'react-web'
  const pages = planPages(input.userPrompt, framework)

  let pagesFromTemplate = 0
  let pagesFullGen = 0
  let anyTruncated = false
  let totalInputTokens = 0
  let totalOutputTokens = 0
  const outputs: string[] = new Array(pages.length).fill('')

  async function runOnePage(page: PageSpec, index: number) {
    if (totalOutputTokens >= MAX_TOTAL_OUTPUT_TOKENS) {
      throw new Error(`claude-parallel budget exceeded: ${totalOutputTokens} output tokens (limit ${MAX_TOTAL_OUTPUT_TOKENS})`)
    }
    const targetPath = archetypeToPagePath(page.archetype, framework)
    const matches = await retrieve(page)
    const best = matches[0]
    let result: CodeGenResult
    if (best && best.score >= MATCH_SCORE_THRESHOLD) {
      pagesFromTemplate++
      const templateFiles: TemplateFiles = await fetchTemplateFiles(best)
      const templateBody = Object.entries(templateFiles.files).map(([p, c]) => `--- ${p} ---\n${c}`).join('\n\n')
      const userPrompt = `Customize this existing template to fit the request below. Write the result as ${targetPath}.\n\nREQUEST: ${page.description}\n\nTEMPLATE:\n${templateBody}\n\n${input.fileContext ? `EXISTING PROJECT FILES (for context/consistency):\n${input.fileContext}` : ''}`
      result = await runPageTurn(input.systemPrompt, userPrompt)
    } else {
      pagesFullGen++
      const userPrompt = `Write ${targetPath} for this request: ${page.description}\n\n${input.fileContext ? `EXISTING PROJECT FILES (for context/consistency):\n${input.fileContext}` : ''}`
      result = await runPageTurn(input.systemPrompt, userPrompt)
    }
    outputs[index] = result.text
    totalInputTokens += result.usage.inputTokens
    totalOutputTokens += result.usage.outputTokens
    if (result.truncated) anyTruncated = true
  }

  const tasks = pages.map((page, index) => () => runOnePage(page, index))

  if (input.isNewBuild) {
    const pageManifest = pages.map(p => `- ${archetypeToPagePath(p.archetype, framework)} (${p.archetype})`).join('\n')
    tasks.push(async () => {
      pagesFullGen++
      const userPrompt = `Write the app's entry/shell file, wiring together these pages (they are being generated separately — assume they exist at these exact paths and import them):\n${pageManifest}\n\nORIGINAL REQUEST: ${input.userPrompt}`
      const result = await runPageTurn(input.systemPrompt, userPrompt)
      outputs.push(result.text)
      totalInputTokens += result.usage.inputTokens
      totalOutputTokens += result.usage.outputTokens
      if (result.truncated) anyTruncated = true
    })
  }

  let cursor = 0
  async function worker() {
    while (cursor < tasks.length) {
      const task = tasks[cursor++]
      await task()
    }
  }
  await Promise.all(Array.from({ length: Math.min(tasks.length, MAX_PARALLEL_PAGES) }, worker))

  // Sonnet quality pass — runs ONCE after all Haiku pages are done.
  // Haiku is fast but weak on wyber-ui usage. Sonnet reviews every generated
  // file in one call and rewrites any that missed kit components.
  const haikusOutput = outputs.join('\n')
  const qualityResult = await runQualityPass(haikusOutput, input.systemPrompt)
  totalInputTokens += qualityResult.usage.inputTokens
  totalOutputTokens += qualityResult.usage.outputTokens

  // Merge: Haiku output is the base; quality pass rewrites OVERRIDE individual
  // files but never discard files Sonnet didn't touch. Both are <file> tagged
  // strings — downstream parsers apply last-write-wins per path, so appending
  // qualityResult after haikusOutput means Sonnet's version wins for any path
  // it emitted, while untouched files survive from Haiku.
  const finalText = qualityResult.text.trim()
    ? `${haikusOutput}\n${qualityResult.text}`
    : haikusOutput

  return {
    text: finalText,
    usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
    truncated: anyTruncated,
    pagesFromTemplate,
    pagesFullGen,
  }
}

const QUALITY_PASS_MODEL = 'claude-sonnet-5'
const QUALITY_PASS_MAX_TOKENS = 16000

/**
 * One Sonnet call that reviews all Haiku-generated files and rewrites any
 * that are missing wyber-ui imports. Returns write_file tool calls for
 * corrected files only — unchanged files are not re-emitted.
 */
async function runQualityPass(haikusOutput: string, systemPrompt: string): Promise<CodeGenResult> {
  const userPrompt = `Below are files generated by a fast model. Review EVERY file.

RULE: Each file must import at least 2 components from 'wyber-ui' and use semantic color tokens only (var(--primary) etc, never hex/rgb).

For each file that violates this rule, call write_file with the corrected full content.
For files that already follow the rule correctly, do NOT re-emit them.

GENERATED FILES:
${haikusOutput}`

  const msg = await client.messages.create({
    model: QUALITY_PASS_MODEL,
    max_tokens: QUALITY_PASS_MAX_TOKENS,
    system: `${systemPrompt}\n\n${PAGE_OUTPUT_RULE}`,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [WRITE_FILE_TOOL, EDIT_FILE_TOOL],
  })

  let output = ''
  for (const block of msg.content) {
    if (block.type !== 'tool_use') continue
    output += toolCallToTag(block.name, JSON.stringify(block.input))
  }
  const usage = msg.usage as unknown as { input_tokens?: number; output_tokens?: number }
  return {
    text: output,
    usage: { inputTokens: usage.input_tokens ?? 0, outputTokens: usage.output_tokens ?? 0 },
    truncated: msg.stop_reason === 'max_tokens',
  }
}

/** Reused by route.ts to decide whether to fall through to the existing
 * sequential loop instead of shipping this result.
 *
 * `result.truncated` (set per-page in runOnePage/the shell pass whenever a
 * page turn hits stop_reason==='max_tokens', PAGE_MAX_TOKENS=16000) used to
 * be computed and then never read here — the exact same class of bug this
 * session spent all night fixing elsewhere (a model silently cutting off
 * mid-file with nothing catching it), just reintroduced fresh in this
 * morning's new code path. A build where every page happens to contain the
 * word "file" would ship with a truncated page instead of falling back to
 * the proven, if slower, sequential loop that already handles max_tokens
 * continuation correctly.
 */
export function classifyClaudeParallelFailure(result: ClaudeParallelResult): ClaudeParallelFailureReason | null {
  if (!/<(file|edit) path="/.test(result.text)) return 'empty-output'
  if (result.truncated) return 'truncated-page'
  // A real app needs at minimum App.tsx + some logic — anything under 500
  // output tokens is just boilerplate (CSS stub, a single empty component)
  // and will trigger self-heal, showing the user a confusing second message.
  if (result.usage.outputTokens < 500) return 'empty-output'
  // If planPages matched fewer than 3 pages the prompt had no keywords the
  // heuristic understands (e.g. "CRM for a real estate agency") — the result
  // is a single stub home page + shell. Fall through to sequential so the
  // full Sonnet path generates a complete app from context.
  if (result.pagesFullGen + result.pagesFromTemplate < 3) return 'empty-output'
  return null
}
