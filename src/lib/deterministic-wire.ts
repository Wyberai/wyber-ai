/**
 * Deterministic router wiring: after fill passes complete, swap placeholder
 * components for the real ones. No model call, no hallucination risk, 15ms vs 60s.
 *
 * The scaffold pass is instructed to write placeholders in this exact pattern:
 *   import ScreenNamePlaceholder from './placeholders/ScreenName'
 *   // ... and render it conditionally or in a routes array
 *
 * Once the fill pass writes the real ScreenName.tsx, we simply find/replace
 * all "ScreenNamePlaceholder" references with "ScreenName" imports/usages.
 */

export interface WireResult {
  success: boolean
  routerContent: string
  swappedCount: number
  missingScreens: string[]
}

/**
 * Swap placeholder component references for real ones.
 * Given the router file content and a list of built screens,
 * find all PlaceholderComponent refs and replace them with the real component imports.
 */
export function deterministicWire(
  routerContent: string,
  builtScreens: Array<{ path: string; name: string }> // e.g. [{ path: 'src/screens/Overview.tsx', name: 'Overview' }]
): WireResult {
  let result = routerContent
  let swappedCount = 0
  const missingScreens: string[] = []

  for (const screen of builtScreens) {
    // Derive the component name: 'src/screens/Overview.tsx' -> 'Overview'
    const componentName = screen.name
    const placeholderName = `${componentName}Placeholder`

    // Find and replace all occurrences of PlaceholderComponent with Component
    // This handles:
    //   import OverviewPlaceholder from '...' -> import Overview from '...'
    //   <OverviewPlaceholder/> -> <Overview/>
    //   OverviewPlaceholder: (...) -> Overview: (...)
    const placeholderRegex = new RegExp(`\\b${placeholderName}\\b`, 'g')
    const beforeLength = (result.match(placeholderRegex) || []).length

    result = result.replace(placeholderRegex, componentName)

    // Track what we swapped
    if (beforeLength > 0) {
      swappedCount += beforeLength
    } else {
      missingScreens.push(screen.path)
    }
  }

  return {
    success: missingScreens.length === 0,
    routerContent: result,
    swappedCount,
    missingScreens,
  }
}
