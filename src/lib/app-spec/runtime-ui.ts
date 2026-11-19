// UI half of the fixed runtime. Same rules as runtime-core.ts: String.raw templates, NO backticks, NO ${ sequences.

export const API_TS = String.raw`import type { Draft } from '../schema'
import type { Store } from '../lib/db'

/** What every screen is given. All changes go through here so they are saved, logged and undoable. */
export interface Api {
  store: Store
  create: (entity: string, row: Draft) => void
  update: (entity: string, id: string, patch: Draft) => void
  remove: (entity: string, ids: string[]) => void
  importRows: (entity: string, rows: Draft[]) => void
  loadSample: () => void
  removeSample: () => void
  go: (view: string) => void
}
`

export const FORM_TSX = String.raw`import { useEffect, useState } from 'react'
import { Button, Dialog, Input } from '../wyber-ui'
import type { Draft, Entity, Field, Row } from '../schema'
import { list, type Store } from '../lib/db'
import { computedValue, entityOf, formatMoney, titleOf } from '../lib/logic'

const control = 'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function defaults(entity: Entity): Draft {
  const v: Draft = {}
  for (const f of entity.fields) {
    if (f.type === 'select') v[f.id] = (f.options || [])[0] || ''
    else if (f.type === 'checkbox') v[f.id] = false
    else v[f.id] = ''
  }
  return v
}

function check(entity: Entity, values: Draft): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of entity.fields) {
    const v = values[f.id]
    const empty = v === undefined || v === null || v === ''
    if ((f.required || f.id === entity.title) && empty && f.type !== 'checkbox') { errors[f.id] = 'Enter ' + f.label.toLowerCase() + ' to save this.'; continue }
    if (empty) continue
    if ((f.type === 'number' || f.type === 'money') && !Number.isFinite(Number(v))) errors[f.id] = f.label + ' must be a number, for example 250.'
    if (f.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(String(v))) errors[f.id] = 'Pick a date for ' + f.label.toLowerCase() + '.'
    if (f.type === 'phone' && String(v).replace(/\D/g, '').length < 10) errors[f.id] = f.label + ' needs at least 10 digits.'
  }
  return errors
}

export default function FormDialog(props: { entity: Entity; store: Store; row: Row | null; open: boolean; onClose: () => void; onSave: (values: Draft) => void }) {
  const { entity, store, row, open, onClose, onSave } = props
  const [values, setValues] = useState<Draft>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) { setErrors({}); setValues(row ? { ...row } : defaults(entity)) }
  }, [open, row, entity])

  const set = (id: string, v: unknown) => setValues(prev => ({ ...prev, [id]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const found = check(entity, values)
    setErrors(found)
    if (Object.keys(found).length === 0) {
      const clean: Draft = { ...values }
      for (const f of entity.fields) if ((f.type === 'number' || f.type === 'money') && clean[f.id] !== '') clean[f.id] = Number(clean[f.id])
      onSave(clean)
    }
  }

  const input = (f: Field) => {
    const id = 'f-' + entity.id + '-' + f.id
    const v = values[f.id] === undefined || values[f.id] === null ? '' : values[f.id]
    const described = errors[f.id] ? id + '-err' : undefined
    if (f.type === 'longtext') return <textarea id={id} aria-describedby={described} value={String(v)} onChange={e => set(f.id, e.target.value)} rows={3} className={control + ' h-auto py-2'} />
    if (f.type === 'select') return (
      <select id={id} aria-describedby={described} value={String(v)} onChange={e => set(f.id, e.target.value)} className={control}>
        {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
    if (f.type === 'ref') {
      const target = f.ref ? entityOf(f.ref) : undefined
      return (
        <select id={id} aria-describedby={described} value={String(v)} onChange={e => set(f.id, e.target.value)} className={control}>
          <option value="">None</option>
          {target ? list(store, target.id).map(r => <option key={r.id} value={r.id}>{titleOf(target, r)}</option>) : null}
        </select>
      )
    }
    if (f.type === 'checkbox') return (
      <input id={id} type="checkbox" checked={Boolean(values[f.id])} onChange={e => set(f.id, e.target.checked)} className="h-5 w-5 rounded border-input accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" />
    )
    const type = f.type === 'number' || f.type === 'money' ? 'number' : f.type === 'date' ? 'date' : f.type === 'phone' ? 'tel' : 'text'
    return <Input id={id} aria-describedby={described} type={type} inputMode={type === 'number' ? 'decimal' : undefined} step={type === 'number' ? 'any' : undefined} value={String(v)} onChange={e => set(f.id, e.target.value)} />
  }

  return (
    <Dialog open={open} onClose={onClose} title={(row ? 'Edit ' : 'Add ') + entity.singular.toLowerCase()}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {entity.fields.map(f => (
            <div key={f.id} className={f.type === 'longtext' ? 'sm:col-span-2' : ''}>
              <label htmlFor={'f-' + entity.id + '-' + f.id} className="mb-1.5 block text-sm font-medium text-foreground">
                {f.label}{f.required || f.id === entity.title ? ' (required)' : ''}
              </label>
              {input(f)}
              {errors[f.id] ? <p id={'f-' + entity.id + '-' + f.id + '-err'} role="alert" className="mt-1 text-xs text-destructive">{errors[f.id]}</p> : null}
            </div>
          ))}
        </div>
        {row && entity.computed && entity.computed.length > 0 ? (
          <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
            {entity.computed.map(c => <p key={c.id}>{c.label}: <span className="font-medium text-foreground">{formatMoney(computedValue(store, entity, c, row))}</span></p>)}
          </div>
        ) : null}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{row ? 'Save changes' : 'Add ' + entity.singular.toLowerCase()}</Button>
        </div>
      </form>
    </Dialog>
  )
}
`

