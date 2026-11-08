import { describe, it, expect, vi, beforeEach } from 'vitest'
import { csvCell, contactsToCsv, filterForExport, EXPORT_COLUMNS, parseCsv } from './csv'
import { splitLinks } from '@/lib/ops/ask/linkify'
import { runTool } from '@/lib/ops/ask/tools'

describe('csvCell', () => {
  it('quotes commas, quotes and line breaks, and joins tags', () => {
    expect(csvCell('plain')).toBe('plain')
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"')
    expect(csvCell(['booth', 'hot'])).toBe('booth; hot')
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
    expect(csvCell(70)).toBe('70')
  })
  it('defuses spreadsheet formulas written by strangers in a public form', () => {
    for (const evil of ['=HYPERLINK("http://evil.example","click")', '+1+1', '-2+3', '@SUM(A1)', '\t=cmd']) {
      expect(csvCell(evil).replace(/^"/, '').startsWith("'"), evil).toBe(true)
    }
    expect(csvCell('a-b')).toBe('a-b') // a dash in the middle is fine
    expect(csvCell('9876543210')).toBe('9876543210')
  })
})

describe('contactsToCsv', () => {
  const c = { name: 'Asha, Patel', company: '=cmd|"/c calc"!A1', title: null, email: 'a@x.in', phone: '9876543210', country: 'India', stage: 'met', source: 'expo', score: 70, value_usd: 0, tags: ['booth'], next_action: null, next_action_at: null, last_touch_at: null, created_at: '2026-11-01', notes: 'two\nlines' }
  it('has a header, one line per contact, and survives a round trip through the importer parser', () => {
    const csv = contactsToCsv([c, { ...c, name: 'Ravi' }])
    const rows = parseCsv(csv)
    expect(rows[0]).toEqual([...EXPORT_COLUMNS])
    expect(rows).toHaveLength(3)
    expect(rows[1][0]).toBe('Asha, Patel')
    expect(rows[1][1].startsWith("'=")).toBe(true) // the formula is neutralised
    expect(rows[1][15]).toBe('two\nlines')
  })
  it('an empty list is just the header', () => {
    expect(parseCsv(contactsToCsv([]))).toEqual([[...EXPORT_COLUMNS]])
  })
})

describe('filterForExport', () => {
  const list = [
    { stage: 'met', source: 'expo', tags: ['booth'], score: 80 }, { stage: 'new', source: 'apollo', tags: [], score: 40 }, { stage: 'met', source: 'consult', tags: [], score: 55 },
  ]
  it('filters by stage, source, tag and minimum score together', () => {
    expect(filterForExport(list, {})).toHaveLength(3)
    expect(filterForExport(list, { stage: 'met' })).toHaveLength(2)
    expect(filterForExport(list, { stage: 'met', source: 'expo' })).toHaveLength(1)
    expect(filterForExport(list, { tag: 'booth' })).toHaveLength(1)
    expect(filterForExport(list, { minScore: 50 })).toHaveLength(2)
    expect(filterForExport(list, { minScore: 0 })).toHaveLength(3)
  })
})

describe('splitLinks: only same-site admin paths ever become links', () => {
  it('links the export path and admin pages inside a sentence', () => {
    const parts = splitLinks('Here: /api/admin/crm/export?stage=met&min_score=50 and also see /admin/crm now.')
    expect(parts.filter(p => p.href).map(p => p.href)).toEqual(['/api/admin/crm/export?stage=met&min_score=50', '/admin/crm'])
    expect(parts.map(p => p.text).join('')).toBe('Here: /api/admin/crm/export?stage=met&min_score=50 and also see /admin/crm now.')
  })
  it('every link target is one of our own admin paths, whatever the text around it says', () => {
    for (const bad of ['https://evil.example/x', 'javascript:alert(1)', '//evil.example/admin/crm', 'https://evil.example/admin/crm', '/api/admin/ask/act', '/api/cron/watchdog', 'data:text/html,x']) {
      for (const p of splitLinks(bad)) {
        if (p.href) { expect(p.href, bad).toMatch(new RegExp('^/(admin/[a-z]+|api/admin/crm/export(\\?[A-Za-z0-9_=&.%-]*)?)$')); expect(p.href).not.toMatch(new RegExp(':|//')) }
      }
    }
    expect(splitLinks('/api/admin/ask/act').some(p => p.href)).toBe(false)
    expect(splitLinks('/api/cron/watchdog').some(p => p.href)).toBe(false)
    expect(splitLinks('no links here')).toEqual([{ text: 'no links here' }])
  })
})

vi.mock('@/lib/crm/db', () => ({ loadContacts: async (a: { __contacts?: unknown[] }) => a.__contacts ?? [] }))

describe('contacts_download_link tool', () => {
  const contacts = [{ stage: 'met', source: 'expo', tags: ['booth'], score: 80 }, { stage: 'new', source: 'apollo', tags: [], score: 40 }]
  const admin = Object.assign({ from: () => ({}) }, { __contacts: contacts })
  beforeEach(() => undefined)
  it('builds the link for the filters and says how many rows it will contain', async () => {
    expect(await runTool(admin, 'contacts_download_link', { stage: 'met', min_score: 50 })).toEqual({ link: '/api/admin/crm/export?stage=met&min_score=50', rows: 1 })
    expect(await runTool(admin, 'contacts_download_link', {})).toEqual({ link: '/api/admin/crm/export', rows: 2 })
  })
})
