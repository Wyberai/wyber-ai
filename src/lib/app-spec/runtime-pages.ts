// Page half of the fixed runtime. Same rules: String.raw templates, NO backticks, NO ${ sequences.

export const ENTITY_PAGE_TSX = String.raw`import { useMemo, useState } from 'react'
import { Download, MessageCircle, Pencil, Plus, Printer, Search, Trash2, Upload } from 'lucide-react'
import { Badge, Button, Card, Drawer, EmptyState, Input } from '../wyber-ui'
import { APP, type Entity, type Row } from '../schema'
import { list } from '../lib/db'
import { childrenOf, computedValue, formatMoney, formatValue, hasSample, isFinal, isOverdue, reminderEligible, reminderLink, titleOf } from '../lib/logic'
import { downloadCsv, toCsv } from '../lib/csv'
import type { Api } from './api'
import FormDialog from './FormDialog'
import CsvImport from './CsvImport'

const control = 'h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

// Neutral text on a neutral pill, with a dot in the accent: a pale accent colour (yellow, mint) as TEXT would fail contrast.
function StatusPill({ final, text }: { final: boolean; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
      {final ? null : <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />}
      {text}
    </span>
  )
}

export default function EntityPage(props: { entity: Entity; api: Api }) {
  const { entity, api } = props
  const { store } = api
  const all = list(store, entity.id)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<{ id: string; dir: 1 | -1 }>({ id: '', dir: 1 })
  const [picked, setPicked] = useState<string[]>([])
  const [editing, setEditing] = useState<Row | null>(null)
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [childAdd, setChildAdd] = useState<{ entity: Entity; initial: Record<string, string> } | null>(null)
  const [childEdit, setChildEdit] = useState<{ entity: Entity; row: Row } | null>(null)
  const pad = APP.layout.density === 'compact' ? 'py-2' : 'py-3.5'
  const board = APP.intent === 'pipeline' && Boolean(entity.status) && entity === APP.entities[0]

  // Columns: what names the row, its status, due date, amount and contact first, then the rest, five in all.
  const pool = entity.fields.filter(f => f.list !== false)
  const chosen = new Set<string>([entity.title, entity.status, entity.due, entity.amount, entity.contact].filter((id): id is string => Boolean(id) && pool.some(f => f.id === id)))
  for (const f of pool) { if (chosen.size >= 5) break; chosen.add(f.id) }
  const shown = pool.filter(f => chosen.has(f.id))
  const statusField = entity.status ? entity.fields.find(f => f.id === entity.status) : undefined

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    let out = all.filter(r => {
      if (statusField && status !== 'all' && String(r[statusField.id]) !== status) return false
      if (!q) return true
      return entity.fields.some(f => formatValue(store, entity, f, r).toLowerCase().includes(q))
    })
    if (sort.id) {
      const f = entity.fields.find(x => x.id === sort.id)
      out = [...out].sort((a, b) => {
        const av = f && (f.type === 'number' || f.type === 'money') ? Number(a[sort.id]) || 0 : String(f ? formatValue(store, entity, f, a) : a[sort.id] || '')
        const bv = f && (f.type === 'number' || f.type === 'money') ? Number(b[sort.id]) || 0 : String(f ? formatValue(store, entity, f, b) : b[sort.id] || '')
        return av < bv ? -sort.dir : av > bv ? sort.dir : 0
      })
    }
    return out
  }, [all, query, status, sort, store, entity, statusField])

  const toggle = (id: string) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]))
  const allPicked = rows.length > 0 && rows.every(r => picked.includes(r.id))
  const flip = (id: string) => setSort(s => (s.id === id ? { id, dir: (s.dir === 1 ? -1 : 1) as 1 | -1 } : { id, dir: 1 }))

  const exportCsv = () => {
    const headers = entity.fields.map(f => f.label).concat((entity.computed || []).map(c => c.label))
    const data = rows.map(r => entity.fields.map(f => (f.type === 'ref' ? formatValue(store, entity, f, r) : r[f.id])).concat((entity.computed || []).map(c => computedValue(store, entity, c, r))))
    downloadCsv(entity.id + '.csv', toCsv(headers, data))
  }

  const cell = (f: (typeof shown)[number], r: Row) => {
    if (statusField && f.id === statusField.id) {
      return <StatusPill final={isFinal(entity, r)} text={String(r[f.id] || '')} />
    }
    return formatValue(store, entity, f, r) || <span className="text-muted-foreground">-</span>
  }

  const actions = (r: Row) => (
    <div className="flex items-center justify-end gap-1" data-noprint>
      {reminderEligible(entity, r) && reminderLink(store, entity, r) ? (
        <a href={reminderLink(store, entity, r)} target="_blank" rel="noreferrer" aria-label={'WhatsApp reminder for ' + titleOf(entity, r)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring lg:h-9 lg:w-9">
          <MessageCircle size={16} aria-hidden="true" />
        </a>
      ) : null}
      <button type="button" aria-label={'Edit ' + titleOf(entity, r)} onClick={() => setEditing(r)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring lg:h-9 lg:w-9">
        <Pencil size={16} aria-hidden="true" />
      </button>
      <button type="button" aria-label={'Delete ' + titleOf(entity, r)} onClick={() => { api.remove(entity.id, [r.id]); setPicked(p => p.filter(x => x !== r.id)) }} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-destructive focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring lg:h-9 lg:w-9">
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  )

  const tabular = APP.layout.list === 'table'
  const opened = openId ? all.find(r => r.id === openId) || null : null
  const kids = childrenOf(entity)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground md:text-3xl">{entity.label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{entity.blurb}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2" data-noprint>
          <Button variant="outline" size="sm" onClick={() => setImporting(true)}><Upload size={16} aria-hidden="true" />Import CSV</Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}><Download size={16} aria-hidden="true" />Export CSV</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} disabled={rows.length === 0}><Printer size={16} aria-hidden="true" />Print</Button>
          <Button size="sm" onClick={() => setAdding(true)}><Plus size={16} aria-hidden="true" />{'Add ' + entity.singular.toLowerCase()}</Button>
        </div>
      </header>

      {all.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3" data-noprint>
          <div className="relative min-w-[12rem] flex-1">
            <label htmlFor="list-search" className="sr-only">{'Search ' + entity.label.toLowerCase()}</label>
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="list-search" value={query} onChange={e => setQuery(e.target.value)} placeholder={'Search ' + entity.label.toLowerCase()} className="pl-9" />
          </div>
          {statusField ? (
            <div>
              <label htmlFor="list-status" className="sr-only">{'Filter by ' + statusField.label.toLowerCase()}</label>
              <select id="list-status" value={status} onChange={e => setStatus(e.target.value)} className={control}>
                <option value="all">{'All ' + statusField.label.toLowerCase() + (/s$/i.test(statusField.label) ? '' : 's')}</option>
                {(statusField.options || []).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ) : null}
          {picked.length > 0 ? (
            <Button variant="destructive" size="sm" onClick={() => { api.remove(entity.id, picked); setPicked([]) }}><Trash2 size={16} aria-hidden="true" />{'Delete ' + picked.length + ' selected'}</Button>
          ) : null}
          <p className="text-sm text-muted-foreground" aria-live="polite">{rows.length === all.length ? all.length + ' in total' : rows.length + ' of ' + all.length}</p>
        </div>
      ) : null}

      {all.length === 0 ? (
        <EmptyState
          title={'No ' + entity.label.toLowerCase() + ' yet'}
          description={'Add the first ' + entity.singular.toLowerCase() + ', import a CSV file, or look around with clearly labelled sample data. Everything is saved in this browser only.'}
          action={(
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => setAdding(true)}><Plus size={16} aria-hidden="true" />{'Add ' + entity.singular.toLowerCase()}</Button>
              {hasSample(store) ? null : <Button variant="outline" onClick={api.loadSample}>Load sample data (demo)</Button>}
            </div>
          )}
        />
      ) : rows.length === 0 ? (
        <EmptyState title="Nothing matches" description="Try a different search or clear the filter." />
      ) : (
        <>
          {tabular ? (
            <div className="hidden overflow-hidden rounded-xl border border-border bg-card lg:block md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th scope="col" className="w-10 px-3 py-3" data-noprint>
                      <label className="sr-only" htmlFor="pick-all">Select all</label>
                      <input id="pick-all" type="checkbox" checked={allPicked} onChange={() => setPicked(allPicked ? [] : rows.map(r => r.id))} className="h-4 w-4 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" />
                    </th>
                    {shown.map(f => (
                      <th key={f.id} scope="col" className="px-3 py-3 font-medium text-foreground">
                        <button type="button" onClick={() => flip(f.id)} aria-label={'Sort by ' + f.label} className="inline-flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                          {f.label}{sort.id === f.id ? (sort.dir === 1 ? ' (up)' : ' (down)') : ''}
                        </button>
                      </th>
                    ))}
                    {(entity.computed || []).map(c => <th key={c.id} scope="col" className="px-3 py-3 font-medium text-foreground">{c.label}</th>)}
                    <th scope="col" className="px-3 py-3" data-noprint><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-3 py-3" data-noprint>
                        <input type="checkbox" aria-label={'Select ' + titleOf(entity, r)} checked={picked.includes(r.id)} onChange={() => toggle(r.id)} className="h-4 w-4 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" />
                      </td>
                      {shown.map(f => (
                        <td key={f.id} className={f.id === entity.title ? 'px-3 ' + pad + ' font-medium text-foreground' : 'px-3 ' + pad + ' text-muted-foreground'}>
                          {f.id === entity.title ? <button type="button" onClick={() => setOpenId(r.id)} aria-label={'Open ' + titleOf(entity, r)} className="text-left underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">{cell(f, r)}</button> : cell(f, r)}
                          {f.id === entity.title && r.demo ? <Badge variant="outline" className="ml-2">Demo</Badge> : null}
                          {f.id === entity.title && isOverdue(entity, r) ? <Badge variant="destructive" className="ml-2">Overdue</Badge> : null}
                        </td>
                      ))}
                      {(entity.computed || []).map(c => <td key={c.id} className="px-3 py-3 text-muted-foreground">{formatMoney(computedValue(store, entity, c, r))}</td>)}
                      <td className="px-3 py-2">{actions(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <ul className={tabular ? 'grid gap-3 md:hidden' : 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3'}>
            {rows.map(r => (
              <li key={r.id}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button type="button" onClick={() => setOpenId(r.id)} aria-label={'Open ' + titleOf(entity, r)} className="block min-h-10 min-w-10 max-w-full truncate text-left font-medium text-foreground underline-offset-4 md:min-h-0 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">{titleOf(entity, r)}</button>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {r.demo ? <Badge variant="outline">Demo</Badge> : null}
                        {isOverdue(entity, r) ? <Badge variant="destructive">Overdue</Badge> : null}
                        {statusField ? <StatusPill final={isFinal(entity, r)} text={String(r[statusField.id] || '')} /> : null}
                      </div>
                    </div>
                    {actions(r)}
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm [&>*:last-child:nth-child(odd)]:col-span-2">
                    {shown.filter(f => f.id !== entity.title && (!statusField || f.id !== statusField.id)).map(f => (
                      <div key={f.id}><dt className="text-xs text-muted-foreground">{f.label}</dt><dd className="text-foreground">{formatValue(store, entity, f, r) || '-'}</dd></div>
                    ))}
                    {(entity.computed || []).map(c => <div key={c.id}><dt className="text-xs text-muted-foreground">{c.label}</dt><dd className="text-foreground">{formatMoney(computedValue(store, entity, c, r))}</dd></div>)}
                  </dl>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      {board && statusField && all.length > 0 ? (
        <section aria-label="Stages" data-noprint className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">By stage</h2>
          <div className="flex items-start gap-3 overflow-x-auto pb-2">
            {(statusField.options || []).map(stage => {
              const inStage = rows.filter(r => String(r[statusField.id]) === stage)
              return (
                <div key={stage} className="min-w-[13rem] flex-1 rounded-xl border border-border bg-muted/40 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">{stage}</h3>
                    <span className="text-xs text-muted-foreground">{inStage.length}</span>
                  </div>
                  <ul className="space-y-2">
                    {inStage.map(r => (
                      <li key={r.id} className="rounded-lg border border-border bg-card p-3">
                        <button type="button" onClick={() => setOpenId(r.id)} className="block w-full truncate text-left text-sm font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">{titleOf(entity, r)}</button>
                        {entity.amount ? <p className="mt-0.5 text-xs text-muted-foreground">{formatMoney(Number(r[entity.amount]) || 0)}</p> : null}
                        <label className="sr-only" htmlFor={'move-' + r.id}>{'Move ' + titleOf(entity, r) + ' to a stage'}</label>
                        <select id={'move-' + r.id} value={stage} onChange={e => api.update(entity.id, r.id, { ...r, [statusField.id]: e.target.value })} className="mt-2 h-9 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          {(statusField.options || []).map(o => <option key={o} value={o}>{'Move to: ' + o}</option>)}
                        </select>
                      </li>
                    ))}
                    {inStage.length === 0 ? <li className="px-1 py-2 text-xs text-muted-foreground">Empty</li> : null}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      <Drawer open={opened !== null} onClose={() => setOpenId(null)} title={opened ? titleOf(entity, opened) : ''}>
        {opened ? (
          <div className="space-y-5 overflow-y-auto">
            <dl className="grid grid-cols-1 gap-3 text-sm">
              {entity.fields.map(f => (
                <div key={f.id}><dt className="text-xs text-muted-foreground">{f.label}</dt><dd className="text-foreground">{formatValue(store, entity, f, opened) || '-'}</dd></div>
              ))}
              {(entity.computed || []).map(c => <div key={c.id}><dt className="text-xs text-muted-foreground">{c.label}</dt><dd className="text-foreground">{formatMoney(computedValue(store, entity, c, opened))}</dd></div>)}
            </dl>
            {kids.map(k => {
              const mine = list(store, k.entity.id).filter(x => x[k.ref.id] === opened.id)
              return (
                <section key={k.entity.id + k.ref.id} aria-label={k.entity.label}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">{k.entity.label}</h3>
                    <Button variant="outline" size="sm" onClick={() => setChildAdd({ entity: k.entity, initial: { [k.ref.id]: opened.id } })}><Plus size={14} aria-hidden="true" />{'Add ' + k.entity.singular.toLowerCase()}</Button>
                  </div>
                  {mine.length === 0 ? <p className="text-sm text-muted-foreground">None yet.</p> : (
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {mine.map(x => (
                        <li key={x.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                          <span className="truncate text-foreground">{titleOf(k.entity, x)}</span>
                          <span className="flex items-center gap-2">
                            {k.entity.amount ? <span className="text-muted-foreground">{formatMoney(Number(x[k.entity.amount]) || 0)}</span> : null}
                            <button type="button" aria-label={'Edit ' + titleOf(k.entity, x)} onClick={() => setChildEdit({ entity: k.entity, row: x })} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"><Pencil size={14} aria-hidden="true" /></button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => { setEditing(opened); setOpenId(null) }}><Pencil size={14} aria-hidden="true" />Edit</Button>
              {reminderEligible(entity, opened) && reminderLink(store, entity, opened) ? <a href={reminderLink(store, entity, opened)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"><MessageCircle size={14} aria-hidden="true" />WhatsApp reminder</a> : null}
            </div>
          </div>
        ) : null}
      </Drawer>
      {childAdd ? (
        <FormDialog entity={childAdd.entity} store={store} row={null} initial={childAdd.initial} open onClose={() => setChildAdd(null)}
          onSave={values => { api.create(childAdd.entity.id, values); setChildAdd(null) }} />
      ) : null}
      {childEdit ? (
        <FormDialog entity={childEdit.entity} store={store} row={childEdit.row} open onClose={() => setChildEdit(null)}
          onSave={values => { api.update(childEdit.entity.id, childEdit.row.id, values); setChildEdit(null) }} />
      ) : null}

      <FormDialog entity={entity} store={store} row={editing} open={adding || editing !== null} onClose={() => { setAdding(false); setEditing(null) }}
        onSave={values => { if (editing) api.update(entity.id, editing.id, values); else api.create(entity.id, values); setAdding(false); setEditing(null) }} />
      <CsvImport entity={entity} store={store} open={importing} onClose={() => setImporting(false)} onImport={rowsIn => api.importRows(entity.id, rowsIn)} />
    </div>
  )
}
`

