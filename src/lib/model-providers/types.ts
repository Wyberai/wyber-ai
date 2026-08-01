/**
 * Shared contract for a second/third code-generation provider (see
 * wybercode.ts). Deliberately NOT retrofitted onto the existing Anthropic
 * tool-use loop in generate/route.ts — that loop has years of accumulated
 * production hardening (per-file Sentinel review, forced-entry-file retry,
 * truncation continuation, SQL-block review) tightly coupled to the Anthropic
 * SDK's own response shapes. Extracting it behind this interface with no live
 * traffic to verify against (no way to run a real multi-minute Anthropic
 * build in this environment) would risk a regression to the single most
 * important, revenue-generating code path in the product for a refactor with
 * no functional payoff until a second provider actually exists to swap to.
 *
 * Instead, a new provider is wired in as an ISOLATED branch in route.ts
 * (mirroring the existing, already-proven 'gpt' tier pattern in
 * openai-coding.ts) that either returns a complete result or throws/flags
 * low confidence, in which case route.ts refunds and falls through
 * UNCHANGED into the existing Claude path below — zero lines of the
 * Anthropic loop touched. See wybercode.ts's classifyWyberCodeFailure for
 * the fallback contract. This file just standardizes the input/output shape
 * so any future provider (WyberCode today, others later) plugs in the same
 * way `openai-coding.ts` already does.
 */

export interface CodeGenInput {
  systemPrompt: string
  userPrompt: string
  /** Existing-file context for edits — same string the Anthropic path builds. */
  fileContext?: string
  projectType?: string
  isNewBuild?: boolean
  maxIterations?: number
}

export interface CodeGenResult {
  /** Full <file>/<edit>-tagged output + closing recap text, ready to stream
   * to the client exactly like the legacy (non-tool-use) Anthropic path's output. */
  text: string
  usage: { inputTokens: number; outputTokens: number }
  /** True if the loop hit maxIterations while the model still had pending
   * tool calls (never reached the natural "no more tool calls" turn). */
  truncated: boolean
}

/** A provider that can turn a prompt into `<file>`/`<edit>` tagged output. */
export interface CodeGenProvider {
  generate(input: CodeGenInput): Promise<CodeGenResult>
}
