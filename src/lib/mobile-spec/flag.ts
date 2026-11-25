/** Server-only switch for the spec-driven mobile build (default OFF): MOBILE_SPEC_BUILD=on. Any failure falls back to the free-form mobile build. */
export function mobileSpecEnabled(): boolean {
  return process.env.MOBILE_SPEC_BUILD === 'on'
}