export const HOME_TSX = String.raw`import { AlertCircle, ArrowRight, BarChart3, CheckCircle2, MessageCircle, Plus, Wallet } from 'lucide-react'
import { Button, Card, StatBlock } from '../wyber-ui'
import { APP } from '../schema'
import { list } from '../lib/db'
import { attention, dueLabel, formatMoney, hasSample, isEmpty, metricValue, reminderEligible, reminderLink, titleOf } from '../lib/logic'
import type { Api } from './api'

// A small original illustration for empty states: three stacked cards in the brand colour and neutrals. Flat shapes only.
export function Art() {
  return (
    <svg viewBox="0 0 160 120" className="h-28 w-40 shrink-0" role="img" aria-label="Illustration of three stacked cards">
      <rect x="22" y="14" width="104" height="68" rx="12" className="fill-muted stroke-border" strokeWidth="1.5" transform="rotate(-6 74 48)" />
      <rect x="30" y="26" width="104" height="68" rx="12" className="fill-card stroke-border" strokeWidth="1.5" transform="rotate(3 82 60)" />
      <rect x="38" y="38" width="104" height="68" rx="12" className="fill-card stroke-foreground" strokeWidth="1.5" />
      <rect x="52" y="54" width="40" height="8" rx="4" className="fill-primary" />
      <rect x="52" y="70" width="72" height="6" rx="3" className="fill-muted" />
      <rect x="52" y="82" width="54" height="6" rx="3" className="fill-muted" />
    </svg>
  )
}

function metricIcon(label: string, money: boolean | undefined) {
  if (/late|overdue|unpaid|due|pending|missed|open/i.test(label)) return <AlertCircle size={18} aria-hidden="true" />
  if (/paid|collected|done|complete|filed|won|closed/i.test(label)) return <CheckCircle2 size={18} aria-hidden="true" />
  return money ? <Wallet size={18} aria-hidden="true" /> : <BarChart3 size={18} aria-hidden="true" />
}

export default function HomePage({ api }: { api: Api }) {
  const { store } = api
  const empty = isEmpty(store)
  const first = APP.entities[0]
  // Never an orphan row: 2, 4 and 6 fill two or four columns; 3 fills three; 5 is three over two, each row full width.
  const shown = APP.metrics.slice(0, 6)
  const n = shown.length
  const gridCls = n === 5 ? 'grid grid-cols-2 gap-4 lg:grid-cols-6' : n === 3 || n === 6 ? 'grid grid-cols-2 gap-4 lg:grid-cols-3' : n === 2 ? 'grid grid-cols-2 gap-4 lg:grid-cols-2' : n === 1 ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-4 lg:grid-cols-4'
  const spanCls = (i: number) => (n === 5 ? (i < 3 ? 'lg:col-span-2' : 'lg:col-span-3') + (i === 4 ? ' col-span-2' : '') : n === 3 && i === 2 ? 'col-span-2 lg:col-span-1' : '')
  const metrics = (
    <section aria-label="Numbers" className={gridCls}>
      {shown.map((m, i) => {
        const v = metricValue(store, m)
        return (
          <Card key={m.id} className={'overflow-hidden p-0 shadow-sm ' + spanCls(i)}>
            <div aria-hidden="true" className="h-1 bg-primary" />
            <div className="p-5">
              <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">{metricIcon(m.label, m.money)}</span>
              <StatBlock value={m.money ? formatMoney(v) : v} label={m.label} />
            </div>
          </Card>
        )
      })}
    </section>
  )
  const due = attention(store)
  const needs = due.length > 0 ? (
    <section aria-label="Needs attention" className="space-y-3">
      <h2 className="font-display text-lg font-semibold text-foreground">Needs attention</h2>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {due.map(d => (
          <li key={d.entity.id + d.row.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className={'h-2.5 w-2.5 shrink-0 rounded-full ' + (d.days < 0 ? 'bg-destructive' : 'bg-primary')} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{titleOf(d.entity, d.row)}</p>
                <p className="text-xs text-muted-foreground">{d.entity.singular + ' - ' + dueLabel(d.days)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {reminderEligible(d.entity, d.row) && reminderLink(store, d.entity, d.row) ? (
                <a href={reminderLink(store, d.entity, d.row)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"><MessageCircle size={14} aria-hidden="true" />Remind</a>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => api.go(d.entity.id)}>Open<ArrowRight size={14} aria-hidden="true" /></Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  ) : null
  const shortcuts = (
    <section aria-label="Shortcuts" className="grid gap-4 sm:grid-cols-2">
      {APP.entities.map(e => (
        <button key={e.id} type="button" onClick={() => api.go(e.id)} className="group flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">{e.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{e.blurb}</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{list(store, e.id).length + ' saved'}</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">Open<ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" /></span>
          </div>
        </button>
      ))}
    </section>
  )
  return (
    <div className="space-y-8">
      <Card className="flex flex-wrap items-center justify-between gap-6 rounded-3xl p-6 shadow-sm md:p-8">
        <div className="min-w-0 max-w-2xl">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary" />{APP.tagline.replace(/[.!?]+$/, '')}</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-5xl">{store.settings.businessName ? store.settings.businessName : APP.name}</h1>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">{APP.homeIntro}</p>
          {first ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => api.go(first.id)}><Plus size={16} aria-hidden="true" />{'Add ' + first.singular.toLowerCase()}</Button>
              {hasSample(store) ? null : <Button variant="outline" onClick={api.loadSample}>Load sample data (demo)</Button>}
            </div>
          ) : null}
        </div>
        <div className="hidden md:block"><Art /></div>
      </Card>
      {empty ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/60 px-5 py-4 text-sm text-muted-foreground">Nothing saved yet. Start with your own first record, or load sample data to look around. Sample rows are marked Demo and can be removed in one click.</p>
      ) : hasSample(store) ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <p className="text-sm text-muted-foreground">You are looking at sample data marked Demo. Your own entries stay when you remove it.</p>
          <Button variant="outline" size="sm" onClick={api.removeSample}>Remove sample data</Button>
        </div>
      ) : null}
      {APP.layout.home === 'metrics-first' ? <>{metrics}{needs}{shortcuts}</> : <>{needs}{shortcuts}{metrics}</>}
    </div>
  )
}
`

