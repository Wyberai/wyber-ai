const PROMPT = `Build a polished, AI-native web app called "Glow Up" — a personal wellness and habit companion focused on consistency, not restrictive dieting or calorie-counting.

Core features:
- Daily check-in: log water intake, workouts, sleep, mood, and meals (simple text/photo entry, no calorie numbers or shame-based framing)
- Home view: a "Your AI check-in" hero card at the top — a short, warm AI-generated insight based on recent logs, regenerated each day
- AI Coach: a persistent chat panel (sidebar assistant) you can ask anything — answered conversationally from your logged data, with suggested quick-questions as chips
- Progress view: weekly/monthly trend charts around consistency (workouts completed, streak history, check-in rate) — never centered on weight
- Optional private weight/measurement log, kept separate and low-emphasis, exportable/deletable anytime
- Premium tier (locked behind an upgrade CTA): deeper AI coaching, personalized workout plans, a weekly AI-written recap email
- Shareable streak card (optional) — no public leaderboard

Design: warm, encouraging, modern wellness aesthetic (soft greens/warm neutrals, not clinical white/blue), smooth animations on streaks and check-ins, celebratory micro-interaction on streak milestones, desktop-first layout with sidebar nav, AI coach panel docked on the right like a real assistant. Populate with realistic sample data and sample AI responses so it feels alive immediately, clearly marked as sample/demo until connected to a real AI key and the user's own data.

Tone: supportive and encouraging throughout, never shame-based, never gives specific medical or nutrition advice — a consistency companion with an AI coach, not a diet plan.`

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// text-only state probe — NEVER call page.screenshot() while the screencast recorder
// is attached, it deadlocks the shared CDP session.
async function state(page) {
  return page.evaluate(() => ({
    text: document.body.innerText,
    hasIframe: !!document.querySelector('iframe'),
  }))
}

async function clickByText(page, { tag = 'button', textRe, placeholderRe }) {
  const box = await page.evaluate((tag, textReSrc, placeholderReSrc) => {
    const textRe = textReSrc ? new RegExp(textReSrc, 'i') : null
    const placeholderRe = placeholderReSrc ? new RegExp(placeholderReSrc, 'i') : null
    const els = [...document.querySelectorAll(tag)]
    const el = els.find(e => (textRe && textRe.test(e.textContent.trim())) || (placeholderRe && e.placeholder && placeholderRe.test(e.placeholder)))
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }, tag, textRe, placeholderRe)
  if (!box) return false
  await page.mouse.click(box.x, box.y)
  return true
}

export default async function ({ page }) {
  await page.goto('https://wyberai.com/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(1500)

  const gotBox = await clickByText(page, { tag: 'textarea', placeholderRe: 'describe the app you want to build' })
  console.log('textarea found:', gotBox)
  await sleep(300)
  await page.keyboard.type(PROMPT, { delay: 9 })
  await sleep(500)
  await page.keyboard.press('Enter')
  console.log('submitted, waiting for plan-mode prompt or build...')

  // Handle the "want to see a plan first?" screen — skip straight to building.
  let sawPlanPrompt = false
  for (let i = 0; i < 20; i++) {
    await sleep(1500)
    const s = await state(page)
    if (/Just build it/i.test(s.text)) { sawPlanPrompt = true; break }
    if (s.hasIframe) break // already building/built somehow
  }
  console.log('saw plan prompt:', sawPlanPrompt)
  if (sawPlanPrompt) {
    const clicked = await clickByText(page, { tag: 'button', textRe: '^just build it$' })
    console.log('clicked just-build-it:', clicked)
  }

  console.log('polling for real build (iframe present)...')
  const deadline = Date.now() + 6 * 60 * 1000
  let built = false
  while (Date.now() < deadline) {
    await sleep(6000)
    const s = await state(page)
    if (s.hasIframe) { built = true; break }
  }
  console.log('build finished:', built)
  await sleep(5000) // let animations settle

  await page.mouse.click(1163, 275) // Security tab
  await sleep(2000)

  await page.mouse.click(1163, 75) // back to Chat tab for a beat before publish
  await sleep(1000)

  const publishClicked = await clickByText(page, { tag: 'button', textRe: '^publish$' })
  console.log('publish clicked:', publishClicked)
  await sleep(3000)
  const confirmClicked = await clickByText(page, { tag: 'button', textRe: '^publish$|^confirm|^publish now$' })
  console.log('confirm clicked:', confirmClicked)
  await sleep(10000)

  const finalState = await state(page)
  const urls = [...new Set((finalState.text.match(/https?:\/\/[^\s)]+/g) || []))]
  console.log('URLs found on page:', JSON.stringify(urls))
}
