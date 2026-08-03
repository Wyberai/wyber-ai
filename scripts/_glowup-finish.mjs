const sleep = (ms) => new Promise(r => setTimeout(r, ms))
export default async function ({ page }) {
  // close the publish modal first (Escape), give the "Live" state a beat on screen
  await page.keyboard.press('Escape')
  await sleep(1500)

  await page.goto('https://wyberai.com/app/glow-up', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(2500)
  await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }))
  await sleep(1800)
  await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }))
  await sleep(2000)
  console.log('done, final url:', page.url())
}
