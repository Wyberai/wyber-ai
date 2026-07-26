import { describe, it, expect } from 'vitest'
import { toolCallToTag } from './openai-coding'

describe('toolCallToTag', () => {
  it('converts a write_file call into a <file> tag matching the client-parsed wire format', () => {
    const tag = toolCallToTag('write_file', JSON.stringify({ path: 'src/App.tsx', content: 'export default function App() { return null }' }))
    expect(tag).toBe('<file path="src/App.tsx">\nexport default function App() { return null }\n</file>\n')
  })

  it('converts an edit_file call into an <edit> SEARCH/REPLACE tag', () => {
    const tag = toolCallToTag('edit_file', JSON.stringify({ path: 'src/App.tsx', search: 'old line', replace: 'new line' }))
    expect(tag).toBe('<edit path="src/App.tsx">\n<<<<<<< SEARCH\nold line\n=======\nnew line\n>>>>>>> REPLACE\n</edit>\n')
  })

  it('returns empty string for malformed JSON instead of throwing', () => {
    expect(toolCallToTag('write_file', 'not valid json{{{')).toBe('')
  })

  it('returns empty string for a write_file call missing required fields', () => {
    expect(toolCallToTag('write_file', JSON.stringify({ path: 'src/App.tsx' }))).toBe('')
  })

  it('returns empty string for an edit_file call missing required fields', () => {
    expect(toolCallToTag('edit_file', JSON.stringify({ path: 'src/App.tsx', search: 'x' }))).toBe('')
  })

  it('returns empty string for an unknown tool name', () => {
    expect(toolCallToTag('delete_file', JSON.stringify({ path: 'src/App.tsx' }))).toBe('')
  })

  it('handles multi-line file content correctly', () => {
    const content = 'line1\nline2\nline3'
    const tag = toolCallToTag('write_file', JSON.stringify({ path: 'a.ts', content }))
    expect(tag).toContain('line1\nline2\nline3')
    expect(tag.startsWith('<file path="a.ts">\n')).toBe(true)
    expect(tag.endsWith('</file>\n')).toBe(true)
  })
})
