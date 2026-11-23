// What really happened to an edit turn. Before this, a turn whose <edit> blocks never matched the file (or matched and changed nothing)
// still closed with the model's cheerful recap and the user saw "done" next to an unchanged page (live, 23 Nov: 7 of 50 requests).
// Every outcome now has an honest, plain message, and a failed match retries once with the real file content.

export interface EditOutcomeInput {
  /** Number of <edit> blocks the model wrote. */
  editBlockCount: number
  /** Number of whole <file> blocks the model wrote. */
  newFileCount: number
  /** Files whose content really changed after applying the edits. */
  changedPathCount: number
  /** Files whose edits could not be matched. */
  failedPathCount: number
}

export type EditOutcome =
  | 'no-blocks'      // the model wrote no changes at all
  | 'applied'        // something really changed
  | 'unmatched'      // edits were written but none could be placed: a retry is needed
  | 'already-there'  // edits matched but left the page exactly as it was

export function classifyEditTurn(i: EditOutcomeInput): EditOutcome {
  if (i.newFileCount > 0 || i.changedPathCount > 0) return 'applied'
  if (i.editBlockCount === 0) return 'no-blocks'
  if (i.failedPathCount > 0) return 'unmatched'
  return 'already-there'
}

export const ALREADY_THERE_MSG = 'That is already on the page, so I left it as it is. If you want it to look or work differently, tell me what to change.'
export const EDIT_RETRY_MSG = 'That change did not fit the page on the first try. Making it again a different way.'
export const EDIT_GAVE_UP_MSG = 'I could not make that change safely. Nothing was changed on your page. Tell me the exact section and the wording you want and I will do it.'

const PER_FILE_LIMIT = 30_000

/** Retry prompt for edits that did not match: hands the model the real current content of the files so it rewrites against the truth. */
export function buildEditRetryPrompt(
  failedPaths: string[],
  files: Record<string, { content?: string } | string>,
  userRequest: string,
): string {
  const blocks = failedPaths.slice(0, 2).map(p => {
    const raw = files[p]
    const content = typeof raw === 'string' ? raw : raw?.content ?? ''
    const shown = content.length > PER_FILE_LIMIT ? content.slice(0, PER_FILE_LIMIT) + '\n/* ... file continues ... */' : content
    return `CURRENT CONTENT OF ${p}:\n${shown}`
  })
  return `Some edits could not be applied automatically because the text they searched for is not in the file. The request was: "${userRequest.slice(0, 400)}". `
    + `Output the COMPLETE updated <file> block (full file contents, not a diff) for each of these files: ${failedPaths.join(', ')}. `
    + `If the page already does what was asked, write one plain sentence starting with "Already on the page:" and no blocks. `
    + `Start from the real current content below.\n\n${blocks.join('\n\n')}\n\n`
    + 'AUTOMATED CONTINUATION: after the last </file> tag, write ZERO additional words.'
}

/** Retry prompt for a reply that wrote no changes and no explanation. */
export function buildNoChangeRetryPrompt(userRequest: string): string {
  return `Your last reply changed nothing on the page. The request was: "${userRequest.slice(0, 600)}". `
    + 'Read the current files again and make the change now. Output each changed file as a COMPLETE <file> block (full contents, not a diff). '
    + 'If the page already does this, write one plain sentence starting with "Already on the page:" saying where, and write no blocks. '
    + 'If it cannot be done (for example it needs real data you do not have), say so in one or two plain sentences and write no blocks.'
}
