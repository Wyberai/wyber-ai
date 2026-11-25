/** Server-only switch for the spec-driven SaaS and Replace-your-SaaS builds (default OFF): SAAS_SPEC_BUILD=on. Any failure falls back to the free-form build. */
export function saasSpecEnabled(): boolean {
  return process.env.SAAS_SPEC_BUILD === 'on'
}
