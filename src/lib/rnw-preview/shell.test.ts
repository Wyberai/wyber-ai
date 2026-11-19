import { describe, it, expect } from 'vitest'
import { IMPORT_MAP, RNW_WRAPPER_SOURCE, RNW_VERSION } from './shell'

describe('react-native-web import map', () => {
  it('serves react-native and react-native-web through one wrapper so they stay one module', () => {
    expect(IMPORT_MAP.imports['react-native']).toBe(IMPORT_MAP.imports['react-native-web'])
    expect(IMPORT_MAP.imports['react-native-web'].startsWith('data:text/javascript')).toBe(true)
  })

  it('re-exports the real library and adds TurboModuleRegistry, which it lacks (a habit tracker preview crashed on it, 18 Nov 2026)', () => {
    expect(RNW_WRAPPER_SOURCE).toContain(`export * from "https://esm.sh/react-native-web@${RNW_VERSION}`)
    expect(RNW_WRAPPER_SOURCE).toContain('export const TurboModuleRegistry')
  })

  it('does not ask for a default export: react-native-web has none, and asking breaks every preview', () => {
    expect(RNW_WRAPPER_SOURCE).not.toMatch(/export \{ default \}/)
  })

  it('getEnforcing does not throw, because libraries call it while loading', () => {
    expect(RNW_WRAPPER_SOURCE).not.toMatch(/getEnforcing: \([^)]*\) => \{ throw/)
  })
})
