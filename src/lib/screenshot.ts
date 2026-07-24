import { createAdminClient } from '@/lib/supabase/server'

// Shared by src/app/api/thumbnail/route.ts (per-project thumbnails) and the
// marketplace listing-thumbnail generator — headless-Chrome capture of a
// live preview URL, uploaded to Supabase Storage.

export async function captureScreenshot(url: string): Promise<Buffer> {
  const chromium = await import('@sparticuz/chromium')
  const puppeteer = await import('puppeteer-core')

  const browser = await puppeteer.default.launch({
    args: chromium.default.args,
    defaultViewport: { width: 1280, height: 800 },
    executablePath: await chromium.default.executablePath(),
    headless: true,
  })

  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 })
    await new Promise(r => setTimeout(r, 1000)) // let animations settle

    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 80,
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    })
    return Buffer.from(screenshot)
  } finally {
    await browser.close()
  }
}

export async function uploadScreenshot(buffer: Buffer, path: string): Promise<string> {
  const supabase = await createAdminClient()
  const { error } = await supabase.storage
    .from('wyber-assets')
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error

  const { data: { publicUrl } } = supabase.storage.from('wyber-assets').getPublicUrl(path)
  return publicUrl
}

// The only URLs this platform should ever be asked to screenshot on a
// caller's behalf — anything else is an open SSRF-ish primitive (arbitrary
// server-side fetch to a caller-supplied URL).
const ALLOWED_SCREENSHOT_HOSTS = [
  'preview-builder.wyberai.com',
  ...(process.env.NEXT_PUBLIC_PREVIEW_BUILDER_URL
    ? [new URL(process.env.NEXT_PUBLIC_PREVIEW_BUILDER_URL).host]
    : []),
]

export function isAllowedScreenshotUrl(url: string): boolean {
  try {
    const host = new URL(url).host
    return ALLOWED_SCREENSHOT_HOSTS.includes(host)
  } catch {
    return false
  }
}
