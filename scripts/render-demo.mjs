// Renders the demo intro page to a video using system Chrome + puppeteer screencast.
// Usage: node scripts/render-demo.mjs <url> <outWebm> <width> <height> <durationMs> [ffmpegPath]
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const [, , url, out, wS, hS, durS, ffmpegPath] = process.argv
const w = parseInt(wS, 10), h = parseInt(hS, 10), dur = parseInt(durS || '43000', 10)

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--autoplay-policy=no-user-gesture-required',
    `--window-size=${w},${h}`,
  ],
  defaultViewport: { width: w, height: h, deviceScaleFactor: 1 },
})

const page = await browser.newPage()
await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 })
try { await page.evaluate(() => document.fonts.ready) } catch {}
// Reload so the scene timeline starts cleanly at scene 1 (fonts now cached → instant)
await page.reload({ waitUntil: 'networkidle2', timeout: 90000 })
try { await page.evaluate(() => document.fonts.ready) } catch {}
await new Promise(r => setTimeout(r, 200))

const opts = { path: out }
if (ffmpegPath) opts.ffmpegPath = ffmpegPath
const recorder = await page.screencast(opts)
console.log('recording', out, `${w}x${h}`, `${dur}ms`)
await new Promise(r => setTimeout(r, dur))
await recorder.stop()
await browser.close()
console.log('DONE', out)
