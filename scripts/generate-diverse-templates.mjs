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

const DESIGN_THEMES = [
  {
    name: 'Midnight Aurora',
    bg: '#0a0a1a', card: '#12122a', border: 'rgba(99,102,241,0.15)',
    text: '#e2e8f0', muted: '#94a3b8', accent: '#818cf8', accent2: '#c084fc',
    vibe: 'Deep indigo/violet dark theme with purple accents. Subtle gradient borders on cards. Glassmorphism-inspired panels with slight transparency.',
  },
  {
    name: 'Arctic Frost',
    bg: '#f8fafc', card: '#ffffff', border: 'rgba(0,0,0,0.08)',
    text: '#0f172a', muted: '#64748b', accent: '#0284c7', accent2: '#0ea5e9',
    vibe: 'Clean white/ice-blue light theme. Crisp shadows, airy spacing. Inspired by Linear and Vercel. Professional and minimal.',
  },
  {
    name: 'Emerald Dashboard',
    bg: '#0c1117', card: '#131c25', border: 'rgba(16,185,129,0.12)',
    text: '#e2e8f0', muted: '#6b8299', accent: '#10b981', accent2: '#34d399',
    vibe: 'Dark theme with emerald/green accents. Data-rich dashboard feel. Inspired by Datadog/Grafana. Neon-like status indicators.',
  },
  {
    name: 'Warm Sunset',
    bg: '#fffbf5', card: '#ffffff', border: 'rgba(0,0,0,0.06)',
    text: '#1c1917', muted: '#78716c', accent: '#ea580c', accent2: '#f59e0b',
    vibe: 'Warm, inviting light theme with orange/amber accents. Rounded corners, friendly feel. Inspired by Notion and Stripe. Cream backgrounds.',
  },
  {
    name: 'Neon Terminal',
    bg: '#0d1117', card: '#161b22', border: 'rgba(48,54,61,0.8)',
    text: '#c9d1d9', muted: '#8b949e', accent: '#58a6ff', accent2: '#39d353',
    vibe: 'GitHub-dark inspired. Monospace headers, code-editor feel. Matrix-like green for success states. Blue links and highlights.',
  },
  {
    name: 'Rose Quartz',
    bg: '#fdf2f8', card: '#ffffff', border: 'rgba(0,0,0,0.06)',
    text: '#1e1b2e', muted: '#6b7280', accent: '#db2777', accent2: '#e879a8',
    vibe: 'Elegant pink/rose light theme. Soft gradients, feminine aesthetic. Inspired by Dribbble designs. Delicate borders and hover states.',
  },
  {
    name: 'Obsidian',
    bg: '#09090b', card: '#18181b', border: 'rgba(255,255,255,0.06)',
    text: '#fafafa', muted: '#71717a', accent: '#f97316', accent2: '#fb923c',
    vibe: 'Pure black with fiery orange accents. High contrast, bold typography. Inspired by Vercel/Raycast dark mode. Dramatic and modern.',
  },
  {
    name: 'Ocean Depth',
    bg: '#0c1222', card: '#111a2e', border: 'rgba(56,189,248,0.1)',
    text: '#e0f2fe', muted: '#7dd3fc', accent: '#0ea5e9', accent2: '#38bdf8',
    vibe: 'Deep navy blue dark theme. Aquatic/oceanic feel. Glowing blue highlights. Inspired by crypto dashboards. Layered depth with subtle transparency.',
  },
  {
    name: 'Forest Floor',
    bg: '#fafdf7', card: '#ffffff', border: 'rgba(0,0,0,0.07)',
    text: '#1a2e1a', muted: '#5c7c5c', accent: '#15803d', accent2: '#22c55e',
    vibe: 'Natural green/earth-tone light theme. Organic, sustainable feel. Rounded shapes, leaf-like decorations. Calming and eco-friendly.',
  },
  {
    name: 'Slate Pro',
    bg: '#1e1e2e', card: '#282840', border: 'rgba(255,255,255,0.08)',
    text: '#cdd6f4', muted: '#a6adc8', accent: '#89b4fa', accent2: '#b4befe',
    vibe: 'Catppuccin-inspired dark theme. Muted pastels on dark slate. Cozy, approachable dark mode. Smooth transitions, pill-shaped elements.',
  },
  {
    name: 'Coral Reef',
    bg: '#0f0f12', card: '#1a1a22', border: 'rgba(251,113,133,0.12)',
    text: '#f1f5f9', muted: '#94a3b8', accent: '#fb7185', accent2: '#f472b6',
    vibe: 'Dark theme with coral/pink accents. Vibrant, energetic feel. Gradient hover effects. Inspired by Spotify/Discord dark themes.',
  },
  {
    name: 'Paper Minimal',
    bg: '#f5f5f0', card: '#ffffff', border: 'rgba(0,0,0,0.1)',
    text: '#1a1a1a', muted: '#737373', accent: '#171717', accent2: '#404040',
    vibe: 'Ultra-minimal newspaper/document style. Black and white with careful typography. Inspired by Medium/Substack. Serif headings optional. Max whitespace.',
  },
  {
    name: 'Electric Violet',
    bg: '#13111c', card: '#1c1a29', border: 'rgba(167,139,250,0.12)',
    text: '#ede9fe', muted: '#a78bfa', accent: '#8b5cf6', accent2: '#a78bfa',
    vibe: 'Dark purple/violet theme. Futuristic, premium feel. Inspired by AI/ML dashboards. Glowing accents, sharp corners on some elements.',
  },
  {
    name: 'Sandstone',
    bg: '#f9f5ed', card: '#ffffff', border: 'rgba(168,130,85,0.15)',
    text: '#3d2e1c', muted: '#8b7355', accent: '#b45309', accent2: '#d97706',
    vibe: 'Warm desert/sandstone light theme. Earthy browns and golds. Luxurious, premium aesthetic. Inspired by high-end brand sites.',
  },
  {
    name: 'Cyber Grid',
    bg: '#0a0a0f', card: '#111118', border: 'rgba(34,211,238,0.1)',
    text: '#e2e8f0', muted: '#64748b', accent: '#22d3ee', accent2: '#06b6d4',
    vibe: 'Cyberpunk-inspired dark theme. Cyan/teal neon accents. Grid patterns as subtle backgrounds. Futuristic, tech-forward. Sharp angles.',
  },
]

