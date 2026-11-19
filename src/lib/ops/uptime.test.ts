import { describe, it, expect, vi } from 'vitest'
import { decideUptimeAction, statelessShouldAlert, checkHealth, alertText, REALERT_MINUTES, type UptimeState } from './uptime'

const at = (m: number) => new Date(Date.UTC(2026, 10, 9, 12, m, 0))
const down = (sinceMin: number, alertMin: number | null): UptimeState => ({ status: 'down', since: at(sinceMin).toISOString(), lastAlertAt: alertMin === null ? null : at(alertMin).toISOString() })
const up: UptimeState = { status: 'up', since: at(0).toISOString(), lastAlertAt: null }

describe('decideUptimeAction', () => {
  it('says nothing while the service stays up', () => {
    expect(decideUptimeAction(up, true, at(5)).action).toBe('none')
    expect(decideUptimeAction(null, true, at(5)).action).toBe('none')
  })
  it('alerts once when it first goes down', () => {
    const d = decideUptimeAction(up, false, at(10))
    expect(d.action).toBe('alert-down')
    expect(d.next.status).toBe('down')
    expect(d.next.lastAlertAt).toBe(at(10).toISOString())
  })
  it('alerts when the very first check ever fails', () => {
    expect(decideUptimeAction(null, false, at(10)).action).toBe('alert-down')
  })
  it('stays quiet during the first hour of an outage, then reminds', () => {
    expect(decideUptimeAction(down(10, 10), false, at(15)).action).toBe('none')
    expect(decideUptimeAction(down(10, 10), false, at(10 + REALERT_MINUTES - 5)).action).toBe('none')
    const again = decideUptimeAction(down(10, 10), false, at(10 + REALERT_MINUTES))
    expect(again.action).toBe('alert-still-down')
    expect(again.next.lastAlertAt).toBe(at(10 + REALERT_MINUTES).toISOString())
    expect(again.next.since).toBe(at(10).toISOString()) // the outage start does not move
  })
  it('says recovered exactly once', () => {
    const d = decideUptimeAction(down(10, 10), true, at(40))
    expect(d.action).toBe('alert-recovered')
    expect(d.next.status).toBe('up')
    expect(decideUptimeAction(d.next, true, at(45)).action).toBe('none')
  })
})

describe('statelessShouldAlert', () => {
  it('alerts only in the first five minutes of an hour, and only while failing', () => {
    expect(statelessShouldAlert(false, at(2))).toBe(true)
    expect(statelessShouldAlert(false, at(30))).toBe(false)
    expect(statelessShouldAlert(true, at(2))).toBe(false)
  })
})

describe('checkHealth', () => {
  it('is ok on a 200', async () => {
    const f = vi.fn(async () => new Response('ok', { status: 200 })) as unknown as typeof fetch
    expect(await checkHealth('https://x/health', f, 2, 0)).toEqual({ ok: true, detail: 'HTTP 200' })
    expect(f).toHaveBeenCalledTimes(1)
  })
  it('retries once so a blip does not page anyone', async () => {
    let n = 0
    const f = vi.fn(async () => (++n === 1 ? new Response('x', { status: 502 }) : new Response('ok', { status: 200 }))) as unknown as typeof fetch
    expect((await checkHealth('https://x/health', f, 2, 0)).ok).toBe(true)
    expect(f).toHaveBeenCalledTimes(2)
  })
  it('reports the failure when both tries fail', async () => {
    const f = vi.fn(async () => new Response('x', { status: 502 })) as unknown as typeof fetch
    expect(await checkHealth('https://x/health', f, 2, 0)).toEqual({ ok: false, detail: 'HTTP 502' })
  })
  it('reports a network error', async () => {
    const f = vi.fn(async () => { throw new Error('ETIMEDOUT') }) as unknown as typeof fetch
    expect((await checkHealth('https://x/health', f, 1, 0)).detail).toBe('ETIMEDOUT')
  })
})

describe('alertText', () => {
  it('tells the founder where to look', () => {
    const t = alertText('alert-down', { url: 'https://api.continuumapi.com/health', detail: 'HTTP 502' })
    expect(t.subject).toMatch(/DOWN/)
    expect(t.text).toContain('Railway')
    expect(t.text).toContain('HTTP 502')
    expect(t.text).toContain('RUNBOOK-continuum')
  })
  it('says how long it was down on recovery', () => {
    expect(alertText('alert-recovered', { url: 'u', detail: '', downFor: 47 }).text).toContain('47 minutes')
  })
})
