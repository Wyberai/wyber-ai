// Visual QA, full matrix: renders generated sites in the installed Chrome and checks the pixels, not the source.
//   npm run qa:visual -- [--only <id text>] [--widths 390,1440] [--out <dir>] [--html <dir>] [--jobs n] [--no-states]
// Findings are written to verify-out-visual/ and the exit code is 1 when there are any. The fast subset runs in `npm test`.
import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

// inside node_modules so the externals (esbuild, tailwind, puppeteer-core) resolve from this repo
const outfile = path.join(process.cwd(), 'node_modules', '.cache', 'visual-qa', 'cli.mjs')
fs.mkdirSync(path.dirname(outfile), { recursive: true })
await build({ entryPoints: ['src/lib/visual-qa/cli.ts'], bundle: true, platform: 'node', format: 'esm', outfile, packages: 'external', logLevel: 'warning', alias: { '@': path.join(process.cwd(), 'src') } })
await import(pathToFileURL(outfile).href)
