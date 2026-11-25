import { describe, it, expect } from 'vitest'
import { resolveDirectivesForPreview } from './image-directives'

describe('dynamic image tokens', () => {
  it('turns a runtime-built token into a placeholder, never a broken src', () => {
    const src = 'const P=({prompt,ratio})=><img src={`{{wyber-image: ${prompt} | ${ratio}}}`} />'
    const out = resolveDirectivesForPreview(src)
    expect(out).not.toContain('wyber-image')
    expect(out).toContain('data:image/svg+xml')
  })
  it('still resolves literal tokens per prompt', () => {
    const out = resolveDirectivesForPreview('<img src="{{wyber-image: a lake | 16:9}}" />')
    expect(out).toContain('data:image/svg+xml')
    expect(out).not.toContain('wyber-image')
  })
})
