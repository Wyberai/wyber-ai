import type { BuildPage } from './types'

export const HEALTH_PAGES: BuildPage[] = [
  {
    slug: 'workout-tracker-app',
    noun: 'workout tracker',
    h1: 'Build a Workout Tracker App with AI',
    metaTitle: 'Build a Workout Tracker App with AI — No Code',
    metaDesc: 'A gym log that matches your program: exercises, sets, progressive overload charts. Describe it in English, get a working mobile app in minutes.',
    target: 'mobile',
    category: 'health',
    tagline: 'Log sets between sets. See the overload curve. Built around your program — push/pull/legs, 5×5, or your coach\'s spreadsheet.',
    body: [
      'A workout log has one job: capture the set you just did before the rest timer ends, and prove next week that the bar is moving up. Store-bought fitness apps wrap that in social feeds, coaching upsells, and subscriptions — while your actual program probably lives in a spreadsheet a coach gave you.',
      'WyberAi turns that spreadsheet into an app. Describe your split and what you record per set, and it generates the mobile app: a today-workout screen with your programmed exercises, fast set logging with previous-session numbers beside each input, and per-exercise charts that show whether squat volume is actually climbing. It\'s your program as software, not someone else\'s app with your program squeezed in.',
    ],
    features: [
      { title: 'Your split, programmed in', desc: 'Push/pull/legs, upper/lower, 5×5 — workout days generated from your routine, each with its exercise list.' },
      { title: 'Rest-timer-speed logging', desc: 'Weight and reps per set with last session\'s numbers shown inline — log a set in the time it takes to rack the bar.' },
      { title: 'Progressive overload charts', desc: 'Per-exercise graphs of top set and total volume over time — the proof the program is working.' },
      { title: 'PR tracking', desc: 'Personal records detected from your logs and celebrated on a records screen, per lift.' },
    ],
    promptExample:
      'Build a workout tracker mobile app for a push/pull/legs program: a Today screen showing the scheduled day\'s exercises where I log weight and reps per set with last session\'s numbers displayed next to each input; a Progress screen with a per-exercise chart of heaviest set over time; and a Records screen listing my PR for each lift. Dark theme, big touch targets.',
    faqs: [
      { q: 'Can it follow my coach\'s program?', a: 'Yes — describe the days, exercises, and set/rep scheme (or paste the plan into chat) and the app is generated around that exact program.' },
      { q: 'Can I change my program mid-cycle?', a: 'Ask in chat — "swap bench for incline dumbbell press on push day" — and the program updates while your history stays intact.' },
      { q: 'Does it work offline at the gym?', a: 'The generated app is a standard React Native + Expo project; ask for offline-first logging in your prompt and entries sync when you\'re back online.' },
      { q: 'How fast can I have it on my phone?', a: 'Builds take minutes, and you preview on your own phone via Expo immediately — most people log their next session in their own app.' },
    ],
    related: ['habit-tracker-app', 'meal-planner-app', 'meditation-app'],
  },
  {
    slug: 'meal-planner-app',
    noun: 'meal planner',
    h1: 'Build a Meal Planner App with AI',
    metaTitle: 'Build a Meal Planning App with AI — No Code',
    metaDesc: 'Weekly meal plans, a recipe box, and an auto-built grocery list — a meal planner generated from your description, shaped to how your household eats.',
    target: 'web',
    category: 'health',
    tagline: 'Plan the week on Sunday, shop from an auto-built list, stop asking "what\'s for dinner" at 6pm.',
    body: [
      'Meal planning fails at the seams: the recipes live in screenshots, the plan lives in your head, and the grocery list gets rewritten from scratch every week. Planner apps exist, but they push their recipe catalogs and their idea of a week — when the recipes that matter are the twelve your household actually eats.',
      'Describe how you plan — how many meals a day, who\'s vegetarian, what a shopping trip looks like — and WyberAi generates the planner around your kitchen: a recipe box you fill once, a drag-together weekly grid, and a grocery list that compiles itself from the week\'s ingredients, grouped by aisle. Prep-day cooking, macro targets, or a picky-kid column — it\'s your app, so the plan bends to the household.',
    ],
    features: [
      { title: 'Your recipe box', desc: 'Your dishes with ingredients, servings, and tags — the dozen meals you rotate, not a database of 40,000 you don\'t.' },
      { title: 'Weekly planning grid', desc: 'Assign recipes to days and meals for the week ahead; repeat last week in one tap when it was a good week.' },
      { title: 'Auto-compiled grocery list', desc: 'Ingredients from the planned week merged into one list — quantities summed, grouped by aisle, checkable in the shop.' },
      { title: 'Household preferences', desc: 'Dietary tags and per-person rules (vegetarian Mondays, no mushrooms for the kids) respected in the plan view.' },
    ],
    promptExample:
      'Build a meal planner web app: a Recipes page where I add dishes with ingredients (name, quantity, unit), servings, and tags like vegetarian or quick; a Planner page with a Monday-to-Sunday grid for lunch and dinner where I assign recipes; and a Grocery List page that compiles all ingredients from the planned week, sums quantities, groups them by category, and lets me check items off while shopping.',
    faqs: [
      { q: 'Can it scale recipes for different serving counts?', a: 'Yes — set servings per planned meal and ingredient quantities scale before they land on the grocery list.' },
      { q: 'Can my partner and I share the same planner?', a: 'Yes — it\'s a web app with logins, so the whole household sees one plan and one list, updated live.' },
      { q: 'Can it track calories or macros?', a: 'Add per-ingredient or per-recipe macro fields in your prompt (or later in chat) and the planner can show daily totals against targets.' },
      { q: 'Do I need to code anything?', a: 'No — you describe the planner, WyberAi generates the working app, and further changes are plain-English requests in chat.' },
    ],
    related: ['workout-tracker-app', 'budget-planner-app', 'habit-tracker-app'],
  },
  {
    slug: 'meditation-app',
    noun: 'meditation app',
    h1: 'Build a Meditation App with AI',
    metaTitle: 'Build a Meditation & Mindfulness App with AI',
    metaDesc: 'A personal mindfulness app — session timer, breathing guides, and a calm streak — generated from plain English. Yours, with no subscription attached.',
    target: 'mobile',
    category: 'health',
    tagline: 'A timer, a breathing guide, and a quiet record of your practice — without a $70/year subscription between you and ten minutes of silence.',
    body: [
      'The strange economics of mindfulness apps: you pay a yearly subscription mostly for a timer, some bells, and a streak counter — then the app interrupts your calm to upsell sleep stories. A personal meditation app inverts that: exactly the practice you do, nothing on the screen you didn\'t put there.',
      'Tell WyberAi how you practice — timed silent sits, box breathing, a morning body scan — and it generates a React Native app around it: a session timer with gentle start and end chimes, an animated breathing pacer set to your count, and a history that shows your practice building without gamifying it. It\'s the rare app category where less is the feature, and owning it is how you get less.',
    ],
    features: [
      { title: 'Session timer with chimes', desc: 'Pick a duration, get start/end bells and optional interval markers — the screen stays dark in between.' },
      { title: 'Breathing pacer', desc: 'An animated guide for box breathing or 4-7-8 — the circle expands and contracts to your chosen counts.' },
      { title: 'Practice history', desc: 'Sessions logged with duration and type; a calm calendar view of your consistency, no badges shouting at you.' },
      { title: 'Your practices, listed', desc: 'Silent sit, body scan, walking meditation — your own practice menu, each with its own default timer.' },
    ],
    promptExample:
      'Build a meditation mobile app: a Home screen listing my practices (Silent Sit, Box Breathing, Body Scan) each with a default duration; a Session screen with a minimal countdown timer, start and end chime, and screen kept dark during the sit; a Breathing screen with an animated circle pacing 4-4-4-4 box breathing; and a History screen with a monthly calendar of completed sessions. Very minimal, dark, no gamification.',
    faqs: [
      { q: 'Can it play ambient sounds or guided audio?', a: 'Yes — ask for an audio option in your prompt and add your own tracks; the app plays them under the timer.' },
      { q: 'Can I adjust the breathing rhythm?', a: 'The pacer counts are settings — change 4-4-4-4 to any pattern in the app, or ask chat to add presets like 4-7-8.' },
      { q: 'Why build this instead of subscribing to Calm?', a: 'If your practice needs a library of celebrity sleep stories, subscribe. If it needs a timer, a pacer, and a record — that\'s an afternoon build you own forever.' },
      { q: 'Does it need an account?', a: 'Your call — build it as a purely personal single-user app, or add login later if you want your history synced across devices.' },
    ],
    related: ['habit-tracker-app', 'workout-tracker-app', 'meal-planner-app'],
  },
]
