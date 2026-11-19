import { BANNED_CLAIMS } from '../build-spec/claims'
import { APP_BLUEPRINTS, type AppIntentBrief } from './intents'
import type { AppComputed, AppEntity, AppField, AppMetric, AppModel, FieldType, SampleRow } from './types'

export const FIELD_TYPES: readonly FieldType[] = ['text', 'longtext', 'number', 'money', 'date', 'phone', 'select', 'ref', 'checkbox']
const SLUG = /^[a-z][a-zA-Z0-9]{1,20}$/
const REL_DATE = /^(today|[+-]\d{1,3}d)$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const SAMPLE_PHONE = /^90000 ?\d{5}$/

export function buildModelPrompt(brief: AppIntentBrief, businessPrompt: string): { system: string; user: string } {
  const bp = APP_BLUEPRINTS[brief.intent]
  const skeleton = bp.skeleton.map(s => `- ${s.entity} (one is a "${s.singular}"): ${s.fields.join('; ')}`).join('\n')
  const system = [
    'You design the data model for a small business web app. You do not write code. Return ONE JSON object and nothing else.',
    'The app is a finished tool the owner uses on day one, built for THIS business. Use the words this business uses for its own things.',
    'Never invent facts about the business, numbers about its results, customers, awards or claims. Sample rows are clearly fake and are only loaded when the owner asks.',
    'No exclamation marks, no superlatives.',
  ].join('\n')
  const user = [
    `Business brief: ${businessPrompt}`,
    `Job of the app: ${bp.label}. ${bp.guidance}`,
    `Start from this skeleton, rename it for this business and add the fields it really records:\n${skeleton}`,
    'Return JSON: { appName, tagline, homeIntro, entities: [Entity], metrics: [Metric] }.',
    'Entity: { id (letters and digits, starts with a letter), label (plural), singular, title (id of the field that names a row), blurb (one line), fields: [Field] (3 to 10), computed?: [{ id, label, kind: "sumChild", entity (child entity id), field (child number or money field id), ref (child field id of type ref pointing at this entity) }], status?: id of a select field of stages, finalStatuses?: the options that mean finished, due?: id of a date field, amount?: id of a money field, contact?: id of a phone field, sample: [3 to 5 demo rows] }.',
    'Field: { id, label, type: text | longtext | number | money | date | phone | select | ref | checkbox, options? (select: 2 to 8 short choices), ref? (ref: entity id), required? }. The title field is type text and required.',
    'Sample rows: an object of field id to value. Dates are "today", "+3d" or "-5d" (relative to the day it is loaded) or YYYY-MM-DD. Phones look like "90000 00001", "90000 00002". A ref field holds the title of a sample row of the referenced entity. Make the samples realistic for this business (names, items, amounts) and cover the interesting cases (one overdue, one finished).',
    'Metric: { id, label, kind: count | sum | countWhere | sumWhere, entity, field? (sum kinds: a number or money field), where?: { field, op: eq | neq | overdue, value? }, money? }. Give 3 to 6 metrics worked out from the rows, for example unpaid amount, overdue count, this-month total. Never a made-up number.',
    `Done means: ${bp.proof}.`,
  ].join('\n')
  return { system, user }
}

const isStr = (v: unknown, min: number, max: number): v is string => typeof v === 'string' && v.trim().length >= min && v.length <= max