const LAYOUT_STYLES = [
  'sidebar-nav: Left sidebar navigation (220px) with main content area. Sidebar has nav items with icons.',
  'top-tabs: Horizontal tab bar at top, content switches below. Clean and simple.',
  'dashboard-grid: Full dashboard with stat cards in a row, followed by charts/tables in a 2-column grid.',
  'split-panel: Left panel shows list/master, right panel shows detail/preview. Click to select.',
  'kanban-board: Columns side by side (3-5 columns), cards draggable within columns.',
  'card-gallery: Grid of cards with filters/search at top. Masonry-like or uniform grid.',
  'timeline-feed: Vertical timeline/feed with chronological entries. Social-media inspired.',
  'wizard-steps: Multi-step form/process with step indicator at top. One step visible at a time.',
  'command-center: Dense data display with multiple panels. Header with key metrics, body with tables and mini-charts.',
  'hero-detail: Large hero section/featured item at top, smaller items in grid below.',
]

const CATEGORY_DESIGN_HINTS = {
  CRM: 'Business-professional. Data tables, pipeline views, contact cards. Think Salesforce, HubSpot, Pipedrive.',
  SaaS: 'Modern tech product. Clean UI, feature toggles, usage meters, API keys. Think Stripe Dashboard, AWS Console.',
  Ecommerce: 'Shopping experience. Product grids, cart, filters, reviews, price tags. Think Shopify, Amazon seller.',
  Finance: 'Trust and precision. Charts, transaction lists, portfolio views, number formatting. Think Robinhood, Mint, QuickBooks.',
  Healthcare: 'Clean and accessible. Patient records, appointment views, health metrics. Think Epic MyChart, modern telehealth.',
  Education: 'Engaging and organized. Course cards, progress bars, grade books, lesson plans. Think Coursera, Canvas LMS.',
  RealEstate: 'Visual and map-oriented. Property cards with images, filters, comparison views. Think Zillow, Redfin.',
  Legal: 'Document-centric. Case files, timers, billing, contract views. Think Clio, LegalZoom dashboard.',
  Marketing: 'Creative and data-driven. Campaign cards, analytics, A/B tests, social metrics. Think Mailchimp, Buffer.',
  Productivity: 'Task-oriented. Todo lists, calendars, time tracking, project boards. Think Todoist, Notion, Asana.',
  Logistics: 'Operational. Shipment tracking, route maps, warehouse grids, status timelines. Think ShipBob, Flexport.',
  HRPeople: 'People-centric. Employee cards, org charts, leave calendars, onboarding checklists. Think BambooHR, Workday.',
  Food: 'Appetizing. Menu grids, order trackers, recipe cards, ingredient lists. Think DoorDash merchant, Toast POS.',
  Creative: 'Visual and inspiring. Gallery grids, color palettes, asset libraries, canvas tools. Think Figma, Canva.',
  ProjectManagement: 'Organized. Gantt-like timelines, sprint boards, milestone trackers. Think Jira, Monday.com, ClickUp.',
  Events: 'Exciting. Event cards, attendee lists, schedules, venue maps. Think Eventbrite, Luma.',
  Media: 'Content-rich. Video/audio players, playlist grids, content calendars. Think YouTube Studio, Spotify for Artists.',
  Restaurant: 'Warm and inviting. Menu displays, reservation systems, kitchen order views. Think OpenTable, Square for Restaurants.',
  Landing: 'Conversion-focused. Hero sections, feature blocks, testimonials, CTAs. Think high-converting SaaS landing pages.',
  Travel: 'Adventurous. Trip cards, itineraries, booking forms, destination grids. Think Airbnb, Booking.com.',
  NonProfit: 'Mission-driven. Donation trackers, volunteer boards, impact metrics. Think GoFundMe dashboard, charity water.',
  Social: 'Community-focused. Feed layouts, profile cards, messaging, activity streams. Think Discord, Slack.',
  'Mobile-Social': 'Mobile social app. Chat threads, stories, profile grids, like/comment interactions. Think Instagram, TikTok.',
  'Mobile-Productivity': 'Mobile productivity tool. Quick-action buttons, swipeable lists, compact forms. Think Todoist, Things 3.',
  'Mobile-Health': 'Mobile health tracking. Activity rings, vitals charts, medication reminders, step counters. Think Apple Health.',
  'Mobile-Shopping': 'Mobile commerce app. Product cards, swipeable galleries, cart badges, wish lists. Think Amazon, SHEIN.',
  'Mobile-Travel': 'Mobile travel companion. Trip cards, maps, booking confirmations, packing lists. Think Airbnb, Google Maps.',
  'Mobile-Finance': 'Mobile banking/finance app. Balance cards, transaction lists, budget circles, transfer forms. Think Revolut, Robinhood.',
  'Mobile-Education': 'Mobile learning app. Lesson cards, quiz interfaces, streak counters, flashcards. Think Duolingo, Anki.',
  'Mobile-Food': 'Mobile food app. Restaurant cards, menu scrollers, order tracking, rating stars. Think Uber Eats, Yelp.',
  'Mobile-Utility': 'Mobile utility tool. Calculators, converters, QR scanners, note editors. Think Apple Calculator, Notes.',
  'Mobile-Lifestyle': 'Mobile lifestyle app. Habit trackers, mood journals, meditation timers. Think Headspace, Calm.',
  'Mobile-Business': 'Mobile business tool. Invoice generators, time trackers, expense logs, meeting schedulers. Think Expensify.',
  'Mobile-Kids': 'Mobile kids app. Bright colors, large touch targets, fun animations, reward systems. Think Khan Academy Kids.',
  'Mobile-Fitness': 'Mobile fitness app. Workout timers, exercise cards, progress rings, rep counters. Think Nike Training, Strava.',
  'Mobile-Entertainment': 'Mobile entertainment app. Movie cards, watchlists, trailers, rating stars. Think IMDb, Letterboxd.',
  'Mobile-Music': 'Mobile music app. Playlist cards, waveforms, playback controls, artist grids. Think Spotify, SoundCloud.',
  'Mobile-Photography': 'Mobile photo app. Gallery grid, filter previews, editing sliders, albums. Think VSCO, Lightroom.',
  'Mobile-Sports': 'Mobile sports app. Live scores, team cards, league tables, match timelines. Think ESPN, FotMob.',
  'Mobile-Meditation': 'Mobile meditation app. Timer circles, breathing animations, session cards. Think Calm, Insight Timer.',
  'Mobile-Cooking': 'Mobile cooking app. Recipe cards, ingredient lists, step-by-step, timers. Think Tasty, Paprika.',
  'Mobile-Parenting': 'Mobile parenting app. Baby logs, milestone trackers, growth charts. Think Baby Tracker, Huckleberry.',
  'Mobile-Pets': 'Mobile pet app. Pet profiles, vet records, walk trackers, food logs. Think Rover, PetDesk.',
  'Mobile-Weather': 'Mobile weather app. Temperature display, hourly forecast, radar maps. Think Weather.com, Carrot.',
  'Mobile-Dating': 'Mobile dating app. Profile cards, swipe interface, match lists, chat bubbles. Think Hinge, Bumble.',
  'Mobile-News': 'Mobile news app. Article cards, category tabs, breaking banners, bookmarks. Think Apple News, Feedly.',
  'Mobile-Gaming': 'Mobile gaming app. Score displays, leaderboards, achievement badges, level progress. Think Game Center.',
}

