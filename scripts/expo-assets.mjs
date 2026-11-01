// Generates the photoreal "clutter" objects for the /expo page with Higgsfield:
// GPT Image 2 (object on plain white) -> Image Background Remover (real alpha) -> 720px WebP.
// Usage: node scripts/expo-assets.mjs [audience ...]   (default: all)
// Output: public/expo/<audience>/<slug>.webp  + .scratch-expo/manifest.json
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const run = promisify(execFile)
const RAW = '.scratch-expo/raw' // relative, forward-slash paths: the CLI hangs on absolute Windows paths
const OUT = path.resolve('public/expo')
fs.mkdirSync(RAW, { recursive: true })

const STYLE =
  'Photorealistic studio photograph of a single real object on a plain white background, photographed from slightly above at a natural angle, ' +
  'soft realistic contact shadow, crisp detail, natural worn texture, centered and filling about 80 percent of the frame. ' +
  'No brand logos and no real company, bank or app names: use only invented generic names. Not an illustration.'

const ITEMS = {
  software: [
    ['timesheets', 'A stack of printed weekly timesheets with handwritten hours, several rows highlighted in yellow and one total circled in red pen, held with a black bulldog clip.'],
    ['invoice-usd', 'A printed invoice for a software project with a dollar total, a line-item table, a paper clip and a handwritten note saying "pending" in blue ink.'],
    ['client-chat', 'A smartphone seen at an angle, the screen showing a messaging chat with green and white bubbles where a client keeps asking for small changes, no app logo.'],
    ['sticky-tasks', 'A cluster of yellow and pink sticky notes stuck together, handwritten with tasks like "fix login", "client call 4pm", "send invoice", "ask Neha".'],
    ['sprint-notebook', 'An open spiral notebook page with a handwritten sprint task list, crossed-out items, arrows and a coffee ring stain.'],
    ['status-sheet', 'A printed project status sheet with a table of client projects, a few cells marked LATE in red and several question marks in pen.'],
    ['wall-calendar', 'A single wall calendar page with several dates circled in red and scribbled deadlines in the margins.'],
    ['email-printout', 'A printed email thread with yellow highlighter on the sentence "can we add one more small thing", a coffee stain and a folded corner.'],
  ],
  business: [
    ['challan-pad', 'A thick pad of carbon-copy delivery challan slips, pink and white duplicate sheets, printed Indian business form with handwritten ballpoint entries and a rubber stamp, a corner curled up.'],
    ['cheques', 'A bundle of post-dated Indian bank cheques held with a red rubber band, a few fanned out with handwritten amounts and signatures, one stamped in red. A generic fictional bank with no logo and no real bank name.'],
    ['gstr2b-printout', 'A stapled printout of a GSTR-2B reconciliation report, a dense table of supplier invoice numbers and amounts, several rows highlighted in yellow and pink marker, a red pen circle around one line, a paper clip.'],
    ['ledger-book', 'An open red cloth-bound accounting ledger book with handwritten entries in blue ink, columns of rupee amounts and a pen lying across the page.'],
    ['supplier-bills', 'A thick bundle of supplier bills and tax invoices pinned with a bulldog clip, edges uneven, sticky tabs and pencil marks.'],
    ['sticky-parties', 'A cluster of yellow sticky notes with handwritten party names and rupee amounts, like "Raval 84,000 - call", "cheque bounce?", "GST due".'],
    ['jobwork-notebook', 'An open lined notebook with handwritten entries of goods sent to job workers, dates, quantities and ticks and question marks beside them.'],
    ['lr-copies', 'A stack of transport lorry receipt copies, thin carbon paper in pink and yellow, with printed forms, handwritten truck numbers and a rubber stamp.'],
  ],
  student: [
    ['exam-timetable', 'An open notebook page with a handwritten exam timetable, subjects in different coloured pens, highlighter and a small coffee stain.'],
    ['placement-notice', 'A printed campus placement drive notice pinned with a paper clip, a table of company names, dates and rounds, a few lines highlighted in green.'],
    ['sticky-exams', 'A cluster of colourful sticky notes handwritten with exam dates, "submit assignment", "mock interview Friday" and "revise unit 3".'],
    ['phone-notes', 'A smartphone seen at an angle, the screen showing an overfull notes app list of reminders and study tasks, no app logo.'],
    ['college-id', 'A student college ID card on a lanyard, with a photo placeholder silhouette and an invented college name, slightly bent and well used.'],
    ['syllabus-checklist', 'A printed syllabus checklist page with ticks, half the topics unchecked, margin notes and a highlighter.'],
    ['tuition-diary', 'A small ruled diary page with handwritten student names, batch timings and monthly fee amounts with ticks and crosses.'],
    ['wedding-card', 'A traditional Gujarati wedding invitation card in red and gold with ornate border, invented names for the couple, a small ribbon, slightly angled.'],
  ],
}

