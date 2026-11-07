// Renders the Gujarat Tech Expo poster in every size.
// Usage: node scripts/poster-gujarat-tech-expo.mjs [layout ...]
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const SRC = path.resolve('marketing/gujarat-tech-expo/poster.html');
const OUT = path.resolve('marketing/gujarat-tech-expo/out');
const DESK = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'Gujarat Tech Expo', 'posters');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// viewport = CSS px canvas; scale = device scale factor for the PNG
const PNGS = [
  { name: 'print-A-series-3508x4961',  layout: 'portrait',  w: 1754, h: 2480, scale: 2 },   // A3 @ 300dpi, same ratio as A1/A2/A4
  { name: 'rollup-85x200cm-1700x4000', layout: 'tall',      w: 850,  h: 2000, scale: 2 },
  { name: 'tv-16x9-3840x2160',         layout: 'landscape', w: 1920, h: 1080, scale: 2 },
  { name: 'backdrop-3x1-3000x1000',    layout: 'wide',      w: 1500, h: 500,  scale: 2 },
  { name: 'social-story-1080x1920',    layout: 'story',     w: 1080, h: 1920, scale: 1 },
  { name: 'social-feed-1080x1350',     layout: 'feed',      w: 1080, h: 1350, scale: 1 },
  { name: 'social-square-1080x1080',   layout: 'square',    w: 1080, h: 1080, scale: 1 },
];
// vector PDFs for the print shop (scale to any size of the same ratio)
const PDFS = [
  { name: 'print-A-series-A2-vector',     layout: 'portrait', w: 1587, h: 2245 },
  { name: 'rollup-85x200cm-vector',       layout: 'tall',     w: 850,  h: 2000 },
  { name: 'backdrop-3x1-vector',          layout: 'wide',     w: 1800, h: 600 },
];

const only = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();

async function open({ layout, w, h, scale = 1 }) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: scale });
  await page.goto(`${pathToFileURL(SRC).href}?layout=${layout}`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
}

for (const s of PNGS) {
  if (only.length && !only.includes(s.layout)) continue;
  await open(s);
  await page.screenshot({ path: path.join(OUT, `${s.name}.png`) });
  console.log('png', s.name);
}
for (const s of PDFS) {
  if (only.length && !only.includes(s.layout)) continue;
  await open(s);
  await page.pdf({ path: path.join(OUT, `${s.name}.pdf`), width: `${s.w}px`, height: `${s.h}px`, printBackground: true, pageRanges: '1' });
  console.log('pdf', s.name);
}
await browser.close();

fs.mkdirSync(DESK, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.copyFileSync(path.join(OUT, f), path.join(DESK, f));
console.log('copied to', DESK);
