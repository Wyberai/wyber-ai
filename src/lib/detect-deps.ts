/**
 * detect-deps.ts
 *
 * Client-side keyword scan: given a user prompt, return which external
 * services the app is likely to need so the chat can ask for keys BEFORE
 * coding starts.
 *
 * Rules:
 *  - Only fires on new-build prompts (no existing fileContext).
 *  - Never hard-blocks: every dep has a "skip" path in the UI.
 *  - Does NOT fire for prompts that will hit the prebuilt-template cache —
 *    that decision is made server-side and detected via X-Source: prebuilt.
 *    The prebuilt path calls us AFTER delivery (see ChatPanel postBuildDeps).
 */

export interface DetectedDeps {
  needsSupabase: boolean
  needsStripe: boolean
  /** Names of Composio-connected tools detected (e.g. ['GitHub', 'Slack']) */
  composioTools: string[]
  /** True if ANY external dep was detected */
  hasAnyDep: boolean
}

// ── keyword banks ─────────────────────────────────────────────────────────────

const SUPABASE_KEYWORDS = [
  'login', 'sign in', 'sign up', 'signup', 'register', 'auth',
  'authentication', 'user account', 'user profile', 'profiles',
  'database', 'backend', 'persist', 'store data', 'save data',
  'real-time', 'realtime', 'live updates', 'supabase',
  'multi-user', 'multiuser', 'per user', 'users can',
]

const STRIPE_KEYWORDS = [
  'payment', 'payments', 'checkout', 'subscribe', 'subscription',
  'billing', 'charge', 'stripe', 'credit card', 'buy', 'purchase',
  'paid plan', 'pricing tier', 'monetize',
]

// Map of tool name → keywords that suggest it's needed
const COMPOSIO_TOOL_KEYWORDS: Record<string, string[]> = {
  GitHub:   ['github', 'repo', 'pull request', 'commit', 'issues', 'git'],
  Slack:    ['slack', 'channel message', 'send a slack', 'notify slack'],
  Gmail:    ['gmail', 'send email', 'email draft', 'email notification'],
  Notion:   ['notion', 'notion page', 'notion database'],
  HubSpot:  ['hubspot', 'crm contact', 'hubspot deal'],
  Google:   ['google sheets', 'google calendar', 'google drive', 'google docs'],
  Jira:     ['jira', 'jira ticket', 'jira issue'],
  Linear:   ['linear', 'linear issue', 'linear ticket'],
}

function matches(prompt: string, keywords: string[]): boolean {
  const p = prompt.toLowerCase()
  return keywords.some(kw => p.includes(kw))
}

export function detectDeps(prompt: string): DetectedDeps {
  const needsSupabase = matches(prompt, SUPABASE_KEYWORDS)
  const needsStripe   = matches(prompt, STRIPE_KEYWORDS)

  const composioTools: string[] = []
  for (const [tool, kws] of Object.entries(COMPOSIO_TOOL_KEYWORDS)) {
    if (matches(prompt, kws)) composioTools.push(tool)
  }

  return {
    needsSupabase,
    needsStripe,
    composioTools,
    hasAnyDep: needsSupabase || needsStripe || composioTools.length > 0,
  }
}

/**
 * After a prebuilt template is applied, scan its code for service references
 * so we can surface a "connect to make it live" nudge.
 */
export function detectDepsInCode(code: string): DetectedDeps {
  const c = code.toLowerCase()
  const needsSupabase = c.includes('supabase') || c.includes('createclient')
  const needsStripe   = c.includes('stripe') || c.includes('loadstripe')

  const composioTools: string[] = []
  for (const [tool, kws] of Object.entries(COMPOSIO_TOOL_KEYWORDS)) {
    if (kws.some(kw => c.includes(kw))) composioTools.push(tool)
  }

  return {
    needsSupabase,
    needsStripe,
    composioTools,
    hasAnyDep: needsSupabase || needsStripe || composioTools.length > 0,
  }
}
