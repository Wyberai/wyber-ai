import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { buildWyberCodeAnnouncement, type WyberCodeAnnouncementKind } from './index'
import { PLAN_FACTS, TOPUP_PACKS } from '@/lib/plans'

const KINDS: WyberCodeAnnouncementKind[] = ['spark-subscriber', 'builder', 'newcomer']
const n = (v: number) => v.toLocaleString('en-US')

describe('WyberCode 1.0 announcement email', () => {
  for (const kind of KINDS) {
    const mail = buildWyberCodeAnnouncement(kind, 'asha@example.com', { name: 'Asha Patel' })

    it(`${kind}: has a subject, a preheader, an HTML body and a plain-text twin`, () => {
      expect(mail.subject.length).toBeGreaterThan(10)
      expect(mail.preheader.length).toBeGreaterThan(10)
      expect(mail.html).toContain('<table')
      expect(mail.text.length).toBeGreaterThan(200)
    })

    it(`${kind}: carries the signed unsubscribe link in both versions`, () => {
      expect(mail.html).toMatch(/\/unsubscribe\?e=asha%40example\.com&t=[0-9a-f]{32}/)
      expect(mail.text).toMatch(/Unsubscribe: .*\/unsubscribe\?e=asha%40example\.com&t=[0-9a-f]{32}/)
    })

    it(`${kind}: greets by first name and makes no claim we cannot back`, () => {
      expect(mail.html).toContain('Hi Asha,')
      for (const banned of [/claude|anthropic|sonnet|opus|haiku/i, /trained/i, /our own model/i, /\bfaster\b/i, /earn|income|make money/i]) {
        expect(mail.html).not.toMatch(banned)
        expect(mail.text).not.toMatch(banned)
      }
    })
  }

  it('every number comes from the plan file', () => {
    const spark = buildWyberCodeAnnouncement('spark-subscriber', 'a@example.com', {})
    expect(spark.html).toContain(`${n(PLAN_FACTS.spark.credits)} credits a month`)
    const builder = buildWyberCodeAnnouncement('builder', 'a@example.com', {})
    expect(builder.html).toContain(`Starter ${n(PLAN_FACTS.starter.credits)}`)
    expect(builder.html).toContain(`Builder ${n(PLAN_FACTS.builder.credits)}`)
    expect(builder.html).toContain(`Pro ${n(PLAN_FACTS.pro.credits)}`)
    for (const t of TOPUP_PACKS) expect(builder.html).toContain(n(t.credits))
    const newcomer = buildWyberCodeAnnouncement('newcomer', 'a@example.com', {})
    expect(newcomer.html).toContain(`${n(PLAN_FACTS.free.credits)} free credits`)
  })

  it('the Spark email says whether the extra credits were added today', () => {
    const later = buildWyberCodeAnnouncement('spark-subscriber', 'a@example.com', {})
    const now = buildWyberCodeAnnouncement('spark-subscriber', 'a@example.com', { extraCreditsAdded: true })
    expect(later.html).toContain('It applies from your next renewal')
    expect(later.html).not.toContain('added the extra 100 credits')
    expect(now.html).toContain('added the extra 100 credits to your balance today')
    expect(now.html).not.toContain('It applies from your next renewal')
  })

  it('works without a name', () => {
    expect(buildWyberCodeAnnouncement('builder', 'a@example.com', {}).html).toContain('Hi,')
  })

  // Preview helper: EMAIL_PREVIEW_DIR=<folder> npx vitest run src/lib/email/wybercode-announcement.test.ts
  it('writes preview files when asked', () => {
    const dir = process.env.EMAIL_PREVIEW_DIR
    if (!dir) return
    fs.mkdirSync(dir, { recursive: true })
    for (const kind of KINDS) {
      const m = buildWyberCodeAnnouncement(kind, 'asha@example.com', { name: 'Asha Patel' })
      fs.writeFileSync(path.join(dir, `${kind}.html`), m.html)
      fs.writeFileSync(path.join(dir, `${kind}.txt`), `Subject: ${m.subject}\nPreheader: ${m.preheader}\n\n${m.text}`)
    }
  })
})
