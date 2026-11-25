import { describe, expect, it } from 'vitest'
import { applyEdits } from './patch-applier'
import { classifyEditTurn } from './edit-outcome'

describe('an edit with an empty SEARCH', () => {
  it('is a failed edit, never a silent skip', () => {
    const r = applyEdits({ 'src/a.tsx': { content: 'export const a = 1\n' } }, [{ path: 'src/a.tsx', search: '', replace: 'export const b = 2\n' }])
    expect(r.failedPaths).toEqual(['src/a.tsx'])
    expect(Object.keys(r.updated)).toEqual([])
  })
  it('so the turn is classified unmatched (a retry with the real file) and not "already on the page"', () => {
    const r = applyEdits({ 'src/a.tsx': { content: 'x' } }, [{ path: 'src/a.tsx', search: '', replace: 'y' }])
    expect(classifyEditTurn({ editBlockCount: 1, newFileCount: 0, changedPathCount: Object.keys(r.updated).length, failedPathCount: r.failedPaths.length })).toBe('unmatched')
  })
  it('real edits in the same file still apply when every block matches', () => {
    const r = applyEdits({ 'src/a.tsx': { content: 'one two' } }, [{ path: 'src/a.tsx', search: 'one', replace: '1' }])
    expect(r.updated['src/a.tsx']).toBe('1 two')
  })
})
