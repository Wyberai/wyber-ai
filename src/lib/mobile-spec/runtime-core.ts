// The fixed, tested non-UI runtime of every spec-driven mobile app: storage, presentation rules and form helpers. Plain source files written
// into the project; the app's own shape arrives as data in schema.ts. The pure logic (totals, overdue, metrics, demo data, reminder link) is
// the same LOGIC_TS the web app uses, so both products agree on every number. RULES: the sources live in String.raw templates, so NO
// backticks and NO ${ sequences inside them (use string concatenation).

export { LOGIC_TS } from '../app-spec/runtime-core'

export const DB_TS = String.raw`// All reads and writes live here: one module over AsyncStorage, with a schema version. Swap this file to move to a real backend.
import AsyncStorage from '@react-native-async-storage/async-storage'
import { APP, type Draft, type Row } from '../schema'

export const SCHEMA_VERSION = 1
const KEY = 'app-data:' + APP.id

export type Store = {
  data: Record<string, Row[]>
  settings: { businessName: string; setupDone: boolean }
}

export const emptyStore = (): Store => {
  const data: Record<string, Row[]> = {}
  for (const e of APP.entities) data[e.id] = []
  return { data, settings: { businessName: '', setupDone: false } }
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
const two = (n: number) => (n < 10 ? '0' + n : String(n))
const isoOf = (d: Date) => d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate())
export const today = () => isoOf(new Date())
export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return isoOf(d)
}

/** Reads the saved data. A storage failure throws, so the screen can show "Try again". Unreadable or newer data is kept as a backup, never overwritten silently. */
export async function loadStore(): Promise<Store> {
  const raw = await AsyncStorage.getItem(KEY)
  if (!raw) return emptyStore()
  let parsed: { version?: number; data?: Record<string, unknown>; settings?: Partial<Store['settings']> } | null = null
  try { parsed = JSON.parse(raw) } catch { parsed = null }
  if (!parsed || typeof parsed.version !== 'number' || parsed.version > SCHEMA_VERSION) {
    try { await AsyncStorage.setItem(KEY + ':backup', raw) } catch { /* the backup is best effort */ }
    return emptyStore()
  }
  const base = emptyStore()
  for (const e of APP.entities) {
    const rows = parsed.data ? parsed.data[e.id] : undefined
    base.data[e.id] = Array.isArray(rows) ? (rows as Row[]) : []
  }
  return { data: base.data, settings: { ...base.settings, ...(parsed.settings || {}) } }
}

export async function saveStore(s: Store): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ version: SCHEMA_VERSION, data: s.data, settings: s.settings }))
    return true
  } catch {
    return false
  }
}

export async function wipeStore(): Promise<Store> {
  try { await AsyncStorage.removeItem(KEY); await AsyncStorage.removeItem(KEY + ':backup') } catch { /* nothing more to do */ }
  return emptyStore()
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

/** Removes the rows, and any row of another entity that points at them (a bill takes its lines with it). Everything removed comes back in one undo. */
export function remove(s: Store, entity: string, ids: string[]): { store: Store; removed: { entity: string; rows: Row[] }[] } {
  const gone = new Set(ids)
  const removed: { entity: string; rows: Row[] }[] = []
  const data = { ...s.data }
  const mine = list(s, entity).filter(r => gone.has(r.id))
  if (mine.length) { removed.push({ entity, rows: mine }); data[entity] = list(s, entity).filter(r => !gone.has(r.id)) }
  for (const e of APP.entities) {
    for (const f of e.fields) {
      if (f.type !== 'ref' || f.ref !== entity) continue
      const dependants = (data[e.id] || []).filter(r => gone.has(String(r[f.id])))
      if (dependants.length) { removed.push({ entity: e.id, rows: dependants }); data[e.id] = (data[e.id] || []).filter(r => !gone.has(String(r[f.id]))) }
    }
  }
  return { store: { ...s, data }, removed }
}

export function restore(s: Store, removed: { entity: string; rows: Row[] }[]): Store {
  const data = { ...s.data }
  for (const g of removed) data[g.entity] = [...g.rows, ...(data[g.entity] || [])]
  return { ...s, data }
}

/** A readable copy of everything, for the share sheet. */
export function exportAll(s: Store): string {
  return JSON.stringify({ app: APP.id, version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), settings: s.settings, data: s.data }, null, 2)
}
`

