// Segment 4: slow scroll through the already-published live app — no build
// wait needed at all, this is the lowest-risk clip of the whole shoot.
import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const WORK = path.resolve(process.argv[2] || '.')
const OUTVID = path.join(WORK, 'demo-raw-seg4.webm')

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)

async function clickNavByText(page, textRe) {
  const box = await page.evaluate((textReSrc) => {
    const re = new RegExp(textReSrc, 'i')
    const candidates = [...document.querySelectorAll('a,button,li,div[role="button"]')]
      .filter(e => e.children.length <= 2 && re.test(e.textContent.trim()) && e.textContent.trim().length < 30)
    // prefer the smallest matching element (most specific, least likely to be a container)
    candidates.sort((a, b) => a.textContent.length - b.textContent.length)
    const el = candidates[0]
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }, textRe)
  if (!box) return false
  await page.mouse.click(box.x, box.y)
  return true
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  userDataDir: path.join(WORK, 'profile'),
  defaultViewport: { width: 1600, height: 900 },
  args: ['--window-size=1616,1000', '--no-first-run', '--no-default-browser-check'],
})
const [page] = await browser.pages()

try {
  await page.goto('https://wyberai.com/app/glow-up-1', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(2000)

  const recorder = await page.screencast({ path: OUTVID })
  log('recording ->', OUTVID)
  await sleep(2000)

  // click around the sidebar nav to show it's a real, interactive app
  await sleep(1500) // beat on Today (already active)
  const r1 = await clickNavByText(page, '^Rituals$')
  log('clicked Rituals:', r1)
  await sleep(2200)
  const r2 = await clickNavByText(page, '^Insights$')
  log('clicked Insights:', r2)
  await sleep(2500)
  const r3 = await clickNavByText(page, '^Today$')
  log('clicked back to Today:', r3)
  await sleep(2000)

  await recorder.stop()
  log('recording stopped')
} catch (e) {
  console.error('ERROR:', e.message)
} finally {
  await browser.close()
}
