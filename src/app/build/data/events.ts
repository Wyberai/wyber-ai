import type { BuildPage } from './types'

export const EVENTS_PAGES: BuildPage[] = [
  {
    slug: 'wedding-rsvp-website',
    noun: 'wedding website',
    h1: 'Build a Wedding RSVP Website with AI',
    metaTitle: 'Build a Wedding Website with RSVP — AI, No Code',
    metaDesc: 'Your story, schedule, and a real RSVP system with meal choices and plus-ones — a wedding website generated from plain English, no template rent.',
    target: 'web',
    category: 'events',
    tagline: 'Your story, your schedule, and an RSVP list that fills itself — instead of a spreadsheet and 40 "who\'s coming?" texts.',
    body: [
      'Wedding website builders have perfected a pricing trick: the pretty page is free, but the thing you actually need — RSVPs with meal choices, plus-ones, and a guest list you can hand the caterer — sits behind the premium tier. And the template is still recognizably the same one from your cousin\'s wedding.',
      'Describe your wedding — the venues, the day\'s timeline, what guests need to choose — and WyberAi generates a site that\'s actually yours: your story told your way, and an RSVP form that writes straight into a guest database. The dashboard answers the questions that matter at T-minus-two-weeks: who\'s confirmed, how many chicken versus paneer, which out-of-town guests need the hotel block link.',
    ],
    features: [
      { title: 'RSVP with the real questions', desc: 'Attending, meal choice, dietary notes, plus-one name, song request — whatever your planning needs, captured per guest.' },
      { title: 'Caterer-ready guest dashboard', desc: 'Confirmed count, meal totals, and dietary flags in one view — exportable when the venue asks.' },
      { title: 'Your day, laid out', desc: 'Ceremony, reception, mehndi, after-party — each with time, venue, map link, and dress code.' },
      { title: 'Private by invitation', desc: 'Keep the site open, or gate RSVP behind a code from your invitation cards.' },
    ],
    promptExample:
      'Build a wedding website: a beautiful Home page with our names, date, and story; a Schedule page with ceremony and reception times, venues with map links, and dress code; an RSVP page where guests enter their invite name, mark attending or not, choose a meal (veg/non-veg), add dietary notes and a plus-one; and a private Dashboard (login) showing confirmed counts, meal totals, and the full guest list.',
    faqs: [
      { q: 'Can guests RSVP for their whole family at once?', a: 'Yes — model invites as households in your prompt and one submission can confirm every name on the invitation.' },
      { q: 'Can we match the site to our invitation suite?', a: 'Describe your palette and mood ("dusty rose and cream, serif, candlelit") and the design is generated to match — then refine in chat.' },
      { q: 'What about a custom domain like ournames.com?', a: 'Publish the site and connect a custom domain from the editor — guests never see a builder URL.' },
      { q: 'Is there a per-guest or premium-feature fee?', a: 'No — RSVP, dashboard, and guest list are just parts of your app. Building uses free monthly credits; the site is yours.' },
    ],
    related: ['event-registration-app', 'restaurant-menu-app', 'sports-league-manager'],
  },
  {
    slug: 'event-registration-app',
    noun: 'event registration app',
    h1: 'Build an Event Registration App with AI',
    metaTitle: 'Build an Event Registration App with AI — No Code',
    metaDesc: 'Registration pages, capacity limits, waitlists, and a check-in view — event signup software generated from a description, without per-ticket fees.',
    target: 'web',
    category: 'events',
    tagline: 'Registration, capacity, waitlist, check-in — the whole signup pipeline for your workshop or meetup, minus the per-ticket platform fee.',
    body: [
      'For free events and paid workshops alike, ticketing platforms charge like exchanges: a cut per ticket, service fees your attendees grumble about, and your attendee list living in their CRM, not yours. A community meetup shouldn\'t hand over a percentage to collect names.',
      'Registration is a form, a capacity counter, and a list — which is why it generates so well. Describe your event and what you need to know per attendee, and WyberAi builds the pipeline: a signup page that closes itself at capacity and starts a waitlist, automatic promotion when someone drops, and a check-in view for the door that works from a phone. Run one event or a monthly series; the attendee data stays yours either way.',
    ],
    features: [
      { title: 'Registration with your questions', desc: 'Name and email plus whatever your event needs — t-shirt size, experience level, dietary needs, company.' },
      { title: 'Capacity + auto-waitlist', desc: 'Signups close at your cap; later registrants join a waitlist and promote automatically when spots free up.' },
      { title: 'Door check-in mode', desc: 'A fast search-and-tap attendee list for event day — see who\'s arrived and who\'s a no-show, live.' },
      { title: 'Series-ready structure', desc: 'Run recurring events under one roof — each with its own page, capacity, and attendee list.' },
    ],
    promptExample:
      'Build an event registration web app for a monthly tech meetup: a public Events page listing upcoming events; each event page with description, venue, date, and a registration form (name, email, role, dietary preference) that enforces a capacity of 80 and starts a waitlist when full, auto-promoting from the waitlist on cancellations; and an organizer Dashboard with attendee lists, waitlist, and a check-in mode with search for event day.',
    faqs: [
      { q: 'Can it handle paid tickets?', a: 'Start with free registration and add a payment step in chat when you need it — the registration flow and attendee list stay the same underneath.' },
      { q: 'How does the waitlist promotion work?', a: 'When a confirmed attendee cancels, the first waitlisted person is promoted automatically and appears in the confirmed list — no manual shuffling.' },
      { q: 'Can attendees cancel their own spot?', a: 'Yes — ask for a manage-registration link in your prompt and cancellations free the spot (and trigger the waitlist) without emailing you.' },
      { q: 'Who owns the attendee data?', a: 'You do — it lives in your app\'s own database, secured with row-level security and scanned before publish. No platform is mining your attendee list.' },
    ],
    related: ['wedding-rsvp-website', 'sports-league-manager', 'salon-booking-app'],
  },
  {
    slug: 'sports-league-manager',
    noun: 'sports league manager',
    h1: 'Build a Sports League Management App with AI',
    metaTitle: 'Build a Sports League Manager with AI — Fixtures & Standings',
    metaDesc: 'Fixtures, live standings, and team rosters for your local league — generated from a plain-English description. No spreadsheet, no league-software fees.',
    target: 'web',
    category: 'events',
    tagline: 'Fixtures published, results in, table updates itself — and the WhatsApp group argues about form, not about whose spreadsheet is right.',
    body: [
      'Every local league — five-a-side football, box cricket, office badminton — runs on the same fragile stack: one volunteer, one spreadsheet, and a WhatsApp group where the fixture list gets buried forty messages deep. The moment the volunteer travels, the standings stop being trustworthy.',
      'A league app is standings math plus a schedule, and that\'s a clean thing to generate. Tell WyberAi your format — teams, rounds, points rules, tie-breakers — and it builds the public league site: fixtures by round, a table that recalculates the instant a result is entered, and team pages with rosters and form. The admin types in one score; everything downstream updates itself.',
    ],
    features: [
      { title: 'Fixture rounds', desc: 'The season\'s schedule laid out by round or week — each match with teams, time, and venue.' },
      { title: 'Self-updating standings', desc: 'Points, goal difference, and your tie-breaker rules applied automatically the moment results land.' },
      { title: 'Team pages and rosters', desc: 'Each team with its squad, results, and recent form — the page players actually check.' },
      { title: 'One-admin results entry', desc: 'A protected results form for the organizer; everyone else gets a read-only league that\'s always current.' },
    ],
    promptExample:
      'Build a sports league web app for an 8-team five-a-side football league: a public Standings page (3 points for a win, 1 for a draw, ranked by points then goal difference); a Fixtures page grouped by round showing date, time, and venue with results filled in as played; team pages with roster and last-5 form; and an admin-only Results page where I enter scores and the table updates automatically.',
    faqs: [
      { q: 'Can it generate the fixture list for me?', a: 'Yes — say "generate a double round-robin schedule" in your prompt and every team plays every team home and away, spread across your season dates.' },
      { q: 'What about knockout stages or playoffs?', a: 'Describe the format — top four to semifinals, a cup bracket — and ask chat to add the knockout structure when the group stage ends.' },
      { q: 'Can players check scores without logging in?', a: 'Yes — the league site is public and read-only by default; only results entry sits behind the admin login.' },
      { q: 'Does it work for cricket, basketball, or badminton?', a: 'The structure — teams, fixtures, results, points rules — is sport-agnostic. Describe your sport\'s scoring and the standings math follows it.' },
    ],
    related: ['event-registration-app', 'team-task-manager', 'wedding-rsvp-website'],
  },
]
