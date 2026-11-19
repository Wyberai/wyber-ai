/**
 * Server-only switch for the spec-driven website build (default OFF).
 *   WEBSITE_SPEC_BUILD=on   -> new launch-ready website builds are planned, written as copy slots and rendered with the kit
 * Anything else leaves the existing free-form build untouched. Any failure of the spec path also falls back to it.
 */
export function websiteSpecEnabled(): boolean {
  return process.env.WEBSITE_SPEC_BUILD === 'on'
}
