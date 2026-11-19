// Mobile design directions: the mobile counterpart of design-directions.ts, dealt by fit instead of the old random
// DESIGN SEED / LAYOUT SEED lists. Each direction carries exact theme.ts values (hex), a structure, type rules,
// motion, and lintable rules. Previews run in Expo Snack (RN-web), which ships no custom Google fonts, so every
// direction uses the platform system font (SF / Roboto) with deliberate weight, size and tracking, plus an optional
// platform serif for the reader direction.
//
// Honesty note: the anchors below are NAMED REFERENCES (award winners and widely shipped apps), not measured the
// way the web anchors were (DOM and computed styles are not available for native apps). See
// docs/mobile-design-direction-research.md.

export interface MobileTheme {
  bg: string; surface: string; elevated: string; border: string
  text: string; textSecondary: string; textMuted: string
  accent: string; onAccent: string
  success: string; warning: string; danger: string
  radius: number
}

export type MobileStructure = 'tabs-feed' | 'tool-first' | 'tabs-dashboard' | 'cards-swipe' | 'split-list' | 'sheet-nav'

export interface MobileDirection {
  id: string
  name: string
  mode: 'light' | 'dark'
  anchors: string[]
  vibe: string
  theme: MobileTheme
  type: { title: string; number: string; body: string; label: string; serif?: boolean }
  structure: MobileStructure
  composition: string
  moves: string[]
  motion: string
  imageBrief: string
  fits: string[]
  notFor: string
  pitfall: string
  generalist?: boolean
}

const STATUS_LIGHT = { success: '#15803D', warning: '#B45309', danger: '#B91C1C' }
const STATUS_DARK = { success: '#4ADE80', warning: '#FBBF24', danger: '#F87171' }

