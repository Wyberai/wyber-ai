import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { repairBlankBrandPanel } from './auth-brand-panel'
import { sanitizeFiles } from './sanitize-files'

// The real Login.tsx from the published "Ironclad Coaching Ops" app (16 Nov): overlay and grain, no picture.
const real = readFileSync(join(__dirname, 'auth-brand-panel.fixture.txt'), 'utf8').replace(/\r\n/g, '\n') // a Windows checkout can turn the fixture into CRLF

describe('repairBlankBrandPanel', () => {
  it('puts a picture under the overlay of the real broken Login.tsx', () => {
    const r = repairBlankBrandPanel('src/pages/auth/Login.tsx', real)
    expect(r.repaired).toBe(1)
    expect(r.content).toContain('{{wyber-image:')
    expect(r.content).toContain('Ironclad Coaching Ops')
    expect(r.content).toMatch(/<img src="\{\{wyber-image:[^}]*\| 9:16\}\}" alt="" className="absolute inset-0 h-full w-full object-cover" \/>/)
    // the picture comes before the overlay, so the overlay still sits on top of it
    expect(r.content.indexOf('<img src="{{wyber-image')).toBeLessThan(r.content.indexOf('bg-gradient-to-t from-black/85'))
    // nothing else changed
    expect(r.content.replace(/\s*<img src="\{\{wyber-image[^\n]*\n/, '\n')).toBe(real)
  })

  it('is idempotent: a repaired file is left alone', () => {
    const once = repairBlankBrandPanel('src/pages/auth/Login.tsx', real).content
    const twice = repairBlankBrandPanel('src/pages/auth/Login.tsx', once)
    expect(twice.repaired).toBe(0)
    expect(twice.content).toBe(once)
  })

  it('leaves the generator template untouched (it already has its image)', () => {
    const tpl = `<div className="relative hidden lg:flex flex-col overflow-hidden grain">
        <img src="{{wyber-image: x | 9:16}}" alt="Brand" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15" />
      </div>`
    expect(repairBlankBrandPanel('src/pages/auth/Login.tsx', tpl).repaired).toBe(0)
  })

  it('leaves a panel with a real image URL or video alone', () => {
    const withUrl = `<div className="relative grain"><img src="https://example.com/a.jpg" className="absolute inset-0" /><div className="absolute inset-0 bg-gradient-to-t from-black/80" /></div>`
    const withVideo = `<div className="relative grain"><video src="/a.mp4" /><div className="absolute inset-0 bg-gradient-to-t from-black/80" /></div>`
    expect(repairBlankBrandPanel('src/pages/auth/Login.tsx', withUrl).repaired).toBe(0)
    expect(repairBlankBrandPanel('src/pages/auth/Login.tsx', withVideo).repaired).toBe(0)
  })

  it('ignores files that are not sign-in screens', () => {
    expect(repairBlankBrandPanel('src/pages/Dashboard.tsx', real).repaired).toBe(0)
    expect(repairBlankBrandPanel('src/components/Hero.tsx', real).repaired).toBe(0)
  })

  it('ignores a gradient that is not directly on a grain panel (a card overlay)', () => {
    const card = `<div className="relative rounded-xl"><div className="absolute inset-0 bg-gradient-to-t from-black/60" /></div>`
    expect(repairBlankBrandPanel('src/pages/auth/Login.tsx', card).repaired).toBe(0)
  })

  it('still repairs when no brand name can be found', () => {
    const bare = `<div className="relative grain">\n  <div className="absolute inset-0 bg-gradient-to-t from-black/85" />\n</div>`
    const r = repairBlankBrandPanel('src/pages/auth/Login.tsx', bare)
    expect(r.repaired).toBe(1)
    expect(r.content).toContain('atmospheric editorial photograph')
  })

  it('runs inside sanitizeFiles so preview, publish and export all heal the file', () => {
    const out = sanitizeFiles({ 'src/pages/auth/Login.tsx': real, 'index.html': '<html></html>' })
    const login = out['src/pages/auth/Login.tsx']
    const text = typeof login === 'string' ? login : (login.content ?? '')
    // sanitizeFiles turns the token into its preview stand-in, so the panel now holds a real <img> above the overlay
    expect(text).toMatch(/<img src="data:image\/svg[^>]*object-cover/)
    expect(text.indexOf('<img src="data:image')).toBeLessThan(text.indexOf('bg-gradient-to-t from-black/85'))
  })
})