function buildSystemPrompt(theme, layout, categoryHint) {
  return `You are an elite frontend developer who creates STUNNING, production-quality React apps. You take immense pride in visual design — every app you build looks like it belongs on Dribbble or Product Hunt.

Output ONLY <file> blocks — no prose, no explanation.

DESIGN THEME — "${theme.name}":
- Background: ${theme.bg}
- Card/panel: ${theme.card}
- Border: ${theme.border}
- Text: ${theme.text}
- Muted text: ${theme.muted}
- Primary accent: ${theme.accent}
- Secondary accent: ${theme.accent2}
- Design vibe: ${theme.vibe}

LAYOUT: ${layout}

CATEGORY CONTEXT: ${categoryHint}

${categoryHint.includes('mobile') || categoryHint.includes('Mobile') ? `MOBILE APP OVERRIDE — This is a MOBILE app, not a desktop app:
- Wrap everything in a phone frame: maxWidth 390px, centered, with subtle border
- Add a bottom tab bar (fixed, 5 tabs with Unicode icons + labels, 56px height)
- Add status bar area at top (54px, show 9:41 + battery icons)
- Body background should be #09090b with the phone centered
- All tap targets minimum 44px
- Use mobile typography: 28px hero numbers, 17px body, 13px captions
` : ''}
CRITICAL RULES:
- Inline styles only (style={{ }}) — NO CSS files, NO Tailwind, NO styled-components
- import { useState } from 'react' — the ONLY allowed import
- export default function App() as the main component
- Realistic, believable mock data (8-15 records with real names, dates, dollar amounts, emails)
- Every file must be complete and syntactically valid JSX
- MUST follow the design theme colors above — do NOT default to generic dark theme
- Add micro-interactions: hover effects using state, animated transitions via CSS-in-JS
- Use varied typography: mix font sizes (11px-32px), font weights (400-700), letter-spacing
- Add visual hierarchy with spacing, borders, shadows appropriate to the theme
- Include at least one interactive feature (search, filter, sort, modal, tabs, expand/collapse)
- Use Unicode symbols creatively (↗ → ● ◆ ▲ ■ ★ etc.) instead of relying on emoji
- Make stat cards visually interesting — colored backgrounds, icon-like decorations, progress bars
- For tables, use alternating row styles or hover highlights
- Max 300 lines per file — pack in visual richness, not verbosity

Required output:
<file path="src/App.tsx">...complete app...</file>
<file path="src/index.css">*, *::before, *::after { box-sizing: border-box; } body { margin: 0; }</file>

Output ONLY these <file> blocks. Nothing else.`
}

