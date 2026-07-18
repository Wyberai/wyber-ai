import type { BuildPage } from './types'

export const BUSINESS_PAGES: BuildPage[] = [
  {
    slug: 'salon-booking-app',
    noun: 'salon booking app',
    h1: 'Build a Salon Booking App with AI',
    metaTitle: 'Build a Salon Booking App with AI — No Code',
    metaDesc: 'Turn phone-tag appointments into online bookings: services, stylist calendars, and client history — built from a plain-English description, no code.',
    target: 'web',
    category: 'business',
    tagline: 'Clients pick a service, a stylist, and a slot. You see the day\'s schedule at a glance. No more DM-and-phone-tag booking.',
    body: [
      'For most salons the booking system is a phone, an Instagram DM inbox, and a paper diary — which works until a double-booking costs you a regular, or an hour of the day disappears into "are you free Thursday?" messages. The booking platforms that fix this take a cut per appointment or charge monthly for every chair.',
      'A salon booking app is mostly a data problem — services with durations, staff with working hours, and slots that don\'t collide — and that\'s exactly what WyberAi generates from your description: a client-facing booking page that only offers genuinely free slots, and an owner dashboard showing each stylist\'s day. Rename "stylist" to "barber", "therapist", or "artist" and the same shape fits your shop.',
    ],
    features: [
      { title: 'Service menu with durations', desc: 'Cut, colour, blow-dry — each service carries a duration and price, so slot lengths are calculated, not guessed.' },
      { title: 'Per-stylist calendars', desc: 'Each staff member has working hours and their own bookings; clients can pick a person or "first available".' },
      { title: 'Collision-proof slots', desc: 'The booking page only shows slots that are actually free for that stylist and that service length.' },
      { title: 'Client history', desc: 'Every client\'s past appointments in one place — who they saw, what they had, when they\'re due back.' },
    ],
    promptExample:
      'Build a salon booking web app: a public Booking page where clients pick a service (each with duration and price), choose a stylist or "first available", and select from open time slots; an owner Dashboard showing today\'s appointments per stylist in a timeline; and a Clients page with each client\'s appointment history. Stylists have configurable working hours.',
    faqs: [
      { q: 'Will it stop double-bookings?', a: 'Yes — available slots are computed from the stylist\'s working hours minus existing bookings and the service\'s duration, so a taken slot simply never appears.' },
      { q: 'Can clients cancel or reschedule themselves?', a: 'Ask for a manage-booking page in your prompt or later in chat — clients get a link to view, cancel, or move their appointment within rules you set.' },
      { q: 'Does this work for barbershops, spas, or clinics?', a: 'The same structure — services, staff, working hours, slots — fits any appointment business. Describe your version and the labels and rules adapt.' },
      { q: 'What happens when I\'m ready to take it live?', a: 'Publish from the editor and share the link. Before publish, WyberAi runs a live security scan on the app\'s database so client data isn\'t exposed.' },
    ],
    related: ['restaurant-menu-app', 'client-crm', 'event-registration-app'],
  },
  {
    slug: 'restaurant-menu-app',
    noun: 'restaurant menu app',
    h1: 'Build a Restaurant Menu App with AI',
    metaTitle: 'Build a Restaurant Menu & QR Ordering App with AI',
    metaDesc: 'A digital menu your kitchen can edit in seconds — categories, photos, prices, and specials — generated from plain English. QR-ready, no code, free to start.',
    target: 'web',
    category: 'business',
    tagline: 'A menu you update from your phone when the fish changes — not a PDF you re-print every time a price moves.',
    body: [
      'Laminated menus and PDF links share a flaw: the moment a price changes or a dish sells out, they\'re wrong. And the QR-menu platforms that solve it charge monthly rent for what is, underneath, a list of dishes with photos — content you should own outright.',
      'Describe your menu\'s shape — sections, dish details, dietary tags, a specials board — and WyberAi builds both halves: the guest-facing menu that loads fast from a table QR code, and an admin page where staff flip "sold out" or update tonight\'s special in seconds. Because it\'s a real web app and not a widget, it grows with you: add a second location\'s menu, a takeaway order form, or a wine list with pairings whenever you\'re ready.',
    ],
    features: [
      { title: 'Sections and dish cards', desc: 'Starters, mains, desserts, drinks — each dish with photo, description, price, and dietary tags (V, VG, GF, spice level).' },
      { title: 'Sold-out and specials switches', desc: 'Staff toggle availability or pin today\'s special from a phone — guests see it change instantly.' },
      { title: 'QR-first guest view', desc: 'A fast, mobile-first menu built to be opened from a table QR code — no app download, no pinch-zooming a PDF.' },
      { title: 'Multi-language ready', desc: 'Add a second language for your menu content when you need it — the structure supports per-language dish text.' },
    ],
    promptExample:
      'Build a restaurant menu web app: a public mobile-first Menu page with sections (Starters, Mains, Desserts, Drinks), each dish showing photo, description, price, and dietary tags, plus a highlighted Today\'s Specials section; and an Admin page (login required) where staff can add or edit dishes, mark items sold out, and set the daily specials.',
    faqs: [
      { q: 'How do guests get to the menu?', a: 'Publish the app and point a QR code at its URL — any free QR generator works. Guests scan and the menu opens in their browser, no download.' },
      { q: 'Can non-technical staff update it?', a: 'That\'s the point of the admin page: logging in and toggling a dish or editing a price is a form, not a code change.' },
      { q: 'Can I add online ordering later?', a: 'Yes — start with the menu and ask chat to add a takeaway order flow when you\'re ready; the dish data you\'ve entered carries over.' },
      { q: 'What does it cost to run?', a: 'Building uses free monthly credits (a build is 30, edits are 2), and published apps are hosted for you — no per-table or per-scan fees.' },
    ],
    related: ['salon-booking-app', 'event-registration-app', 'online-course-platform'],
  },
  {
    slug: 'client-crm',
    noun: 'client CRM',
    h1: 'Build a Simple CRM for Your Business with AI',
    metaTitle: 'Build a Custom CRM with AI — Your Pipeline, No Code',
    metaDesc: 'A CRM shaped to your sales process: your pipeline stages, your fields, your follow-up rhythm — generated from a description, not configured for weeks.',
    target: 'web',
    category: 'business',
    tagline: 'Your pipeline stages, your fields, your follow-up cadence — a CRM that fits your business instead of a giant one you configure down.',
    body: [
      'CRMs fail small businesses from both ends: the big platforms bury you in setup and per-seat pricing, while the spreadsheet you retreat to can\'t remind you that a warm lead has gone quiet for two weeks. The result is the most expensive kind of leak — deals lost to silence, not to competitors.',
      'What a five-person business actually needs is a pipeline with its own stage names, a contact record with the fields that matter in your industry, and a today-view of who to follow up with. That\'s a description, and WyberAi turns it into a working CRM on a real database — with logins for your team and a security scan before you put client data in it. When your process changes, you change the app in chat, not in a settings maze.',
    ],
    features: [
      { title: 'Pipeline with your stages', desc: 'Lead → Quoted → Won, or your five-stage version — a kanban pipeline generated from how you actually sell.' },
      { title: 'Contact records, your fields', desc: 'Company, source, budget, renewal date, sizes, allergies — whatever your business tracks, in the schema from day one.' },
      { title: 'Follow-up today view', desc: 'A dashboard of contacts whose next-action date has arrived or whose deals have gone quiet — the anti-leak screen.' },
      { title: 'Notes and activity trail', desc: 'Calls, meetings, and emails logged against the contact, so anyone on the team can pick up the thread.' },
    ],
    promptExample:
      'Build a CRM web app for a small design agency: a Pipeline page with kanban stages New Lead, Discovery, Proposal Sent, Won, and Lost, where deals have a value, contact, and next-action date; a Contacts page with company, role, source, and notes; and a Today page listing deals whose next-action date is today or overdue. Include team login.',
    faqs: [
      { q: 'How is this better than a HubSpot free tier?', a: 'It\'s smaller on purpose: only your fields, only your stages, no upgrade walls — and when you outgrow a feature you add it in chat instead of moving plans.' },
      { q: 'Can I import my existing contacts?', a: 'Ask for a CSV import in your prompt or afterwards — describe your spreadsheet\'s columns and they map into the contacts table.' },
      { q: 'Is client data safe in a generated app?', a: 'The app ships with authentication and row-level security, and WyberAi probes the live database like an attacker before you publish — critical leaks block the publish gate.' },
      { q: 'Can my team use it at the same time?', a: 'Yes — it\'s a real multi-user web app on Postgres. Everyone logs in, and edits show up for the whole team.' },
    ],
    related: ['team-task-manager', 'freelance-time-tracker', 'salon-booking-app'],
  },
]
