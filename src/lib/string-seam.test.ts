import { describe, it, expect } from 'vitest'
import { transform } from 'esbuild'
import { repairStringSeams } from './string-seam'

const broken = [
  `export function Tabs({ tab, setTab, tabs }) {`,
  `  return tabs.map(([id, label]) => (`,
  `    <button key={id} onClick={() => setTab(id)}`,
  `      className={cx('whitespace-nowrap px-3 text-sm border-b-2', tab === id ? 'border-`,
  ``,
  `primary text-foreground font-medium' : 'border-transparent text-muted-foreground')}>`,
  `      {label}`,
  `    </button>`,
  `  ))`,
  `}`,
  ``,
].join('\n')

describe('repairStringSeams', () => {
  it('rejoins a string split by a newline at a token-limit seam (the 16 Nov Screens.tsx case)', async () => {
    const r = repairStringSeams('src/components/Screens.tsx', broken)
    expect(r.repaired).toBe(1)
    expect(r.content).toContain(`'border-primary text-foreground font-medium' : 'border-transparent`)
    // the broken input does not compile; the repaired one does
    await expect(transform(broken, { loader: 'tsx', jsx: 'automatic' })).rejects.toBeTruthy()
    await expect(transform(r.content, { loader: 'tsx', jsx: 'automatic' })).resolves.toBeTruthy()
  })

  it('handles a double-quoted string and no blank line between the halves', async () => {
    const src = `const label = cond ? "Add a mem\nber to the list" : "None"\nexport default label\n`
    const r = repairStringSeams('a.ts', src)
    expect(r.repaired).toBe(1)
    expect(r.content).toContain('"Add a member to the list"')
    await expect(transform(r.content, { loader: 'ts' })).resolves.toBeTruthy()
  })

  it('leaves valid code untouched', () => {
    const ok = `const a = 'x'\nconst b = "y"\nconst c = cond ? 'a' : 'b'\nexport { a, b, c }\n`
    expect(repairStringSeams('a.ts', ok)).toEqual({ content: ok, repaired: 0 })
  })

  it('does not treat an apostrophe in JSX text as a string', () => {
    const jsx = `export const A = () => (\n  <p>Don't forget\n\n  to save</p>\n)\n`
    expect(repairStringSeams('a.tsx', jsx).repaired).toBe(0)
  })

  it('leaves a JSX attribute string that spans lines (legal) alone', () => {
    const jsx = `export const A = () => (\n  <div className="flex gap-2\n\n    items-center">x</div>\n)\n`
    expect(repairStringSeams('a.tsx', jsx).repaired).toBe(0)
  })

  it('leaves multi-line template literals alone', () => {
    const t = 'const q = `select *\n\nfrom t where a = \'x\'`\n'
    expect(repairStringSeams('a.ts', t).repaired).toBe(0)
  })

  it('leaves a backslash line continuation and comments alone', () => {
    const a = `const s = 'abc\\\n  def'\n`
    const b = `// it's a note\n\nconst x = 1\n`
    expect(repairStringSeams('a.ts', a).repaired).toBe(0)
    expect(repairStringSeams('a.ts', b).repaired).toBe(0)
  })

  it('only acts when the next non-blank line really closes the string', () => {
    const src = `const a = cond ? 'open\n\nnothing closes here\nconst b = 1\n`
    expect(repairStringSeams('a.ts', src).repaired).toBe(0)
  })

  it('ignores non-code files', () => {
    expect(repairStringSeams('a.css', broken).repaired).toBe(0)
    expect(repairStringSeams('a.md', broken).repaired).toBe(0)
  })
})
