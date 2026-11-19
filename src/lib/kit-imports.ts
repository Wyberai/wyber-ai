/** Distinct names a build imports from the Wyber UI kit across its files (import { A, B as C } from './wyber-ui'). Used by the launch-ready kit checks. */
export function kitImportCount(code: string): number {
  const names = new Set<string>()
  for (const m of code.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"][./]*\/?wyber-ui['"]/g)) {
    for (const part of m[1].split(',')) { const n = part.trim().split(/\s+as\s+/)[0].trim(); if (n) names.add(n) }
  }
  return names.size
}