export const MOBILE_DIRECTIONS: MobileDirection[] = [
  {
    id: 'm-paper-notes', name: 'Paper notes', mode: 'light', generalist: true,
    anchors: ['Things 3 (Apple Design Award winner)', 'Bear', 'Notion mobile'],
    vibe: 'Warm paper, near-black ink, one restrained accent; content-first, almost no chrome',
    theme: { bg: '#FAF8F4', surface: '#FFFFFF', elevated: '#F1EEE7', border: 'rgba(40,32,20,0.10)', text: '#1F1B16', textSecondary: '#5B544A', textMuted: '#8A8276', accent: '#B8431F', onAccent: '#FFFFFF', ...STATUS_LIGHT, radius: 12 },
    type: { title: '28/700, tracking -0.4', number: '32/700, tabular', body: '16/400, line-height 24', label: '12/600 uppercase, tracking 0.6' },
    structure: 'tabs-dashboard',
    composition: 'A large left-aligned title, then a plain list of rows separated by hairlines (no card around every row). One primary action as a filled accent button or a single FAB. Checklists and rows have generous 52px height.',
    moves: ['Hairline dividers instead of card boxes', 'Accent used only for the primary action and the active tab', 'Completed items fade to textMuted with a thin strikethrough'],
    motion: 'Rows slide out on complete (180ms), nothing loops. Haptic-style 0.98 scale on press.',
    imageBrief: 'No photos needed. Empty states use a single quiet line drawing.',
    fits: ['todo', 'to-do', 'task', 'tasks', 'notes', 'note', 'notebook', 'journal', 'planner', 'checklist', 'productivity', 'organizer', 'reminder', 'bookmark', 'list', 'habit', 'habits', 'tracker'],
    notFor: 'Games, social feeds, luxury brands.',
    pitfall: 'Turns into a grey list app; the warm ground and one accent must carry the personality.',
  },
  {
    id: 'm-calm-sage', name: 'Calm sage', mode: 'light',
    anchors: ['Headspace', 'Calm (Google Play Best for XR)', 'Moonlitt (Apple Design Award, Interaction)'],
    vibe: 'Soft sage and sand, large rounded shapes, slow motion, plenty of air',
    theme: { bg: '#F4F2EA', surface: '#FFFFFF', elevated: '#E9E7DB', border: 'rgba(52,70,56,0.12)', text: '#1F2A22', textSecondary: '#4B5B50', textMuted: '#76847A', accent: '#2F6F5A', onAccent: '#FFFFFF', ...STATUS_LIGHT, radius: 24 },
    type: { title: '30/600, tracking -0.3', number: '44/300', body: '16/400, line-height 26', label: '12/600 uppercase, tracking 0.8' },
    structure: 'tool-first',
    composition: 'One focused screen: a large soft card (radius 24) holding today\'s single practice or number, a quiet row of 3 chips, then a gentle list. Bottom tabs have only 3 items. Copy speaks in plain, kind sentences.',
    moves: ['One hero card per screen with generous padding (24)', 'Numbers in light weight (300) at 44px', 'Accent only on the start button and the progress ring'],
    motion: 'Progress ring fills once over 700ms; screens cross-fade 250ms. Breathing animations only where the app is about breathing.',
    imageBrief: 'Soft flat shapes or calm photography (water, leaves, light). No stock people meditating.',
    fits: ['meditation', 'mindfulness', 'sleep', 'wellness', 'calm', 'breathing', 'yoga', 'therapy', 'mood', 'self care', 'gratitude', 'diary', 'pregnancy', 'baby', 'mental health', 'relax'],
    notFor: 'Energetic fitness, finance, marketplaces.',
    pitfall: 'Pastel everything becomes sugary; keep text near-black and the accent deep.',
  },
  {
    id: 'm-cash-bold', name: 'Cash bold', mode: 'dark',
    anchors: ['Cash App', 'Revolut', 'Robinhood'],
    vibe: 'Tinted near-black, huge numbers, ONE vivid lime action colour, almost no chrome',
    theme: { bg: '#0E100D', surface: '#171A15', elevated: '#20241D', border: 'rgba(235,245,220,0.10)', text: '#F4F7EE', textSecondary: '#B4BCA8', textMuted: '#848C78', accent: '#B6F23C', onAccent: '#10140A', ...STATUS_DARK, radius: 16 },
    type: { title: '26/800, tracking -0.5', number: '56/800, tabular, tracking -1.5', body: '15/400, line-height 22', label: '11/700 uppercase, tracking 0.8' },
    structure: 'tabs-dashboard',
    composition: 'A balance or key number at 56px dominates the top. Under it a row of 3-4 big round action buttons (Send, Add, Cash out) with labels, then a plain transaction list with amounts right-aligned in tabular figures. Tab bar is 4 icons, no labels needed.',
    moves: ['One huge number per screen', 'Lime accent only on the primary pill and active states', 'Amounts coloured only for sign (success/danger), never decoration'],
    motion: 'Numbers count up once (400ms); sheets rise with a spring. No ambient motion.',
    imageBrief: 'None; merchant avatars as monogram discs. Card art may be a flat colour block.',
    fits: ['wallet', 'payments', 'payment', 'upi', 'bank', 'banking', 'money', 'finance', 'fintech', 'crypto', 'trading', 'invest', 'investing', 'stocks', 'savings', 'loan', 'credit', 'remittance'],
    notFor: 'Wellness, kids, craft or hospitality brands.',
    pitfall: 'Neon on large surfaces looks cheap; the lime stays on one action per screen.',
  },
  {
    id: 'm-ledger-calm', name: 'Ledger calm', mode: 'light',
    anchors: ['Monzo budgeting views', 'Copilot Money', 'Wise'],
    vibe: 'Clean light ground, deep teal, readable lists and charts for everyday money and records',
    theme: { bg: '#F6F8F7', surface: '#FFFFFF', elevated: '#EAF0EE', border: 'rgba(16,48,44,0.10)', text: '#10201E', textSecondary: '#44595A', textMuted: '#74878A', accent: '#0F6B66', onAccent: '#FFFFFF', ...STATUS_LIGHT, radius: 14 },
    type: { title: '26/700, tracking -0.4', number: '34/700, tabular', body: '15/400, line-height 22', label: '11/700 uppercase, tracking 0.6' },
    structure: 'tabs-dashboard',
    composition: 'A summary card with the month total and a thin progress bar, a horizontal row of category chips, then a grouped list (Today, Yesterday) with amounts right-aligned. One chart at most, with labelled axes.',
    moves: ['Grouped lists with sticky date headers', 'Chart in one hue with a labelled baseline', 'Status words next to every coloured dot'],
    motion: 'Bars and rings animate in once (500ms). Row swipe actions reveal delete.',
    imageBrief: 'None; category icons from one icon family.',
    fits: ['expense', 'expenses', 'budget', 'bills', 'invoice', 'khata', 'ledger', 'accounting', 'spending', 'split', 'emi', 'subscription', 'subscriptions', 'inventory', 'stock', 'records', 'billing'],
    notFor: 'Playful consumer or luxury apps.',
    pitfall: 'Grey spreadsheet feel; keep the summary card and grouped headers.',
  },
  {
    id: 'm-sport-energy', name: 'Sport energy', mode: 'dark',
    anchors: ['Strava', 'Nike Run Club', 'Whoop'],
    vibe: 'Charcoal base, punchy orange, big stats, high contrast and urgent type',
    theme: { bg: '#101113', surface: '#1A1C1F', elevated: '#25282C', border: 'rgba(255,255,255,0.09)', text: '#F5F5F3', textSecondary: '#B7B9BC', textMuted: '#85888D', accent: '#FF5A1F', onAccent: '#140700', ...STATUS_DARK, radius: 14 },
    type: { title: '28/800 uppercase, tracking 0', number: '64/800, tabular, tracking -2', body: '15/500, line-height 22', label: '11/800 uppercase, tracking 1' },
    structure: 'tabs-feed',
    composition: 'A live or last-activity hero with a giant number (distance, time, reps), a row of 3 secondary stats, then a feed of past activities as dense cards with a mini chart. A big start button is anchored above the tab bar.',
    moves: ['Uppercase heavy titles', 'One orange start button always reachable by thumb', 'Stats grouped in 3s with consistent units'],
    motion: 'Start button pulses once on load; counters tick live. Charts draw in 400ms.',
    imageBrief: 'Route maps as simple line shapes; athlete photos only if supplied.',
    fits: ['fitness', 'workout', 'gym', 'running', 'run', 'cycling', 'training', 'exercise', 'sport', 'sports', 'steps', 'calorie', 'calories', 'yoga', 'cricket', 'football', 'athlete', 'coach'],
    notFor: 'Calm wellness, finance, kids.',
    pitfall: 'Orange everywhere gets loud; it is for the start action and the one key stat.',
  },
  {
    id: 'm-play-bright', name: 'Play bright', mode: 'light',
    anchors: ['Duolingo', 'Sago Mini (Apple Design Award)', 'grug (Apple Design Award, Delight)'],
    vibe: 'Bright friendly ground, rounded everything, one saturated green with cheerful supporting colours',
    theme: { bg: '#F7FBEF', surface: '#FFFFFF', elevated: '#E8F3D6', border: 'rgba(40,80,20,0.14)', text: '#1B2A12', textSecondary: '#46603A', textMuted: '#74896A', accent: '#217A20', onAccent: '#FFFFFF', ...STATUS_LIGHT, radius: 20 },
    type: { title: '28/800, tracking -0.2', number: '40/800', body: '17/500, line-height 24', label: '12/700 uppercase, tracking 0.6' },
    structure: 'cards-swipe',
    composition: 'A path or deck of big rounded cards, one task per screen, a chunky bottom button that fills the width, progress dots or a bar at the top, instant friendly feedback after every answer.',
    moves: ['Chunky 56px buttons with a 4px darker bottom edge', 'One question or card per screen', 'Streak or progress shown as a simple number, never a fake leaderboard'],
    motion: 'Correct answers bounce (spring), wrong ones shake 120ms. Confetti only on completing a lesson, once.',
    imageBrief: 'Flat, friendly illustration; no stock photos.',
    fits: ['learn', 'learning', 'language', 'quiz', 'flashcard', 'flashcards', 'kids', 'children', 'education', 'study', 'school', 'exam', 'game', 'puzzle', 'trivia', 'vocabulary', 'maths', 'reading'],
    notFor: 'Finance, luxury, staff tools.',
    pitfall: 'Childish if used for adult professional content; tone must match the audience.',
  },
  {
    id: 'm-market-warm', name: 'Market warm', mode: 'light',
    anchors: ['Airbnb', 'Zomato / Swiggy listing screens', 'Etsy'],
    vibe: 'Photo-led cards on a warm white ground, one coral action colour, search first',
    theme: { bg: '#FFFBF7', surface: '#FFFFFF', elevated: '#F7EFE8', border: 'rgba(60,30,10,0.10)', text: '#2A1A10', textSecondary: '#5E4A3C', textMuted: '#8D7A6C', accent: '#D93C2B', onAccent: '#FFFFFF', ...STATUS_LIGHT, radius: 16 },
    type: { title: '26/700, tracking -0.3', number: '24/700, tabular', body: '15/400, line-height 22', label: '12/600, tracking 0.2' },
    structure: 'tabs-feed',
    composition: 'A pinned search bar, a horizontal row of category chips, then big photo cards (4:3, radius 16) with title, rating-free subtitle, and price. Heart toggle on the photo. Detail opens full screen with a sticky bottom action bar.',
    moves: ['Photo first, text second on every card', 'Sticky bottom bar with price and one action', 'Coral only on the primary action and the saved heart'],
    motion: 'Photo cards fade in; the heart pops with a spring; the sticky bar slides in on scroll.',
    imageBrief: 'Honest natural-light photography of the actual products, rooms or dishes; consistent 4:3 crops.',
    fits: ['marketplace', 'shop', 'store', 'ecommerce', 'e-commerce', 'delivery', 'food', 'restaurant', 'order', 'orders', 'travel', 'booking', 'hotel', 'rental', 'rentals', 'listing', 'listings', 'grocery', 'cafe', 'menu', 'classifieds'],
    notFor: 'Tools without photography, finance, games.',
    pitfall: 'Bad placeholder photos sink it; generated images must look real and consistent.',
  },
  {
    id: 'm-field-tool', name: 'Field tool', mode: 'light',
    anchors: ['Square Point of Sale', 'Jobber', 'Uber Driver'],
    vibe: 'High contrast, very large tap targets, plain words, works one-handed in sunlight',
    theme: { bg: '#F5F5F2', surface: '#FFFFFF', elevated: '#E8E8E2', border: 'rgba(20,20,10,0.16)', text: '#14140F', textSecondary: '#3F3F36', textMuted: '#686860', accent: '#0B5FD1', onAccent: '#FFFFFF', ...STATUS_LIGHT, radius: 14 },
    type: { title: '28/800, tracking -0.3', number: '40/800, tabular', body: '18/500, line-height 26', label: '13/700 uppercase, tracking 0.4' },
    structure: 'tool-first',
    composition: 'One dominant action as a full-width 64px button at the bottom (Start trip, Take payment, Mark delivered). The job or order in progress fills the screen; lists use 72px rows with the status as a word plus a dot.',
    moves: ['64px primary button, thumb zone', '18px minimum body text, 7:1 contrast', 'Status always written out, never colour alone'],
    motion: 'Press feedback only; confirmations are a clear full-width banner, not a toast.',
    imageBrief: 'None; maps and proof-of-delivery photos only when the user supplies them.',
    fits: ['driver', 'rider', 'delivery partner', 'technician', 'field', 'staff', 'attendance', 'punch', 'check-in', 'inspection', 'survey', 'warehouse', 'logistics', 'dispatch', 'fleet', 'worker', 'employee', 'pos', 'collection', 'agent app'],
    notFor: 'Consumer entertainment and luxury.',
    pitfall: 'Looks like enterprise software unless tap targets and words are generous and warm.',
  },
  {
    id: 'm-sky-data', name: 'Sky data', mode: 'dark',
    anchors: ['Tide Guide (Apple Design Award, Visuals and Graphics)', 'Carrot Weather', 'Apple Weather'],
    vibe: 'Deep sky-blue ground, full-screen charts, glass bars, colours that follow the data',
    theme: { bg: '#0B1A2A', surface: '#12263A', elevated: '#1A3450', border: 'rgba(190,225,255,0.14)', text: '#EAF4FF', textSecondary: '#B5CCE0', textMuted: '#86A1B8', accent: '#5CC8FF', onAccent: '#04141F', ...STATUS_DARK, radius: 20 },
    type: { title: '30/600, tracking -0.4', number: '72/200, tracking -2', body: '16/400, line-height 24', label: '12/600 uppercase, tracking 0.8' },
    structure: 'tool-first',
    composition: 'A full-screen chart as the hero with the current value in 72px thin type above it, a time scrubber underneath, and a few translucent cards below for details. The background colour shifts with the data (time of day, level).',
    moves: ['Chart fills the screen edge to edge', 'Thin 200-weight giant number', 'Translucent cards (surface at 70% opacity) over the gradient-free ground'],
    motion: 'Chart draws in once (600ms); scrubbing is 1:1 with the finger; values update without bounce.',
    imageBrief: 'None; the data visualisation is the imagery.',
    fits: ['weather', 'tide', 'tides', 'forecast', 'moon', 'astronomy', 'sky', 'stars', 'ocean', 'surf', 'fishing', 'sailing', 'hiking', 'maps', 'air quality', 'aqi', 'sensor', 'iot', 'telemetry', 'monitor'],
    notFor: 'Text-heavy, social, or finance apps.',
    pitfall: 'Without real-looking data the chart is empty decoration; seed believable series.',
  },
  {
    id: 'm-luxe-dark', name: 'Luxe dark', mode: 'dark',
    anchors: ['Apple Wallet', 'Net-a-Porter', 'Aesop (mobile)'],
    vibe: 'Tinted near-black, champagne accent, lots of negative space, restrained serif touches',
    theme: { bg: '#121110', surface: '#1B1917', elevated: '#26231F', border: 'rgba(240,225,200,0.12)', text: '#F3EEE6', textSecondary: '#C2B9AA', textMuted: '#8F8678', accent: '#D9BC8A', onAccent: '#1A130A', ...STATUS_DARK, radius: 6 },
    type: { title: '30/400 serif, tracking 0', number: '36/300 serif', body: '15/400, line-height 24', label: '11/500 uppercase, tracking 1.6', serif: true },
    structure: 'tabs-feed',
    composition: 'Full-bleed product or editorial imagery, very little chrome, thin hairlines, a serif title over the image, tiny wide-tracked labels. One quiet champagne button. Generous 32px section spacing.',
    moves: ['Serif for titles only, system sans for everything else', 'Radius 6, hairline borders', 'Champagne accent on one element per screen'],
    motion: 'Slow 300ms fades; images ease in. No springs, no bounce.',
    imageBrief: 'Editorial product photography on dark neutral grounds, raking light, close crops; no lifestyle stock.',
    fits: ['luxury', 'fashion', 'jewellery', 'jewelry', 'watch', 'watches', 'perfume', 'fragrance', 'couture', 'boutique', 'premium', 'concierge', 'membership', 'club', 'collector', 'auction', 'art'],
    notFor: 'Utility, kids, budget-conscious tools.',
    pitfall: 'Needs real photography; without it the dark screens feel empty.',
  },
  {
    id: 'm-social-feed', name: 'Social feed', mode: 'light',
    anchors: ['Instagram', 'Threads', 'Edits (Google Play Best for Fun)'],
    vibe: 'Clean white feed, photo and text posts, one warm accent, fast scanning',
    theme: { bg: '#FFFFFF', surface: '#FFFFFF', elevated: '#F3F3F1', border: 'rgba(0,0,0,0.08)', text: '#161616', textSecondary: '#4A4A48', textMuted: '#767672', accent: '#E0245E', onAccent: '#FFFFFF', ...STATUS_LIGHT, radius: 12 },
    type: { title: '22/700, tracking -0.2', number: '20/700', body: '15/400, line-height 22', label: '12/600' },
    structure: 'tabs-feed',
    composition: 'Stories row on top, then a vertical feed with edge-to-edge media, a slim action row (like, comment, share) and the caption under it. A centre create button in the tab bar. Profile is a grid of square thumbnails.',
    moves: ['Edge-to-edge media in the feed', 'Action row icons 24px, one icon family', 'Accent only on the like state and unread badges'],
    motion: 'Like pops with a spring and haptic; stories open with a scale transition.',
    imageBrief: 'Varied authentic photos in square and 4:5 crops; avatar circles with initials as fallback.',
    fits: ['social', 'community', 'feed', 'chat', 'messaging', 'dating', 'friends', 'followers', 'creator', 'creators', 'video', 'reels', 'photo sharing', 'forum', 'group', 'groups', 'events', 'network'],
    notFor: 'Finance, field tools, calm wellness.',
    pitfall: 'Fake follower counts read as fabricated; use small believable numbers.',
  },
  {
    id: 'm-reader-editorial', name: 'Reader editorial', mode: 'light',
    anchors: ['Apple News', 'Kindle', 'Substack reader'],
    vibe: 'Warm paper page, serif reading text, large headlines, quiet navigation',
    theme: { bg: '#FBF8F1', surface: '#FFFFFF', elevated: '#F0EBDF', border: 'rgba(50,38,20,0.12)', text: '#211B12', textSecondary: '#524838', textMuted: '#7F7464', accent: '#9A2E1B', onAccent: '#FFFFFF', ...STATUS_LIGHT, radius: 8 },
    type: { title: '32/700 serif, tracking -0.4', number: '28/700 serif', body: '18/400 serif, line-height 30', label: '12/700 uppercase, tracking 1', serif: true },
    structure: 'split-list',
    composition: 'A lead story with a big image and a 32px serif headline, then a list of articles with a small thumbnail right and a serif title left. The reading screen is a single column at 18px/30px with a thin progress line at the top.',
    moves: ['Serif body for reading screens', 'Small-caps style labels for sections', 'Reading progress as a 2px line, not a percentage'],
    motion: 'Page transitions are a simple push; no decorative motion in reading mode.',
    imageBrief: 'Editorial photography with real captions; consistent 3:2 crops.',
    fits: ['news', 'article', 'articles', 'blog', 'reader', 'reading', 'book', 'books', 'ebook', 'magazine', 'podcast', 'newsletter', 'stories', 'poetry', 'recipes', 'recipe', 'library', 'bible', 'quotes'],
    notFor: 'Dashboards, games, field tools.',
    pitfall: 'Serif at small sizes hurts readability; keep body at 17px or larger.',
  },
]

