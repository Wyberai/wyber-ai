import { describe, it, expect } from 'vitest'
import { findHeroImage, heroPrompt, siteSubject } from './hero-upsell'

const URL1 = 'https://abc.supabase.co/storage/v1/object/public/generated-images/p1/hero.png'
const URL2 = 'https://abc.supabase.co/storage/v1/object/public/generated-images/p1/second.png'

describe('findHeroImage', () => {
  it('returns the picture from the entry component before one further down', () => {
    const files = {
      'src/components/Footer.tsx': { content: `<img src="${URL2}" />` },
      'src/App.tsx': { content: `<img src="${URL1}" />` },
    }
    expect(findHeroImage(files)).toBe(URL1)
  })
  it('returns null when the site has no generated picture', () => {
    expect(findHeroImage({ 'src/App.tsx': { content: '<h1>Hi</h1>' } })).toBeNull()
  })
})

describe('heroPrompt', () => {
  const files = {
    'index.html': { content: '<title>Property and Family Law Firm in Pune</title><meta name="description" content="A small law firm for people dealing with a property dispute or a family matter.">' },
  }
  it('names the business in the owner\'s words', () => {
    expect(siteSubject(files)).toContain('Property and Family Law Firm in Pune')
    expect(heroPrompt(files)).toContain('law firm')
  })
  it('asks for room for a headline and forbids text, logos and faces', () => {
    const p = heroPrompt(files)
    expect(p).toMatch(/empty space on the left/i)
    expect(p).toMatch(/no text/i)
    expect(p).toMatch(/no people's faces/i)
  })
  it('falls back to the project name, then to a plain description, and never injects markup', () => {
    expect(heroPrompt({}, 'Pune <script>x</script> Law')).not.toMatch(/<script>/)
    expect(heroPrompt({})).toContain('small local business')
  })
})
