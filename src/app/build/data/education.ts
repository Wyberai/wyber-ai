import type { BuildPage } from './types'

export const EDUCATION_PAGES: BuildPage[] = [
  {
    slug: 'quiz-maker-app',
    noun: 'quiz app',
    h1: 'Build a Quiz App with AI',
    metaTitle: 'Build a Quiz Maker App with AI — No Code',
    metaDesc: 'Create a quiz app with timed questions, instant scoring, and a results dashboard — for classrooms, training, or trivia nights. Built from plain English.',
    target: 'web',
    category: 'education',
    tagline: 'Write the questions, share a link, watch the scores come in — for a classroom, a compliance training, or Friday trivia.',
    body: [
      'Quiz tools split by audience and charge accordingly: classroom platforms bill per student, corporate training tools bill per seat, and trivia apps bill the host — for what is structurally the same product. Questions in, answers scored, results tallied.',
      'Building your own collapses all three into one app shaped to your use. Describe the quiz experience you want — question types, timing, whether wrong answers show explanations — and WyberAi generates it end to end: an editor where you write questions, a clean taking experience on any device, and a results view that shows you per-question breakdowns. A teacher sees which concept the class missed; a trivia host gets a live leaderboard; a trainer gets completion records.',
    ],
    features: [
      { title: 'Question editor', desc: 'Multiple choice, true/false, short answer — write and reorder questions with correct answers and optional explanations.' },
      { title: 'Timed or untimed play', desc: 'Per-question countdowns for trivia energy, or relaxed untimed mode for learning checks.' },
      { title: 'Instant scoring', desc: 'Results at submit, with per-question review and the explanations you wrote for the misses.' },
      { title: 'Results dashboard', desc: 'Every attempt logged — scores, completion, and which questions the group got wrong most.' },
    ],
    promptExample:
      'Build a quiz web app: an admin Editor page (login) where I create quizzes with multiple-choice and true/false questions, each with a correct answer and an explanation; a public quiz-taking page with one question at a time, a 30-second timer per question, and a final score screen with per-question review; and a Results dashboard showing all attempts with scores and a most-missed-questions chart.',
    faqs: [
      { q: 'Can students take it on their phones?', a: 'Yes — the taking experience is a mobile-first web page; you share a link and it works on any device with a browser.' },
      { q: 'Can I stop people from retaking a quiz?', a: 'Set attempt rules in your prompt — one attempt per email, or unlimited practice mode — and the app enforces them.' },
      { q: 'Can it show a live leaderboard for trivia night?', a: 'Yes — ask for a leaderboard screen that updates as answers come in, and project it while players answer on their phones.' },
      { q: 'How many quizzes can I create?', a: 'As many as you like — quizzes are rows in your own database, not per-quiz charges on a platform plan.' },
    ],
    related: ['flashcard-app', 'online-course-platform', 'team-task-manager'],
  },
  {
    slug: 'flashcard-app',
    noun: 'flashcard app',
    h1: 'Build a Flashcard App with AI',
    metaTitle: 'Build a Flashcard Study App with AI — Spaced Repetition',
    metaDesc: 'Your own spaced-repetition flashcard app — decks, review scheduling, and progress stats — generated from a plain-English description in minutes.',
    target: 'mobile',
    category: 'education',
    tagline: 'Decks, daily reviews, and spaced repetition that resurfaces a card right before you\'d forget it — in an app built around how you study.',
    body: [
      'Flashcard software inspires strong loyalty and stronger complaints: the powerful one has a learning curve steeper than most exams, and the friendly ones meter your decks and cards through a subscription. Underneath both is an algorithm — spaced repetition — that is well understood and eminently generatable.',
      'Describe what you\'re studying and how you want reviews to feel, and WyberAi builds your version: decks for your subjects, a swipe-through review session that schedules each card by how well you knew it, and stats that show your retention actually climbing as an exam approaches. Medical mnemonics with images, language cards with audio, formula cards with rendered math — the card template is yours to define.',
    ],
    features: [
      { title: 'Decks and sub-decks', desc: 'Organize by subject, chapter, or exam — study one deck or everything due today across all of them.' },
      { title: 'Spaced-repetition scheduling', desc: 'Rate each card Again/Hard/Good/Easy and the next review lands at the interval that maximizes retention.' },
      { title: 'Your card format', desc: 'Front/back text, images, hints, example sentences — the card template matches your material.' },
      { title: 'Retention stats', desc: 'Cards due, daily streak, and per-deck accuracy — the picture of whether the studying is working.' },
    ],
    promptExample:
      'Build a flashcard mobile app with spaced repetition: a Decks screen where I create decks and add cards with front, back, and an optional hint; a Review screen showing due cards one at a time — tap to flip, then rate Again, Hard, Good, or Easy, with intervals growing per rating; and a Stats screen with cards due today, current streak, and accuracy per deck. Fast and minimal, optimized for one-handed review.',
    faqs: [
      { q: 'How does the spaced repetition actually work?', a: 'Each rating adjusts the card\'s next interval — misses come back within minutes, easy cards stretch to days then weeks. The scheduling runs on your review history in your own database.' },
      { q: 'Can I import my existing Anki or CSV decks?', a: 'Ask for a CSV import in your prompt — export your decks to CSV, map the columns once, and your cards carry their content in.' },
      { q: 'Can two languages share one card?', a: 'Yes — language decks work naturally as front/back pairs, and you can add fields like pronunciation, audio, or an example sentence per card.' },
      { q: 'Will it work during my commute?', a: 'It generates as a React Native + Expo app — ask for offline review in your prompt and sessions sync back when you\'re online.' },
    ],
    related: ['quiz-maker-app', 'habit-tracker-app', 'online-course-platform'],
  },
  {
    slug: 'online-course-platform',
    noun: 'course platform',
    h1: 'Build an Online Course Platform with AI',
    metaTitle: 'Build Your Own Course Platform with AI — No Code',
    metaDesc: 'Host your course on your own platform: modules, lessons, student progress, and completion tracking — generated from plain English, no revenue share.',
    target: 'web',
    category: 'education',
    tagline: 'Your course on your own domain — modules, progress tracking, your brand — with no marketplace discounting your work to $9.99.',
    body: [
      'Course creators get squeezed from both directions: marketplaces set the price floor and own the student relationship, while hosted course platforms take monthly rent that scales with the features you were promised would grow your business. Either way, the platform is the brand and you\'re the content.',
      'A course platform is modules, lessons, and a record of who finished what — well within a description\'s reach. Tell WyberAi how your course is structured and what students should experience, and it generates your school: a landing page that sells the course, gated lesson content with video embeds, progress that picks up where the student left off, and a teacher\'s view of who\'s advancing and who\'s stalled. Your domain, your pricing, your student emails.',
    ],
    features: [
      { title: 'Modules and lessons', desc: 'Your curriculum as structured content — video embeds, rich text, downloads, ordered exactly as you teach it.' },
      { title: 'Student progress tracking', desc: 'Lessons check off as completed; students resume where they stopped, and momentum stays visible.' },
      { title: 'Gated enrollment', desc: 'Content behind student accounts — enroll manually, by invite, or wire up payments when you\'re ready to sell.' },
      { title: 'Teacher dashboard', desc: 'Enrollment counts, per-student progress, and completion rates per module — where students stall is where the course needs work.' },
    ],
    promptExample:
      'Build an online course platform web app: a public landing page describing my course with curriculum outline and an enroll button; a student area (login required) with modules containing lessons (video embed, rich text notes, downloadable resources), completion checkboxes, and a progress bar; and a teacher Dashboard showing enrolled students, their progress percentages, and completion rate per module.',
    faqs: [
      { q: 'Where do the videos live?', a: 'Embed from YouTube (unlisted), Vimeo, or any host — the lesson player embeds your links, so you keep your existing video workflow.' },
      { q: 'Can I charge for enrollment?', a: 'Launch free or invite-only, then add a payment step in chat when you\'re ready — the course structure underneath doesn\'t change.' },
      { q: 'Can I run more than one course?', a: 'Yes — the structure extends to multiple courses under one school, each with its own landing page and enrollment.' },
      { q: 'What about certificates?', a: 'Ask for a completion certificate page in your prompt or later — students who finish get a shareable, dated certificate with your branding.' },
    ],
    related: ['quiz-maker-app', 'flashcard-app', 'restaurant-menu-app'],
  },
]