export const PRESENT_TS = String.raw`// How rows are shown and edited on a phone: subtitles, status badges, search, filters, forms. Pure functions, no UI.
import { APP, type Entity, type Field, type Row } from '../schema'
import { list, type Store } from './db'
import { computedValue, entityOf, formatMoney, formatValue, isFinal, isOverdue, titleOf } from './logic'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** 2026-10-30 as 30 Oct 2026. Anything that is not a plain date comes back as it was. */
export function friendlyDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1] : iso
}

/** What a field shows on screen: the shared formatter, with dates written the way people say them. */
export function shown(store: Store, e: Entity, f: Field, row: Row): string {
  const v = formatValue(store, e, f, row)
  return f.type === 'date' ? friendlyDate(v) : v
}

export type StatusView = { label: string; tone: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' }

/** A child entity points at another one and has no stage or due date of its own (the lines of a bill). */
export const isChild = (e: Entity): boolean => e.fields.some(f => f.type === 'ref') && !e.status && !e.due
export const mainEntities = (): Entity[] => APP.entities.filter(e => !isChild(e))
export const primaryEntity = (): Entity => mainEntities()[0] || APP.entities[0]

/** Entities whose rows hang off this one, and the field that points back. */
export function childLinks(e: Entity): { entity: Entity; field: Field }[] {
  const out: { entity: Entity; field: Field }[] = []
  for (const c of APP.entities) for (const f of c.fields) if (f.type === 'ref' && f.ref === e.id) out.push({ entity: c, field: f })
  return out
}

export function statusOf(e: Entity, row: Row): StatusView | null {
  if (!e.status) return null
  const label = String(row[e.status] ?? '')
  if (!label) return null
  if (isOverdue(e, row)) return { label: 'Overdue', tone: 'danger' }
  if (isFinal(e, row)) return { label, tone: 'success' }
  const options = e.fields.find(f => f.id === e.status)?.options ?? []
  return { label, tone: options.indexOf(label) <= 0 ? 'neutral' : 'accent' }
}

/** The fields worth a glance in a list: not the title, not the money shown on the right, not long text. */
export function subtitleOf(store: Store, e: Entity, row: Row): string {
  const skip = new Set([e.title, e.status, e.amount])
  const parts: string[] = []
  for (const f of e.fields) {
    if (skip.has(f.id) || f.type === 'longtext' || f.type === 'checkbox') continue
    if (f.type === 'money' && !e.amount && parts.length >= 1) continue
    const v = shown(store, e, f, row)
    if (v) parts.push(f.type === 'date' ? f.label + ' ' + v : v)
    if (parts.length >= 2) break
  }
  return parts.join(' · ')
}

export function metaOf(store: Store, e: Entity, row: Row): string {
  if (e.amount && Number(row[e.amount]) > 0) return formatMoney(Number(row[e.amount]))
  const c = (e.computed || [])[0]
  if (c) { const v = computedValue(store, e, c, row); return v > 0 ? formatMoney(v) : '' }
  const m = e.fields.find(f => f.type === 'money' && Number(row[f.id]) > 0)
  return m ? formatMoney(Number(row[m.id])) : ''
}

export function haystack(store: Store, e: Entity, row: Row): string {
  return e.fields.map(f => formatValue(store, e, f, row)).join(' ').toLowerCase()
}

export type ListFilter = { q: string; status: string; overdue: boolean }

/** Search + stage + overdue, then overdue rows first (they are the ones that need a phone call). */
export function filterRows(store: Store, e: Entity, rows: Row[], f: ListFilter): Row[] {
  const q = f.q.trim().toLowerCase()
  const hit = rows.filter(r => (!q || haystack(store, e, r).includes(q)) && (!f.status || !e.status || String(r[e.status]) === f.status) && (!f.overdue || isOverdue(e, r)))
  return [...hit.filter(r => isOverdue(e, r)), ...hit.filter(r => !isOverdue(e, r))]
}

/** What needs attention, worked out from the rows and nothing else. */
export function attention(store: Store): { text: string; entityId: string }[] {
  const out: { text: string; entityId: string }[] = []
  for (const e of APP.entities) {
    if (!e.due) continue
    const n = list(store, e.id).filter(r => isOverdue(e, r)).length
    if (n > 0) out.push({ entityId: e.id, text: n + ' ' + (n === 1 ? e.singular.toLowerCase() + ' is' : e.label.toLowerCase() + ' are') + ' overdue' })
  }
  return out
}

/** The newest rows across the main entities, one list. */
export function recentRows(store: Store, limit: number): { entity: Entity; row: Row }[] {
  const out: { entity: Entity; row: Row }[] = []
  const lists = mainEntities().map(e => ({ e, rows: list(store, e.id) }))
  for (let i = 0; out.length < limit; i++) {
    let any = false
    for (const l of lists) { if (l.rows[i] && out.length < limit) { out.push({ entity: l.e, row: l.rows[i] }); any = true } }
    if (!any) break
  }
  return out
}

// ------------------------------------------------------------ forms
export type DraftValue = string | boolean
export type FormDraft = Record<string, DraftValue>

export function parseNumber(s: string): number | null {
  const t = String(s).replace(/,/g, '').trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function refOptions(store: Store, f: Field): { value: string; label: string }[] {
  const target = f.ref ? entityOf(f.ref) : undefined
  return target ? list(store, target.id).map(r => ({ value: r.id, label: titleOf(target, r) })) : []
}

export function draftFromRow(e: Entity, row: Row | undefined, preset: Record<string, string> = {}): FormDraft {
  const d: FormDraft = {}
  for (const f of e.fields) {
    const v = row ? row[f.id] : undefined
    if (f.type === 'checkbox') d[f.id] = Boolean(v)
    else if (f.type === 'select') d[f.id] = v !== undefined ? String(v) : (f.options || [])[0] || ''
    else d[f.id] = v === undefined || v === null ? '' : String(v)
    if (preset[f.id] !== undefined) d[f.id] = preset[f.id]
  }
  return d
}

export function validateDraft(e: Entity, d: FormDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of e.fields) {
    const v = d[f.id]
    const empty = v === undefined || v === '' || v === false
    if ((f.id === e.title || f.required) && f.type !== 'checkbox' && (empty || String(v).trim() === '')) errors[f.id] = f.label + ' is needed'
    else if ((f.type === 'number' || f.type === 'money') && String(v) !== '' && parseNumber(String(v)) === null) errors[f.id] = f.label + ' must be a number'
    else if (f.type === 'phone' && String(v) !== '' && String(v).replace(/\D/g, '').length < 10) errors[f.id] = f.label + ' needs at least 10 digits'
  }
  return errors
}

export function rowFromDraft(e: Entity, d: FormDraft): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  for (const f of e.fields) {
    const v = d[f.id]
    if (f.type === 'checkbox') out[f.id] = Boolean(v)
    else if (f.type === 'number' || f.type === 'money') { const n = parseNumber(String(v ?? '')); if (n !== null) out[f.id] = n }
    else out[f.id] = String(v ?? '').trim()
  }
  return out
}
`

export const API_TS = String.raw`// The shape every screen receives. Types only; App.tsx fills it in.
import type { Row } from '../schema'
import type { Store } from './db'

export type Route =
  | { kind: 'list'; entity: string; overdue?: boolean }
  | { kind: 'detail'; entity: string; id: string }
  | { kind: 'form'; entity: string; id?: string; preset?: Record<string, string> }
  | { kind: 'settings' }

export type Api = {
  store: Store
  tab: string
  tabs: string[]
  go: (tab: string) => void
  push: (r: Route) => void
  pop: () => void
  create: (entity: string, row: Record<string, string | number | boolean>) => Row | undefined
  update: (entity: string, id: string, patch: Record<string, string | number | boolean>) => void
  remove: (entity: string, id: string) => void
  loadSample: () => void
  removeSample: () => void
  setBusinessName: (name: string) => void
  finishSetup: (name: string, withSample: boolean) => void
  wipe: () => Promise<void>
  notify: (message: string) => void
  saved: boolean
}
`
