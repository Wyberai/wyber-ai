import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Step 1: Seed missing mobile templates ──────────────────────────────────
const MOBILE_CATEGORIES = [
  'Mobile-Social', 'Mobile-Productivity', 'Mobile-Health', 'Mobile-Shopping',
  'Mobile-Travel', 'Mobile-Finance', 'Mobile-Education', 'Mobile-Food',
  'Mobile-Utility', 'Mobile-Lifestyle', 'Mobile-Business', 'Mobile-Kids',
  'Mobile-Fitness', 'Mobile-Entertainment', 'Mobile-News', 'Mobile-Music',
  'Mobile-Photography', 'Mobile-Weather', 'Mobile-Dating', 'Mobile-Sports',
  'Mobile-Meditation', 'Mobile-Cooking', 'Mobile-Parenting', 'Mobile-Pets',
  'Mobile-Gaming',
]

const MOBILE_APP_IDEAS = {
  'Mobile-Social': ['Group Chat App', 'Story Sharing App', 'Local Community App', 'Alumni Network App', 'Book Club App', 'Neighborhood App', 'Pen Pal App', 'Event Social App', 'Music Fan App', 'Sports Fan App', 'Art Community App', 'Language Exchange App'],
  'Mobile-Productivity': ['Smart Notes App', 'Task Planner App', 'Time Blocking App', 'Habit Streak App', 'Goal Setting App', 'Voice Memo App', 'Document Scanner App', 'Bookmark Manager App', 'Password Vault App', 'Daily Journal App', 'Focus Timer App', 'Project Tracker App'],
  'Mobile-Health': ['Medication Reminder App', 'Water Intake Tracker', 'Sleep Tracker App', 'Mental Health Check App', 'Symptom Logger App', 'Allergy Tracker App', 'Blood Pressure Log', 'Period Tracker App', 'Dental Care App', 'Eye Care Reminder App', 'Vaccination Record App', 'Health Insurance App'],
  'Mobile-Shopping': ['Wishlist Manager App', 'Price Comparison App', 'Coupon Wallet App', 'Grocery List App', 'Gift Registry App', 'Thrift Store Finder', 'Fashion Outfit App', 'Sneaker Drop Alert App', 'Local Market App', 'Plant Shop App', 'Vintage Finder App', 'Subscription Box App'],
  'Mobile-Travel': ['Trip Planner App', 'Flight Tracker App', 'Hotel Booking App', 'Currency Converter App', 'Language Phrasebook App', 'Packing List App', 'Travel Journal App', 'Local Guide App', 'Road Trip Planner', 'Hostel Finder App', 'Visa Checker App', 'Travel Budget App'],
  'Mobile-Finance': ['Budget Tracker App', 'Investment Portfolio App', 'Bill Splitter App', 'Savings Goal App', 'Crypto Wallet App', 'Tax Calculator App', 'Loan Calculator App', 'Net Worth Tracker', 'Receipt Scanner App', 'Subscription Manager', 'Cash Flow App', 'Tip Calculator App'],
  'Mobile-Education': ['Flashcard Study App', 'Quiz Practice App', 'Language Learning App', 'Math Solver App', 'Study Planner App', 'Lecture Notes App', 'Citation Generator App', 'Vocabulary Builder App', 'Science Lab App', 'History Timeline App', 'Coding Practice App', 'Music Theory App'],
  'Mobile-Food': ['Recipe Discovery App', 'Meal Planner App', 'Restaurant Finder App', 'Food Diary App', 'Bartender App', 'Baking Timer App', 'Grocery Delivery App', 'Food Waste Tracker', 'Nutrition Scanner App', 'Coffee Brewing App', 'BBQ Timer App', 'Smoothie Recipe App'],
  'Mobile-Utility': ['QR Code Scanner App', 'Unit Converter App', 'Flashlight Pro App', 'Level & Compass App', 'File Manager App', 'WiFi Analyzer App', 'Battery Saver App', 'Screen Mirror App', 'Sound Meter App', 'Color Picker App', 'Ruler Measure App', 'Text Scanner OCR App'],
  'Mobile-Lifestyle': ['Mood Tracker App', 'Wardrobe Planner App', 'Home Decor App', 'Plant Care App', 'Skincare Routine App', 'Astrology App', 'Gratitude Journal App', 'Bucket List App', 'Vision Board App', 'Self Care App', 'Morning Routine App', 'Minimalism Tracker App'],
  'Mobile-Business': ['Invoice Creator App', 'Business Card Scanner', 'Meeting Notes App', 'Sales CRM App', 'Expense Report App', 'Timesheet App', 'Inventory Manager App', 'Client Portal App', 'Proposal Builder App', 'Contract Signer App', 'Team Chat App', 'KPI Dashboard App'],
  'Mobile-Kids': ['ABCs Learning App', 'Math Games App', 'Drawing Canvas App', 'Storybook Reader App', 'Animal Quiz App', 'Space Explorer App', 'Puzzle Game App', 'Music Maker App', 'Dinosaur Facts App', 'Ocean Discovery App', 'Spelling Bee App', 'Science Experiments App'],
  'Mobile-Fitness': ['Workout Timer App', 'Running Tracker App', 'Yoga Poses App', 'Gym Log App', 'Stretching Guide App', 'HIIT Timer App', 'Cycling Tracker App', 'Swimming Log App', 'CrossFit WOD App', 'Bodyweight Workout App', 'Martial Arts App', 'Dance Fitness App'],
  'Mobile-Entertainment': ['Movie Watchlist App', 'TV Show Tracker App', 'Podcast Player App', 'Meme Generator App', 'Trivia Quiz App', 'Board Game Scorer', 'Comic Reader App', 'Streaming Guide App', 'Celebrity News App', 'Karaoke App', 'Magic Tricks App', 'Joke Generator App'],
  'Mobile-News': ['News Aggregator App', 'RSS Reader App', 'Tech News App', 'Stock News App', 'Crypto News App', 'Local News App', 'Sports Scores App', 'Breaking Alert App', 'Fact Checker App', 'Newsletter Reader App', 'Bookmarking App', 'Summary Reader App'],
  'Mobile-Music': ['Playlist Maker App', 'Metronome App', 'Guitar Tuner App', 'Beat Maker App', 'Song Lyrics App', 'Music Discovery App', 'Piano Practice App', 'DJ Mixer App', 'Concert Finder App', 'Album Collection App', 'Chord Library App', 'Singing Coach App'],
  'Mobile-Photography': ['Photo Editor App', 'Collage Maker App', 'Photo Vault App', 'Camera Filter App', 'Before & After App', 'Photo Calendar App', 'Watermark App', 'Photo Print App', 'Background Remover App', 'Photo Frame App', 'Time-Lapse App', 'Photo Story App'],
  'Mobile-Weather': ['Weather Forecast App', 'Storm Tracker App', 'UV Index App', 'Air Quality App', 'Pollen Tracker App', 'Sunrise Sunset App', 'Rain Alert App', 'Snow Report App', 'Humidity Monitor App', 'Wind Speed App', 'Lightning Tracker App', 'Weather History App'],
  'Mobile-Dating': ['Dating Profile App', 'Match Finder App', 'Date Planner App', 'Love Language App', 'Couple Goals App', 'Anniversary Reminder App', 'Relationship Quiz App', 'Date Night Ideas App', 'Long Distance App', 'Wedding Planner App', 'Compatibility App', 'Date Journal App'],
  'Mobile-Sports': ['Score Tracker App', 'Fantasy League App', 'Workout Log App', 'Sports Stats App', 'Team Manager App', 'Tournament Bracket App', 'Referee Tools App', 'Golf Scorecard App', 'Fishing Log App', 'Hunting Map App', 'Surfing Forecast App', 'Climbing Routes App'],
  'Mobile-Meditation': ['Meditation Timer App', 'Breathing Exercise App', 'Sleep Sounds App', 'Mindfulness App', 'Affirmation App', 'Chakra Balance App', 'Zen Garden App', 'Stress Relief App', 'Body Scan App', 'Walking Meditation App', 'Journaling Prompts App', 'Calm Down App'],
  'Mobile-Cooking': ['Recipe Box App', 'Cooking Timer App', 'Ingredient Substitute App', 'Meal Prep App', 'Wine Pairing App', 'Sourdough Tracker App', 'Spice Guide App', 'Cheese Guide App', 'Kitchen Inventory App', 'Cooking Conversion App', 'Diet Recipe App', 'Chef Challenge App'],
  'Mobile-Parenting': ['Baby Tracker App', 'Chore Chart App', 'Screen Time App', 'School Lunch App', 'Family Calendar App', 'Allowance Tracker App', 'Growth Chart App', 'Milestone Tracker App', 'Family Photo App', 'Bedtime Story App', 'Reward System App', 'Carpool Scheduler App'],
  'Mobile-Pets': ['Pet Health Tracker App', 'Dog Walking App', 'Pet Food Tracker App', 'Vet Appointment App', 'Pet Photo Album App', 'Training Guide App', 'Pet Sitter Finder App', 'Aquarium Log App', 'Bird Watching App', 'Horse Stable App', 'Pet Adoption App', 'Pet Insurance App'],
  'Mobile-Gaming': ['Game Score Tracker', 'Gaming Stats App', 'Dice Roller App', 'Character Builder App', 'Game Library App', 'Achievement Tracker App', 'Game Timer App', 'Strategy Guide App', 'Retro Games App', 'Puzzle Daily App', 'Sudoku App', 'Chess Timer App'],
}

