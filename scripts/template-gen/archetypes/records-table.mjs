// records-table archetype — a client/matter list page for a specialized,
// agency-caliber vertical: Navbar + hero + stat row + filterable records
// table, composed entirely from wyber-ui-kit primitives + the same Tailwind
// token classes the kit's own components use (bg-card, border-border,
// text-foreground, text-muted-foreground, hsl(var(--primary))) so it's
// visually on-brand with every AI-generated WyberAi app, not a foreign look.
//
// config shape:
// {
//   brand: string
//   eyebrow: string
//   title: string
//   description: string
//   stats: [{ label, value, suffix?, delta? }]
//   statusTabs: string[]          // e.g. ['All','Active','Pending','Closed']
//   columns: string[]             // table header labels
//   rows: [ { cells: string[], status: string } ]
//   ctaLabel: string              // primary button on a row / header
// }

function statusVariant(status) {
  const s = status.toLowerCase()
  if (s.includes('active') || s.includes('open') || s.includes('progress')) return 'default'
  if (s.includes('pending') || s.includes('review') || s.includes('waiting')) return 'outline'
  if (s.includes('closed') || s.includes('done') || s.includes('complete')) return 'solid'
  return 'default'
}

export function buildRecordsTablePage(config) {
  const {
    brand, eyebrow, title, description, stats, statusTabs, columns, rows, ctaLabel,
  } = config

  const statsJsx = stats.map((s) => {
    const props = [
      `value={${typeof s.value === 'number' ? s.value : `'${s.value}'`}}`,
      `label="${s.label}"`,
      s.suffix ? `suffix="${s.suffix}"` : null,
      typeof s.delta === 'number' ? `delta={${s.delta}}` : null,
    ].filter(Boolean).join('\n            ')
    return `\n          <StatBlock\n            ${props}\n          />`
  }).join('\n')

  const tabsJsx = statusTabs.map((t) => `{ id: '${t.toLowerCase()}', label: '${t}' }`).join(', ')

  const headerCells = columns.map((c) => `<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">${c}</th>`).join('\n              ')

  const rowsJsx = rows.map((r) => {
    const dataCells = r.cells.slice(0, -1).map((c) => `<td className="px-5 py-4 text-sm text-foreground">${c}</td>`).join('\n                ')
    const lastCell = r.cells[r.cells.length - 1]
    return `            <tr className="border-b border-border last:border-0 transition-colors hover:bg-accent/40">
                ${dataCells}
                <td className="px-5 py-4 text-sm text-muted-foreground">${lastCell}</td>
                <td className="px-5 py-4 text-right">
                  <Badge variant="${statusVariant(r.status)}">${r.status}</Badge>
                </td>
              </tr>`
  }).join('\n')

  const appTsx = `import { useState } from 'react'
import {
  Navbar, Button, Badge, Input, Card, SectionHeading, StatBlock, Tabs,
} from './wyber-ui'

export default function App() {
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        brand={<>${brand}</>}
        links={[{ label: 'Overview', href: '#' }, { label: 'Clients', href: '#' }, { label: 'Reports', href: '#' }]}
        cta={<Button size="sm">${ctaLabel}</Button>}
      />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        <SectionHeading
          eyebrow="${eyebrow}"
          title="${title}"
          description="${description}"
          align="left"
        />

        <div className="mb-10 grid grid-cols-2 gap-6 rounded-2xl border border-border bg-card p-6 md:grid-cols-4 md:gap-8">${statsJsx}
        </div>

        <Card className="p-0">
          <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
            <Tabs
              tabs={[${tabsJsx}]}
              active={active}
              onChange={setActive}
            />
            <Input
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="md:w-64"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
              ${headerCells}
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
${rowsJsx}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  )
}
`

  return { appTsx }
}
