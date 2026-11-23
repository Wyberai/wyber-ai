import { describe, it, expect } from 'vitest'
import { applyEdits } from './patch-applier'
import { classifyEditTurn, buildEditRetryPrompt, buildNoChangeRetryPrompt, ALREADY_THERE_MSG, EDIT_RETRY_MSG, EDIT_GAVE_UP_MSG } from './edit-outcome'
import { explainableNoChange } from './no-change-reply'

const file = '<footer>\n  <p>Contact</p>\n</footer>\n'
const files = { 'index.html': { content: file } }
const classify = (edits: { path: string; search: string; replace: string }[]) => {
  const r = applyEdits(files, edits)
  return classifyEditTurn({ editBlockCount: edits.length, newFileCount: 0, changedPathCount: Object.keys(r.updated).length, failedPathCount: r.failedPaths.length })
}

describe('classifyEditTurn with the real patch applier', () => {
  it('applied: the search text is found and the page changes', () => {
    expect(classify([{ path: 'index.html', search: '<p>Contact</p>', replace: '<p>Contact</p>\n<a href="/privacy">Privacy</a>' }])).toBe('applied')
  })
  it('unmatched: the search text is not in the file', () => {
    expect(classify([{ path: 'index.html', search: '<p>Phone</p>', replace: '<p>Phone</p><a>x</a>' }])).toBe('unmatched')
  })
  it('already-there: the edit matches but changes nothing', () => {
    expect(classify([{ path: 'index.html', search: '<p>Contact</p>', replace: '<p>Contact</p>' }])).toBe('already-there')
  })
  it('no-blocks: the model wrote nothing', () => {
    expect(classifyEditTurn({ editBlockCount: 0, newFileCount: 0, changedPathCount: 0, failedPathCount: 0 })).toBe('no-blocks')
  })
  it('a new file counts as applied even when edits failed', () => {
    expect(classifyEditTurn({ editBlockCount: 1, newFileCount: 1, changedPathCount: 0, failedPathCount: 1 })).toBe('applied')
  })
})

describe('retry prompts', () => {
  it('hands the model the real file content and the request', () => {
    const p = buildEditRetryPrompt(['index.html'], files, 'add a skip-to-content link')
    expect(p).toContain('<footer>')
    expect(p).toContain('skip-to-content')
    expect(p).toContain('Already on the page:')
  })
  it('caps very large files', () => {
    const big = { 'a.css': { content: 'x'.repeat(100_000) } }
    expect(buildEditRetryPrompt(['a.css'], big, 'r').length).toBeLessThan(40_000)
  })
  it('the no-change retry names the request and the honest exits', () => {
    const p = buildNoChangeRetryPrompt('add alt text to all images')
    expect(p).toContain('alt text')
    expect(p).toContain('Already on the page:')
  })
  it('user-facing messages name no code or files', () => {
    for (const m of [ALREADY_THERE_MSG, EDIT_RETRY_MSG, EDIT_GAVE_UP_MSG]) expect(m).not.toMatch(/\.(tsx?|css|html|json)\b|<edit|SEARCH/i)
  })
})

describe('an honest "already" answer is shown, not replaced by the canned error', () => {
  it('short already-on-the-page reply passes', () => {
    expect(explainableNoChange('Already on the page: the footer has a privacy link under Contact.')).toMatch(/Already on the page/)
  })
  it('still hides a false success claim', () => {
    expect(explainableNoChange("I've added the sticky bar to the page and it now shows on mobile screens, all set for you.")).toBeNull()
  })
})
