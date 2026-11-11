export type AudienceId = 'software' | 'business' | 'student'

export const AUDIENCES: { id: AudienceId; label: string; name: string; color: string; start: string; end: string }[] = [
  { id: 'software', label: 'I run a software company', name: 'Software companies', color: '#0ea5e9', start: 'Month-end. Hours in five sheets.', end: 'Delivered. Real code, security-scanned.' },
  { id: 'business', label: 'I run a business', name: 'Business owners', color: '#a855f7', start: 'Return week. GSTR-2B and a long Excel.', end: 'Running. Nobody chases a spreadsheet.' },
  { id: 'student', label: "I'm a student", name: 'Students', color: '#e6edf6', start: 'Placement season starts Monday.', end: 'In your portfolio. Ready for a first client.' },
]

export type UseCase = {
  tag: string
  title: string
  scene: string
  gets: string[]
  say: string
  slug: string
  files: string
  tables: string
}

export const USE_CASES: Record<AudienceId, UseCase[]> = {
  software: [
    {
      tag: 'WEB APP',
      title: 'Timesheet to invoice',
      scene: 'Month-end. Hours are scattered across five sheets, and the US client wants the invoice by the 1st.',
      gets: ['Hours per developer, per client', 'Invoice in USD with the rupee value', 'Paid and unpaid at a glance'],
      say: 'Build a timesheet app where developers log hours per client project. Create a monthly invoice in USD with the rupee value, and show paid or unpaid status.',
      slug: 'timesheet-invoices', files: '16 files', tables: '5 tables',
    },
    {
      tag: 'WEB APP',
      title: 'Change-request log',
      scene: 'The client asks for a "small change" on WhatsApp. Then another. None of it was ever priced.',
      gets: ['Every request logged', 'Hours and price estimated', 'Client approval before you start'],
      say: 'Build a change-request tracker. I log each client request with estimated hours and price, the client approves it, and I mark it as billed.',
      slug: 'change-requests', files: '13 files', tables: '4 tables',
    },
    {
      tag: 'PROTOTYPE',
      title: 'Pitch prototype, on the call',
      scene: 'A pharma stockist explains how retailers send orders on WhatsApp. You send a link to a working version before the call ends.',
      gets: ['A clickable prototype', 'Real code you keep', 'A strong first impression'],
      say: 'Build a prototype for a pharma stockist to take retailer orders and track medicine expiry dates, with a login and an order status screen.',
      slug: 'stockist-orders', files: '15 files', tables: '5 tables',
    },
  ],
  business: [
    {
      tag: 'WEB APP',
      title: 'Job-work challan tracker',
      scene: 'You send goods to job workers every day, and nobody can say what has come back and what is still out.',
      gets: ['A record for every challan', 'What is pending at each job worker', 'A warning before the one-year return limit'],
      say: 'Build a job-work tracker. I log a challan for goods sent to a job worker, record what comes back, and get a warning before the one-year return limit.',
      slug: 'job-work-tracker', files: '14 files', tables: '4 tables',
    },
    {
      tag: 'WEB APP',
      title: 'GSTR-2B reconciliation',
      scene: 'Return week. Your accountant matches the purchase register to GSTR-2B line by line, and three supplier invoices are missing.',
      gets: ['Upload both files', 'Matched by supplier GSTIN and invoice number', 'A list of suppliers to chase'],
      say: 'Build a tool where I upload my purchase register and my GSTR-2B file. Match them by supplier GSTIN and invoice number, then show the mismatches and a list of suppliers to chase.',
      slug: 'gstr2b-match', files: '14 files', tables: '4 tables',
    },
    {
      tag: 'MOBILE APP',
      title: 'Delivery proof on a phone',
      scene: 'The truck delivers, the driver gets a signed LR copy, and the office sees it days later as a photo on WhatsApp.',
      gets: ['The driver photographs the LR on delivery', 'The office sees delivered or pending live', 'Payment follow-up starts the same day'],
      say: 'Build a mobile app for my drivers. They pick a delivery, photograph the signed LR copy, and the office sees delivered or pending in one list.',
      slug: 'delivery-proof', files: '13 files', tables: '3 tables',
    },
  ],
  student: [
    {
      tag: 'WEBSITE',
      title: 'Wedding website with RSVP',
      scene: 'Every family wedding sends its invitation as a card photo on WhatsApp, and the guest list lives in someone\'s notebook.',
      gets: ['A page for each event, with a venue map', 'An RSVP form', 'Guest list and headcount'],
      say: 'Build a wedding website with an invitation page for each event, a venue map link, an RSVP form and a guest list with headcount.',
      slug: 'wedding-rsvp', files: '11 files', tables: '3 tables',
    },
    {
      tag: 'WEB APP',
      title: 'Tuition class manager',
      scene: 'A tuition teacher keeps fees in a diary and batch lists in WhatsApp groups. You could fix that in a weekend.',
      gets: ['Batches and attendance', 'Monthly fee dues', 'A parent contact list'],
      say: 'Build a tuition class manager with batches, attendance, monthly fee dues and a parent contact list.',
      slug: 'tuition-manager', files: '13 files', tables: '4 tables',
    },
    {
      tag: 'MOBILE',
      title: 'Placement season tracker',
      scene: 'Twelve companies, different dates, different rounds, and your only tracker is the notes app.',
      gets: ['Companies and rounds', 'Dates and results', 'Prep notes per company'],
      say: 'Build a mobile app to track campus placements: companies, rounds, dates, results and prep notes.',
      slug: 'placement-tracker', files: '12 files', tables: '4 tables',
    },
  ],
}

