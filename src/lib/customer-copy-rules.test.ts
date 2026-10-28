import { describe, it, expect } from 'vitest'
import { breaksCopyRules, scrubCopy } from './customer-copy-rules'

// Every case here is a real reply a customer saw (or nearly saw) on prod.
describe('breaksCopyRules — live replies that must be caught', () => {
  it.each([
    "I haven't opened the preview to check it yet.",
    "I haven't run the app, so none of this is tested yet.",
    'Something interrupted your build — retrying automatically…',
    'Your connection dropped mid-build (this happens when the computer sleeps or wifi blips).',
    'I added the three missing pieces (AddTodoForm, TodoList, TodoItem).',
    '✓ Finished applying the remaining files — the build is complete.',
  ])('%s', (line) => {
    expect(breaksCopyRules(line)).not.toBeNull()
  })
})

describe('breaksCopyRules — normal recaps stay', () => {
  it.each([
    'Added a dark mode toggle to the header.',
    "The edit dialog didn't open on mobile — fixed that, it now slides up.",
    'Tags now show as colored chips on Board cards and List rows.',
    'Done — it\'s live in the preview. Tell me what to change next.',
  ])('%s', (line) => {
    expect(breaksCopyRules(line)).toBeNull()
  })
})

describe('scrubCopy', () => {
  it('drops only the offending sentence', () => {
    expect(scrubCopy("I added five colored category tags to Tickoff and a way to filter your tasks by them. I haven't opened the preview to check it yet."))
      .toBe('I added five colored category tags to Tickoff and a way to filter your tasks by them.')
  })
  it('leaves clean lines untouched', () => {
    const l = '- **Tags:** Urgent (red), Deep work (blue).'
    expect(scrubCopy(l)).toBe(l)
  })
})