export function validateModel(m: AppModel): string[] {
  const out: string[] = []
  const add = (p: string, msg: string) => out.push(`${p}: ${msg}`)
  const text = (p: string, v: unknown, min: number, max: number) => {
    if (!isStr(v, min, max)) return add(p, `needs ${min} to ${max} characters`)
    if (BANNED_CLAIMS.test(v)) add(p, `contains a claim or "!" the owner did not give ("${v.match(BANNED_CLAIMS)?.[0]}")`)
  }
  if (!m || typeof m !== 'object') return ['reply is not an object']
  text('appName', m.appName, 2, 40)
  text('tagline', m.tagline, 10, 100)
  text('homeIntro', m.homeIntro, 20, 220)
  if (!Array.isArray(m.entities) || m.entities.length < 1 || m.entities.length > 4) { add('entities', 'needs 1 to 4 entities'); return out }
  const ids = new Set<string>()
  for (const e of m.entities) { if (e && typeof e.id === 'string') ids.add(e.id) }
  const byId = new Map(m.entities.map(e => [e.id, e]))
  if (ids.size !== m.entities.length) add('entities', 'entity ids must be unique')

  for (const e of m.entities) {
    const p = `entities.${e?.id}`
    if (!e || !SLUG.test(e.id ?? '')) { add(p, 'id must be letters and digits, starting with a letter'); continue }
    text(`${p}.label`, e.label, 2, 30); text(`${p}.singular`, e.singular, 2, 30); text(`${p}.blurb`, e.blurb, 10, 120)
    if (!Array.isArray(e.fields) || e.fields.length < 3 || e.fields.length > 10) { add(`${p}.fields`, 'needs 3 to 10 fields'); continue }
    const fieldIds = new Set<string>()
    const fieldOf = new Map<string, AppField>()
    for (const f of e.fields) {
      const fp = `${p}.fields.${f?.id}`
      if (!f || !SLUG.test(f.id ?? '')) { add(fp, 'field id must be letters and digits'); continue }
      if (fieldIds.has(f.id)) add(fp, 'duplicate field id')
      fieldIds.add(f.id); fieldOf.set(f.id, f)
      text(`${fp}.label`, f.label, 2, 30)
      if (!FIELD_TYPES.includes(f.type)) add(`${fp}.type`, `must be one of ${FIELD_TYPES.join(', ')}`)
      if (f.type === 'select' && (!Array.isArray(f.options) || f.options.length < 2 || f.options.length > 8 || f.options.some(o => !isStr(o, 1, 24)))) add(`${fp}.options`, 'a select needs 2 to 8 short options')
      if (f.type === 'ref' && !(f.ref && ids.has(f.ref) && f.ref !== e.id)) add(`${fp}.ref`, 'must be the id of another entity')
    }
    const typeOf = (id: string | undefined) => (id ? fieldOf.get(id)?.type : undefined)
    if (typeOf(e.title) !== 'text') add(`${p}.title`, 'must be the id of a text field')
    if (e.status !== undefined && typeOf(e.status) !== 'select') add(`${p}.status`, 'must be the id of a select field')
    if (e.due !== undefined && typeOf(e.due) !== 'date') add(`${p}.due`, 'must be the id of a date field')
    if (e.amount !== undefined && typeOf(e.amount) !== 'money') add(`${p}.amount`, 'must be the id of a money field')
    if (e.contact !== undefined && typeOf(e.contact) !== 'phone') add(`${p}.contact`, 'must be the id of a phone field')
    if (e.finalStatuses && e.status) {
      const opts = fieldOf.get(e.status)?.options ?? []
      if (e.finalStatuses.some(s => !opts.includes(s))) add(`${p}.finalStatuses`, 'must be options of the status field')
    }
    for (const c of e.computed ?? []) {
      const child = byId.get(c.entity)
      const childField = child?.fields.find(f => f.id === c.field)
      const refField = child?.fields.find(f => f.id === c.ref)
      if (c.kind !== 'sumChild' || !SLUG.test(c.id ?? '') || !isStr(c.label, 2, 30)) add(`${p}.computed`, 'needs id, label and kind "sumChild"')
      else if (!child || !childField || !['number', 'money'].includes(childField.type) || !refField || refField.type !== 'ref' || refField.ref !== e.id) add(`${p}.computed.${c.id}`, 'must sum a number or money field of a child entity whose ref field points at this entity')
    }
    if (!Array.isArray(e.sample) || e.sample.length < 3 || e.sample.length > 5) add(`${p}.sample`, 'needs 3 to 5 demo rows')
    else e.sample.forEach((row, i) => {
      const rp = `${p}.sample[${i}]`
      for (const [k, v] of Object.entries(row)) {
        const f = fieldOf.get(k)
        if (!f) { add(rp, `unknown field "${k}"`); continue }
        if ((f.type === 'number' || f.type === 'money') && typeof v !== 'number') add(`${rp}.${k}`, 'must be a number')
        else if (f.type === 'checkbox' && typeof v !== 'boolean') add(`${rp}.${k}`, 'must be true or false')
        else if (f.type === 'select' && !(f.options ?? []).includes(String(v))) add(`${rp}.${k}`, 'must be one of the options')
        else if (f.type === 'date' && !(REL_DATE.test(String(v)) || ISO_DATE.test(String(v)))) add(`${rp}.${k}`, 'must be YYYY-MM-DD, "today", "+3d" or "-5d"')
        else if (f.type === 'phone' && !SAMPLE_PHONE.test(String(v))) add(`${rp}.${k}`, 'sample phones must look like "90000 00001"')
        else if (f.type === 'ref') {
          const target = byId.get(f.ref ?? '')
          if (!target?.sample?.some(r => String(r[target.title]) === String(v))) add(`${rp}.${k}`, `must be the title of a sample row of ${f.ref}`)
        } else if ((f.type === 'text' || f.type === 'longtext') && (typeof v !== 'string' || BANNED_CLAIMS.test(v))) add(`${rp}.${k}`, 'must be plain text without claims')
      }
      if (row[e.title] === undefined) add(rp, `needs the title field "${e.title}"`)
    })
  }

  if (!Array.isArray(m.metrics) || m.metrics.length < 3 || m.metrics.length > 6) add('metrics', 'needs 3 to 6 metrics')
  else for (const x of m.metrics) {
    const p = `metrics.${x?.id}`
    const ent = byId.get(x?.entity ?? '')
    if (!x || !SLUG.test(x.id ?? '') || !isStr(x.label, 2, 40)) { add(p, 'needs an id and a label'); continue }
    if (!ent) { add(`${p}.entity`, 'unknown entity'); continue }
    if (!['count', 'sum', 'countWhere', 'sumWhere'].includes(x.kind)) add(`${p}.kind`, 'must be count, sum, countWhere or sumWhere')
    if ((x.kind === 'sum' || x.kind === 'sumWhere') && !['number', 'money'].includes(ent.fields.find(f => f.id === x.field)?.type ?? '')) add(`${p}.field`, 'a sum needs a number or money field')
    if (x.kind === 'countWhere' || x.kind === 'sumWhere') {
      const wf = ent.fields.find(f => f.id === x.where?.field)
      if (!x.where || !wf) add(`${p}.where`, 'needs a field of the entity')
      else if (!['eq', 'neq', 'overdue'].includes(x.where.op)) add(`${p}.where.op`, 'must be eq, neq or overdue')
      else if (x.where.op === 'overdue' && !(ent.due && wf.id === ent.due)) add(`${p}.where`, 'overdue needs the entity due date field')
      else if (x.where.op !== 'overdue' && !x.where.value) add(`${p}.where.value`, 'needs a value')
    }
  }
  return out
}

