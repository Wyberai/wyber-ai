// Drive the demo-record.mjs Chrome instance (CDP :9223) with a snippet file.
// Usage: node scripts/demo-drive.mjs <snippet.mjs>
// The snippet default-exports async ({ browser, page }) => {...}; `page` is the
// most recently opened tab.
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const snippet = process.argv[2]
if (!snippet) { console.error('Usage: node scripts/demo-drive.mjs <snippet.mjs>'); process.exit(1) }
const mod = await import(pathToFileURL(path.resolve(snippet)).href)

const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${process.env.CDP_PORT || 9223}`, defaultViewport: null })
const pages = await browser.pages()
const page = pages[pages.length - 1]
try {
  await mod.default({ browser, page })
} finally {
  await browser.disconnect()
}
