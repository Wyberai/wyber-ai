// Builds the file-list context sent to the auto-fix model, prioritizing the
// file the build error actually points to. Pure logic, extracted for testing —
// see route.ts for how this integrates with the actual Anthropic call.
//
// Previously this concatenated files in plain object-iteration order and only
// truncated the WHOLE joined string at the end with a 12000-CHARACTER budget
// (~3000 tokens — absurdly small for a Haiku call, which comfortably handles
// 200K input tokens). On any project with more than ~5-6 files, or any single
// file bigger than a few hundred lines, the actual broken file could start
// past the cutoff and never reach the model at all. Confirmed live: a real
// "Unterminated regular expression" bug sat at char 26558 of a 30220-char
// file, itself starting at char 12619 in a 10-file project — the fix model
// never saw the file's content, and two consecutive fix attempts silently did
// nothing.
export const AUTO_FIX_GLOBAL_BUDGET = 60000
const OTHER_FILE_CAP = 3000

/**
 * fileName comes from a regex over the raw build error, which usually names
 * an absolute path (e.g. /tmp/wyber-work/<hash>/src/pages/Foo.tsx) — it will
 * almost never equal a project-relative path exactly, but the absolute path
 * always ENDS WITH it. Check both directions plus a basename fallback so a
 * path that got extracted oddly still matches.
 */
export function findNamedEntry(
  entries: [string, string][],
  fileName: string | undefined,
): [string, string] | undefined {
  if (!fileName) return undefined
  return entries.find(([path]) =>
    path === fileName
    || fileName.endsWith(path)
    || path.endsWith(`/${fileName}`)
    || path.split('/').pop() === fileName.split('/').pop(),
  )
}

/**
 * Puts the named (erroring) file FIRST with no per-file cap — its own length
 * is the only limit — then fills the rest of the global budget with other
 * files (each capped) for cross-reference context.
 */
export function buildFixFileList(
  files: Record<string, string>,
  fileName: string | undefined,
  budget: number = AUTO_FIX_GLOBAL_BUDGET,
): string {
  const entries = Object.entries(files)
  const namedEntry = findNamedEntry(entries, fileName)
  const ordered = namedEntry ? [namedEntry, ...entries.filter(([path]) => path !== namedEntry[0])] : entries
  let remaining = budget
  return ordered
    .map(([path, content], i) => {
      if (remaining <= 0) return null
      const perFileCap = i === 0 && namedEntry ? remaining : Math.min(remaining, OTHER_FILE_CAP)
      const slice = content.slice(0, perFileCap)
      remaining -= slice.length
      return `--- ${path} ---\n${slice}`
    })
    .filter((s): s is string => s !== null)
    .join('\n\n')
}