export const MOBILE_DIRECTION_IDS = MOBILE_DIRECTIONS.map(d => d.id)
export const getMobileDirectionById = (id: string | null | undefined) => MOBILE_DIRECTIONS.find(d => d.id === id)

// ── deal by fit ───────────────────────────────────────────────────────────────
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ')

function score(prompt: string, d: MobileDirection): number {
  const text = ` ${norm(prompt)} `
  let s = 0
  for (const f of d.fits) {
    const needle = norm(f).trim()
    if (!needle) continue
    const re = new RegExp(`(?<![a-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es)?(?![a-z0-9])`, 'g')
    const hits = Math.min((text.match(re) ?? []).length, 3)
    if (hits) s += hits * (needle.includes(' ') || needle.includes('-') ? 1.5 : 1)
  }
  return s
}

/** Best keyword match, or a random generalist when the prompt carries no signal. */
export function pickMobileDirection(prompt: string, rnd: () => number = Math.random): MobileDirection {
  let best: MobileDirection | null = null
  let bestScore = 0
  for (const d of MOBILE_DIRECTIONS) {
    const s = score(prompt, d)
    if (s > bestScore) { best = d; bestScore = s }
  }
  if (best && bestScore >= 1) return best
  const pool = MOBILE_DIRECTIONS.filter(d => d.generalist)
  return pool[Math.floor(rnd() * pool.length)] ?? MOBILE_DIRECTIONS[0]
}

