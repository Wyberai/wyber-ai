// One-off: generate a photoreal reference set for "Ugg" as a real human
// character, for character-consistency video work (Runway/Kling reference
// input). Uses the same gpt-image-1 call the product already makes in
// src/lib/generate-image-persist.ts, just run standalone with 'high' quality
// since these are one-time brand-defining assets, not per-publish images.
//
// One CORE_IDENTITY description is held constant across every prompt — that's
// the actual point of a reference set: same face/build, different
// wardrobe/setting per story-beat (caveman / mid-transformation / founder).
//
// Usage: node scripts/ugg-photoreal-refs.mjs
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'ugg-photoreal-refs')
fs.mkdirSync(OUT, { recursive: true })

const KEY = process.env.OPENAI_API_KEY
if (!KEY) { console.error('OPENAI_API_KEY not set in .env.local'); process.exit(1) }

const CORE_IDENTITY = `a stocky, warm-faced man in his early-to-mid 40s, sandy-brown hair, short full beard, deep-set kind brown eyes, strong brow, easy natural grin, believable relatable everyman appearance — approachable and memorable like a sitcom dad, NOT conventionally "model handsome", NOT cartoonish, photoreal skin texture and pores`

const STYLE = `photorealistic high-end advertising campaign photography, shot on 50mm lens, shallow depth of field, natural cinematic lighting, sharp focus on face, commercial ad quality`

const SHOTS = [
  {
    name: 'caveman-headshot-front',
    size: '1024x1024',
    prompt: `Front-facing headshot portrait of ${CORE_IDENTITY}, wearing a rough animal-hide wrap over one shoulder, wild slightly unkempt hair, warm neutral studio background, ${STYLE}`,
  },
  {
    name: 'caveman-fullbody-office',
    size: '1024x1536',
    prompt: `Full body shot of ${CORE_IDENTITY}, wearing a rough animal-hide tunic, standing bewildered but endearing in a modern minimalist tech office holding a plain unbranded silver laptop with no visible logo like it's an unfamiliar artifact, ${STYLE}`,
  },
  {
    name: 'transformation-fullbody',
    size: '1024x1536',
    prompt: `Full body comedic shot of ${CORE_IDENTITY}, mid-transformation from caveman to startup founder — wearing a sharp navy blazer over a rugged animal-hide wrap, hair half-tamed, holding a laptop with a proud confident grin, standing in a modern bright office, ${STYLE}`,
  },
  {
    name: 'founder-headshot-front',
    size: '1024x1024',
    prompt: `Front-facing headshot portrait of ${CORE_IDENTITY}, now neatly groomed, wearing a well-tailored charcoal blazer over a plain white t-shirt, confident approachable smile, warm neutral studio background, ${STYLE}`,
  },
  {
    name: 'founder-headshot-3q',
    size: '1024x1024',
    prompt: `Three-quarter angle headshot portrait of ${CORE_IDENTITY}, wearing a well-tailored charcoal blazer over a plain white t-shirt, confident approachable smile, warm neutral studio background, ${STYLE}`,
  },
  {
    name: 'founder-fullbody-office',
    size: '1024x1536',
    prompt: `Full body shot of ${CORE_IDENTITY}, wearing a well-tailored charcoal blazer over a plain white t-shirt, standing confidently in front of a laptop in a bright modern startup office, natural daylight, ${STYLE}`,
  },
]

async function genOne(shot) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: 'gpt-image-1', prompt: shot.prompt, n: 1, size: shot.size, quality: 'high' }),
  })
  if (!res.ok) {
    console.error(`[${shot.name}] FAILED ${res.status}:`, (await res.text()).slice(0, 300))
    return false
  }
  const data = await res.json()
  const b64 = data?.data?.[0]?.b64_json
  if (!b64) { console.error(`[${shot.name}] no b64_json returned`); return false }
  const outPath = path.join(OUT, `${shot.name}.png`)
  fs.writeFileSync(outPath, Buffer.from(b64, 'base64'))
  console.log(`[${shot.name}] saved -> ${outPath}`)
  return true
}

const args = process.argv.slice(2)
const only = args.find(a => a.startsWith('--only='))?.split('=')[1]
const toRun = only ? SHOTS.filter(s => s.name === only) : SHOTS

for (const shot of toRun) {
  await genOne(shot)
}
console.log(`\nDone. Output: ${OUT}`)
