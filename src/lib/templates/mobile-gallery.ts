export interface MobileTemplate {
  id: string
  title: string
  description: string
  category: string
  prompt: string
  framework: 'expo'
  icon: string
}

export const MOBILE_CATEGORIES = [
  'All', 'Productivity', 'Health & Fitness', 'Social', 'Finance',
  'E-commerce', 'Food & Delivery', 'Travel', 'Education', 'Utility',
]

export const MOBILE_GALLERY: MobileTemplate[] = [
  {
    id: 'mobile-habit-tracker',
    title: 'Habit Tracker',
    category: 'Health & Fitness',
    framework: 'expo',
    icon: '🎯',
    description: 'Daily habit streaks with progress rings, check-off lists, and weekly stats.',
    prompt: 'Build a mobile habit tracker app. Show a list of daily habits the user has created. Each habit has a check button — tapping marks it done for today with a satisfying animation. Show a streak counter and a weekly progress bar per habit. Include a + button to add new habits with a name and optional emoji. Use a clean dark theme with sky-blue accent color.',
  },
  {
    id: 'mobile-expense-splitter',
    title: 'Expense Splitter',
    category: 'Finance',
    framework: 'expo',
    icon: '💸',
    description: 'Split bills with friends, track who owes what, and settle up easily.',
    prompt: 'Build a mobile expense splitter app. Users can create a "group" (e.g. Trip to Bali) and add people. For each expense, enter the amount, payer, and split equally among selected members. Show a summary of who owes who and a "Settle up" button that marks debts paid. Use a clean white/light UI with clear typography.',
  },
  {
    id: 'mobile-workout-logger',
    title: 'Workout Logger',
    category: 'Health & Fitness',
    framework: 'expo',
    icon: '🏋️',
    description: 'Log sets, reps, and weights for each exercise with a history view.',
    prompt: 'Build a mobile workout logger app. The home screen shows today\'s workout session. User can add exercises (name + sets). Each set records reps and weight. A timer counts elapsed workout time. After finishing, save the session. A History tab shows past workouts grouped by date. Use a dark, gym-inspired theme with green accents.',
  },
  {
    id: 'mobile-recipe-book',
    title: 'Recipe Book',
    category: 'Food & Delivery',
    framework: 'expo',
    icon: '🍳',
    description: 'Save and browse personal recipes with ingredients, steps, and photos.',
    prompt: 'Build a mobile recipe book app. Home screen shows a card grid of saved recipes with a photo, title, and cook time. Tapping a recipe shows full details: ingredient list with checkboxes and numbered steps. A + button lets users add a new recipe with title, cook time, ingredients, and steps. Include a search bar. Use warm colors with card-based layout.',
  },
  {
    id: 'mobile-pomodoro-timer',
    title: 'Focus Timer',
    category: 'Productivity',
    framework: 'expo',
    icon: '⏱️',
    description: 'Pomodoro-style focus sessions with break reminders and session tracking.',
    prompt: 'Build a mobile Pomodoro focus timer app. Large circular countdown timer in the center. Default 25 min focus, 5 min short break, 15 min long break after 4 sessions. Start/pause/reset buttons. Shows current session type (Focus / Short Break / Long Break) and session count. Plays a soft ding on completion. Log of today\'s completed sessions. Calm, minimal design with a soft gradient background.',
  },
  {
    id: 'mobile-travel-planner',
    title: 'Trip Planner',
    category: 'Travel',
    framework: 'expo',
    icon: '✈️',
    description: 'Plan itineraries day-by-day with places, times, and notes per trip.',
    prompt: 'Build a mobile trip planner app. Users create trips with a destination and date range. Inside each trip, a day-by-day itinerary view (Day 1, Day 2, etc.) lets them add stops: place name, time, and notes. A packing checklist tab with common categories. A trip overview screen shows destination, days count, and progress. Use a vibrant travel-inspired color palette with map pin icons.',
  },
  {
    id: 'mobile-budget-tracker',
    title: 'Budget Tracker',
    category: 'Finance',
    framework: 'expo',
    icon: '💰',
    description: 'Monthly budget with category spending rings and transaction log.',
    prompt: 'Build a mobile budget tracker app. Top section shows a monthly budget circle showing spent vs remaining. Below, category bars (Food, Transport, Entertainment, etc.) show budget vs actual spend. A Transactions tab shows a chronological log with amount, category, and note. A + FAB button to log a new expense. Use green/red color coding for under/over budget. Clean, financial-app aesthetic.',
  },
  {
    id: 'mobile-journal',
    title: 'Daily Journal',
    category: 'Productivity',
    framework: 'expo',
    icon: '📓',
    description: 'Private daily journal with mood tracking, rich text, and calendar view.',
    prompt: 'Build a mobile daily journal app. A calendar strip at the top lets users navigate dates. Each day has a journal entry (rich text) and a mood selector (5 emoji options). Past entries are shown in a timeline. A streak counter rewards consistent journaling. The design should feel personal and calming — soft gradients, rounded cards, warm typography.',
  },
  {
    id: 'mobile-language-flashcards',
    title: 'Language Flashcards',
    category: 'Education',
    framework: 'expo',
    icon: '🌍',
    description: 'Flashcard decks for language learning with spaced-repetition review.',
    prompt: 'Build a mobile language flashcard app. Users create decks (e.g. Spanish — Food). Each card has a front (English word) and back (translation + example sentence). Study mode: show card front, tap to flip, then mark Easy / Hard / Again. Track a "due today" count with spaced repetition logic. A deck list screen shows progress per deck. Clean, friendly UI with smooth flip animations.',
  },
  {
    id: 'mobile-water-reminder',
    title: 'Water Tracker',
    category: 'Health & Fitness',
    framework: 'expo',
    icon: '💧',
    description: 'Track daily water intake with a visual fill animation and reminder nudges.',
    prompt: 'Build a mobile water intake tracker app. A large animated water glass or bottle fills as the user logs drinks. Daily goal is 8 glasses (customizable). Quick-add buttons for 250ml, 500ml, custom. A circular progress showing oz drank vs goal. History chart for the past 7 days. Option to set hourly reminder push notifications. Calm blue color scheme with wave animations.',
  },
  {
    id: 'mobile-qr-scanner',
    title: 'QR & Barcode Scanner',
    category: 'Utility',
    framework: 'expo',
    icon: '📷',
    description: 'Scan QR codes and barcodes with instant result display and history.',
    prompt: 'Build a mobile QR code and barcode scanner app. Main screen opens camera with a scan-frame overlay. On scan, display the decoded content (URL, text, product barcode). For URLs, show an "Open in Browser" button. For barcodes, show a "Search Product" button. Save scan history with timestamp, type, and content. A Flashlight toggle. Clean, utilitarian UI with dark camera view and bright result cards.',
  },
  {
    id: 'mobile-meditation-timer',
    title: 'Meditation Timer',
    category: 'Health & Fitness',
    framework: 'expo',
    icon: '🧘',
    description: 'Guided meditation timer with ambient sounds, breathing guide, and session log.',
    prompt: 'Build a mobile meditation timer app. Home screen has a serene landscape background with a large timer. Users pick duration (5, 10, 15, 20, 30 min). An animated breathing circle expands/contracts with inhale/exhale cues. Ambient sound options (Rain, Forest, Ocean, Silence). On finish, a gentle bell sound plays and the session is logged. Stats page shows total hours meditated and streak. Use calming purple/indigo gradients.',
  },
  {
    id: 'mobile-grocery-list',
    title: 'Smart Grocery List',
    category: 'Utility',
    framework: 'expo',
    icon: '🛒',
    description: 'Grocery list organized by store section, with recurring items and sharing.',
    prompt: 'Build a mobile grocery list app. Items are organized into store sections (Produce, Dairy, Meat, Bakery, etc.). Tapping an item crosses it out with a strikethrough. Swipe to delete. A + button to add items with name, quantity, and auto-detected section. A Favorites list for recurring items that can be quickly added back. Share list via link. Clean white UI with colorful category badges.',
  },
  {
    id: 'mobile-event-countdown',
    title: 'Event Countdown',
    category: 'Productivity',
    framework: 'expo',
    icon: '🎉',
    description: 'Countdown timers for your upcoming events with beautiful animated displays.',
    prompt: 'Build a mobile event countdown app. Home screen shows cards for upcoming events, each displaying days/hours/minutes/seconds counting down live. Each event has a custom emoji, title, date, and optional background color. A widget-style card design. Add new events with a date picker. Completed events move to a "Memories" section. Use vibrant gradient cards and smooth number-flip animations.',
  },
  {
    id: 'mobile-task-board',
    title: 'Kanban Task Board',
    category: 'Productivity',
    framework: 'expo',
    icon: '📋',
    description: 'Mobile kanban board with Todo, In Progress, and Done columns.',
    prompt: 'Build a mobile kanban task board app. Three horizontal columns: To Do, In Progress, Done — displayed as swipeable horizontal scroll. Each task card shows title, priority badge, and optional due date. Drag a card to move it between columns. Tap to expand and add notes. A + button per column to add tasks. Color-coded priority (red=high, yellow=medium, gray=low). Dark theme with subtle card shadows.',
  },
]
