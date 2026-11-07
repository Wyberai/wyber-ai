// DATA TABLE INFRASTRUCTURE — pre-built generic table injected into every
// WyberAI dashboard app.
//
// WHY: every dashboard/list-style build re-writes the same sort/search/
// paginate/select/export-CSV table logic from scratch (the system prompt's
// own EXPORT mandate requires hand-rolled Blob/URL.createObjectURL CSV code
// on every table). That's real, measurable output-token cost paid on every
// single build for logic that never actually varies — only the columns do.
//
// HOW IT WORKS (identical mechanics to connector-infra.ts):
//   - One generated-app module, `src/components/DataTable.tsx`, injected at
//     build time by sanitize-files. Transient: never persisted to the saved
//     project, user files win, tree-shaken when unused.
//   - Apps import it relatively: `import DataTable from '../components/DataTable'`
//   - The model sees DATA_TABLE_PROMPT per-request (dashboard apps only) and
//     knows this file exists — it imports and configures it, never rewrites it.
//
// HARD CONSTRAINTS (same as connector-infra.ts):
//   - Zero external deps beyond react.
//   - String.raw template: NO backticks, NO ${ sequences inside the source.

export const DATA_TABLE_PATH = 'src/components/DataTable.tsx'

export const DATA_TABLE_SOURCE = String.raw`// Data table infrastructure — auto-injected by WyberAI. Do not edit; overwritten on every build.
import React, { useState, useMemo } from 'react'

export interface DataTableColumn<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
}

interface DataTableProps<T extends { id: string }> {
  columns: DataTableColumn<T>[]
  rows: T[]
  pageSize?: number
  searchPlaceholder?: string
  searchKeys?: string[]
  onDeleteSelected?: (ids: string[]) => void
  emptyMessage?: string
  exportFilename?: string
}

export default function DataTable<T extends { id: string }>(props: DataTableProps<T>) {
  var pageSize = props.pageSize || 8
  var searchPlaceholder = props.searchPlaceholder || 'Search...'
  var emptyMessage = props.emptyMessage || 'No results match your filters'
  var exportFilename = props.exportFilename || 'export.csv'

  var [query, setQuery] = useState('')
  var [sortKey, setSortKey] = useState<string | null>(null)
  var [sortDir, setSortDir] = useState<1 | -1>(1)
  var [page, setPage] = useState(0)
  var [selected, setSelected] = useState<Record<string, boolean>>({})

  var searchKeys = props.searchKeys || props.columns.map(function (c) { return c.key })

  var filtered = useMemo(function () {
    if (!query.trim()) return props.rows
    var q = query.toLowerCase()
    return props.rows.filter(function (row: any) {
      return searchKeys.some(function (k) {
        var v = row[k]
        return v != null && String(v).toLowerCase().indexOf(q) !== -1
      })
    })
  }, [props.rows, query, searchKeys])

  var sorted = useMemo(function () {
    if (!sortKey) return filtered
    var copy = filtered.slice()
    copy.sort(function (a: any, b: any) {
      var av = a[sortKey!]
      var bv = b[sortKey!]
      if (av < bv) return -1 * sortDir
      if (av > bv) return 1 * sortDir
      return 0
    })
    return copy
  }, [filtered, sortKey, sortDir])

  var totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  var safePage = Math.min(page, totalPages - 1)
  var pageRows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize)

  var selectedIds = Object.keys(selected).filter(function (id) { return selected[id] })

  function toggleSort(key: string) {
    if (sortKey === key) { setSortDir(sortDir === 1 ? -1 : 1) }
    else { setSortKey(key); setSortDir(1) }
  }

  function toggleRow(id: string) {
    setSelected(function (s) {
      var next = Object.assign({}, s)
      if (next[id]) { delete next[id] } else { next[id] = true }
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.length === pageRows.length && pageRows.length > 0) {
      setSelected({})
    } else {
      var next: Record<string, boolean> = {}
      pageRows.forEach(function (r) { next[r.id] = true })
      setSelected(next)
    }
  }

  function exportCsv() {
    var cols = props.columns
    var header = cols.map(function (c) { return '"' + c.label.replace(/"/g, '""') + '"' }).join(',')
    var lines = sorted.map(function (row: any) {
      return cols.map(function (c) {
        var raw = row[c.key]
        var text = raw == null ? '' : String(raw)
        return '"' + text.replace(/"/g, '""') + '"'
      }).join(',')
    })
    var csv = [header].concat(lines).join('\n')
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = exportFilename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={query}
          onChange={function (e) { setQuery(e.target.value); setPage(0) }}
          placeholder={searchPlaceholder}
          className="flex-1 min-w-[180px] max-w-sm px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition"
        />
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{selectedIds.length} selected</span>
            {props.onDeleteSelected && (
              <button
                onClick={function () { props.onDeleteSelected!(selectedIds); setSelected({}) }}
                className="px-2.5 py-1 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
              >Delete</button>
            )}
          </div>
        )}
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors ml-auto"
        >Export CSV</button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 w-8">
                <input type="checkbox" checked={selectedIds.length === pageRows.length && pageRows.length > 0} onChange={toggleAll} />
              </th>
              {props.columns.map(function (col) {
                var isSorted = sortKey === col.key
                return (
                  <th
                    key={col.key}
                    onClick={col.sortable === false ? undefined : function () { toggleSort(col.key) }}
                    className={'text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground select-none ' + (col.sortable === false ? '' : 'cursor-pointer')}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {isSorted && <span>{sortDir === 1 ? '↑' : '↓'}</span>}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map(function (row: any) {
              return (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={!!selected[row.id]} onChange={function () { toggleRow(row.id) }} />
                  </td>
                  {props.columns.map(function (col) {
                    var value = row[col.key]
                    return (
                      <td key={col.key} className="px-4 py-3 text-sm text-foreground">
                        {col.render ? col.render(value, row) : String(value != null ? value : '')}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            {pageRows.length === 0 && (
              <tr><td colSpan={props.columns.length + 1} className="px-4 py-12 text-center text-sm text-muted-foreground">{emptyMessage}</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{sorted.length} of {props.rows.length} rows</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={safePage === 0}
                onClick={function () { setPage(Math.max(0, safePage - 1)) }}
                className="px-2 py-1 rounded-md border border-border text-xs disabled:opacity-40 hover:bg-accent/50 transition-colors"
              >Prev</button>
              <span className="text-xs text-muted-foreground">Page {safePage + 1} of {totalPages}</span>
              <button
                disabled={safePage >= totalPages - 1}
                onClick={function () { setPage(Math.min(totalPages - 1, safePage + 1)) }}
                className="px-2 py-1 rounded-md border border-border text-xs disabled:opacity-40 hover:bg-accent/50 transition-colors"
              >Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
`

export const DATA_TABLE_FILES: Array<{ path: string; content: string }> = [
  { path: DATA_TABLE_PATH, content: DATA_TABLE_SOURCE },
]

// Prompt fragment injected per-request for dashboard apps (same condition as
// CONNECTOR_INFRA_PROMPT — web/SaaS, not website, not mobile).
export const DATA_TABLE_PROMPT = `
PRE-INSTALLED DATA TABLE (DO NOT REGENERATE — already in the app):
  ${DATA_TABLE_PATH} → import DataTable, { DataTableColumn } from '../components/DataTable'
Use this for ANY list/table view instead of hand-writing table markup. It already implements sort, search, pagination, row selection, and the mandatory "Export CSV" button — do not write that logic yourself.
Example:
  const columns: DataTableColumn<Item>[] = [
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', render: (v) => <span className={...}>{v}</span> },
  ]
  <DataTable columns={columns} rows={items} onDeleteSelected={(ids) => ...} />
Generating this file as a <file> block overwrites the platform version and wastes output budget.
`.trim()