export const TYPES = [
  { tag: 'WEBSITE', title: 'Your business, online', p: 'A shop, clinic, studio or firm, live by tonight with a WhatsApp enquiry button.' },
  { tag: 'WEB APP', title: 'Tools for your team', p: 'Trackers, approvals, invoices and dashboards that replace sheets and chat threads.' },
  { tag: 'MOBILE APP', title: 'An app people install', p: 'Orders, attendance or delivery proof on a phone, for your team or your customers.' },
  { tag: 'SAAS', title: 'A product you sell', p: 'Logins, a database and a link customers can sign up on. Ready to put in front of buyers.' },
]

export const STEPS = [
  { n: 'START' },
  { n: 'SAY IT', d: 'Describe it in plain words. WyberAi plans the build before it writes a line.', m: 'Describe it. WyberAi plans first.' },
  { n: 'SEE IT', d: 'Fresh code, never a template. Web app, mobile app, website or SaaS.', m: 'Fresh code, never a template.' },
  { n: 'SHAPE IT', d: 'Change anything by chatting. It fixes its own mistakes.', m: 'Change it by chatting. It repairs itself.' },
  { n: 'LOCK IT', d: 'It probes its own database like an attacker the moment you publish.', m: 'It probes its own database on publish.', tag: 'BUILT IN' },
  { n: 'SHIP IT' },
]

export const WHY = [
  { n: '01', a: 'Fresh code, ', b: 'every time.', p: 'No drag-and-drop and no stale templates. WyberAi writes real React and Tailwind from scratch for every project.' },
  { n: '02', a: 'Self-healing ', b: 'builds.', p: 'A broken import or a cut-off file does not stop the build. WyberAi finds the failure and repairs it in the same run.' },
  { n: '03', a: 'It probes your database ', b: 'like an attacker.', p: 'A real Row-Level Security test against your live database, not a linter guessing at your schema. It runs right after every publish, and a critical leak is flagged the moment it is found.' },
  { n: '04', a: 'Your code. ', b: 'Zero lock-in.', p: 'Push to your own GitHub repo, connect your own domain, and fork it or hire developers later. Auth, database and API routes come wired up, and the database runs on WyberCloud, free for 2 years.' },
]

/* ---------- story: the clutter that becomes software ---------- */

