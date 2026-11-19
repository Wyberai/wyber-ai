/** Server-only switch for the spec-driven web app build (default OFF): WEBAPP_SPEC_BUILD=on. Any failure falls back to the free-form build. */
export function webappSpecEnabled(): boolean {
  return process.env.WEBAPP_SPEC_BUILD === 'on'
}
