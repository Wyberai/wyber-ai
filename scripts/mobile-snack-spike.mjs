// Spike: which Expo SDK versions does the Snack web player run today? Our mobile preview embeds Snack, and our pins say SDK 54.
// Opens https://snack.expo.dev/embedded for each SDK with a one-line app and looks for its text in any frame.
//   node scripts/mobile-snack-spike.mjs [--chrome <path>]   (uses puppeteer-core and the Chrome already on the machine; nothing is downloaded)
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const args = process.argv.slice(2)
const i = args.indexOf('--chrome')
const executablePath = [i >= 0 ? args[i + 1] : null, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => p && existsSync(p))
if (!executablePath) { console.error('No Chrome or Edge found'); process.exit(2) }

const MARK = 'SNACK-OK-7421'
const code = `import { Text, View } from 'react-native'; export default function App() { return <View><Text>${MARK}</Text></View> }`
const sleep = ms => new Promise(r => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] })
const rows = []
try {
  for (const sdk of [52, 53, 54, 55, 56, 57, 58]) {
    const page = await browser.newPage()
    await page.setViewport({ width: 420, height: 700 })
    const errors = []
    page.on('pageerror', e => errors.push(String(e.message).slice(0, 120)))
    const u = `https://snack.expo.dev/embedded?platform=web&preview=true&theme=light&sdkVersion=${sdk}.0.0&name=spike&code=${encodeURIComponent(code)}`
    let ok = false; let note = ''
    try {
      await page.goto(u, { waitUntil: 'networkidle2', timeout: 60000 })
      for (let t = 0; t < 12 && !ok; t++) {
        await sleep(1500)
        for (const f of page.frames()) {
          try { const txt = await f.evaluate(() => document.body ? document.body.innerText : ''); if (txt.includes(MARK)) { ok = true; break } if (/unsupported|not supported|upgrade/i.test(txt)) note = txt.replace(/\s+/g, ' ').slice(0, 140) } catch { /* detached */ }
        }
      }
    } catch (e) { note = String(e.message).slice(0, 100) }
    rows.push({ sdk, ok, note: ok ? '' : (note || (errors[0] ?? 'no output within 18 s')) })
    await page.close()
  }
} finally { await browser.close() }
console.log('Snack web player, one-line app:')
for (const r of rows) console.log(`  SDK ${r.sdk}: ${r.ok ? 'renders' : 'DOES NOT RENDER'}${r.note ? ' (' + r.note + ')' : ''}`)
