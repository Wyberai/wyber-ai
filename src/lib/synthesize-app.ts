/**
 * Smart App.tsx synthesizer.
 *
 * When the model's output is missing App.tsx (truncated stream, soft-deadline
 * cutoff, or a failed edit-apply), the naive fallback renders every component
 * with zero props — which crashes any app where components import types from
 * App or expect data callbacks.
 *
 * This module parses each component file's Props interface, collects the types
 * it expects from App.tsx, and generates a stateful App.tsx that:
 *   - Exports required type definitions (found or inferred from usage)
 *   - Creates useState entries with realistic seed data
 *   - Passes the correct props to each component
 */

type FileMap = Record<string, string> // path → content

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Synthesize a minimal-but-working App.tsx from the component files present.
 * Returns the file content string, or null if synthesis isn't possible
 * (mobile project, no components, etc.).
 */
export function synthesizeAppTsx(allFiles: FileMap, projectType: string): string | null {
  if (projectType === 'mobile') return null

  const compPaths = Object.keys(allFiles).filter(p =>
    p.startsWith('src/') &&
    (p.endsWith('.tsx') || p.endsWith('.jsx')) &&
    !p.endsWith('main.tsx') && !p.endsWith('main.jsx') &&
    !p.endsWith('App.tsx') && !p.endsWith('App.jsx')
  )
  if (compPaths.length === 0) return null

  // 1. Find all names that component files import FROM App.tsx/App.jsx
  const importedFromApp = new Set<string>()
  for (const content of Object.values(allFiles)) {
    const re = /import\s+(?:type\s+)?\{\s*([^}]+)\}\s+from\s+['"][^'"]*App['"]/g
    let m
    while ((m = re.exec(content)) !== null) {
      m[1].split(',')
        .map(s => s.trim().replace(/^type\s+/, '').trim())
        .filter(Boolean)
        .forEach(n => importedFromApp.add(n))
    }
  }

  // 2. For each required type, find its definition anywhere in the file set,
  //    or infer a plausible interface from usage patterns in the components.
  const typeDefs = new Map<string, string>()
  for (const typeName of importedFromApp) {
    typeDefs.set(typeName, findOrInferInterface(typeName, allFiles))
  }

  // 3. Parse each component to find what props it needs and whether it has a
  //    default export (skip utility/context files with no renderable component).
  const comps: ComponentInfo[] = []
  for (const path of compPaths) {
    const content = allFiles[path] || ''
    if (!/export\s+default\s+/m.test(content)) continue // not a component

    const name = path.split('/').pop()!.replace(/\.(tsx|jsx)$/, '')
    const rel = './' + path.replace(/^src\//, '').replace(/\.(tsx|jsx)$/, '')
    const props = parseProps(content)
    comps.push({ name, importPath: rel, props })
  }
  if (comps.length === 0) return null

  // 4. Collect unique state variables across all components.
  //    Multiple components can share the same prop (e.g., `contacts`) — we
  //    only need one useState for each.
  const stateMap = new Map<string, PropEntry>()
  for (const comp of comps) {
    for (const prop of comp.props) {
      if (!stateMap.has(prop.name)) stateMap.set(prop.name, prop)
    }
  }

  // 4b. Detect {base}Actions / {base}Handlers props paired with a {base}[]
  //     array prop. These become real CRUD handlers instead of null state so
  //     add/update/remove calls don't crash at runtime.
  //     e.g. contactActions + contacts: Contact[] → setContacts-backed handlers
  const actionsMap = new Map<string, string>() // propName → array-state varName
  for (const [varName] of stateMap) {
    const m = varName.match(/^(.+?)(?:Actions|Handlers|Callbacks)$/)
    if (!m) continue
    const base = m[1]
    const arrState = [base + 's', base].find(k => {
      const e = stateMap.get(k)
      return e && (e.type.endsWith('[]') || e.type.startsWith('Array<'))
    })
    if (arrState) actionsMap.set(varName, arrState)
  }

  // 5. Generate the file.
  const lines: string[] = []

  // Imports
  lines.push("import React, { useState } from 'react'")
  for (const comp of comps) {
    lines.push(`import ${comp.name} from '${comp.importPath}'`)
  }
  lines.push('')

  // Type exports
  for (const def of typeDefs.values()) {
    lines.push(def)
    lines.push('')
  }

  // App function
  lines.push('export default function App() {')

  // State declarations — skip actionsMap entries (generated inline as const)
  let hasState = false
  for (const [varName, prop] of stateMap) {
    if (actionsMap.has(varName)) continue
    const decl = stateDeclaration(varName, prop.type)
    if (decl) { lines.push('  ' + decl); hasState = true }
  }
  if (hasState) lines.push('')

  // Render
  lines.push('  return (')
  lines.push('    <div className="min-h-screen bg-background text-foreground">')
  for (const comp of comps) {
    const attrs = comp.props.map(p => propAttribute(p, stateMap, actionsMap)).filter(Boolean).join(' ')
    lines.push(`      <${comp.name}${attrs ? ' ' + attrs : ''} />`)
  }
  lines.push('    </div>')
  lines.push('  )')
  lines.push('}')
  lines.push('')

  return lines.join('\n')
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface PropEntry {
  name: string
  type: string
  optional: boolean
}

interface ComponentInfo {
  name: string
  importPath: string
  props: PropEntry[]
}

// ─── Prop parsing ────────────────────────────────────────────────────────────

function parseProps(content: string): PropEntry[] {
  const props: PropEntry[] = []
  // Match the first Props-like interface (ComponentProps, Props, XxxProps …)
  const m = content.match(/interface\s+\w*[Pp]rops\s*\{([\s\S]*?)\n\}/)
  if (!m) return props

  const body = m[1]
  // Each line: [indent] name[?]: type[;]
  const linePat = /^\s+(\w+)(\??)\s*:\s*(.+?)\s*[;,]?\s*$/
  for (const line of body.split('\n')) {
    const lm = line.match(linePat)
    if (lm) props.push({ name: lm[1], type: lm[3].trim(), optional: lm[2] === '?' })
  }
  return props
}

// ─── State generation ────────────────────────────────────────────────────────

function stateDeclaration(varName: string, type: string): string | null {
  // Skip callbacks and object-of-callbacks — they don't need useState
  if (isCallbackType(type)) return null
  if (isActionsObjectType(type)) return null

  const isArr = type.endsWith('[]') || /^Array</.test(type)
  if (isArr) {
    const baseType = type.replace(/\[\]$/, '').replace(/^Array<(.+)>$/, '$1').trim()
    const seed = seedArray(varName, baseType)
    return `const [${varName}, set${cap(varName)}] = useState<${type}>(${seed})`
  }
  if (type === 'string') return `const [${varName}, set${cap(varName)}] = useState(${defaultString(varName)})`
  if (type === 'number') return `const [${varName}, set${cap(varName)}] = useState(0)`
  if (type === 'boolean') return `const [${varName}, set${cap(varName)}] = useState(false)`

  // Complex object type — initialize as null with optional chaining expected
  return `const [${varName}, set${cap(varName)}] = useState<${type} | null>(null)`
}

function propAttribute(
  prop: PropEntry,
  stateMap: Map<string, PropEntry>,
  actionsMap: Map<string, string>,
): string {
  const type = prop.type

  // {base}Actions / {base}Handlers paired with a matching array state →
  // generate real CRUD handlers so add/update/remove calls don't crash.
  if (actionsMap.has(prop.name)) {
    const arrState = actionsMap.get(prop.name)!
    const setter = `set${cap(arrState)}`
    return (
      `${prop.name}={{` +
      ` add: (item: any) => ${setter}((p: any[]) => [...p, { ...item, id: String(Date.now()) }]),` +
      ` update: (id: string, patch: any) => ${setter}((p: any[]) => p.map((x: any) => x.id === id ? { ...x, ...patch } : x)),` +
      ` remove: (id: string) => ${setter}((p: any[]) => p.filter((x: any) => x.id !== id))` +
      ` }}`
    )
  }

  // Simple callback: (arg: T) => void, () => void
  if (isCallbackType(type)) {
    // For navigation/routing callbacks (onNavigate, onSelect, setSection, etc.),
    // wire to the matching string state if it exists
    const targetState = guessNavigationTarget(prop.name, stateMap)
    if (targetState) {
      return `${prop.name}={(v: string) => set${cap(targetState)}(v)}`
    }
    return `${prop.name}={(..._args: unknown[]) => {}}`
  }

  // Inline object of callbacks: { add: (x) => void, update: ..., remove: ... }
  if (isActionsObjectType(type)) {
    const methods = extractMethodNames(type)
    if (methods.length > 0) {
      const body = methods.map(n => `${n}: (..._args: unknown[]) => {}`).join(', ')
      return `${prop.name}={{ ${body} }}`
    }
    return `${prop.name}={{}}`
  }

  // State-backed prop
  if (stateMap.has(prop.name)) {
    return `${prop.name}={${prop.name}}`
  }

  return ''
}

// ─── Type finding / inference ─────────────────────────────────────────────────

function findOrInferInterface(typeName: string, allFiles: FileMap): string {
  // Try to find it defined in any file (may or may not have `export`)
  const defPat = new RegExp(
    `(?:export\\s+)?(?:interface|type)\\s+${typeName}[\\s<{=]([\\s\\S]*?)\\n\\}`
  )
  for (const content of Object.values(allFiles)) {
    const m = content.match(defPat)
    if (m) {
      // Re-emit as an exported interface
      const body = m[0]
        .replace(/^(?:export\s+)?(?:interface|type)\s+\w+[^{]*\{/, '')
        .replace(/\}$/, '')
      return `export interface ${typeName} {\n${body}\n}`
    }
  }
  // Infer from usage
  return inferInterface(typeName, allFiles)
}

function inferInterface(typeName: string, allFiles: FileMap): string {
  const fields = new Map<string, string>()
  fields.set('id', 'string')

  for (const content of Object.values(allFiles)) {
    // Find singular variable names typed as this type: `item: TypeName`
    const varPat = new RegExp(`\\b(\\w+):\\s*${typeName}\\b`, 'g')
    let m
    const singulars: string[] = []
    while ((m = varPat.exec(content)) !== null) singulars.push(m[1])

    // For array variables `items: TypeName[]`, look at arrow-function parameter
    // patterns inside map/filter/find calls: `items.map(c => c.field)`
    const arrPat = new RegExp(`\\b\\w+:\\s*${typeName}\\[\\]`, 'g')
    if (arrPat.test(content)) {
      const dotPat = /\.\s*(?:map|filter|find|forEach|some|every)\s*\(\s*\w+\s*=>\s*\w+\.(\w+)/g
      while ((m = dotPat.exec(content)) !== null) {
        const field = m[1]
        if (!isBuiltinMethod(field)) {
          fields.set(field, guessFieldType(field))
        }
      }
    }

    // For singular variables, track property accesses: `item.field`
    for (const v of singulars) {
      const dotPat = new RegExp(`\\b${v}\\.(\\w+)\\b`, 'g')
      while ((m = dotPat.exec(content)) !== null) {
        const field = m[1]
        if (!isBuiltinMethod(field) && !/^[A-Z]/.test(field)) {
          fields.set(field, guessFieldType(field))
        }
      }
    }
  }

  const body = Array.from(fields.entries()).map(([k, v]) => `  ${k}: ${v}`).join('\n')
  return `export interface ${typeName} {\n${body}\n}`
}

// ─── Seed data ────────────────────────────────────────────────────────────────

function seedArray(varName: string, baseType: string): string {
  const key = (varName + baseType).toLowerCase()

  if (/contact|customer|client|person|member|user/.test(key)) {
    return `[\n    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', status: 'active', company: 'Acme Corp' },\n    { id: '2', name: 'Bob Smith', email: 'bob@example.com', status: 'lead', company: 'TechCo' },\n    { id: '3', name: 'Carol Davis', email: 'carol@example.com', status: 'prospect', company: 'Startup Ltd' },\n  ]`
  }
  if (/deal|opportunity|pipeline/.test(key)) {
    return `[\n    { id: '1', name: 'Enterprise License Q4', value: 50000, stage: 'Proposal', probability: 75 },\n    { id: '2', name: 'SMB Starter Pack', value: 5000, stage: 'Discovery', probability: 30 },\n    { id: '3', name: 'Agency Partnership', value: 120000, stage: 'Negotiation', probability: 90 },\n  ]`
  }
  if (/activity|event|log|history/.test(key)) {
    return `[\n    { id: '1', type: 'call', description: 'Discovery call with Alice', date: '2026-08-10', user: 'sales@example.com' },\n    { id: '2', type: 'email', description: 'Sent proposal to Bob', date: '2026-08-09', user: 'sales@example.com' },\n    { id: '3', type: 'meeting', description: 'Product demo for Carol', date: '2026-08-08', user: 'sales@example.com' },\n  ]`
  }
  if (/invoice|payment|bill|receipt/.test(key)) {
    return `[\n    { id: '1', number: 'INV-001', client: 'Acme Corp', amount: 5000, status: 'paid', dueDate: '2026-08-01' },\n    { id: '2', number: 'INV-002', client: 'TechCo', amount: 12500, status: 'pending', dueDate: '2026-08-15' },\n    { id: '3', number: 'INV-003', client: 'Startup Ltd', amount: 3750, status: 'overdue', dueDate: '2026-07-20' },\n  ]`
  }
  if (/product|item|listing|catalog|sku/.test(key)) {
    return `[\n    { id: '1', name: 'Premium Plan', price: 99, category: 'SaaS', status: 'active' },\n    { id: '2', name: 'Starter Plan', price: 29, category: 'SaaS', status: 'active' },\n    { id: '3', name: 'Enterprise Add-on', price: 499, category: 'Services', status: 'available' },\n  ]`
  }
  if (/task|todo|ticket|issue|bug/.test(key)) {
    return `[\n    { id: '1', title: 'Set up project structure', status: 'done', priority: 'high', assignee: 'Alice' },\n    { id: '2', title: 'Design UI mockups', status: 'in-progress', priority: 'high', assignee: 'Bob' },\n    { id: '3', title: 'Write API documentation', status: 'todo', priority: 'medium', assignee: 'Carol' },\n  ]`
  }
  if (/order|cart|purchase|transaction/.test(key)) {
    return `[\n    { id: '1', orderId: 'ORD-001', customer: 'Alice Johnson', total: 249.99, status: 'fulfilled', date: '2026-08-10' },\n    { id: '2', orderId: 'ORD-002', customer: 'Bob Smith', total: 89.50, status: 'processing', date: '2026-08-11' },\n    { id: '3', orderId: 'ORD-003', customer: 'Carol Davis', total: 1199.00, status: 'pending', date: '2026-08-11' },\n  ]`
  }
  // Generic fallback
  return `[\n    { id: '1', name: 'Item One', status: 'active', value: 100 },\n    { id: '2', name: 'Item Two', status: 'pending', value: 200 },\n    { id: '3', name: 'Item Three', status: 'inactive', value: 300 },\n  ]`
}

function defaultString(varName: string): string {
  const key = varName.toLowerCase()
  if (/section|tab|view|page|route|screen|panel/.test(key)) return "'dashboard'"
  if (/theme|mode/.test(key)) return "'light'"
  if (/status/.test(key)) return "'active'"
  if (/role/.test(key)) return "'user'"
  if (/lang|locale/.test(key)) return "'en'"
  return "''"
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isCallbackType(type: string): boolean {
  const t = type.trim()
  // Starts with `(` or is `() => …`, `(arg: T) => T`, etc.
  return (t.startsWith('(') && t.includes('=>')) || /^\(\s*\)/.test(t)
}

function isActionsObjectType(type: string): boolean {
  // Object literal with at least one method: { add: (...) => void, ... }
  return type.includes('{') && type.includes('=>') && !type.startsWith('(')
}

function extractMethodNames(type: string): string[] {
  const names: string[] = []
  const re = /(\w+)\s*(?:\??\s*)?:\s*\([^)]*\)\s*=>/g
  let m
  while ((m = re.exec(type)) !== null) names.push(m[1])
  return names
}

function guessNavigationTarget(callbackName: string, stateMap: Map<string, PropEntry>): string | null {
  // onNavigate → look for currentSection, activeSection, section, currentTab, etc.
  const key = callbackName.toLowerCase()
  if (!/navigate|select|change|set/.test(key)) return null

  for (const varName of stateMap.keys()) {
    const vKey = varName.toLowerCase()
    if (/section|tab|view|page|route|screen|panel/.test(vKey) && stateMap.get(varName)?.type === 'string') {
      return varName
    }
  }
  return null
}

function guessFieldType(field: string): string {
  const key = field.toLowerCase()
  if (/count|total|amount|price|value|index|size|age|score|rank|num|qty|quantity|percent|rate/.test(key)) return 'number'
  if (/^is|^has|^can|^show|^enable|^active|^visible|^check|^toggle/.test(key)) return 'boolean'
  return 'string'
}

function isBuiltinMethod(field: string): boolean {
  return ['map', 'filter', 'find', 'forEach', 'reduce', 'sort', 'slice', 'some',
    'every', 'includes', 'push', 'pop', 'shift', 'unshift', 'length', 'flat',
    'flatMap', 'concat', 'join', 'reverse', 'indexOf', 'lastIndexOf', 'keys',
    'values', 'entries', 'toString', 'valueOf'].includes(field)
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
