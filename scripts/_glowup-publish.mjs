const sleep = (ms) => new Promise(r => setTimeout(r, ms))
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

export default async function ({ page }) {
  await sleep(1000)
  const text0 = await page.evaluate(() => document.body.innerText)
  console.log('has Publish word already gone / published state hint:', /published|live at|your app is live/i.test(text0))

  const clicked = await clickByText(page, { tag: 'button', textRe: '^publish$' })
  console.log('publish click 1:', clicked)
  await sleep(4000)

  const confirmClicked = await clickByText(page, { tag: 'button', textRe: '^publish$|^confirm|^publish now$|^yes, publish' })
  console.log('confirm click:', confirmClicked)
  await sleep(12000)

  const text1 = await page.evaluate(() => document.body.innerText)
  const urls = [...new Set((text1.match(/https?:\/\/[^\s)]+/g) || []))]
  console.log('URLs found:', JSON.stringify(urls))
  console.log('snippet:', text1.slice(0, 600))
}
