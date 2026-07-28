import { describe, it, expect } from 'vitest'
import { buildWyberCloudReport, scoreFindings, scanWyberCloud, type WyberCloudTable, type WyberCloudFinding } from './wybercloud-scan'

describe('wybercloud-scan — buildWyberCloudReport classification', () => {
  it('flags a public_* table with a sensitive column as CRITICAL', () => {
    const tables: WyberCloudTable[] = [
      { table: 'public_signups', columns: ['id', 'email', 'password', 'created_at'] },
    ]
    const r = buildWyberCloudReport(tables)
    expect(r.findings).toHaveLength(1)
    expect(r.findings[0]).toMatchObject({ table: 'public_signups', severity: 'critical' })
    expect(r.findings[0].exposedColumns).toEqual(['email', 'password'])
    expect(r.protectedTables).toEqual([])
  })

  it('flags a public_* table whose NAME implies private data as HIGH, even with no sensitive columns', () => {
    const tables: WyberCloudTable[] = [
      { table: 'public_admins', columns: ['id', 'name', 'note'] },
    ]
    const r = buildWyberCloudReport(tables)
    expect(r.findings).toHaveLength(1)
    expect(r.findings[0]).toMatchObject({ table: 'public_admins', severity: 'high' })
    expect(r.findings[0].exposedColumns).toBeUndefined()
  })

  it('treats an ordinary public_* table (RSVP-style) as protected', () => {
    const tables: WyberCloudTable[] = [
      { table: 'public_rsvps', columns: ['id', 'full_name', 'class_choice', 'created_at'] },
    ]
    const r = buildWyberCloudReport(tables)
    expect(r.findings).toHaveLength(0)
    expect(r.protectedTables).toEqual(['public_rsvps'])
    expect(r.score).toBe(100)
  })

  it('sorts critical findings before high findings', () => {
    const tables: WyberCloudTable[] = [
      { table: 'public_admins', columns: ['id', 'name'] },
      { table: 'public_users', columns: ['id', 'password'] },
    ]
    const r = buildWyberCloudReport(tables)
    expect(r.findings.map(f => f.severity)).toEqual(['critical', 'high'])
  })
})

describe('wybercloud-scan — scoreFindings', () => {
  it('subtracts 40 per critical and 20 per high, floored at 0', () => {
    const critical: WyberCloudFinding = { table: 'a', severity: 'critical', issue: '', evidence: '' }
    const high: WyberCloudFinding = { table: 'b', severity: 'high', issue: '', evidence: '' }
    expect(scoreFindings([])).toBe(100)
    expect(scoreFindings([critical])).toBe(60)
    expect(scoreFindings([high])).toBe(80)
    expect(scoreFindings([critical, critical, critical])).toBe(0)
  })
})

describe('wybercloud-scan — scanWyberCloud orchestration', () => {
  it('groups columns by table from a flat query result', async () => {
    const query = async () => ({
      rows: [
        { table_name: 'public_rsvps', column_name: 'id' },
        { table_name: 'public_rsvps', column_name: 'full_name' },
        { table_name: 'public_feedback', column_name: 'id' },
        { table_name: 'public_feedback', column_name: 'message' },
      ],
    })
    const report = await scanWyberCloud({ query })
    expect(report.reachable).toBe(true)
    expect(report.tablesScanned).toBe(2)
    expect(report.protectedTables.sort()).toEqual(['public_feedback', 'public_rsvps'])
  })

  it('returns a clean 100 report with a note when no public_* tables exist yet', async () => {
    const query = async () => ({ rows: [] })
    const report = await scanWyberCloud({ query })
    expect(report.score).toBe(100)
    expect(report.tablesScanned).toBe(0)
    expect(report.note).toMatch(/no public_\* tables/i)
  })
})