async function seedMobileTemplates() {
  // Get existing
  const { data: existing } = await supabase.from('prebuilt_apps').select('name').like('category', 'Mobile-%')
  const existingNames = new Set((existing || []).map(e => e.name))

  const toInsert = []
  for (const [category, apps] of Object.entries(MOBILE_APP_IDEAS)) {
    for (const name of apps) {
      if (existingNames.has(name)) continue
      toInsert.push({
        name,
        category,
        description: `A mobile ${name.toLowerCase().replace(' app', '')} application`,
        app_id: `WYBER-MOB-${name.replace(/\s+/g, '-').toUpperCase().slice(0, 20)}-${Date.now().toString(36).slice(-4)}`,
        valid: true,
        files: {},
      })
    }
  }

  if (toInsert.length > 0) {
    // Insert in batches of 50
    for (let i = 0; i < toInsert.length; i += 50) {
      const batch = toInsert.slice(i, i + 50)
      const { error } = await supabase.from('prebuilt_apps').insert(batch)
      if (error) console.error('Seed error:', error.message)
    }
    console.log(`Seeded ${toInsert.length} new mobile templates`)
  } else {
    console.log('No new mobile templates to seed')
  }
  return toInsert.length
}

// ── Step 2: Generate code for all mobile templates ────────────────────────

