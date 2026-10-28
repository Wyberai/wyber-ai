import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

import { BANNED_COPY as BANNED } from '../customer-copy-rules'

// The pre-push hook runs this suite: a reintroduced banned phrase in our own
// chat copy fails the push. Rules + rationale live in customer-copy-rules.ts.

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
