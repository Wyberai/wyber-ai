/**
 * The "what we would build first" sketch shown on the answer pages (Solve a problem, Build apps).
 *
 * Pure, no network: a visitor types their problem, we match it to one of six common shapes of business
 * problem (or a general fallback) and show a short plan plus three tappable questions. It is a sketch, and
 * the page says so. The real plan is made by the builder when they start, so nothing here invents an
 * integration, a number or a promise.
 */

export type SketchKind = 'Web app' | 'Web app with a phone view' | 'Mobile app' | 'Website' | 'SaaS'

export interface Sketch {
  title: string
  kind: SketchKind
  why: string
  screens: [name: string, note: string][]
  win: string
  qs: [question: string, options: string[]][]
}

interface Topic extends Sketch { match: RegExp }

export const TOPICS: Topic[] = [
  {
    match: /invoice|bill\b|bills\b|receipt|gst|payment|owe|credit|ledger|udhaar|collect/i,
    title: 'Invoice and payment tracker', kind: 'Web app',
    why: 'You will mostly work with this at a desk, and it will also work on a phone for quick checks.',
    screens: [['Dashboard', 'Unpaid, overdue and paid at a glance'], ['Invoices', 'Every invoice with its status, amount and due date'], ['Add invoice', 'Customer, items, tax and due date in one form'], ['Customers', 'Who you bill and what each one owes'], ['Follow-ups', 'Who to chase today']],
    win: 'See everything that is unpaid in one list, today.',
    qs: [['How do invoices reach you today?', ['Paper copies', 'WhatsApp or email', 'A mix of both', 'Another tool']], ['What do you need to know first?', ['Which are unpaid', 'Who owes me how much', 'Which are overdue', 'Monthly totals']], ['Who else will use it?', ['Just me', 'My accountant', 'My team', 'My customers']]],
  },
  {
    match: /stock|inventory|warehouse|expiry|batch|goods|material/i,
    title: 'Stock and inventory tracker', kind: 'Web app',
    why: 'Stock is checked and updated from a desk or a counter, so a web app fits first.',
    screens: [['Dashboard', 'Low stock and nearly-expired items'], ['Items', 'Every item with quantity and location'], ['Stock in and out', 'Record what came in and what left'], ['Suppliers', 'Who you buy from and what is on order']],
    win: 'Know what is low before you run out.',
    qs: [['What do you track?', ['Products for sale', 'Raw materials', 'Spare parts', 'Medicines or food']], ['What goes wrong most?', ['Running out', 'Items expiring', 'Counts not matching', 'Not knowing where things are']], ['Where do you count stock?', ['One shop', 'A warehouse', 'Several places', 'On the road']]],
  },
  {
    match: /order|deliver|dispatch|shipment|proof|courier|driver|route|transport/i,
    title: 'Order and delivery tracker', kind: 'Web app with a phone view',
    why: 'The office tracks orders on a computer, and drivers update status from their phones.',
    screens: [['Dashboard', 'Orders waiting, on the way and delivered'], ['Orders', 'Every order with customer, status and driver'], ['Delivery proof', 'Photo or signature captured on the phone'], ['Customers', 'Who ordered what, and their history']],
    win: 'See which deliveries have no proof yet.',
    qs: [['How do orders arrive?', ['WhatsApp', 'Phone calls', 'A website', 'Sales visits']], ['Who needs to update status?', ['Just me', 'Drivers', 'My team in the office', 'Everyone']], ['What is hardest to track today?', ['Where an order is', 'Missing proof of delivery', 'Who is late', 'Payments after delivery']]],
  },
  {
    match: /appoint|booking|book\b|slot|clinic|salon|class|schedule/i,
    title: 'Booking and appointments manager', kind: 'Web app',
    why: 'Customers book on a page and you manage the day from one calendar.',
    screens: [['Calendar', 'Today and the week at a glance'], ['Booking page', 'Customers pick a time themselves'], ['Customers', 'History and notes for each person'], ['Reminders', 'Fewer no-shows']],
    win: 'Stop double bookings.',
    qs: [['How do people book today?', ['Phone', 'WhatsApp', 'Walk-ins', 'Another tool']], ['What is a booking?', ['A visit', 'A class', 'A table', 'A service at their place']], ['Should customers pay when booking?', ['Yes', 'Not yet', 'Only a deposit']]],
  },
  {
    match: /lead|enquir|inquir|follow.?up|crm|sales|prospect/i,
    title: 'Leads and follow-up tracker', kind: 'Web app',
    why: 'A shared list of leads is easiest to work on a computer, with a phone view for notes on the move.',
    screens: [['Pipeline', 'Leads by stage, from new to won'], ['Leads', 'Every lead with contact and next step'], ['Follow-ups', 'Who to call today'], ['Reports', 'What is won, lost and stuck']],
    win: 'Never lose a lead in a chat again.',
    qs: [['Where do leads come from?', ['WhatsApp', 'Website or ads', 'Calls and walk-ins', 'Referrals']], ['Who works on them?', ['Just me', 'A small sales team', 'Several teams']], ['What do you lose most?', ['Follow-ups I forget', 'Who said what', 'Which stage a lead is in']]],
  },
  {
    match: /staff|attendance|employee|payroll|shift|leave|worker/i,
    title: 'Staff and attendance manager', kind: 'Web app with a phone view',
    why: 'Managers review on a computer, and staff can mark attendance from a phone.',
    screens: [['Dashboard', 'Who is in, absent or on leave today'], ['Attendance', 'Daily check-in with times'], ['Staff', 'People, roles and contact details'], ['Leave', 'Requests and approvals']],
    win: 'Know who is working today without asking.',
    qs: [['How many people?', ['Under 10', '10 to 50', 'More than 50']], ['How do you track attendance today?', ['Register book', 'WhatsApp message', 'A machine', 'We do not']], ['Who marks attendance?', ['The manager', 'Each person', 'A supervisor']]],
  },
]