const langMap = { tsx: 'typescript', jsx: 'javascript', ts: 'typescript', js: 'javascript', css: 'css', html: 'html', json: 'json' }

const mode = process.argv[2] || 'new' // 'new' = only ungenerated, 'all' = regenerate everything, 'regen' = only already-generated
const limit = parseInt(process.argv[3] || '300')
const concurrency = parseInt(process.argv[4] || '3') // parallel requests

// Fetch templates
const { data: allApps, error } = await supabase
  .from('prebuilt_apps')
  .select('id, name, category, description, files')
  .eq('valid', true)
  .limit(500)

if (error) { console.error('DB error:', error); process.exit(1) }

let apps
if (mode === 'new') {
  apps = allApps.filter(app => {
    const f = app.files
    if (!f || Object.keys(f).length === 0) return true
    if (typeof f.code === 'string') return true
    if (!f['src/App.tsx'] && !f['src/App.jsx']) return true
    return false
  })
} else if (mode === 'regen') {
  apps = allApps.filter(app => {
    const f = app.files
    return f && Object.keys(f).length > 0 && (f['src/App.tsx'] || f['src/App.jsx'])
  })
} else {
  apps = allApps
}

apps = apps.slice(0, limit)

console.log(`\n🎨 Diverse Template Generator`)
console.log(`   Mode: ${mode} | Target: ${apps.length} templates | Concurrency: ${concurrency}`)
console.log(`   Themes: ${DESIGN_THEMES.length} | Layouts: ${LAYOUT_STYLES.length}\n`)

