import type { AppBlueprint, AppIntentId, OwnerFacts } from './types'

export const APP_BLUEPRINTS: Record<AppIntentId, AppBlueprint> = {
  register: {
    id: 'register', label: 'Register',
    skeleton: [
      { entity: 'Records', singular: 'Record', fields: ['name (text, the title)', 'phone (phone)', 'category (select)', 'notes (longtext)'] },
    ],
    features: { whatsapp: false, statusStrip: false, print: true },
    proof: 'CSV import previews first; a delete can be undone',
    guidance: 'A list of people or things the owner keeps track of (members, patients, tenants, stock). One or two entities. Add the fields this specific business actually records.',
  },
  tracker: {
    id: 'tracker', label: 'Tracker',
    skeleton: [
      { entity: 'Entries', singular: 'Entry', fields: ['what (text, the title)', 'date (date)', 'amount (number or money)', 'category (select)', 'note (longtext)'] },
    ],
    features: { whatsapp: false, statusStrip: false, print: true },
    proof: 'totals and counts match the rows shown',
    guidance: 'Things logged over time (expenses, workouts, habits, visits). The metrics sum or count the log. One or two entities.',
  },
  booking: {
    id: 'booking', label: 'Booking',
    skeleton: [
      { entity: 'Appointments', singular: 'Appointment', fields: ['client (text, the title)', 'phone (phone, the contact)', 'date (date, the due date)', 'time (text)', 'service (select)', 'status (select: Booked, Done, Cancelled; finished = Done, Cancelled)'] },
      { entity: 'Clients', singular: 'Client', fields: ['name (text, the title)', 'phone (phone)', 'notes (longtext)'] },
    ],
    features: { whatsapp: true, statusStrip: true, print: true },
    proof: 'an upcoming booking can be reminded by WhatsApp link; a past one is marked overdue',
    guidance: 'People booked into time slots (clinic, salon, classes). Appointments with a date, a status and a phone number, plus the people. The status strip shows Booked, Done and Cancelled.',
  },
  billing: {
    id: 'billing', label: 'Billing',
    skeleton: [
      { entity: 'Bills', singular: 'Bill', fields: ['customer (text, the title)', 'phone (phone, the contact)', 'date (date)', 'due (date, the due date)', 'status (select: Unpaid, Part paid, Paid; finished = Paid)', 'total (computed: sum of its lines)', 'amount owed (money, the amount)'] },
      { entity: 'Bill lines', singular: 'Line', fields: ['bill (ref to Bills)', 'item (text, the title)', 'quantity (number)', 'rate (money)', 'amount (money)'] },
    ],
    features: { whatsapp: true, statusStrip: true, print: true },
    proof: 'a bill total equals the sum of its lines; an unpaid bill past its due date can be reminded by WhatsApp link',
    guidance: 'Money owed to the owner (bills, invoices, udhaar). A bill has lines, a status and a due date. Metrics show unpaid and overdue amounts worked out from the rows.',
  },
  pipeline: {
    id: 'pipeline', label: 'Pipeline',
    skeleton: [
      { entity: 'Leads', singular: 'Lead', fields: ['name (text, the title)', 'phone (phone, the contact)', 'source (select)', 'stage (select: New, Contacted, Quoted, Won, Lost; finished = Won, Lost)', 'follow up (date, the due date)', 'value (money, the amount)', 'notes (longtext)'] },
    ],
    features: { whatsapp: true, statusStrip: true, print: false },
    proof: 'a lead moves stage with a button; follow-ups past their date are marked overdue',
    guidance: 'Work that moves through stages (leads, orders, jobs, applications). One main entity with a stage field and a follow-up date.',
  },
}

const RULES: { id: AppIntentId; w: [RegExp, number][] }[] = [
  { id: 'billing', w: [[/\b(bills?|billing|invoices?|udhaar|khata|payments? due|receivables?|quotations?|quotes?)\b/, 4], [/\b(gst|tax|owed|outstanding|collect)\b/, 2]] },
  { id: 'booking', w: [[/\b(appointments?|bookings?|schedul\w*|slots?|reservations?|classes|sessions?|check-?ins?)\b/, 4], [/\b(calendar|reminder|clinic|salon|physio|doctor)\b/, 2]] },
  { id: 'pipeline', w: [[/\b(leads?|pipeline|crm|enquir\w*|orders?|jobs?|applications?|follow-?ups?|deals?|stages?)\b/, 4], [/\b(prospects?|quote|won|lost)\b/, 2]] },
  { id: 'tracker', w: [[/\b(track\w*|log|logs|habits?|expenses?|workouts?|diary|journal|budget|streaks?|mileage|spend\w*)\b/, 4]] },
  { id: 'register', w: [[/\b(register|records?|members?|patients?|tenants?|students?|inventory|stock|directory|contacts?|customers?|database|list of)\b/, 3], [/\b(manage|keep track|maintain)\b/, 1]] },
]

