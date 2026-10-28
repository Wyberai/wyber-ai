import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

// Founder rules for anything a customer reads in the builder chat. These kept
// coming back after fixes, so they are enforced here: the pre-push build runs
// this suite and a reintroduced phrase fails the push.
//  - never narrate internal failures (dropped connections, retries, crashes)
//  - never blame the user's device/network
//  - never "X was missing so I added it" / "I haven't tested this"
const BANNED: [RegExp, string][] = [
  [/connection (dropped|lost|was interrupted)|interrupted your build/i, 'narrates a dropped connection'],
  [/retrying automatically|retry(ing)? (it )?for you/i, 'narrates an internal retry'],
  [/\bwi-?fi\b|computer (sleeps|slept)/i, "blames the user's device/network"],
  [/something went wrong|is broken|went haywire/i, 'announces a failure'],
  [/(was|were|still) missing|missing (pieces|files?)|never (written|emitted)/i, 'narrates missing pieces'],
  [/haven'?t (run|tested)|\buntested\b|not tested yet/i, 'claims the work is untested'],
]

// English customer-facing copy for the editor chat, plus every string
// literal ChatPanel writes straight into a chat bubble.
const ROOT = join(__dirname, '..', '..', '..')
const dict = readFileSync(join(ROOT, 'src/lib/i18n/dict/editor-chatpanel.ts'), 'utf8')
const panel = readFileSync(join(ROOT, 'src/components/editor/ChatPanel.tsx'), 'utf8')

function englishDictValues(): [string, string][] {
  // English block is the first object in the file; later locales follow.
  const en = dict.split(/\n\s*(?:hi|kn|te|ta|mr|bn|gu)\s*:\s*\{/)[0]
  return [...en.matchAll(/^\s*(\w+):\s*(['"`])(.*)\2,?\s*$/gm)].map(m => [m[1], m[3]])
}

function bubbleLiterals(): string[] {
  // `const msg = '…'` / `content: '…'` literals that feed updateMessage/
  // persistMessage/addMessage — model PROMPTS (sent to the AI, never shown)
  // are built in template literals passed as `prompt:` and are excluded.
  return [...panel.matchAll(/(?:const (?:msg|errMsg)\s*=|content:)\s*(['"])((?:\\.|(?!\1).)*)\1/g)].map(m => m[2])
}

describe('customer-facing chat copy', () => {
  it.each(englishDictValues())('dictionary %s follows the copy rules', (_key, value) => {
    for (const [re, why] of BANNED) expect(re.test(value), `${why}: "${value}"`).toBe(false)
  })
  it('ChatPanel bubble literals follow the copy rules', () => {
    const lits = bubbleLiterals()
    // The scan must actually see the bubbles it guards (escaped quotes included).
    expect(lits.some(l => l.includes('Tap Retry to run it again'))).toBe(true)
    expect(lits.some(l => l.includes('live in the preview'))).toBe(true)
    for (const lit of lits) for (const [re, why] of BANNED) expect(re.test(lit), `${why}: "${lit}"`).toBe(false)
  })
})