export const HISTORY_TSX = String.raw`import { Card } from '../wyber-ui'
import type { Api } from './api'

export default function HistoryPage({ api }: { api: Api }) {
  const items = api.store.history
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-foreground md:text-3xl">Change history</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every add, edit, delete and import on this device, newest first. Kept in this browser only.</p>
      </header>
      {items.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">No changes yet. They appear here as you add and edit.</Card>
      ) : (
        <ol className="divide-y divide-border rounded-xl border border-border bg-card">
          {items.map(c => (
            <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm">
              <span className="text-foreground">{c.what}</span>
              <time dateTime={c.at} className="text-xs text-muted-foreground">{new Date(c.at).toLocaleString('en-IN')}</time>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
`

export const PRIVACY_TSX = String.raw`import { useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { Button, Card, Input } from '../wyber-ui'
import { APP } from '../schema'
import { exportAll } from '../lib/db'
import { downloadText } from '../lib/csv'
import type { Api } from './api'

export default function PrivacyPage({ api, onWipe }: { api: Api; onWipe: () => void }) {
  const [typed, setTyped] = useState('')
  const ok = typed.trim().toUpperCase() === 'DELETE'
  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-foreground md:text-3xl">Privacy and data</h1>
        <p className="mt-1 text-sm text-muted-foreground">What this app stores, and where.</p>
      </header>
      <Card className="space-y-3 p-5 text-sm text-muted-foreground">
        <p>{APP.name} saves what you enter in this browser only, on this device. There is no account and nothing is sent to a server. If you clear your browser data or switch device, it is gone unless you exported it.</p>
        <p>Use Export all my data to keep a backup file. Use the CSV buttons on each list to move rows in or out.</p>
      </Card>
      <Card className="space-y-3 p-5">
        <h2 className="font-medium text-foreground">Export all my data</h2>
        <p className="text-sm text-muted-foreground">Downloads one file with every list and the change history.</p>
        <Button variant="outline" onClick={() => downloadText(APP.id + '-backup.json', exportAll(api.store), 'application/json')}><Download size={16} aria-hidden="true" />Export all my data</Button>
      </Card>
      <Card className="space-y-3 p-5">
        <h2 className="font-medium text-foreground">Delete all my data</h2>
        <p className="text-sm text-muted-foreground">Removes every record, the history and your settings from this browser. This cannot be undone.</p>
        <div>
          <label htmlFor="confirm-delete" className="mb-1.5 block text-sm font-medium text-foreground">Type DELETE to confirm</label>
          <Input id="confirm-delete" value={typed} onChange={e => setTyped(e.target.value)} autoComplete="off" />
        </div>
        <Button variant="destructive" disabled={!ok} onClick={() => { onWipe(); setTyped('') }}><Trash2 size={16} aria-hidden="true" />Delete all my data</Button>
      </Card>
    </div>
  )
}
`
