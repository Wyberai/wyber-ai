// The fixed, tested runtime every generated web app is built from. These are plain source files written into the project; the app's own
// shape arrives as data in src/schema.ts. RULES for this file: the sources live in String.raw templates, so NO backticks and NO ${ sequences
// inside them (use string concatenation). The launch-ready contract (LR1 to LR14) is met here once, for every app.

export const DB_TS = String.raw`// All reads and writes live here. localStorage, per browser, with a schema version.
import { APP, type Draft, type Row } from '../schema'

export const SCHEMA_VERSION = 1
const KEY = 'app-data:' + APP.id

export type Change = { id: string; at: string; what: string }
export type Store = {
  data: Record<string, Row[]>
  history: Change[]
  settings: { businessName: string; setupDone: boolean }
}

const empty = (): Store => {
  const data: Record<string, Row[]> = {}
  for (const e of APP.entities) data[e.id] = []
  return { data, history: [], settings: { businessName: '', setupDone: false } }
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
export const today = () => new Date().toISOString().slice(0, 10)
export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw)
    const base = empty()
    if (!parsed || parsed.version !== SCHEMA_VERSION) return base
    for (const e of APP.entities) base.data[e.id] = Array.isArray(parsed.data && parsed.data[e.id]) ? parsed.data[e.id] : []
    return {
      data: base.data,
      history: Array.isArray(parsed.history) ? parsed.history : [],
      settings: { ...base.settings, ...(parsed.settings || {}) },
    }
  } catch {
    return empty()
  }
}

export function save(s: Store): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: SCHEMA_VERSION, data: s.data, history: s.history, settings: s.settings }))
    return true
  } catch {
    return false
  }
}

export function wipe(): Store {
  try { localStorage.removeItem(KEY) } catch { /* storage blocked */ }
  return empty()
}

export function logChange(s: Store, what: string): Store {
  const change: Change = { id: uid(), at: new Date().toISOString(), what }
  return { ...s, history: [change, ...s.history].slice(0, 500) }
}

export const list = (s: Store, entity: string): Row[] => s.data[entity] || []
export const get = (s: Store, entity: string, id: string): Row | undefined => list(s, entity).find(r => r.id === id)

export function create(s: Store, entity: string, row: Draft): { store: Store; row: Row } {
  const made: Row = { ...row, id: uid() }
  return { store: { ...s, data: { ...s.data, [entity]: [made, ...list(s, entity)] } }, row: made }
}

export function update(s: Store, entity: string, id: string, patch: Draft): Store {
  return { ...s, data: { ...s.data, [entity]: list(s, entity).map(r => (r.id === id ? { ...r, ...patch, id } : r)) } }
}

export function remove(s: Store, entity: string, ids: string[]): { store: Store; removed: Row[] } {
  const gone = new Set(ids)
  const removed = list(s, entity).filter(r => gone.has(r.id))
  return { store: { ...s, data: { ...s.data, [entity]: list(s, entity).filter(r => !gone.has(r.id)) } }, removed }
}

export function restore(s: Store, entity: string, rows: Row[]): Store {
  return { ...s, data: { ...s.data, [entity]: [...rows, ...list(s, entity)] } }
}

export function exportAll(s: Store): string {
  return JSON.stringify({ app: APP.id, version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), settings: s.settings, data: s.data, history: s.history }, null, 2)
}
`

export const CSV_TS = String.raw`// A small CSV reader and writer. Handles quotes, commas inside quotes and a byte order mark. No Excel library.
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++ } else quoted = false
      } else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some(x => x.trim() !== '')) rows.push(row)
      row = []
    } else cell += c
  }
  row.push(cell)
  if (row.some(x => x.trim() !== '')) rows.push(row)
  return rows
}

const esc = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v)
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\r\n')
}

export function downloadCsv(filename: string, text: string): void {
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadText(filename: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
`

