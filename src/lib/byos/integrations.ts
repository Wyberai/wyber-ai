/**
 * Which integrations a BYOS build can really connect (vs. only leave a labelled
 * placeholder for). Mirrors what the builder already wires: Supabase, Stripe and
 * email in detect-deps.ts plus its Composio-backed tools. Only list a tool here
 * once the builder genuinely connects it — the quote screen promises exactly this.
 */
export const LIVE_INTEGRATIONS = [
  'Supabase', 'Stripe', 'Email (Resend)', 'Slack', 'Gmail', 'Google Sheets', 'Google Calendar', 'Google Drive',
  'GitHub', 'Notion', 'HubSpot', 'Jira', 'Linear', 'OpenAI',
] as const

const ALIASES: [RegExp, (typeof LIVE_INTEGRATIONS)[number]][] = [
  [/^supabase/i, 'Supabase'],
  [/^stripe/i, 'Stripe'],
  [/^(resend|sendgrid|email)\b/i, 'Email (Resend)'],
  [/^slack/i, 'Slack'],
  [/^gmail/i, 'Gmail'],
  [/^google\s*(sheets?|spreadsheets?)/i, 'Google Sheets'],
  [/^google\s*calendar/i, 'Google Calendar'],
  [/^google\s*drive/i, 'Google Drive'],
  [/^github/i, 'GitHub'],
  [/^notion/i, 'Notion'],
  [/^hubspot/i, 'HubSpot'],
  [/^jira/i, 'Jira'],
  [/^linear/i, 'Linear'],
  [/^(openai|chatgpt)/i, 'OpenAI'],
]

/** Canonical live name for a detected integration, or null when it would be a placeholder. */
export function liveMatch(name: string): (typeof LIVE_INTEGRATIONS)[number] | null {
  const n = name.trim()
  for (const [re, live] of ALIASES) if (re.test(n)) return live
  return null
}
