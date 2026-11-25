// Repairs one specific corruption: a newline spliced into the middle of a quoted string where a model's output was cut at the
// token limit and continued. Seen on 16 Nov in a 62 KB Screens.tsx:
//
//     className={cx('whitespace-nowrap ... ', tab === id ? 'border-
//
//     primary text-foreground font-medium' : 'border-transparent ...')}
//
// A '…' or "…" string cannot span lines in TS/JS, so the build failed with "Unterminated string literal".
//
// High precision by design — it only acts when ALL of these hold, so valid code is never touched:
//   - the file is .ts/.tsx/.js/.jsx
//   - a line ends inside a ' or " string that opens in a CODE position (after ( , ? : = [ { & | or a space-padded =),
//     never as a JSX attribute value (class="…" may legally span lines) and never as JSX text (an apostrophe in prose)
//   - the line does not end with a backslash (a legal line continuation)
//   - the next non-blank line contains the closing quote of that same kind
// Then the line, the blank lines and that next line are joined. Backtick (template) strings may span lines and are left alone.
// Pure and dependency-free.

const CODE_FILE = /\.(tsx?|jsx?)$/i

/** If `line` ends inside an open ' or " string opened in a code position, return the quote char, else null. */
function openQuoteAtEol(line: string): string | null {
  let quote: string | null = null
  let openedAt = -1
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quote) {
      if (ch === '\\') { i++; continue }
      if (ch === quote) quote = null
      continue
    }
    if (ch === '`') {
      // a template literal on this line: skip to its end (or give up if it runs past the line — those may span lines)
      const end = line.indexOf('`', i + 1)
      if (end === -1) return null
      i = end
      continue
    }
    if (ch === '/' && line[i + 1] === '/') return null // line comment: the rest is prose
    if (ch === '"' || ch === "'") { quote = ch; openedAt = i }
  }
  if (!quote) return null
  if (line.endsWith('\\')) return null
  const before = line.slice(0, openedAt)
  // JSX attribute value: name="…" with no spaces around the equals sign. Legal across lines.
  if (/[A-Za-z0-9_-]=$/.test(before)) return null
  // Must follow a code position, not prose.
  if (!/(?:[(,?:\[{&|]|[^=!<>]=|=>|return|\?\?)\s*$/.test(before)) return null
  return quote
}

export function repairStringSeams(path: string, content: string): { content: string; repaired: number } {
  if (!content || !CODE_FILE.test(path) || content.indexOf('\n') === -1) return { content, repaired: 0 }
  const lines = content.split('\n')
  const out: string[] = []
  let repaired = 0
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    // Repeat for the (unlikely) case of several seams on one line.
    for (let guard = 0; guard < 3; guard++) {
      const q = openQuoteAtEol(line)
      if (!q) break
      let j = i + 1
      while (j < lines.length && lines[j].trim() === '') j++
      if (j >= lines.length) break
      const next = lines[j]
      // The continuation must close the string: its first quote of this kind must come before any other string would be misread.
      const closeAt = indexOfUnescaped(next, q)
      if (closeAt === -1) break
      line = line + next.replace(/^\s+/, '')
      i = j
      repaired++
    }
    out.push(line)
  }
  return repaired === 0 ? { content, repaired: 0 } : { content: out.join('\n'), repaired }
}

function indexOfUnescaped(s: string, q: string): number {
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\') { i++; continue }
    if (s[i] === q) return i
  }
  return -1
}
