// Scores every published app in a list with the browser checker (verify-app.mjs) and the button checker (check-buttons.mjs), a few at a
// time, and writes one JSON line per app. Read-only on the live pages; no credits are spent.
//
//   node scripts/score-all.mjs <slugs.txt> <outDir> [--parallel 3] [--base https://wyberai.com/app]
// slugs.txt: one "<slug> <type>" per line.
import { spawn } from 'node:child_process'
import { readFileSync, mkdirSync, appendFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const [list, outArg, ...rest] = process.argv.slice(2)
if (!list || !outArg) { console.error('usage: node scripts/score-all.mjs <slugs.txt> <outDir>'); process.exit(1) }
const opt = (n, f) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : f }
const PAR = +opt('--parallel', 3)
const BASE = opt('--base', 'https://wyberai.com/app')
const out = resolve(outArg)
mkdirSync(join(out, 'verify'), { recursive: true }); mkdirSync(join(out, 'buttons'), { recursive: true })
const rows = readFileSync(list, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => { const [slug, type] = l.split(/\s+/); return { slug, type } })
const jsonl = join(out, 'summary.jsonl'); writeFileSync(jsonl, '')

const run = (script, args, ms) => new Promise(res => {
  const p = spawn(process.execPath, [script, ...args], { cwd: process.cwd() })
  let o = ''; const t = setTimeout(() => { p.kill(); res({ out: o + '\n[timed out]', code: -1 }) }, ms)
  p.stdout.on('data', d => { o += d }); p.stderr.on('data', d => { o += d })
  p.on('close', code => { clearTimeout(t); res({ out: o, code }) })
})

let next = 0, done = 0
async function worker() {
  while (next < rows.length) {
    const { slug, type } = rows[next++]
    const url = `${BASE}/${slug}`
    const v = await run('scripts/verify-app.mjs', [url, '--out', join(out, 'verify'), '--setup'], 240000)
    const b = await run('scripts/check-buttons.mjs', [url, '--out', join(out, 'buttons'), '--max', '30'], 240000)
    const score = (v.out.match(/(\d{1,3})\s*\/\s*100/g) || []).map(s => s.replace(/\s/g, ''))
    const bm = b.out.match(/found (\d+), tested (\d+), ok (\d+), dead (\d+), errors (\d+), skipped (\d+)\s+=> button score (\d+)/)
    const rec = { slug, type, url, verifyScores: score, verifyTail: v.out.trim().split('\n').slice(-6).join(' | ').slice(0, 400), buttons: bm ? { found: +bm[1], tested: +bm[2], ok: +bm[3], dead: +bm[4], errors: +bm[5], skipped: +bm[6], score: +bm[7] } : null, buttonNotes: b.out.split('\n').filter(l => /^\s+(DEAD|ERROR|CHECK)/.test(l)).slice(0, 6) }
    appendFileSync(jsonl, JSON.stringify(rec) + '\n')
    done++; console.log(`[${done}/${rows.length}] ${slug}  verify ${score.join(' ') || 'n/a'}  buttons ${rec.buttons ? rec.buttons.score + ' (' + rec.buttons.ok + '/' + rec.buttons.tested + ')' : 'n/a'}`)
  }
}
await Promise.all(Array.from({ length: PAR }, worker))
console.log('finished', done, 'apps ->', jsonl)
