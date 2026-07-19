// WYBER STORE — local-first persistence injected into every generated WEB app.
//
// WHY: most users never connect Supabase, so until now every "tracker/planner"
// app the platform generated forgot its data on reload (the prompt mandated
// in-memory useState + mock data). This helper gives those apps real
// persistence with zero backend: localStorage on the user's device, namespaced
// per app, survives reload/close, works offline. It is the foundation the
// hosted "sync to your email" tier plugs into later.
//
// HOW IT WORKS (identical mechanics to wyber-ui-kit.ts — keep them in step):
//   - ONE generated-app module, `src/wyber-store.ts`, injected at build time by
//     both pipelines (sanitize-files + wyber-preview engine). Transient: never
//     persisted to the saved project, user files win, tree-shaken when unused.
//   - Apps import it relatively: `import { useCollection } from './wyber-store'`.
//   - The model never sees this source — it sees WYBER_STORE_PROMPT, injected
//     per-request by generate/route.ts ONLY when no backend is connected.
//
// HARD CONSTRAINTS:
//   - Zero external deps beyond react (both pipelines guarantee react only for
//     this module — see wyber-ui-kit.ts for the allowlist rationale).
//   - String.raw template: NO backticks, NO ${ sequences inside the source.
//     Validated by wyber-store.test.ts (esbuild transpile), like the UI kit.
//   - Namespacing is MANDATORY: editor previews and main-domain shell iframes
//     share an origin across different apps, so keys are prefixed with the
//     project id (window.__WYBER_PROJECT_ID__, baked in by the preview engine's
//     generateHTML and by sanitize-files at publish), falling back to
//     location.host on a bare custom domain.

export const WYBER_STORE_PATH = 'src/wyber-store.ts'