const MOBILE_THEMES = [
  { name: 'iOS Clean', bg: '#000000', card: '#1C1C1E', accent: '#007AFF', accent2: '#5856D6', vibe: 'iOS-inspired. SF-style rounded rects, system font, bottom tab bar. Clean white-on-black with blue accents. Think Apple Health, Apple Music.' },
  { name: 'Material You', bg: '#1C1B1F', card: '#2B2930', accent: '#D0BCFF', accent2: '#CCC2DC', vibe: 'Material You inspired. Large rounded corners (28px), tonal surfaces, expressive colors. Think Google apps with dynamic color.' },
  { name: 'Glassmorphism Mobile', bg: '#0f0f1a', card: 'rgba(255,255,255,0.06)', accent: '#60a5fa', accent2: '#a78bfa', vibe: 'Frosted glass effect. Semi-transparent cards with backdrop blur. Gradient accents. Think modern fintech apps.' },
  { name: 'Warm Minimal', bg: '#FAF8F5', card: '#FFFFFF', accent: '#FF6B35', accent2: '#FF9F1C', vibe: 'Warm light theme. Cream backgrounds, orange accents, friendly rounded UI. Think Headspace, Calm.' },
  { name: 'Neon Night', bg: '#0D0D0D', card: '#1A1A2E', accent: '#E94560', accent2: '#0F3460', vibe: 'Dark with vibrant neon pinks and blues. Cyberpunk-ish. Think gaming apps, nightlife apps.' },
  { name: 'Nature Green', bg: '#F0F7F4', card: '#FFFFFF', accent: '#2D6A4F', accent2: '#40916C', vibe: 'Eco-friendly, calm green tones. Light theme with natural feel. Think plant apps, wellness apps.' },
  { name: 'Candy Pop', bg: '#FFF0F5', card: '#FFFFFF', accent: '#FF69B4', accent2: '#DDA0DD', vibe: 'Playful, colorful, kid-friendly. Bubbly shapes, bright pinks and purples. Think kids apps, casual games.' },
  { name: 'Dark Luxury', bg: '#0A0A0A', card: '#141414', accent: '#C9A96E', accent2: '#8B7D3C', vibe: 'Premium dark with gold accents. Elegant, luxury feel. Think banking apps, premium services.' },
]

const langMap = { tsx: 'typescript', jsx: 'javascript', ts: 'typescript', js: 'javascript', css: 'css' }

