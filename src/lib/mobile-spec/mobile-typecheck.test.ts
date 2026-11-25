import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { planMobile, renderMobileApp } from './index'
import { MOBILE_DEMOS } from './demo'
import { MOBILE_DIRECTIONS, type MobileStructure } from '../mobile-directions'

// Strict type-check of the GENERATED source against the real react-native, react and safe-area types. Those packages are not dependencies of
// this repo, so the check runs only when MOBILE_TC_DIR points at a folder where they are installed:
//   npm i --ignore-scripts --legacy-peer-deps react@18.3.1 @types/react@18.3.12 react-native@0.76.5 @react-native-async-storage/async-storage@2.1.0 react-native-safe-area-context@4.14.0 typescript
const dir = process.env.MOBILE_TC_DIR

const STRUCTURES: MobileStructure[] = ['tabs-feed', 'tool-first', 'tabs-dashboard', 'cards-swipe', 'split-list', 'sheet-nav']

describe.skipIf(!dir)('generated mobile source type-checks under strict TypeScript', () => {
  const sets = [
    ...MOBILE_DEMOS.map(d => ({ name: d.key, files: renderMobileApp(planMobile(d.prompt, { seed: d.seed, directionId: d.directionId }), d.model).files })),
    ...STRUCTURES.map(s => {
      const d = MOBILE_DEMOS[0]
      const spec = planMobile(d.prompt, { seed: 'tc-' + s, directionId: (MOBILE_DIRECTIONS.find(x => x.structure === s) ?? MOBILE_DIRECTIONS[0]).id })
      spec.layout = { ...spec.layout, structure: s }
      return { name: 's-' + s, files: renderMobileApp(spec, d.model).files }
    }),
  ]
  for (const { name, files } of sets) {
    it(name, () => {
      const out = path.join(dir!, 'out', name)
      fs.rmSync(out, { recursive: true, force: true })
      for (const [p, c] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(out, p)), { recursive: true }); fs.writeFileSync(path.join(out, p), c) }
      fs.writeFileSync(path.join(out, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true, noEmit: true, jsx: 'react-jsx', target: 'ES2020', module: 'ESNext', moduleResolution: 'Bundler', skipLibCheck: true, esModuleInterop: true, noUnusedLocals: true, typeRoots: [path.join(dir!, 'node_modules', '@types')], types: ['react'] }, include: ['**/*.ts', '**/*.tsx'] }))
      let problems = ''
      try { execFileSync(process.execPath, [path.join(dir!, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', out], { encoding: 'utf8', stdio: 'pipe' }) } catch (e) { problems = String((e as { stdout?: string }).stdout ?? e) }
      expect(problems.split('\n').filter(l => /error TS/.test(l))).toEqual([])
    }, 120000)
  }
})
