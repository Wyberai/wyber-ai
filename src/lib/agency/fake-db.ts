// An in-memory stand-in for the Supabase client, for tests. It applies .eq() / .in() filters like Postgres does, and,
// like PostgREST, treats .single() with no row as an error. Only what the agency routes use is implemented.

type Row = Record<string, unknown>
export type Tables = Record<string, Row[]>

export function makeFakeDb(tables: Tables) {
  let seq = 0
  function from(table: string) {
    const rows = () => (tables[table] ??= [])
    let filters: Array<(r: Row) => boolean> = []
    let op: 'select' | 'update' | 'delete' | 'insert' = 'select'
    let patch: Row = {}
    let wantCount = false
    let limitN = Infinity
    let order: [string, boolean] | null = null
    const match = () => {
      let r = rows().filter(x => filters.every(f => f(x)))
      if (order) { const [k, asc] = order; r = [...r].sort((a, b) => (String(a[k]) < String(b[k]) ? -1 : String(a[k]) > String(b[k]) ? 1 : 0) * (asc ? 1 : -1)) }
      return r.slice(0, limitN)
    }
    const exec = () => {
      if (op === 'update') { const m = match(); m.forEach(x => Object.assign(x, patch)); return m }
      if (op === 'delete') { const m = match(); tables[table] = rows().filter(x => !m.includes(x)); return m }
      return match()
    }
    const b: Record<string, unknown> = {
      select: () => b,
      eq: (k: string, v: unknown) => { filters.push(r => r[k] === v); return b },
      in: (k: string, vs: unknown[]) => { filters.push(r => vs.includes(r[k])); return b },
      order: (k: string, o?: { ascending?: boolean }) => { order = [k, o?.ascending !== false]; return b },
      limit: (n: number) => { limitN = n; return b },
      update: (p: Row) => { op = 'update'; patch = p; return b },
      delete: (o?: { count?: string }) => { op = 'delete'; wantCount = !!o?.count; return b },
      insert: (r: Row) => { op = 'insert'; const row = { id: `id${++seq}`, created_at: new Date(Date.now() + seq).toISOString(), ...r }; rows().push(row); filters = [x => x === row]; return b },
      // Like Postgres, hand back copies: a later update must not change a row a route has already read.
      maybeSingle: async () => { const r = exec()[0]; return { data: r ? { ...r } : null, error: null } },
      single: async () => { const m = exec(); return m[0] ? { data: { ...m[0] }, error: null } : { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } } },
      then: (res: (v: unknown) => void) => { const m = exec(); res({ data: m.map(r => ({ ...r })), error: null, count: wantCount ? m.length : null }) },
    }
    return b
  }
  return { from }
}