export const CSV_IMPORT_TSX = String.raw`import { useState } from 'react'
import { Button, Dialog } from '../wyber-ui'
import type { Draft, Entity, Field } from '../schema'
import { list, type Store } from '../lib/db'
import { entityOf, titleOf } from '../lib/logic'
import { parseCsv } from '../lib/csv'

type Parsed = { rows: Draft[]; errors: string[]; preview: string[][]; headers: string[] }

function build(entity: Entity, store: Store, text: string): Parsed {
  const table = parseCsv(text)
  if (table.length < 2) return { rows: [], errors: ['The file needs a header row and at least one data row.'], preview: [], headers: [] }
  const headers = table[0].map(h => h.trim())
  const col = (f: Field) => headers.findIndex(h => h.toLowerCase() === f.label.toLowerCase() || h.toLowerCase() === f.id.toLowerCase())
  const fields = entity.fields.map(f => ({ f, i: col(f) }))
  const errors: string[] = []
  if (fields.find(x => x.f.id === entity.title && x.i < 0)) errors.push('There is no "' + (entity.fields.find(f => f.id === entity.title) || { label: entity.title }).label + '" column. That column names each row.')
  const rows: Draft[] = []
  table.slice(1).forEach((cells, n) => {
    const line = n + 2
    const row: Draft = {}
    let bad = false
    for (const { f, i } of fields) {
      const raw = i >= 0 ? (cells[i] || '').trim() : ''
      if (raw === '') {
        if (f.id === entity.title || f.required) { errors.push('Row ' + line + ': ' + f.label + ' is empty.'); bad = true }
        continue
      }
      if (f.type === 'number' || f.type === 'money') {
        const num = Number(raw.replace(/,/g, ''))
        if (!Number.isFinite(num)) { errors.push('Row ' + line + ': ' + f.label + ' "' + raw + '" is not a number.'); bad = true } else row[f.id] = num
      } else if (f.type === 'date') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) { errors.push('Row ' + line + ': ' + f.label + ' "' + raw + '" should look like 2026-03-31.'); bad = true } else row[f.id] = raw
      } else if (f.type === 'select') {
        const hit = (f.options || []).find(o => o.toLowerCase() === raw.toLowerCase())
        if (!hit) { errors.push('Row ' + line + ': ' + f.label + ' "' + raw + '" is not one of ' + (f.options || []).join(', ') + '.'); bad = true } else row[f.id] = hit
      } else if (f.type === 'checkbox') row[f.id] = /^(yes|true|1|y)$/i.test(raw)
      else if (f.type === 'ref') {
        const target = f.ref ? entityOf(f.ref) : undefined
        const hit = target ? list(store, target.id).find(r => titleOf(target, r).toLowerCase() === raw.toLowerCase()) : undefined
        if (!hit) { errors.push('Row ' + line + ': ' + f.label + ' "' + raw + '" is not an existing entry.'); bad = true } else row[f.id] = hit.id
      } else row[f.id] = raw
    }
    if (!bad) rows.push(row)
  })
  return { rows, errors, headers, preview: table.slice(1, 6) }
}

export default function CsvImport(props: { entity: Entity; store: Store; open: boolean; onClose: () => void; onImport: (rows: Draft[]) => void }) {
  const { entity, store, open, onClose, onImport } = props
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [name, setName] = useState('')

  const pick = async (file: File | undefined) => {
    if (!file) return
    setName(file.name)
    setParsed(build(entity, store, await file.text()))
  }
  const close = () => { setParsed(null); setName(''); onClose() }

  return (
    <Dialog open={open} onClose={close} title={'Import ' + entity.label.toLowerCase() + ' from CSV'}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose a .csv file. Its first row must name the columns ({entity.fields.map(f => f.label).join(', ')}). You see a preview and any problems before anything is saved.
        </p>
        <div>
          <label htmlFor="csv-file" className="mb-1.5 block text-sm font-medium text-foreground">CSV file</label>
          <input id="csv-file" type="file" accept=".csv,text/csv" onChange={e => pick(e.target.files ? e.target.files[0] : undefined)} className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-2 file:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        {parsed ? (
          <div className="space-y-3">
            <p className="text-sm text-foreground"><span className="font-medium">{name}</span>: {parsed.rows.length} {parsed.rows.length === 1 ? 'row' : 'rows'} ready to import, {parsed.errors.length} {parsed.errors.length === 1 ? 'problem' : 'problems'}.</p>
            {parsed.preview.length > 0 ? (
              <div className="overflow-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted"><tr>{parsed.headers.map((h, i) => <th key={i} className="px-3 py-2 font-medium text-foreground">{h}</th>)}</tr></thead>
                  <tbody>{parsed.preview.map((r, i) => <tr key={i} className="border-t border-border">{r.map((c, j) => <td key={j} className="px-3 py-2 text-muted-foreground">{c}</td>)}</tr>)}</tbody>
                </table>
              </div>
            ) : null}
            {parsed.errors.length > 0 ? (
              <ul role="alert" className="max-h-32 list-disc space-y-1 overflow-auto pl-5 text-xs text-destructive">
                {parsed.errors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}
                {parsed.errors.length > 20 ? <li>and {parsed.errors.length - 20} more</li> : null}
              </ul>
            ) : null}
          </div>
        ) : null}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={close}>Cancel</Button>
          <Button type="button" disabled={!parsed || parsed.rows.length === 0} onClick={() => { if (parsed) { onImport(parsed.rows); close() } }}>
            {parsed && parsed.rows.length > 0 ? 'Import ' + parsed.rows.length + (parsed.rows.length === 1 ? ' row' : ' rows') : 'Import'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
`
