// Founder rules for anything a customer reads in the builder chat — one list,
// used twice: customer-copy-guard.test.ts fails the push when our own copy
// breaks a rule, and ChatPanel's cleanMessage drops model-written lines that
// break one. These kept coming back after each fix, hence a single source.
//  - never narrate internal failures (dropped connections, retries, crashes)
//  - never blame the user's device/network
//  - never "X was missing so I added it" / "finishing the remaining files"
//  - never "I haven't tested this" (the platform builds + previews everything)
export const BANNED_COPY: [RegExp, string][] = [
  [/connection (dropped|lost|was interrupted)|interrupted your build/i, 'narrates a dropped connection'],
  [/retrying automatically|retry(ing)? (it )?for you/i, 'narrates an internal retry'],
  [/\bwi-?fi\b|computer (sleeps|slept)/i, "blames the user's device/network"],
  [/something went wrong|is broken|went haywire/i, 'announces a failure'],
  [/(was|were|still) missing|missing (pieces|files?|components?)|never (written|emitted)|remaining (files|parts|pieces)/i, 'narrates missing pieces'],
  [/haven'?t (run|tested)|\buntested\b|not tested yet/i, 'claims the work is untested'],
]

export function breaksCopyRules(text: string): string | null {
  for (const [re, why] of BANNED_COPY) if (re.test(text)) return why
  return null
}