export const LOGIC_TS = String.raw`// Everything the screens compute from the rows: titles, totals, overdue, metrics, sample data, reminder links.
import { APP, type Entity, type Field, type Metric, type Row } from '../schema'
import { addDays, list, today, uid, type Store } from './db'

export const entityOf = (id: string): Entity | undefined => APP.entities.find(e => e.id === id)
export const titleOf = (entity: Entity, row: Row): string => String(row[entity.title] == null ? '' : row[entity.title])

export function formatMoney(n: number): string {
  return APP.currency + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export function formatValue(store: Store, entity: Entity, field: Field, row: Row): string {
  const v = row[field.id]
  if (v === undefined || v === null || v === '') return ''
  if (field.type === 'money') return formatMoney(Number(v))
  if (field.type === 'checkbox') return v ? 'Yes' : 'No'
  if (field.type === 'ref') {
    const target = field.ref ? entityOf(field.ref) : undefined
    const hit = target ? list(store, target.id).find(r => r.id === v) : undefined
    return target && hit ? titleOf(target, hit) : ''
  }
  return String(v)
}

export function computedValue(store: Store, entity: Entity, c: NonNullable<Entity['computed']>[number], row: Row): number {
  return list(store, c.entity).filter(r => r[c.ref] === row.id).reduce((n, r) => n + (Number(r[c.field]) || 0), 0)
}

export function isFinal(entity: Entity, row: Row): boolean {
  return Boolean(entity.status && entity.finalStatuses && entity.finalStatuses.includes(String(row[entity.status])))
}

export function isOverdue(entity: Entity, row: Row): boolean {
  if (!entity.due) return false
  const d = row[entity.due]
  return Boolean(d) && String(d) < today() && !isFinal(entity, row)
}

export function metricValue(store: Store, m: Metric): number {
  const entity = entityOf(m.entity)
  if (!entity) return 0
  let rows = list(store, m.entity)
  if (m.where) {
    const w = m.where
    rows = rows.filter(r => {
      if (w.op === 'overdue') return isOverdue(entity, r)
      if (w.op === 'eq') return String(r[w.field]) === String(w.value)
      return String(r[w.field]) !== String(w.value)
    })
  }
  if (m.kind === 'count' || m.kind === 'countWhere') return rows.length
  return rows.reduce((n, r) => n + (Number(r[m.field || '']) || 0), 0)
}

function resolveDate(v: string): string {
  if (v === 'today') return today()
  const m = /^([+-]\d{1,3})d$/.exec(v)
  return m ? addDays(today(), Number(m[1])) : v
}

/** Adds every entity's sample rows, marked demo. Refs name the other row by its title. */
export function withSample(store: Store): Store {
  const ids: Record<string, string[]> = {}
  const byTitle: Record<string, Record<string, string>> = {}
  for (const e of APP.entities) {
    ids[e.id] = e.sample.map(() => uid())
    byTitle[e.id] = {}
    e.sample.forEach((s, i) => { byTitle[e.id][String(s[e.title])] = ids[e.id][i] })
  }
  const data = { ...store.data }
  for (const e of APP.entities) {
    const rows: Row[] = e.sample.map((s, i) => {
      const row: Row = { id: ids[e.id][i], demo: true }
      for (const f of e.fields) {
        const v = s[f.id]
        if (v === undefined) continue
        if (f.type === 'date') row[f.id] = resolveDate(String(v))
        else if (f.type === 'ref') row[f.id] = f.ref ? (byTitle[f.ref] || {})[String(v)] || '' : ''
        else row[f.id] = v
      }
      return row
    })
    data[e.id] = [...rows, ...list(store, e.id)]
  }
  return { ...store, data }
}

export function withoutSample(store: Store): Store {
  const data: Store['data'] = {}
  for (const e of APP.entities) data[e.id] = list(store, e.id).filter(r => !r.demo)
  return { ...store, data }
}

export const hasSample = (store: Store): boolean => APP.entities.some(e => list(store, e.id).some(r => r.demo))
export const isEmpty = (store: Store): boolean => APP.entities.every(e => list(store, e.id).length === 0)

/** A pre-filled WhatsApp message the owner sends by hand. Never claimed to be sent automatically. */
export function reminderLink(store: Store, entity: Entity, row: Row): string {
  if (!entity.contact) return ''
  const digits = String(row[entity.contact] || '').replace(/\D/g, '')
  if (digits.length < 10) return ''
  const phone = digits.length === 10 ? '91' + digits : digits
  const who = titleOf(entity, row)
  const owed = entity.amount && Number(row[entity.amount]) > 0 ? ' of ' + formatMoney(Number(row[entity.amount])) : ''
  const when = entity.due && row[entity.due] ? ' on ' + String(row[entity.due]) : ''
  const from = store.settings.businessName ? ' from ' + store.settings.businessName : ''
  const text = 'Hello ' + who + ', a friendly reminder' + from + ': your ' + entity.singular.toLowerCase() + owed + ' is due' + when + '. Please reply if you have any questions.'
  return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(text)
}

export function reminderEligible(entity: Entity, row: Row): boolean {
  return Boolean(entity.contact && (entity.due || entity.amount) && row[entity.contact] && !isFinal(entity, row))
}
`
