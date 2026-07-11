import { describe, it, expect, beforeEach } from 'vitest'
import { transform } from 'esbuild'
import vm from 'node:vm'
import { WYBER_STORE_SOURCE } from './wyber-store'

// Runs the ACTUAL shipped store source (not a reimplementation) against a
// mocked browser environment, to prove the persistence semantics the generated
// apps rely on: seed-on-first-run, add/update/remove, survives reload, per-app
// namespacing, and export/import round-trip.

type StoreModule = {
  createStore: <T extends { id: string }>(name: string, seed: T[]) => {
    getAll(): T[]
    add(item: any): T
    update(id: string, patch: any): void
    remove(id: string): void
    clear(): void
  }
  exportData: () => string
  importData: (json: string) => boolean
}

function makeLocalStorage(backing: Map<string, string>) {
  return {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => { backing.set(k, v) },
    removeItem: (k: string) => { backing.delete(k) },
    get length() { return backing.size },
    key: (i: number) => Array.from(backing.keys())[i] ?? null,
  }
}

// Load the store module fresh with a given appId + shared localStorage backing.
// A fresh load mirrors a real page load (module-level NS is recomputed).
async function loadStore(appId: string, backing: Map<string, string>): Promise<StoreModule> {
  const js = (await transform(WYBER_STORE_SOURCE, { loader: 'ts', format: 'cjs' })).code
  const localStorage = makeLocalStorage(backing)
  const listeners: Record<string, any> = {}
  const win: any = {
    __WYBER_PROJECT_ID__: appId,
    addEventListener: (ev: string, fn: any) => { listeners[ev] = fn },
  }
  const sandbox: any = {
    module: { exports: {} },
    exports: {},
    require: (id: string) => { if (id === 'react') return {}; throw new Error('unexpected import ' + id) },
    window: win,
    localStorage,
    location: { host: 'preview.wyberai.app' },
    Date, Math, JSON, Array, Object,
  }
  sandbox.module.exports = sandbox.exports
  vm.runInNewContext(js, sandbox)
  return sandbox.module.exports as StoreModule
}

describe('wyber-store — persistence behavior', () => {
  let backing: Map<string, string>
  beforeEach(() => { backing = new Map() })

  it('seeds on first run, then persists mutations across a reload', async () => {
    const seed = [{ id: '1', name: 'Asha', paid: false }]
    let s = await loadStore('proj-A', backing)
    let store = s.createStore('clients', seed)
    expect(store.getAll()).toHaveLength(1)          // seeded

    const added = store.add({ name: 'Bala', paid: true })
    expect(added.id).toBeTruthy()                    // id auto-generated
    expect(store.getAll()).toHaveLength(2)
    store.update('1', { paid: true })
    expect(store.getAll().find(c => c.id === '1')!.paid).toBe(true)

    // Simulate a full reload: fresh module load, SAME localStorage backing.
    s = await loadStore('proj-A', backing)
    store = s.createStore('clients', seed)
    expect(store.getAll()).toHaveLength(2)           // survived reload, not re-seeded
    expect(store.getAll().find(c => c.id === added.id)!.name).toBe('Bala')

    store.remove(added.id)
    expect(store.getAll()).toHaveLength(1)
  })

  it('namespaces per app — two apps sharing an origin do not see each others data', async () => {
    const a = await loadStore('proj-A', backing)
    const b = await loadStore('proj-B', backing)
    a.createStore('items', []).add({ name: 'only-A' })
    expect(a.createStore('items', []).getAll()).toHaveLength(1)
    expect(b.createStore('items', []).getAll()).toHaveLength(0) // isolated
  })

  it('export/import round-trips all collections', async () => {
    const s = await loadStore('proj-A', backing)
    s.createStore('clients', []).add({ name: 'Asha' })
    s.createStore('invoices', []).add({ amount: 500 })
    const json = s.exportData()
    expect(JSON.parse(json).collections.clients).toHaveLength(1)

    // Wipe into a fresh app, import the backup.
    const fresh = new Map<string, string>()
    const s2 = await loadStore('proj-A', fresh)
    expect(s2.importData(json)).toBe(true)
    expect(s2.createStore('clients', []).getAll()).toHaveLength(1)
    expect(s2.createStore('invoices', []).getAll()).toHaveLength(1)
  })

  it('falls back to in-memory when localStorage throws (private mode)', async () => {
    const js = (await transform(WYBER_STORE_SOURCE, { loader: 'ts', format: 'cjs' })).code
    const throwing = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => {}, length: 0, key: () => null,
    }
    const sandbox: any = {
      module: { exports: {} }, exports: {},
      require: () => ({}),
      window: { __WYBER_PROJECT_ID__: 'p', addEventListener: () => {} },
      localStorage: throwing, location: { host: 'x' },
      Date, Math, JSON, Array, Object,
    }
    sandbox.module.exports = sandbox.exports
    vm.runInNewContext(js, sandbox)
    const store = (sandbox.module.exports as StoreModule).createStore('t', [])
    expect(() => store.add({ name: 'x' })).not.toThrow()   // never crashes the app
    expect(store.getAll()).toHaveLength(1)                  // in-memory persistence
  })
})
