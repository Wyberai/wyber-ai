import { describe, it, expect } from 'vitest'
import { cleanAppName } from './app-name'

describe('cleanAppName', () => {
  it('keeps normal names', () => {
    expect(cleanAppName('Invoice Generator')).toBe('Invoice Generator')
    expect(cleanAppName('Pipeline CRM')).toBe('Pipeline CRM')
    expect(cleanAppName('"Shot Reel Studio"')).toBe('Shot Reel Studio')
  })

  it('strips a markdown heading', () => {
    expect(cleanAppName('# Sound Atlas')).toBe('Sound Atlas')
    expect(cleanAppName("# ShortsPilot AI\n\nI'll create a production-ready AI YouTube")).toBe('ShortsPilot AI')
  })

  // Real replies that were saved as project names in prod.
  it.each([
    "I can't access external websites or URLs. I can only read",
    'I appreciate the detailed instructions, but I need to clarif',
    'I need more context. Could you clarify what app you\'d like m',
    "I'm waiting for you to describe an app you'd like to build.",
    "I can't help with creating tools designed to steal credentia",
    "# Sound Atlas\n\n```jsx\nimport React, { useState } from 'react",
    'Sorry, that is not something I can name',
  ])('rejects %s', raw => {
    expect(cleanAppName(raw)).toBeNull()
  })

  it('rejects empty and overlong replies', () => {
    expect(cleanAppName('')).toBeNull()
    expect(cleanAppName('One Two Three Four Five Six Seven')).toBeNull()
  })
})
