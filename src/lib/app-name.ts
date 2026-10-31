// Validates the cheap model's reply in /api/projects/auto-name. The model
// sometimes answers the prompt instead of naming it (refusals, "I need more
// context", markdown headings, whole code files), and those replies were being
// saved as project names. Returns a clean 2-6 word name, or null to keep the
// current name.

const REFUSAL_RE = /^(i |i'm|i’m|i've|sorry|unfortunately|as an ai|could you|please |here('s| is)|sure\b|certainly)/i

export function cleanAppName(raw: string): string | null {
  if (!raw || raw.includes('```')) return null
  const firstLine = raw.trim().split(/\r?\n/)[0] ?? ''
  const name = firstLine
    .replace(/^#+\s*/, '')
    .replace(/^["'“”‘’*_`]+|["'“”‘’*_`.]+$/g, '')
    .trim()
  if (!name || name.length > 40) return null
  if (REFUSAL_RE.test(name)) return null
  if (/[<>{}=;]|https?:/i.test(name)) return null
  const words = name.split(/\s+/).length
  if (words > 6) return null
  return name
}