const pick = <T extends object>(o: unknown, keys: string[]): T => {
  const r: Record<string, unknown> = {}
  if (o && typeof o === 'object') for (const k of keys) { const v = (o as Record<string, unknown>)[k]; if (v !== undefined) r[k] = v }
  return r as T
}

/** Keeps only the keys the schema knows, so a model reply can never smuggle extra text into the app. */
export function normalizeModel(raw: unknown): AppModel {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const entities = (Array.isArray(r.entities) ? r.entities : []).map(e => {
    const x = pick<AppEntity>(e, ['id', 'label', 'singular', 'title', 'blurb', 'status', 'due', 'amount', 'contact', 'finalStatuses'])
    const src = e as Record<string, unknown>
    x.fields = (Array.isArray(src.fields) ? src.fields : []).map(f => pick<AppField>(f, ['id', 'label', 'type', 'options', 'ref', 'required', 'list']))
    if (Array.isArray(src.computed)) x.computed = src.computed.map(c => pick<AppComputed>(c, ['id', 'label', 'kind', 'entity', 'field', 'ref']))
    x.sample = (Array.isArray(src.sample) ? src.sample : []).filter(s => s && typeof s === 'object') as SampleRow[]
    return x
  })
  const metrics = (Array.isArray(r.metrics) ? r.metrics : []).map(m => {
    const x = pick<AppMetric>(m, ['id', 'label', 'kind', 'entity', 'field', 'money'])
    const w = (m as Record<string, unknown>)?.where
    if (w && typeof w === 'object') x.where = pick<NonNullable<AppMetric['where']>>(w, ['field', 'op', 'value'])
    return x
  })
  return { appName: r.appName as string, tagline: r.tagline as string, homeIntro: r.homeIntro as string, entities, metrics }
}