// ── contrast ──────────────────────────────────────────────────────────────────
function lum(hex: string): number {
  const h = hex.replace('#', '')
  const c = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
export function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

// ── the brief the model receives ────────────────────────────────────────────
export function renderMobileBrief(d: MobileDirection): string {
  const t = d.theme
  return `

━━━ MOBILE DESIGN DIRECTION: ${d.name} (${d.mode} base) — DO NOT DEVIATE ━━━
Reference apps: ${d.anchors.join('; ')}.
Vibe: ${d.vibe}.

THEME — put these EXACT values in theme.ts (they replace any example palette; keep the key names your theme.ts uses, mapping: bg/background, surface, elevated/surfaceElevated, border, text/textPrimary, textSecondary, textMuted, accent/primary, onAccent/white, success, warning, danger/error):
  bg ${t.bg} · surface ${t.surface} · elevated ${t.elevated} · border ${t.border}
  text ${t.text} · textSecondary ${t.textSecondary} · textMuted ${t.textMuted}
  accent ${t.accent} · onAccent ${t.onAccent}
  success ${t.success} · warning ${t.warning} · danger ${t.danger}
  radius ${t.radius}
  StatusBar style: ${d.mode === 'dark' ? 'light-content' : 'dark-content'}.

TYPE (platform system font; fontSize/weight): title ${d.type.title}; numbers ${d.type.number}; body ${d.type.body}; labels ${d.type.label}.${d.type.serif ? ' Serif where noted: Platform.select({ ios: "Georgia", android: "serif" }) — titles and reading text only.' : ''} Do not import custom fonts.

STRUCTURE: ${d.structure}. ${d.composition}

SIGNATURE MOVES:
${d.moves.map(m => `- ${m}`).join('\n')}

MOTION: ${d.motion}
IMAGES: ${d.imageBrief}

HARD RULES (a reviewer will check these):
- Every colour comes from theme.ts; no hex or rgba inside a StyleSheet.
- One accent colour. No purple/violet/indigo unless this direction's accent is that hue. No gradients unless the direction asks for one.
- No emoji as icons; one icon family (Ionicons) at one weight everywhere.
- Tap targets at least 44px; the primary action sits in the lower half of the screen (thumb zone).
- Status is never colour alone: add a word or an icon.
- INVENTED FACTS ARE PLACEHOLDERS: do not invent user counts, ratings, reviews, credentials or testimonials; label sample data as sample.
- Avoid: ${d.notFor} (if the user's idea is one of these, adapt but keep the theme values).
- Pitfall to dodge: ${d.pitfall}
`
}

// ── optional classifier (Haiku), keyword fallback ─────────────────────────────
export function buildMobileClassifierSystem(): string {
  const lines = MOBILE_DIRECTIONS.map(d => `${d.id} | ${d.name} | best for: ${d.fits.slice(0, 12).join(', ')} | not for: ${d.notFor}`)
  return `You choose the best visual design direction for a new MOBILE app.
Read the app idea and pick the ONE direction whose category and feel fit best. Judge the real product and its users, not stray words. A direction's "not for" list is a hard exclusion. Staff and field tools (drivers, attendance, shop billing for owners) need the high-contrast field tool or ledger look, not a consumer look. If nothing fits well, choose ${MOBILE_DIRECTIONS.filter(d => d.generalist).map(d => d.id).join(', ')}.
Reply with ONLY compact JSON: {"id":"<direction id>"}

Directions:
${lines.join('\n')}`
}

export function parseMobileClassifierReply(text: string): string | null {
  const m = (text || '').match(/\{[^{}]*\}/)
  if (!m) return null
  try {
    const id = JSON.parse(m[0])?.id
    return typeof id === 'string' && getMobileDirectionById(id) ? id : null
  } catch { return null }
}

export async function pickMobileDirectionSmart(
  prompt: string,
  opts: { id?: string | null; apiKey?: string; timeoutMs?: number; votes?: number; rnd?: () => number } = {},
): Promise<{ direction: MobileDirection; source: 'explicit' | 'classifier' | 'keywords' }> {
  const explicit = getMobileDirectionById(opts.id)
  if (explicit) return { direction: explicit, source: 'explicit' }
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY
  if (apiKey && (prompt || '').trim()) {
    const call = async (): Promise<string | null> => {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 6000)
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: 'claude-haiku-5-5', max_tokens: 60, thinking: { type: 'disabled' }, output_config: { effort: 'low' },
            system: buildMobileClassifierSystem(), messages: [{ role: 'user', content: prompt.slice(0, 1500) }],
          }),
          signal: ctrl.signal,
        })
        if (!res.ok) return null
        const data = await res.json()
        return parseMobileClassifierReply((data?.content ?? []).filter((b: any) => b?.type === 'text').map((b: any) => b.text).join(''))
      } catch { return null } finally { clearTimeout(timer) }
    }
    const n = Math.max(1, Math.min(opts.votes ?? 3, 5))
    const { tallyVotes } = await import('./direction-classifier')
    const id = tallyVotes(await Promise.all(Array.from({ length: n }, call)))
    const picked = getMobileDirectionById(id)
    if (picked) return { direction: picked, source: 'classifier' }
  }
  return { direction: pickMobileDirection(prompt, opts.rnd), source: 'keywords' }
}