async function hf(args) {
  const pending = run('higgsfield', args, { maxBuffer: 20 * 1024 * 1024, shell: process.platform === 'win32' })
  // The CLI reads a prompt from stdin when none is given (the background remover takes none),
  // so close stdin or it waits forever.
  pending.child.stdin.end()
  const { stdout } = await pending
  return JSON.parse(stdout)[0]
}
async function download(url, file) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`download ${r.status}`)
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()))
}

async function make(aud, slug, prompt) {
  const out = path.join(OUT, aud, `${slug}.webp`)
  if (fs.existsSync(out)) return { aud, slug, skipped: true }
  fs.mkdirSync(path.dirname(out), { recursive: true })
  const base = `${RAW}/${aud}-${slug}`
  if (!fs.existsSync(`${base}.png`)) {
  const gen = await hf(['generate', 'create', 'gpt_image_2', '--prompt', `"${(prompt + ' ' + STYLE).replace(/"/g, "'")}"`, '--aspect_ratio', '1:1', '--resolution', '1k', '--quality', 'high', '--wait', '--json'])
  if (gen.status !== 'completed') throw new Error(`gen ${gen.status}`)
  await download(gen.result_url, `${base}.png`)
  }
  const cut = await hf(['generate', 'create', 'image_background_remover', '--image', `"${base}.png"`, '--wait', '--json'])
  if (cut.status !== 'completed') throw new Error(`cut ${cut.status}`)
  await download(cut.result_url, `${base}-cut.png`)
  await sharp(`${base}-cut.png`).trim({ threshold: 1 }).resize(720, 720, { fit: 'inside' }).webp({ quality: 84, alphaQuality: 90 }).toFile(out)
  return { aud, slug, bytes: fs.statSync(out).size, prompt }
}

const want = process.argv.slice(2)
const jobs = Object.entries(ITEMS).filter(([a]) => !want.length || want.includes(a)).flatMap(([a, list]) => list.map(([slug, p]) => [a, slug, p]))
const LOG = '.scratch-expo/log.txt'
const log = m => { console.log(m); fs.appendFileSync(LOG, m + '\n') }
const results = []
let next = 0
async function worker() {
  while (next < jobs.length) {
    const [a, s, p] = jobs[next++]
    try {
      const r = await make(a, s, p)
      results.push(r)
      log('ok ' + a + ' ' + s + ' ' + (r.bytes ?? 'skipped'))
    } catch (e) {
      results.push({ aud: a, slug: s, error: String(e.message || e).slice(0, 200) })
      log('FAIL ' + a + ' ' + s + ' ' + String(e.message || e).slice(0, 160))
    }
  }
}
await Promise.all(Array.from({ length: 4 }, worker))
fs.writeFileSync(path.resolve('.scratch-expo/manifest.json'), JSON.stringify(results, null, 1))
console.log('done', results.filter(r => !r.error).length, 'ok,', results.filter(r => r.error).length, 'failed')
