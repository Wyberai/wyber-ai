import type { BuildPage } from './types'

export const PRODUCTIVITY_PAGES: BuildPage[] = [
  {
    slug: 'habit-tracker-app',
    noun: 'habit tracker',
    h1: 'Build a Habit Tracker App with AI',
    metaTitle: 'Build a Habit Tracker App with AI — No Code',
    metaDesc: 'Describe your habit tracker in plain English and get a working mobile app with streaks, daily check-ins, and progress charts. Free to start, no code needed.',
    target: 'mobile',
    category: 'productivity',
    tagline: 'Streaks, daily check-ins, and a progress view that makes you want to keep the chain going — built from one prompt.',
    body: [
      'Habit apps live or die on friction: if logging a habit takes more than two taps, you stop opening the app by week two. The generic trackers on the app stores solve this with subscriptions and feature bloat. Building your own means the app tracks exactly your habits, your way — a morning-routine checklist, a gym streak, a "no sugar" counter — with nothing else in the way.',
      'Describe the habits you want to track and how you want to see progress, and WyberAi generates a React Native app around that: a today screen for one-tap check-ins, streak logic that survives timezone changes, and a history view that shows the chain. Preview it on your own phone over Expo, then keep tweaking in plain English — "make missed days break the streak only after two misses."',
    ],
    features: [
      { title: 'One-tap daily check-ins', desc: 'A today screen listing each habit with a single toggle — the whole log-your-day flow takes seconds.' },
      { title: 'Streak engine', desc: 'Current streak, best streak, and completion percentage per habit, computed from your check-in history.' },
      { title: 'Progress heatmap', desc: 'A calendar heatmap per habit so the chain is visible — the psychology that makes trackers work.' },
      { title: 'Your habits, your rules', desc: 'Weekday-only habits, quantity goals ("8 glasses of water"), or simple yes/no — described in English, wired into the schema.' },
    ],
    promptExample:
      'Build a habit tracker mobile app with a Today screen listing my habits as one-tap toggles, a Stats screen with current streak, best streak and a monthly calendar heatmap per habit, and an Add Habit screen where I can set a name, icon, and schedule (daily or specific weekdays). Keep the design minimal and dark.',
    faqs: [
      { q: 'Can the streak logic handle skipped days or rest days?', a: 'Yes — describe the rule you want ("weekends don\'t break streaks" or "one skip per week is allowed") and the generated logic follows it. You can change the rule later in chat.' },
      { q: 'Does it work on both iPhone and Android?', a: 'The app is generated as React Native + Expo, which runs on both platforms from one codebase. You preview it instantly on your own phone via Expo.' },
      { q: 'Can I add reminders later?', a: 'You can add a reminders screen and schedule structure now, and wire push notifications when you export or publish — the schema is ready for it.' },
      { q: 'What does it cost to build?', a: 'Your first build is covered by the 50 free monthly credits — a full app build costs 30 credits, and small edits cost 2. No card required to start.' },
    ],
    related: ['workout-tracker-app', 'freelance-time-tracker', 'meditation-app'],
  },
  {
    slug: 'freelance-time-tracker',
    noun: 'time tracker',
    h1: 'Build a Time Tracking App for Freelancers with AI',
    metaTitle: 'Build a Freelance Time Tracker with AI — No Code',
    metaDesc: 'Generate a time tracking web app with client projects, billable hours, and invoice-ready summaries — described in plain English, built in minutes.',
    target: 'web',
    category: 'productivity',
    tagline: 'Track hours by client and project, mark what\'s billable, and export invoice-ready totals — without paying a subscription for someone else\'s workflow.',
    body: [
      'Every freelancer eventually hits the same wall: the time trackers built for teams cost per-seat money for features you\'ll never use, and the free tiers cap the one thing you need — history. Meanwhile your actual requirement is simple: which client, which project, how long, is it billable, and a clean total at invoice time.',
      'That one-paragraph spec is enough for WyberAi to build the whole tool: a timer page, a client and project structure in a real Postgres database, and a monthly summary grouped the way your invoices are. Because you own the app, the workflow bends to you — add an hourly-rate field per client, a weekly email summary, or a "mark as invoiced" flag whenever you need it.',
    ],
    features: [
      { title: 'Live timer + manual entries', desc: 'Start a timer or backfill hours after the fact — both land in the same log with client and project attached.' },
      { title: 'Clients → projects → entries', desc: 'A proper relational structure, so totals roll up cleanly by project or by client at any date range.' },
      { title: 'Billable vs. internal split', desc: 'Flag entries as billable; summaries show billable totals separately so invoicing takes one glance.' },
      { title: 'Invoice-ready monthly view', desc: 'Hours grouped by client for any month, with your hourly rate applied — the number that goes on the invoice.' },
    ],
    promptExample:
      'Build a time tracking web app for a freelancer: a Timer page with a start/stop timer that saves entries with client, project and notes; a Clients page to manage clients each with an hourly rate and their projects; and a Reports page showing hours and earnings grouped by client for a selected month, with billable and non-billable separated.',
    faqs: [
      { q: 'Can it calculate what I should invoice?', a: 'Yes — give each client an hourly rate and the reports page multiplies billable hours by rate for any date range you pick.' },
      { q: 'Where is my time data stored?', a: 'In your app\'s own Postgres database (Supabase), with row-level security scanned live before you publish — your hours are yours, on your infrastructure.' },
      { q: 'Can I import history from Toggl or a spreadsheet?', a: 'Add a CSV import page by asking for it in chat — describe your export\'s columns and the app maps them into your entries table.' },
      { q: 'Is this really cheaper than a time-tracker subscription?', a: 'You build it once with free monthly credits and it runs as your own app — there\'s no per-month tracker fee, and edits cost 2 credits when you want changes.' },
    ],
    related: ['expense-tracker-app', 'client-crm', 'habit-tracker-app'],
  },
  {
    slug: 'team-task-manager',
    noun: 'task manager',
    h1: 'Build a Team Task Manager with AI',
    metaTitle: 'Build a Team Task Management App with AI',
    metaDesc: 'Create a kanban-style task manager for your team — boards, assignees, due dates, and comments — generated from a plain-English description. Free to start.',
    target: 'web',
    category: 'productivity',
    tagline: 'A kanban board that matches how your team actually works — your columns, your labels, your rules — instead of renting someone else\'s.',
    body: [
      'Small teams are stuck between two bad options: heavyweight project tools priced per seat that the team half-uses, and shared spreadsheets that fall apart the moment two people edit at once. What most five-person teams need fits on a single board — if the board speaks their language.',
      'Tell WyberAi how your team works — the stages work moves through, who needs to see what, what a "done" task requires — and it generates a task manager with that exact shape: a kanban board backed by a real database, per-member assignment, and an activity trail. It ships with authentication and a security scan, so inviting the team is safe from day one.',
    ],
    features: [
      { title: 'Kanban with your columns', desc: 'Backlog → In Progress → Review → Done, or whatever your flow is — the board is generated from your description of it.' },
      { title: 'Assignees and due dates', desc: 'Every task carries an owner and a deadline; a My Tasks view filters the board to what each person owes.' },
      { title: 'Comments on tasks', desc: 'Discussion lives on the task itself, so context stops getting lost in chat threads.' },
      { title: 'Team auth built in', desc: 'Sign-in and membership come wired, with row-level security probed by a live scan before you share the link.' },
    ],
    promptExample:
      'Build a team task manager web app: a kanban Board page with columns Backlog, This Week, In Progress, and Done, where tasks have a title, description, assignee, due date, and priority; a My Tasks page showing the signed-in user\'s tasks sorted by due date; and task detail with threaded comments. Include team member management.',
    faqs: [
      { q: 'Can each teammate have their own login?', a: 'Yes — the app generates with authentication included, and a members table controls who can see and edit the board.' },
      { q: 'Can I change the workflow after the team starts using it?', a: 'Yes. Ask in chat — "add a Blocked column" or "require a checklist before Done" — and the board updates without losing existing tasks.' },
      { q: 'How is this different from using Trello?', a: 'It\'s your own app: no per-seat pricing, no feature gates, and the workflow is shaped to your team instead of approximated with labels and power-ups.' },
      { q: 'Is the team\'s data secure?', a: 'Every WyberAi app gets a live database security scan that probes your app the way an attacker would — before publish, with critical leaks blocking the gate.' },
    ],
    related: ['client-crm', 'freelance-time-tracker', 'event-registration-app'],
  },
]