export interface AppIntentBrief { intent: AppIntentId; confidence: number; industry: string; facts: OwnerFacts; note?: string; secondary?: AppIntentId; notBuilt?: string[] }

const INDUSTRY = /\b(gym|clinic|dental|physio\w*|salon|spa|school|tuition|coaching|pharmacy|kirana|shop|store|restaurant|cafe|garage|workshop|laundry|tiffin|hostel|pg|rental|society|ngo|farm|dairy|transport|logistics)\b/

export function classifyAppIntent(prompt: string, facts: OwnerFacts = {}): AppIntentBrief {
  const p = (prompt || '').toLowerCase()
  const scores = RULES.map(r => ({ id: r.id, s: r.w.reduce((n, [re, w]) => n + (re.test(p) ? w : 0), 0) })).sort((a, b) => b.s - a.s)
  const top = scores[0]
  const second = scores[1]
  const strength = Math.min(1, top.s / 6)
  const margin = top.s === 0 ? 0 : Math.min(1, (top.s - (second?.s ?? 0)) / Math.max(top.s, 1))
  const confidence = top.s === 0 ? 0.2 : Math.round((0.5 * strength + 0.5 * margin) * 100) / 100
  let intent: AppIntentId = top.s > 0 ? top.id : 'register'
  let note: string | undefined
  if (confidence < 0.5) { intent = top.s > 0 ? top.id : 'register'; note = 'The job was not clear, so this starts as a simple register you can extend.' }
  return { intent, confidence, industry: p.match(INDUSTRY)?.[1] ?? APP_BLUEPRINTS[intent].label.toLowerCase(), facts, note }
}

/** What the generated web app cannot do. The model lists the parts of a brief that fall in here, so the owner is told instead of left to find out. */
export const APP_LIMITS = [
  'sign-in, user accounts and different roles or permissions per person',
  'data shared between several people or devices (everything is saved in the browser it is used in)',
  'taking online payments, or sending SMS or WhatsApp messages by itself (it can open a ready message for the owner to send)',
  'photo or file uploads, barcode scanning, maps or live tracking',
]

export interface AppIntentChoice { primary: AppIntentId; secondary?: AppIntentId | null; notBuilt: string[] }

export function buildIntentPrompt(prompt: string): { system: string; user: string } {
  const shapes = (Object.values(APP_BLUEPRINTS)).map(b => `- ${b.id}: ${b.guidance}`).join('\n')
  return {
    system: [
      'You choose the shape of a small business web app from the owner\'s brief. Reply with one JSON object and nothing else.',
      `The available shapes:\n${shapes}`,
      '"primary" is the shape of the daily work the staff touch all day. A job that moves through stages (job cards, orders, cases) is "pipeline" even when invoices are also asked for: the invoice is the secondary part.',
      '"secondary" is one other shape the brief clearly also needs, or null.',
      `"notBuilt" lists, in the owner's own words and at most 5 short phrases, the parts of the brief this app cannot do. It cannot do: ${APP_LIMITS.join('; ')}. Leave it empty when the brief asks for none of these.`,
      'Format: {"primary": "pipeline", "secondary": "billing" or null, "notBuilt": ["..."]}',
    ].join('\n'),
    user: `Brief:\n${prompt.slice(0, 2000)}`,
  }
}

export function validateIntentChoice(v: unknown): string[] {
  const o = v as Partial<AppIntentChoice> | null
  if (!o || typeof o !== 'object') return ['reply is not an object']
  const ids = Object.keys(APP_BLUEPRINTS)
  const out: string[] = []
  if (!o.primary || !ids.includes(o.primary)) out.push('primary must be one of ' + ids.join(', '))
  if (o.secondary != null && (!ids.includes(o.secondary) || o.secondary === o.primary)) out.push('secondary must be null or a different shape')
  if (!Array.isArray(o.notBuilt) || o.notBuilt.length > 5 || o.notBuilt.some(s => typeof s !== 'string' || s.trim().length < 3 || s.length > 90)) out.push('notBuilt must be up to 5 short phrases')
  return out
}