function buildMobilePrompt(theme, app) {
  return `You are a world-class mobile app designer. You create React apps that look EXACTLY like real iOS/Android apps — the kind you'd see featured on the App Store or Play Store. Every pixel matters.

Output ONLY <file> blocks — no prose.

DESIGN THEME — "${theme.name}":
- Background: ${theme.bg}
- Card: ${theme.card}
- Accent: ${theme.accent}
- Secondary: ${theme.accent2}
- Vibe: ${theme.vibe}

MANDATORY MOBILE LAYOUT:
- OUTER WRAPPER: centered on page, maxWidth 390px, minHeight 844px (iPhone 15 size), with subtle border/shadow to look like a phone screen
- BODY CSS: background #09090b (dark behind phone), display flex, justify-content center, align-items center, min-height 100vh
- STATUS BAR: 54px top area with time (9:41), signal/wifi/battery icons (use Unicode ● ▮ etc.)
- BOTTOM TAB BAR: fixed at bottom of phone frame, 5 tabs with Unicode icons + labels, 56px height, background with backdrop blur
- CONTENT: scrollable area between status bar and tab bar
- ALL corners: 16-24px radius on cards, 28px on modals
- TAP TARGETS: minimum 44px height on all interactive elements
- TYPOGRAPHY: 28-32px for hero numbers, 17px for body, 13px for captions, 11px for labels
- SPACING: 16-20px horizontal padding, 12px gaps between cards
- Use inline styles only (style={{ }})
- import { useState } from 'react' — only allowed import
- Realistic mock data (8-12 items)
- export default function App()
- Max 300 lines

Required output:
<file path="src/App.tsx">...mobile app with phone frame...</file>
<file path="src/index.css">*, *::before, *::after { box-sizing: border-box; } body { margin: 0; background: #09090b; display: flex; justify-content: center; align-items: center; min-height: 100vh; }</file>

Output ONLY these <file> blocks.`
}

async function generateMobileTemplates() {
  const { data: apps } = await supabase
    .from('prebuilt_apps')
    .select('id, name, category, description, files')
    .eq('valid', true)
    .like('category', 'Mobile-%')
    .limit(500)

  const regenAll = process.argv.includes('--regen')
  const needsGen = regenAll ? (apps || []) : (apps || []).filter(app => {
    const f = app.files
    if (!f || Object.keys(f).length === 0) return true
    if (!f['src/App.tsx'] && !f['src/App.jsx']) return true
    return false
  })

  const limit = parseInt(process.argv[2] || '300')
  const targets = needsGen.slice(0, limit)

  console.log(`\n📱 Mobile Template Generator`)
  console.log(`   Target: ${targets.length} templates | Themes: ${MOBILE_THEMES.length}\n`)

  let ok = 0, fail = 0, cost = 0

  for (let i = 0; i < targets.length; i += 3) {
    const batch = targets.slice(i, i + 3)
    await Promise.all(batch.map(async (app, j) => {
      const idx = i + j
      const theme = MOBILE_THEMES[(idx * 7 + app.name.length) % MOBILE_THEMES.length]
      const t0 = Date.now()
      process.stdout.write(`[${idx + 1}/${targets.length}] ${app.name} (${theme.name})...`)

      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 6000,
          system: buildMobilePrompt(theme, app),
          messages: [{ role: 'user', content: `Build a "${app.name}" mobile app. Category: ${app.category}. ${app.description || ''}. Make it look like a real mobile app with bottom navigation and phone-sized layout.` }],
        })

        const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
        const files = {}
        const re = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g
        let m
        while ((m = re.exec(text)) !== null) {
          const p = m[1], ext = p.split('.').pop()
          files[p] = { path: p, content: m[2].trim(), language: langMap[ext] || 'plaintext' }
        }
        if (!files['src/index.css']) files['src/index.css'] = { path: 'src/index.css', content: '*, *::before, *::after { box-sizing: border-box; }\nbody { margin: 0; background: #09090b; display: flex; justify-content: center; align-items: center; min-height: 100vh; }', language: 'css' }

        if (Object.keys(files).length > 0 && files['src/App.tsx']) {
          const c = (response.usage.input_tokens * 3 + response.usage.output_tokens * 15) / 1000000
          cost += c
          await supabase.from('prebuilt_apps').update({ files }).eq('id', app.id)
          console.log(` OK (${files['src/App.tsx'].content.length} chars, $${c.toFixed(3)}) [${((Date.now()-t0)/1000).toFixed(1)}s]`)
          ok++
        } else {
          console.log(` SKIP [${((Date.now()-t0)/1000).toFixed(1)}s]`)
          fail++
        }
      } catch (err) {
        console.log(` ERROR: ${String(err).slice(0, 80)} [${((Date.now()-t0)/1000).toFixed(1)}s]`)
        fail++
        if (String(err).includes('429')) await new Promise(r => setTimeout(r, 30000))
      }
    }))

    if ((i + 3) % 15 === 0 || i + 3 >= targets.length) {
      console.log(`   --- ${Math.min(100, Math.round(((i + 3) / targets.length) * 100))}% | OK: ${ok} | Failed: ${fail} | Cost: $${cost.toFixed(2)} ---`)
    }
  }

  console.log(`\n✅ Mobile done: ${ok} generated, ${fail} failed, $${cost.toFixed(2)} total`)
}

// Run
console.log('=== Phase 1: Seeding mobile templates ===')
await seedMobileTemplates()
console.log('\n=== Phase 2: Generating mobile app code ===')
await generateMobileTemplates()
