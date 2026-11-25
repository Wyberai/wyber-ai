import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const src = fs.readFileSync(path.join(process.cwd(), 'src/app/agencies/page.tsx'), 'utf8')

// The agency page makes promises to people who put their own clients on it, so each one is pinned to how the product works.
describe('the agency page promises only what the product does', () => {
  it('says the freelancer pays for builds and the client is never charged', () => {
    expect(src).toContain('You do, from your own credits')
    expect(src).toContain('Your client is never charged by WyberAi')
  })
  it('is honest that payment is manual and a custom domain needs a paid plan', () => {
    expect(src).toContain('Not today. Quotes and invoices are for you to send')
    expect(src).toContain('needs a paid plan')
  })
  it('does not claim the platform emails clients on its own', () => {
    expect(src).toContain('Emails go out when you press send')
    expect(src).not.toMatch(/automatic(ally)? (email|remind|chase)/i)
  })
  it('gets its free-credit number from the shared constant, not a typed copy', () => {
    expect(src).toContain('${FREE_CREDITS}')
    expect(src).not.toMatch(/\b30 credits\b/)
  })
})