const FALLBACK_PROBLEM: Sketch = {
  title: 'A simple tracker for your problem', kind: 'Web app',
  why: 'A web app is the quickest way to get one clear view of something you track by hand today.',
  screens: [['Dashboard', 'The few numbers you check every day'], ['List', 'Everything you track, searchable'], ['Add and edit', 'One simple form'], ['Detail', 'The full history of one item']],
  win: 'Replace the notebook or spreadsheet with one clear list.',
  qs: [['What do you track today?', ['In a notebook', 'In a spreadsheet', 'In WhatsApp chats', 'In my head']], ['What goes wrong most?', ['Things get lost', 'It takes too long', 'Nobody has the full picture', 'Mistakes in numbers']], ['Who else will use it?', ['Just me', 'My team', 'My customers']]],
}

const FALLBACK_IDEA: Sketch = {
  title: 'Your first version', kind: 'Web app', why: '',
  screens: [['Home', 'What it is, and one clear first action'], ['Sign in', 'Accounts so each person has their own space'], ['The main screen', 'The thing people come to do'], ['Detail', 'One item in full'], ['Account', 'Settings and history']],
  win: 'Click through a working first version of your idea.',
  qs: [['Who is it for?', ['Customers', 'My team', 'The public', 'Just me']], ['What is the first thing a person does?', ['Sign up', 'Browse', 'Book or buy something', 'Add their own data']], ['Does it need payments?', ['Yes, from day one', 'Later', 'No']]],
}

export function pickIdeaKind(text: string): SketchKind {
  if (/mobile|phone|ios|android|app store/i.test(text)) return 'Mobile app'
  if (/website|landing|portfolio|blog|store\b|shop/i.test(text)) return 'Website'
  if (/saas|subscription|plans|billing|customers pay/i.test(text)) return 'SaaS'
  return 'Web app'
}

export type Door = 'problem' | 'idea'

export function sketchFor(door: Door, text: string): Sketch {
  if (door === 'problem') {
    for (const t of TOPICS) if (t.match.test(text)) { const { match: _m, ...s } = t; void _m; return s }
    return { ...FALLBACK_PROBLEM }
  }
  const kind = pickIdeaKind(text)
  const s: Sketch = JSON.parse(JSON.stringify(FALLBACK_IDEA))
  s.kind = kind
  s.why = kind === 'Mobile app' ? 'You mentioned phones, so we would start with a phone-first app.'
    : kind === 'Website' ? 'You described something people visit and read, so a website fits first.'
    : kind === 'SaaS' ? 'You mentioned plans or billing, so we would include sign-ups and a plan page.'
    : 'A web app is the quickest way to get a working first version you can click through.'
  if (kind === 'Website') s.screens = [['Home', 'What you offer, in one screen'], ['About', 'Who you are'], ['Services or products', 'What people can get'], ['Contact or booking', 'The one action you want']]
  if (kind === 'SaaS') s.screens = [['Landing page', 'What it is and who it is for'], ['Sign up and sign in', 'Accounts and plans'], ['The main screen', 'The thing customers pay for'], ['Plans and billing', 'Choose a plan, see the status']]
  return s
}
