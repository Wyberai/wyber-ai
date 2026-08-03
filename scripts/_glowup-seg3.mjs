// Segment 3: wait out the in-flight build on project c14f015f (started by v3),
// then record ONLY security-tab + publish — no long build-wait inside the
// screencast window, so this recording is short and low-risk.
// Completion signal fixed again: earlier attempts scanned the WHOLE page for
// words like "generating"/"thinking", which also appear as normal copy
// inside the finished app itself (false "still building" forever). This time
// we poll the specific top-right action button until its text is exactly
// "Publish" (not "Deploying Ns...") — that button only reads bare "Publish"
// once the build is truly idle.
import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const WORK = path.resolve(process.argv[2] || '.')
const OUTVID = path.join(WORK, 'demo-raw-seg3.webm')
const PROJECT_URL = 'https://wyberai.com/project/c14f015f-9e61-4ebc-8467-2ae4dd8376fb'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)

async function topActionText(page) {
  return page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')]
    const pub = btns.find(b => /publish|deploying/i.test(b.textContent))
    return pub ? pub.textContent.trim() : null
  })
}

async function clickByText(page, { tag = 'button', textRe }) {
  const box = await page.evaluate((tag, textReSrc) => {
    const re = new RegExp(textReSrc, 'i')
    const el = [...document.querySelectorAll(tag)].find(e => re.test(e.textContent.trim()))
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }, tag, textRe)
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
  await page.goto(PROJECT_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(2000)

  log('waiting (not recording yet) for Publish button to settle...')
  const deadline = Date.now() + 6 * 60 * 1000
  let stable = 0
  while (Date.now() < deadline) {
    await sleep(4000)
    const t = await topActionText(page)
    const idle = t && /^publish$/i.test(t)
    stable = idle ? stable + 1 : 0
    log('button text:', JSON.stringify(t), 'stable:', stable)
    if (stable >= 3) break
  }
  if (stable < 3) {
    console.error('still not idle after wait, aborting without recording')
    await browser.close()
    process.exit(1)
  }
  await sleep(3000)

  const recorder = await page.screencast({ path: OUTVID })
  log('recording ->', OUTVID)
  await sleep(2000) // beat on the finished chat/preview

  await page.mouse.click(1163, 275) // Security tab
  await sleep(3500)

  await page.mouse.click(1163, 75) // back to Chat
  await sleep(1200)

  const publishClicked = await clickByText(page, { textRe: '^publish$' })
  log('publish clicked:', publishClicked)
  await sleep(2500)
  const confirmClicked = await clickByText(page, { textRe: '^publish$|^confirm|^publish now$|^yes, publish' })
  log('confirm clicked:', confirmClicked)
  await sleep(8000)

  const finalText = await page.evaluate(() => document.body.innerText)
  const urls = [...new Set((finalText.match(/https?:\/\/[^\s)]+/g) || []))]
  log('URLs found:', JSON.stringify(urls))

  await sleep(1500)
  await recorder.stop()
  log('recording stopped')
} catch (e) {
  console.error('ERROR:', e.message)
} finally {
  await browser.close()
}
