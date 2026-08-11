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
    const decl = stateDeclaration(varName, prop.type, allFiles)
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

function stateDeclaration(varName: string, type: string, allFiles: FileMap): string | null {
  // Skip callbacks and object-of-callbacks — they don't need useState
  if (isCallbackType(type)) return null
  if (isActionsObjectType(type)) return null

  const isArr = type.endsWith('[]') || /^Array</.test(type)
  if (isArr) {
    const baseType = type.replace(/\[\]$/, '').replace(/^Array<(.+)>$/, '$1').trim()
    const seed = seedFromInterface(varName, baseType, allFiles)
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

/**
 * Generate 3 seed records whose fields match the actual interface definition
 * found in the component files. Falls back to name-based guessing only when
 * the interface can't be located (avoids undefined-field crashes at runtime).
 */
function seedFromInterface(varName: string, baseType: string, allFiles: FileMap): string {
  // Try to find the actual interface so seed records cover every field
  const ifaceDef = findOrInferInterface(baseType, allFiles)
  const fields = parseInterfaceFields(ifaceDef)

  if (fields.length > 0) {
    const records = [0, 1, 2].map(i => {
      const entries = fields.map(f => {
        const v = seedFieldValue(f.name, f.type, i)
        return `${f.name}: ${typeof v === 'string' && !v.startsWith('[') ? `'${v}'` : v}`
      })
      return `{ ${entries.join(', ')} }`
    })
    return `[\n    ${records.join(',\n    ')},\n  ]`
  }

  // Ultimate fallback — generic records guaranteed not to crash on .length / .toLocaleString
  return `[\n    { id: '1', name: 'Item One', status: 'active', value: 100 },\n    { id: '2', name: 'Item Two', status: 'pending', value: 200 },\n    { id: '3', name: 'Item Three', status: 'inactive', value: 300 },\n  ]`
}

function parseInterfaceFields(ifaceDef: string): Array<{ name: string; type: string }> {
  const fields: Array<{ name: string; type: string }> = []
  const bodyMatch = ifaceDef.match(/\{([\s\S]*)\}/)
  if (!bodyMatch) return fields
  for (const line of bodyMatch[1].split('\n')) {
    const m = line.match(/^\s+(\w+)\??\s*:\s*(.+?)\s*[;,]?\s*$/)
    if (m) fields.push({ name: m[1], type: m[2].trim() })
  }
  return fields
}

const NAMES  = ['Alice Johnson', 'Bob Smith', 'Carol Davis']
const EMAILS = ['alice@example.com', 'bob@example.com', 'carol@example.com']
const COMPANIES = ['Acme Corp', 'TechCo', 'Startup Ltd']
const PHONES = ['+1 415 555 0101', '+1 415 555 0102', '+1 415 555 0103']
const DATES  = ['2026-08-10', '2026-08-09', '2026-08-08']

function seedFieldValue(name: string, type: string, i: number): string | number | boolean {
  const k = name.toLowerCase()

  // Union literal type: 'lead' | 'active' | 'churned'  →  cycle through options
  const literals = [...type.matchAll(/'([^']+)'/g)].map(m => m[1])
  if (literals.length > 0) return literals[i % literals.length]

  // Field-name heuristics (most specific first)
  if (k === 'id')                                        return String(i + 1)
  if (k === 'name' || k === 'fullname')                  return NAMES[i]
  if (k === 'email')                                     return EMAILS[i]
  if (k === 'company' || k === 'organization' || k === 'firm') return COMPANIES[i]
  if (k === 'phone' || k === 'mobile' || k === 'tel')    return PHONES[i]
  if (/date|at$|time|day/.test(k))                       return DATES[i]
  if (k === 'stage')    return ['Proposal', 'Discovery', 'Negotiation'][i]
  if (k === 'priority') return ['high', 'medium', 'low'][i]
  if (k === 'assignee') return NAMES[i].split(' ')[0]
  if (k === 'title' || k === 'label' || k === 'subject') return [`Task ${i + 1}`, `Issue ${i + 1}`, `Ticket ${i + 1}`][i]
  if (k === 'description' || k === 'note' || k === 'body') return [`Item ${i + 1} description`, `Note ${i + 1}`, `Detail ${i + 1}`][i]
  if (k === 'type' || k === 'kind' || k === 'category')  return ['primary', 'secondary', 'tertiary'][i]
  if (k === 'user' || k === 'author' || k === 'owner')   return EMAILS[i]
  if (k === 'number' || k === 'num' || k === 'ref')      return `REF-00${i + 1}`
  if (k === 'client' || k === 'customer')                return COMPANIES[i]

  // Type-based fallbacks
  if (type === 'number' || /value|amount|price|total|cost|fee|balance|revenue|profit|salary|count|qty|quantity|probability|percent|score|rank|index|size|age/.test(k))
    return [5000, 12500, 3750][i]
  if (type === 'boolean' || /^is|^has|^can|^show|^enable|^active|^visible/.test(k))
    return false

  // Default: non-empty string (never undefined)
  return `${cap(name)} ${i + 1}`
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
