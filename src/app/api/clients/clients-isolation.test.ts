import { describe, it, expect, vi, beforeEach } from 'vitest'

// Agency mode: every client and deliverable route must be scoped to the signed-in account. These tests run the real
// route handlers against an in-memory database that applies .eq() filters like Postgres does, with two accounts.

type Row = Record<string, unknown>
const db: Record<string, Row[]> = { clients: [], client_deliverables: [], projects: [] }
let currentUser: string | null = null

function from(table: string) {
  let rows = () => db[table]
  let filters: Array<[string, unknown]> = []
  let op: 'select' | 'update' | 'delete' | 'insert' = 'select'
  let patch: Row = {}
  let wantCount = false
  let limitN = Infinity
  let order: [string, boolean] | null = null
  const match = () => {
    let r = rows().filter(x => filters.every(([k, v]) => x[k] === v))
    if (order) r = [...r].sort((a, b) => (((a[order![0]] as number) - (b[order![0]] as number)) * (order![1] ? 1 : -1)))
    return r.slice(0, limitN)
  }
  const exec = () => {
    if (op === 'update') { const m = match(); m.forEach(x => Object.assign(x, patch)); return m }
    if (op === 'delete') { const m = match(); db[table] = rows().filter(x => !m.includes(x)); return m }
    return match()
  }
  const b: Record<string, unknown> = {
    select: () => b,
    eq: (k: string, v: unknown) => { filters.push([k, v]); return b },
    order: (k: string, o: { ascending: boolean }) => { order = [k, o.ascending]; return b },
    limit: (n: number) => { limitN = n; return b },
    update: (p: Row) => { op = 'update'; patch = p; return b },
    delete: (o?: { count?: string }) => { op = 'delete'; wantCount = !!o?.count; return b },
    insert: (r: Row) => { op = 'insert'; const row = { id: `id${Math.random()}`, ...r }; rows().push(row); filters = [['id', row.id]]; return b },
    maybeSingle: async () => ({ data: exec()[0] ?? null, error: null }),
    // Real PostgREST: .single() with zero rows is an error, not null.
    single: async () => { const m = exec(); return m[0] ? { data: m[0], error: null } : { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } } },
    then: (res: (v: unknown) => void) => { const m = exec(); res({ data: m, error: null, count: wantCount ? m.length : null }) },
  }
  return b
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: currentUser ? { id: currentUser } : null } }) } }),
  createAdminClient: async () => ({ from }),
}))

const req = (body: unknown) => new Request('http://x', { method: 'POST', body: JSON.stringify(body) }) as never
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  db.clients = [
    { id: 'cA', owner_id: 'A', name: 'A client', slug: 'a-1', status: 'active' },
    { id: 'cB', owner_id: 'B', name: 'B client', slug: 'b-1', status: 'active' },
  ]
  db.client_deliverables = []
  db.projects = [{ id: 'pA', user_id: 'A' }, { id: 'pB', user_id: 'B' }]
  currentUser = null
})

describe('agency clients API is isolated per account', () => {
  it('rejects signed-out callers', async () => {
    const { GET } = await import('./route')
    expect((await GET()).status).toBe(401)
  })

  it('lists only the caller\'s own clients', async () => {
    const { GET } = await import('./route')
    currentUser = 'A'
    const j = await (await GET()).json()
    expect(j.clients.map((c: Row) => c.id)).toEqual(['cA'])
  })

  it('creating a client stamps the caller as owner', async () => {
    const { POST } = await import('./route')
    currentUser = 'B'
    const r = await POST(req({ name: 'New Co' }))
    expect(r.status).toBe(201)
    expect(db.clients.find(c => c.name === 'New Co')?.owner_id).toBe('B')
  })

  it('another account cannot edit a client, and gets a 404 (not a 500)', async () => {
    const { PATCH } = await import('./[id]/route')
    currentUser = 'B'
    const r = await PATCH(req({ name: 'hijacked', status: 'paused' }), ctx('cA'))
    expect(r.status).toBe(404)
    expect(db.clients.find(c => c.id === 'cA')).toMatchObject({ name: 'A client', status: 'active' })
  })

  it('the owner can edit their client', async () => {
    const { PATCH } = await import('./[id]/route')
    currentUser = 'A'
    const r = await PATCH(req({ status: 'paused' }), ctx('cA'))
    expect(r.status).toBe(200)
    expect(db.clients.find(c => c.id === 'cA')?.status).toBe('paused')
  })

  it('another account cannot delete a client', async () => {
    const { DELETE } = await import('./[id]/route')
    currentUser = 'B'
    const r = await DELETE(req({}), ctx('cA'))
    expect(r.status).toBe(404)
    expect(db.clients.some(c => c.id === 'cA')).toBe(true)
  })

  it('cannot attach a deliverable to someone else\'s client', async () => {
    const { POST } = await import('./[id]/deliverables/route')
    currentUser = 'B'
    const r = await POST(req({ projectId: 'pB' }), ctx('cA'))
    expect(r.status).toBe(404)
    expect(db.client_deliverables).toHaveLength(0)
  })

  it('cannot attach a stranger\'s project to your own client', async () => {
    const { POST } = await import('./[id]/deliverables/route')
    currentUser = 'A'
    const r = await POST(req({ projectId: 'pB' }), ctx('cA'))
    expect(r.status).toBe(404)
    expect(db.client_deliverables).toHaveLength(0)
  })

  it('attaches your own project to your own client', async () => {
    const { POST } = await import('./[id]/deliverables/route')
    currentUser = 'A'
    const r = await POST(req({ projectId: 'pA', headline: 'Booking portal' }), ctx('cA'))
    expect(r.status).toBe(201)
    expect(db.client_deliverables[0]).toMatchObject({ client_id: 'cA', project_id: 'pA' })
  })
})
