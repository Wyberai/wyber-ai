/**
 * Deterministic router wiring: swaps placeholder components with real screen imports.
 *
 * Handles two scaffold patterns:
 *   1. Imported placeholder:  import OverviewPlaceholder from './anywhere/Overview'
 *      → replaced with:       import Overview from './screens/Overview'
 *   2. Inline placeholder:    const OverviewPlaceholder = () => <div>Coming up next...</div>
 *      → adds import:         import Overview from './screens/Overview'
 *      (inline const stays but is now unused — harmless, tree-shaken at build)
 *
 * In both cases, JSX usage is swapped: <OverviewPlaceholder /> → <Overview />
 */

export interface WireScreen {
  path: string
  name: string
}

export interface WireResult {
  success: boolean
  swappedCount: number
  routerContent: string
}

export function deterministicWire(routerContent: string, screens: WireScreen[]): WireResult {
  let content = routerContent
  let swappedCount = 0

  for (const screen of screens) {
    const { name } = screen
    const placeholderName = `${name}Placeholder`

    if (!content.includes(placeholderName)) continue

    // Compute a relative import dir for the real component (same logic as before)
    const dir = screen.path.includes('/screens/')
      ? './screens'
      : screen.path.replace(/\/[^/]+$/, '').replace(/^src\//, './')
    const cleanDir = dir.replace(/\/+$/, '') || '.'

    // Case 1: explicit import of the placeholder (any path, not just /placeholders/)
    const importRegex = new RegExp(
      `import\\s+${placeholderName}\\s+from\\s+(['"])[^'"]*(['"])`,
      'g'
    )
    if (importRegex.test(content)) {
      content = content.replace(
        new RegExp(`import\\s+${placeholderName}\\s+from\\s+(['"])[^'"]*(['"])`, 'g'),
        `import ${name} from $1${cleanDir}/${name}$2`
      )
    } else {
      // Case 2: inline definition (const NamePlaceholder = ...) — no import to replace.
      // Add a real import after the last existing import statement.
      const importLines = content.match(/^import\s[^\n]+/gm)
      const lastImportLine = importLines?.[importLines.length - 1]
      if (lastImportLine) {
        const insertAt = content.lastIndexOf(lastImportLine) + lastImportLine.length + 1
        content = content.slice(0, insertAt) + `import ${name} from '${cleanDir}/${name}';\n` + content.slice(insertAt)
      } else {
        content = `import ${name} from '${cleanDir}/${name}';\n` + content
      }
    }

    // Swap JSX usage in both cases
    content = content
      .replace(new RegExp(`<${placeholderName}(\\s|/)`, 'g'), `<${name}$1`)
      .replace(new RegExp(`</${placeholderName}>`, 'g'), `</${name}>`)

    swappedCount++
  }

  return {
    success: swappedCount > 0,
    swappedCount,
    routerContent: content,
  }
}