let ok = 0, fail = 0, totalCost = 0

async function generateOne(app, index) {
  // Deterministic but varied selection based on app properties
  const hash = (app.name + app.category).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const theme = DESIGN_THEMES[(hash + index) % DESIGN_THEMES.length]
  const layout = LAYOUT_STYLES[(hash * 3 + index * 7) % LAYOUT_STYLES.length]
  const categoryHint = CATEGORY_DESIGN_HINTS[app.category] || 'Create an impressive, polished app appropriate for this category.'

  const t0 = Date.now()
  const num = `[${index + 1}/${apps.length}]`
  process.stdout.write(`${num} ${app.name} (${theme.name}, ${layout.split(':')[0]})...`)

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: buildSystemPrompt(theme, layout, categoryHint),
      messages: [{
        role: 'user',
        content: `Build a "${app.name}" web app. Category: ${app.category}. Description: ${app.description || 'A professional ' + app.name.toLowerCase() + ' application.'}

Make this VISUALLY STUNNING. This should look like a real product, not a tutorial demo. Rich data, polished UI, thoughtful interactions.`,
      }],
    })

    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
    const files = {}
    const fileRegex = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g
    let match
    while ((match = fileRegex.exec(text)) !== null) {
      const p = match[1], ext = p.split('.').pop() ?? ''
      files[p] = { path: p, content: match[2].trim(), language: langMap[ext] ?? 'plaintext' }
    }

    if (Object.keys(files).length === 0) {
      let code = text.replace(/```(?:tsx|jsx|typescript|javascript)?\n?/g, '').replace(/```\n?/g, '').trim()
      // Strip any <file> tags that weren't closed (truncated response)
      code = code.replace(/^<file\s+path="[^"]*">\s*/g, '').replace(/\s*<\/file>\s*$/g, '')
      if (code.includes('export default') || code.includes('function App')) {
        files['src/App.tsx'] = { path: 'src/App.tsx', content: code, language: 'typescript' }
      }
    }

    if (Object.keys(files).length < 1) {
      console.log(` SKIP (no code) [${((Date.now()-t0)/1000).toFixed(1)}s]`)
      fail++
      return
    }

    if (!files['src/index.css']) {
      files['src/index.css'] = { path: 'src/index.css', content: '*, *::before, *::after { box-sizing: border-box; }\nbody { margin: 0; padding: 0; }', language: 'css' }
    }

    const appLen = files['src/App.tsx']?.content?.length || 0
    const cost = (response.usage.input_tokens * 3 + response.usage.output_tokens * 15) / 1000000
    totalCost += cost

    await supabase.from('prebuilt_apps').update({ files }).eq('id', app.id)
    console.log(` OK (${Object.keys(files).length} files, ${appLen} chars, $${cost.toFixed(3)}) [${((Date.now()-t0)/1000).toFixed(1)}s]`)
    ok++
  } catch (err) {
    const msg = String(err).slice(0, 120)
    console.log(` ERROR: ${msg} [${((Date.now()-t0)/1000).toFixed(1)}s]`)
    fail++

    // If rate limited, wait and retry won't help in parallel, just continue
    if (msg.includes('rate') || msg.includes('429')) {
      console.log('   ⏳ Rate limited, waiting 30s...')
      await new Promise(r => setTimeout(r, 30000))
    }
  }
}

// Process with concurrency
async function processAll() {
  for (let i = 0; i < apps.length; i += concurrency) {
    const batch = apps.slice(i, i + concurrency)
    const promises = batch.map((app, j) => generateOne(app, i + j))
    await Promise.all(promises)

    // Progress summary every 10
    if ((i + concurrency) % 10 === 0 || i + concurrency >= apps.length) {
      const pct = Math.min(100, Math.round(((i + concurrency) / apps.length) * 100))
      console.log(`   --- Progress: ${pct}% | OK: ${ok} | Failed: ${fail} | Cost: $${totalCost.toFixed(2)} ---`)
    }
  }
}

await processAll()

console.log(`\n✅ Complete!`)
console.log(`   Generated: ${ok}`)
console.log(`   Failed: ${fail}`)
console.log(`   Total cost: $${totalCost.toFixed(2)}`)
console.log(`   Avg cost/template: $${(totalCost / Math.max(ok, 1)).toFixed(3)}`)
