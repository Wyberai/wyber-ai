/**
 * Deterministic router wiring: swaps placeholder imports with real screen imports.
 *
 * Given a router file that imports placeholder components like:
 *   import OverviewPlaceholder from './placeholders/Overview'
 * and a list of built screens, this replaces them with:
 *   import Overview from './screens/Overview'
 * and swaps JSX usage too (<OverviewPlaceholder /> → <Overview />).
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

    // Detect if the router imports this placeholder
    const importRegex = new RegExp(
      `import\\s+${placeholderName}\\s+from\\s+['"][^'"]*placeholders[^'"]*['"]`,
      'g'
    )
    if (!importRegex.test(content)) continue

    // Replace the import line
    content = content.replace(
      new RegExp(
        `import\\s+${placeholderName}\\s+from\\s+(['"])[^'"]*placeholders[^'"]*['"]`,
        'g'
      ),
      (_match, quote) => {
        const dir = screen.path.includes('/screens/') ? './screens' : screen.path.replace(/\/[^/]+$/, '').replace(/^src\//, './')
        return `import ${name} from ${quote}${dir}/${name}${quote}`
      }
    )

    // Replace JSX usage: <OverviewPlaceholder ... /> and <OverviewPlaceholder ...>...</OverviewPlaceholder>
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
