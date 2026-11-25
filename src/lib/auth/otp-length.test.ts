import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { EMAIL_CODE_LENGTH, EMAIL_CODE_MIN_LENGTH } from './otp-length'

// 16 Nov: the emailed sign-in code is 8 digits (86273019), the sign-in screen had 6 boxes and sent only the first six, so every email
// sign-in failed. These tests keep the screen, the styles and the WhatsApp linking flow on the one shared code length.
const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

describe('emailed sign-in code length', () => {
  it('is 8, with a lower bound of 6 for a shorter Supabase setting', () => {
    expect(EMAIL_CODE_LENGTH).toBe(8)
    expect(EMAIL_CODE_MIN_LENGTH).toBe(6)
  })

  it('the sign-in screen has no hard-coded 6 left: boxes, paste spread, arrows, submit and copy all use the shared length', () => {
    const src = read('src/components/signal/AuthForm.tsx')
    expect(src).toContain("from '@/lib/auth/otp-length'")
    expect(src).not.toMatch(/'', '', '', '', '', ''/)
    expect(src).not.toMatch(/slice\(0, 6 - i\)/)
    expect(src).not.toMatch(/Math\.min\(i \+ d\.length, 5\)/)
    expect(src).not.toMatch(/c\.length === 6/)
    expect(src).not.toMatch(/6 digit code/)
    expect(src).toMatch(/maxLength=\{i === 0 \? EMAIL_CODE_LENGTH : 1\}/)
  })

  it('the styles lay out one box per digit', () => {
    expect(read('src/styles/signal.css')).toMatch(/\.sg-otps \{ display: grid; grid-template-columns: repeat\(8, 1fr\)/)
  })

  it('the WhatsApp linking flow accepts the real 8-digit code and a 6-digit one, and nothing else', () => {
    const src = read('src/lib/whatsapp/identity.ts')
    expect(src).toContain("from '@/lib/auth/otp-length'")
    expect(src).not.toContain('\\d{6}$')
    const re = new RegExp(`^\\d{${EMAIL_CODE_MIN_LENGTH},${EMAIL_CODE_LENGTH}}$`)
    expect(re.test('86273019')).toBe(true)
    expect(re.test('862730')).toBe(true)
    expect(re.test('8627301')).toBe(true)
    expect(re.test('12345')).toBe(false)
    expect(re.test('123456789')).toBe(false)
    expect(re.test('12a45678')).toBe(false)
  })
})