export const STORY_COPY: Record<AudienceId, { head: string; sub: string; chat: string }> = {
  software: {
    head: 'Build any digital product. Ship it in minutes.',
    sub: 'Timesheets. Chat threads. A status sheet nobody trusts. Say what is broken. Get software.',
    chat: 'Show the rupee value next to every invoice.',
  },
  business: {
    head: 'Build any digital product. Ship it in minutes.',
    sub: 'Challans. Cheques. GST printouts. A ledger only one can read. Say what is broken. Get software.',
    chat: 'Make anything close to the one-year limit red.',
  },
  student: {
    head: 'Build any digital product. Ship it in minutes.',
    sub: 'A timetable. Sticky notes. Placement notices. Six reminder apps. Say what you need. Get software.',
    chat: 'Add a prep notes section for every company.',
  },
}

// Photoreal objects generated with Higgsfield (see scripts/expo-assets.mjs).
// x / y are percentages of the stage, r is rotation in degrees, s is a size multiplier, b is depth blur in px.
export type Pose = { x: number; y: number; r: number; s: number; b: number }
export const OBJECT_SLUGS: Record<AudienceId, string[]> = {
  software: ['timesheets', 'invoice-usd', 'client-chat', 'sticky-tasks', 'sprint-notebook', 'status-sheet', 'wall-calendar', 'email-printout'],
  business: ['challan-pad', 'cheques', 'gstr2b-printout', 'ledger-book', 'supplier-bills', 'sticky-parties', 'jobwork-notebook', 'lr-copies'],
  student: ['exam-timetable', 'placement-notice', 'sticky-exams', 'phone-notes', 'college-id', 'syllabus-checklist', 'tuition-diary', 'wedding-card'],
}

export const CHAOS_DESKTOP: Pose[] = [
  { x: 66, y: 20, r: 12, s: 1.25, b: 0 },
  { x: 87, y: 46, r: -9, s: 1.35, b: 0 },
  { x: 62, y: 74, r: 7, s: 1.1, b: 0 },
  { x: 9, y: 16, r: -14, s: 0.95, b: 2 },
  { x: 24, y: 84, r: 10, s: 1.15, b: 1.5 },
  { x: 92, y: 88, r: -6, s: 1.0, b: 3 },
  { x: 44, y: 9, r: 5, s: 0.85, b: 2.5 },
  { x: 5, y: 58, r: -8, s: 1.05, b: 3 },
]
export const CHAOS_MOBILE: Pose[] = [
  { x: 76, y: 14, r: 12, s: 1.15, b: 0 },
  { x: 18, y: 30, r: -9, s: 1.2, b: 0 },
  { x: 80, y: 62, r: 7, s: 1.1, b: 0 },
  { x: 20, y: 80, r: -14, s: 1.0, b: 1.5 },
  { x: 55, y: 90, r: 10, s: 0.95, b: 2 },
  { x: 92, y: 36, r: -6, s: 0.8, b: 3 },
  { x: 40, y: 8, r: 5, s: 0.8, b: 2.5 },
  { x: 8, y: 54, r: -8, s: 0.9, b: 3 },
]
export const GRID_DESKTOP: { x: number; y: number; s: number }[] = [27.5, 42.5, 57.5, 72.5].flatMap(x => [45, 68].map(y => ({ x, y, s: 0.68 })))
export const GRID_MOBILE: { x: number; y: number; s: number }[] = [16, 38.7, 61.3, 84].flatMap(x => [42, 62].map(y => ({ x, y, s: 0.6 })))

// Which generated object illustrates which use case.
export const CASE_IMAGE: Record<string, { audience: AudienceId; obj: string }> = {
  'timesheet-invoices': { audience: 'software', obj: 'timesheets' },
  'change-requests': { audience: 'software', obj: 'email-printout' },
  'stockist-orders': { audience: 'software', obj: 'client-chat' },
  'job-work-tracker': { audience: 'business', obj: 'challan-pad' },
  'gstr2b-match': { audience: 'business', obj: 'gstr2b-printout' },
  'delivery-proof': { audience: 'business', obj: 'lr-copies' },
  'wedding-rsvp': { audience: 'student', obj: 'wedding-card' },
  'tuition-manager': { audience: 'student', obj: 'tuition-diary' },
  'placement-tracker': { audience: 'student', obj: 'placement-notice' },
}
