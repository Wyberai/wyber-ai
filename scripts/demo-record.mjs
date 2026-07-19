// WyberAi — demo footage recorder.
// Launches headful Chrome (persistent profile so login sticks), opens prod,
// and records the tab via page.screencast when told to. Controlled by a
// command file so an outside driver (puppeteer.connect on :9223) can act
// while this process owns the recording.
//   commands (write the word into CTRL file): start | stop | quit
// Usage: node scripts/demo-record.mjs <workdir>
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const WORK = path.resolve(process.argv[2] || '.')
fs.mkdirSync(WORK, { recursive: true })
const CTRL = path.join(WORK, 'ctrl.txt')
const STATUS = path.join(WORK, 'status.txt')
const OUTVID = path.join(WORK, 'demo-raw.webm')
const status = (s) => { fs.writeFileSync(STATUS, s); console.log('[status]', s) }

fs.writeFileSync(CTRL, '')
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  userDataDir: path.join(WORK, 'profile'),
  defaultViewport: { width: 1600, height: 900 },
  args: ['--remote-debugging-port=9223', '--window-size=1616,1000', '--no-first-run', '--no-default-browser-check'],
})
const [page] = await browser.pages()
await page.goto('https://wyberai.com', { waitUntil: 'domcontentloaded', timeout: 120000 }).catch(e => console.log('nav:', e.message))
status('ready — log in, then write "start" to ctrl.txt')

let recorder = null
const poll = setInterval(async () => {
  let cmd = ''
  try { cmd = fs.readFileSync(CTRL, 'utf8').trim() } catch {}
  if (!cmd) return
  fs.writeFileSync(CTRL, '')
  try {
    if (cmd === 'start' && !recorder) {
      // record whichever tab is currently fronted
      const pages = await browser.pages()
      const target = pages[pages.length - 1]
      recorder = await target.screencast({ path: OUTVID })
      status('recording')
    } else if (cmd === 'stop' && recorder) {
      await recorder.stop()
      recorder = null
      status('stopped — ' + OUTVID)
    } else if (cmd === 'quit') {
      if (recorder) { await recorder.stop(); recorder = null }
      clearInterval(poll)
      status('quitting')
      await browser.close()
      process.exit(0)
    }
  } catch (e) { status('error: ' + e.message) }
}, 500)

browser.on('disconnected', () => { status('browser closed'); process.exit(0) })
