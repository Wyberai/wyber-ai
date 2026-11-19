import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

describe('free-pass daily cap (16 Nov)', () => {
  const src = read('src/app/api/generate/route.ts')
  it('caps free passes per user per day on top of the hourly cap', () => {
    expect(src).toMatch(/const FREE_PASSES_PER_HOUR = 60/)
    expect(src).toMatch(/const FREE_PASSES_PER_DAY = 150/)
    expect(src).toMatch(/\(dayCount \?\? 0\) >= FREE_PASSES_PER_DAY/)
  })
  it('counts the day window over the same free-pass rows the insert writes', () => {
    const block = src.slice(src.indexOf('const FREE_PASSES_PER_DAY'), src.indexOf('const FREE_PASSES_PER_DAY') + 700)
    expect(block).toMatch(/reason', 'free-pass'/)
    expect(block).toMatch(/24 \* 3600_000/)
  })
})

describe('stuck "working" bubble watchdog (16 Nov)', () => {
  const src = read('src/components/editor/ChatPanel.tsx')
  it('closes assistant bubbles left streaming when nothing is generating', () => {
    expect(src).toMatch(/Watchdog for a "working" bubble nothing is working on/)
    expect(src).toMatch(/if \(isGenerating\) return;\s*const stuck = messages\.filter\(m => m\.role === 'assistant' && m\.status === 'streaming'\)/)
  })
  it('never fires while a generation is running again, and waits longer for the dropped-connection rescue', () => {
    expect(src).toMatch(/if \(useEditorStore\.getState\(\)\.isGenerating\) return;/)
    expect(src).toMatch(/m\.content \? 270_000 : 45_000/)
  })
})

describe('string split by a newline at a token-limit seam is repaired (16 Nov)', () => {
  it('is applied where the editor writes files, where the preview builds, and in sanitizeFiles', () => {
    expect(read('src/components/editor/ChatPanel.tsx')).toMatch(/repairStringSeams\(path, rawContent\)\.content/)
    expect(read('src/components/editor/PreviewPanel.tsx')).toMatch(/repairStringSeams\(path, content\)\.content/)
    expect(read('src/lib/sanitize-files.ts')).toMatch(/repairStringSeams\(p, text\)/)
  })
  it('the continuation prompt tells the model not to open with a newline inside a string', () => {
    expect(read('src/app/api/generate/route.ts')).toMatch(/continue that string on the SAME line/)
  })
})