export const WYBER_STORE_SOURCE = String.raw`// Wyber Store — local-first persistence provided by the platform. Auto-injected;
// edits here are overwritten on every build. Data lives in localStorage on this
// device, namespaced per app: it survives reloads and works offline. Storage
// failures (private mode, blocked storage) fall back to in-memory so the app
// keeps working — it just won't persist.
import { useEffect, useMemo, useState } from 'react'

type WithId = { id: string }

function appId(): string {
  try {
    var injected = (window as any).__WYBER_PROJECT_ID__ || (window as any).__WYBER_APP__
    if (injected) return String(injected)
  } catch (e) { /* no window */ }
  try { if (location.host) return location.host } catch (e) { /* about:srcdoc */ }
  return 'app'
}

var NS = 'wyber:' + appId() + ':'
var memoryFallback: Record<string, string> = {}

function rawRead(key: string): string | null {
  try { return localStorage.getItem(NS + key) } catch (e) { return memoryFallback[NS + key] != null ? memoryFallback[NS + key] : null }
}
function rawWrite(key: string, value: string): void {
  try { localStorage.setItem(NS + key, value) } catch (e) { memoryFallback[NS + key] = value }
}

var listeners: Record<string, Array<() => void>> = {}
function notify(collection: string): void {
  var fns = listeners[collection] || []
  for (var i = 0; i < fns.length; i++) { try { fns[i]() } catch (e) { /* listener error */ } }
}
// Cross-tab sync: another tab writing the same collection refreshes this one.
try {
  window.addEventListener('storage', function (e) {
    if (e.key && e.key.indexOf(NS + 'c:') === 0) notify(e.key.slice((NS + 'c:').length))
  })
} catch (e) { /* no window */ }

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function readCollection<T extends WithId>(name: string, seed: T[]): T[] {
  var raw = rawRead('c:' + name)
  if (raw == null) {
    // First run: seed with the app's starter records so it never opens empty.
    rawWrite('c:' + name, JSON.stringify(seed))
    return seed.slice()
  }
  try {
    var parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) { return [] }
}
function writeCollection<T extends WithId>(name: string, items: T[]): void {
  rawWrite('c:' + name, JSON.stringify(items))
  notify(name)
}

export interface StoreActions<T extends WithId> {
  add(item: Omit<T, 'id'> & { id?: string }): T
  update(id: string, patch: Partial<T>): void
  remove(id: string): void
  clear(): void
}

export function createStore<T extends WithId>(name: string, seed: T[]) {
  return {
    getAll: function (): T[] { return readCollection(name, seed) },
    add: function (item: Omit<T, 'id'> & { id?: string }): T {
      var doc = Object.assign({}, item, { id: item.id || genId() }) as T
      writeCollection(name, readCollection(name, seed).concat([doc]))
      return doc
    },
    update: function (id: string, patch: Partial<T>): void {
      writeCollection(name, readCollection(name, seed).map(function (d) {
        return d.id === id ? (Object.assign({}, d, patch) as T) : d
      }))
    },
    remove: function (id: string): void {
      writeCollection(name, readCollection(name, seed).filter(function (d) { return d.id !== id }))
    },
    clear: function (): void { writeCollection(name, []) },
    subscribe: function (fn: () => void): () => void {
      if (!listeners[name]) listeners[name] = []
      listeners[name].push(fn)
      return function () {
        listeners[name] = (listeners[name] || []).filter(function (f) { return f !== fn })
      }
    },
  }
}

// React hook — persisted state in one line. The natural upgrade from
// useState(seedData): same shape on first run, but changes survive reloads.
//   const [clients, clientActions] = useCollection<Client>('clients', seedClients)
export function useCollection<T extends WithId>(name: string, seed: T[]): [T[], StoreActions<T>] {
  var store = useMemo(function () { return createStore<T>(name, seed) }, [name])
  var state = useState<T[]>(function () { return store.getAll() })
  var items = state[0]
  var setItems = state[1]
  useEffect(function () {
    setItems(store.getAll())
    return store.subscribe(function () { setItems(store.getAll()) })
  }, [store])
  var actions = useMemo(function (): StoreActions<T> {
    return {
      add: function (item) { return store.add(item) },
      update: function (id, patch) { store.update(id, patch) },
      remove: function (id) { store.remove(id) },
      clear: function () { store.clear() },
    }
  }, [store])
  return [items, actions]
}

// Backup: every collection in this app as one JSON string (offer as a download
// or copy action in Settings). importData accepts the same format back.
export function exportData(): string {
  var collections: Record<string, unknown> = {}
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i)
      if (key && key.indexOf(NS + 'c:') === 0) {
        try { collections[key.slice((NS + 'c:').length)] = JSON.parse(localStorage.getItem(key) || '[]') } catch (e) { /* skip bad entry */ }
      }
    }
  } catch (e) { /* storage blocked — export what memory has */
    for (var mk in memoryFallback) {
      if (mk.indexOf(NS + 'c:') === 0) {
        try { collections[mk.slice((NS + 'c:').length)] = JSON.parse(memoryFallback[mk]) } catch (e2) { /* skip */ }
      }
    }
  }
  return JSON.stringify({ app: appId(), exportedAt: new Date().toISOString(), collections: collections }, null, 2)
}

export function importData(json: string): boolean {
  try {
    var parsed = JSON.parse(json)
    var collections = parsed && parsed.collections
    if (!collections || typeof collections !== 'object') return false
    for (var name in collections) {
      if (Array.isArray(collections[name])) {
        rawWrite('c:' + name, JSON.stringify(collections[name]))
        notify(name)
      }
    }
    return true
  } catch (e) { return false }
}
`

export const WYBER_STORE_FILES: Record<string, string> = {
  [WYBER_STORE_PATH]: WYBER_STORE_SOURCE,
}

// Injected into the generation request ONLY when no backend is connected
// (generate/route.ts storage-context else branch). Mutually exclusive with the
// Supabase context — never show both to the model.
export const WYBER_STORE_PROMPT = `\n\n=== STORAGE CONTEXT (no backend connected) ===
The platform injects \`src/wyber-store.ts\` — local-first persistence (localStorage on the user's device, survives reload/close, works offline). Do NOT write this file yourself; import it.

WHEN the app is a personal tool where the user creates or tracks their own data (trackers, planners, notes, bookings, budgets, habits, lists, clients, inventory):
  import { useCollection } from './wyber-store'
  const [clients, clientActions] = useCollection<Client>('clients', seedClients)
  clientActions.add({ name: 'Asha', paid: false })   // id auto-generated
  clientActions.update(id, { paid: true })
  clientActions.remove(id); clientActions.clear()
Every record type needs an \`id: string\` field. Seed with the same 8-15 realistic records you would have used as mock data — they appear on first run, then the user's own changes persist. Also import { exportData, importData } from './wyber-store' and expose a small "Export data" action (Settings row or footer button) that downloads/copies exportData().

WHEN the app is a content/marketing/landing site with nothing user-editable: plain useState as usual — do not force storage in.

Do NOT import or reference Supabase. Do NOT add any storage-notice banner or warning about data persistence — the platform handles that externally.`
