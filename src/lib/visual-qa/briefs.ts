// Distinct business briefs and stand-in copy for them, at three lengths. The copy step is a model in production; here it is written
// by code so the harness is free and repeatable. Every result must pass the production copy validator, so each case is a page a real
// build could ship. "long" sits near the validator's limits, with the long words and long names where layouts break.
import type { BuildSpec, OwnerFacts, SiteCopy } from '../website-spec/types'

export type Length = 'short' | 'typical' | 'long'

export interface Brief { key: string; prompt: string; what: string; city: string; offers: string[] }

const B = (key: string, prompt: string, what: string, city: string, offers: string): Brief => ({ key, prompt, what, city, offers: offers.split('|') })

export const BRIEFS: Brief[] = [
  B('law', 'Website for a family law firm in Ahmedabad handling divorce, custody and property matters', 'Family law practice', 'Ahmedabad', 'Divorce and separation|Child custody|Property settlements|Wills and succession|Maintenance claims|Mediation'),
  B('dentist', 'Website for a dental clinic in Surat for implants, braces and cleaning', 'Dental clinic', 'Surat', 'Check-ups and cleaning|Braces and aligners|Dental implants|Root canal treatment|Dentistry for children|Teeth whitening'),
  B('physio', 'Website for a physiotherapy clinic in Pune treating sports injuries and back pain', 'Physiotherapy clinic', 'Pune', 'Back and neck pain|Sports injuries|Post-surgery rehabilitation|Posture correction|Home visits|Joint mobility'),
  B('salon', 'Website for a hair and beauty salon in Vadodara with bridal packages and booking', 'Hair and beauty salon', 'Vadodara', 'Cut and styling|Hair colouring|Bridal makeup|Skin care|Nail art|Hair spa'),
  B('gym', 'Website for a strength training gym in Rajkot with personal trainers', 'Strength training gym', 'Rajkot', 'Strength coaching|Personal training|Beginner batches|Mobility classes|Nutrition guidance|Women only hours'),
  B('plumber', 'Website for a plumbing repair service in Indore that books emergency visits', 'Plumbing repair service', 'Indore', 'Leak repair|Bathroom fitting|Water tank cleaning|Pipe replacement|Motor installation|Drain unblocking'),
  B('vet', 'Website for a vet clinic in Mysuru for dogs and cats with vaccination visits', 'Veterinary clinic', 'Mysuru', 'Vaccinations|General check-ups|Dental care for pets|Minor surgery|Grooming advice|Home visits'),
  B('bakery', 'Website for a sourdough bakery in Bengaluru that takes custom cake orders', 'Sourdough bakery', 'Bengaluru', 'Country sourdough|Custom celebration cakes|Morning pastries|Seeded loaves|Cookies by the box|Festival hampers'),
  B('cafe', 'Website for a coffee cafe in Panaji with brunch and a reading corner', 'Coffee cafe', 'Panaji', 'Filter coffee|All day brunch|Fresh sandwiches|Seasonal desserts|Cold brew|Reading corner'),
  B('dhaba', 'Website for a Punjabi dhaba restaurant in Ludhiana with a thali menu and catering', 'Punjabi dhaba', 'Ludhiana', 'Dal makhani|Tandoori breads|Weekend thali|Paneer specials|Lassi and chaas|Event catering'),
  B('tiffin', 'Website for a home tiffin kitchen in Nagpur delivering lunch to offices', 'Home tiffin kitchen', 'Nagpur', 'Daily lunch tiffin|Jain meals|Office group orders|Weekend specials|Diet meals|Evening snacks'),
  B('mithai', 'Website for a mithai and sweets shop in Jodhpur with wedding orders', 'Sweets and mithai shop', 'Jodhpur', 'Kaju katli|Fresh ghewar|Wedding boxes|Sugar-free sweets|Namkeen range|Gift hampers'),
  B('steel', 'Website for a steel pipes wholesale supplier in Ahmedabad that answers quote enquiries', 'Steel pipe supplier', 'Ahmedabad', 'Mild steel pipes|Galvanised pipes|Structural hollow sections|Angles and channels|Sheets and plates|Cut to length'),
  B('rice', 'Website for a basmati and sona masoori rice exporter in Hyderabad supplying wholesale buyers', 'Rice exporter', 'Hyderabad', 'Basmati rice|Sona masoori|Parboiled rice|Broken rice|Private label packing|Container loads'),
  B('textile', 'Website for a cotton textile manufacturer in Coimbatore selling fabric in bulk', 'Cotton fabric manufacturer', 'Coimbatore', 'Greige cotton fabric|Dyed shirting|Printed cambric|Canvas and drill|Yarn-dyed checks|Custom weaves'),
  B('valves', 'Website for an industrial valve distributor in Vadodara with a catalogue and quote requests', 'Industrial valve distributor', 'Vadodara', 'Ball valves|Gate valves|Butterfly valves|Check valves|Actuators|Flanges and fittings'),
  B('photog', 'Portfolio website for a freelance wedding photographer in Jaipur', 'Wedding photography portfolio', 'Jaipur', 'Wedding stories|Pre-wedding shoots|Family portraits|Event coverage|Printed albums|Short films'),
  B('designer', 'Personal portfolio for a freelance product designer in Kochi showing my work', 'Product design portfolio', 'Kochi', 'App interface design|Design systems|Brand identity|Usability reviews|Prototype sprints|Illustration'),
  B('developer', 'Portfolio for a freelance developer in Chandigarh who builds websites for small firms', 'Freelance developer portfolio', 'Chandigarh', 'Business websites|Booking systems|Dashboard builds|Performance fixes|Migration work|Monthly care'),
  B('ca', 'Website for a chartered accountant firm in Mumbai for tax filing and company registration', 'Chartered accountant firm', 'Mumbai', 'Income tax filing|Company registration|Goods and services tax returns|Bookkeeping|Statutory audit|Compliance calendar'),
  B('architect', 'Website for an architects studio in Auroville designing climate friendly homes', 'Architecture studio', 'Auroville', 'Residential design|Interior planning|Renovation|Site supervision|Landscape|Feasibility study'),
  B('consult', 'Website for a management consultancy in Gurugram helping manufacturers with operations', 'Operations consultancy', 'Gurugram', 'Process mapping|Inventory planning|Quality systems|Vendor review|Floor layout|Team training'),
  B('notary', 'Website for a notary and legal documentation office in Nashik', 'Notary and documentation office', 'Nashik', 'Affidavits|Agreement drafting|Property papers|Name change|Power of attorney|Attestation'),
  B('jee', 'Website for a JEE and NEET coaching institute in Kota with demo classes', 'Entrance exam coaching', 'Kota', 'Physics foundations|Chemistry practice|Mathematics problem solving|Biology revision|Mock tests|Doubt sessions'),
  B('music', 'Website for a music classes academy in Kolkata teaching tabla and vocals to students', 'Music academy', 'Kolkata', 'Hindustani vocals|Tabla|Harmonium|Rabindra sangeet|Weekend batches|Recital practice'),
  B('coding', 'Website for a coding training institute in Hubballi with weekend batches for students', 'Coding training institute', 'Hubballi', 'Web development course|Python basics|Data analysis|Interview practice|Project mentoring|Weekend batches'),
  B('meetup', 'Website for a two-day startup meetup in Pune with talks, demos and a hiring corner', 'Startup meetup', 'Pune', 'Opening talks|Founder demos|Hiring corner|Product clinic|Investor hour|Evening mixer'),
  B('expo', 'Website for a technology expo in Gandhinagar where visitors register for the three-day event', 'Technology expo', 'Gandhinagar', 'Exhibitor hall|Keynote sessions|Live demonstrations|Student projects|Buyer meetings|Closing ceremony'),
  B('wedding', 'Website for a wedding invitation with the agenda, venue and registration for guests', 'Wedding celebration', 'Udaipur', 'Mehendi evening|Haldi morning|Sangeet night|Wedding ceremony|Reception dinner|Farewell breakfast'),
  B('hackathon', 'Website for a weekend hackathon in Hyderabad with registration and a schedule', 'Weekend hackathon', 'Hyderabad', 'Team formation|Build sprint|Mentor rounds|Overnight lab|Demo hour|Judging'),
  B('ngo', 'Website for an NGO in Bhuj that teaches children and welcomes volunteers and donations', 'Community education trust', 'Bhuj', 'Evening school|Library van|Health camps|Skill workshops|Scholarship help|Volunteer days'),
  B('temple', 'Website for a temple trust in Dwarka with daily timings and seva information', 'Temple trust', 'Dwarka', 'Daily darshan|Annakut seva|Festival programme|Community kitchen|Guest lodging|Cow shelter'),
  B('club', 'Website for a cycling community club in Mangaluru with weekend rides', 'Cycling club', 'Mangaluru', 'Sunday rides|Beginner circle|Night rides|Safety workshops|Repair mornings|Charity ride'),
  B('realty', 'Website for a real estate agency in Noida with flat listings and rentals', 'Real estate agency', 'Noida', 'Two bedroom flats|Office rentals|Plots|Villas|Serviced apartments|Resale homes'),
  B('travel', 'Website for a travel and tours operator in Shimla with trekking tour listings', 'Tour operator', 'Shimla', 'Valley treks|Family tours|Pilgrim routes|Snow weekends|Village stays|Airport transfers'),
  B('homestay', 'Website for a family homestay in Munnar with three rooms and home cooked breakfast', 'Family homestay', 'Munnar', 'Valley view room|Garden room|Family suite|Kerala breakfast|Tea estate walk|Station pickup'),
  B('haveli', 'Website for a heritage haveli hotel in Bikaner with courtyard rooms', 'Heritage haveli hotel', 'Bikaner', 'Courtyard rooms|Terrace suites|Folk music evenings|Old city walk|Thali dinners|Desert drive'),
  B('resort', 'Website for a beach resort in Gokarna with cottages and yoga mornings', 'Beach resort', 'Gokarna', 'Sea facing cottages|Garden cottages|Yoga mornings|Kayak hire|Seafood suppers|Sunset boat'),
  B('saasland', 'Landing page for our app, a SaaS software platform for building maintenance billing', 'Society accounts software', 'Thane', 'Maintenance bills|Payment tracking|Notice board|Visitor log|Expense reports|Committee roles'),
  B('invoicing', 'Landing page for a SaaS that helps small traders send invoices and reminders', 'Invoicing software', 'Anand', 'Quick invoices|Payment reminders|Customer ledger|Stock count|Daily summary|Export to accountant'),
  B('helpdesk', 'Landing page for our app, a SaaS software platform for fleet route planning', 'School transport software', 'Nadiad', 'Route lists|Parent updates|Driver roster|Fee records|Vehicle papers|Daily attendance'),
  B('magazine', 'Website for a Gujarati food magazine and newsletter with new articles every week', 'Food magazine', 'Ahmedabad', 'Street food notes|Home recipes|Market diaries|Kitchen interviews|Festival cooking|Reader letters'),
  B('podcast', 'Website for a podcast and blog about small town businesses', 'Business podcast', 'Aurangabad', 'Founder conversations|Shop floor stories|Money basics|Hiring notes|Tool reviews|Reading list'),
  B('jeweller', 'Website for a jewellery maker in Rajkot who sells handmade silver pieces wholesale', 'Silver jewellery maker', 'Rajkot', 'Silver anklets|Toe rings|Bangles|Pendant sets|Pooja articles|Custom orders'),
  B('laundry', 'Website for a laundry and dry cleaning service in Bhopal with doorstep pickup', 'Laundry service', 'Bhopal', 'Wash and fold|Dry cleaning|Steam ironing|Curtain cleaning|Shoe care|Doorstep pickup'),
  B('optician', 'Website for an optician and eye clinic in Ranchi for eye tests and spectacles', 'Eye care clinic', 'Ranchi', 'Eye tests|Spectacle frames|Contact lens fitting|Children eye checks|Lens repair|Home trial'),
]

const SCENE = 'A calm working room in daylight: two people at a wooden table going through material together, a tall window, a plant on a shelf.'
const ALT = 'Two people at a wooden table in a bright room, going through material together'

/** Cuts at a word so the result never exceeds the validator's limit. */
function fit(s: string, max: number): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max + 1)
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.]+$/, '')
}

export function factsFor(b: Brief, len: Length, i: number): OwnerFacts {
  const long = len === 'long'
  return {
    city: b.city,
    email: long ? `enquiries.${b.key}.reservations@example-business-name.com` : 'hello@example.com',
    ...(i % 3 !== 2 ? { phone: '+91 90000 00000' } : {}),
    ...(i % 2 === 0 ? { whatsapp: '919000000000' } : {}),
    ...(i % 4 !== 3 ? { hours: long ? 'Monday to Saturday, 9.30 in the morning to 8.00 in the evening, closed on public holidays' : 'Mon to Sat, 10 to 7' } : {}),
    ...(i % 2 === 1 || long ? { address: long ? `Shop 14 and 15, Shree Siddhivinayak Commercial Complex, opposite the Municipal Corporation Building, ${b.city} 380015` : `12 Station Road, ${b.city}` } : {}),
    ...(long ? { name: fit(`Shree Venkateshwara ${b.what} and Associates`, 58) } : len === 'short' ? { name: 'Aavya' } : {}),
  }
}

const HEADLINE: Record<Length, (b: Brief) => string> = {
  short: b => fit(`Care in ${b.city}.`, 90),
  typical: b => fit(`${b.what} in ${b.city}, explained plainly`, 90),
  long: b => fit(`Comprehensive ${b.what.toLowerCase()} for families and organisations across ${b.city} district`, 90),
}

export function copyFor(spec: BuildSpec, b: Brief, len: Length): SiteCopy {
  const long = len === 'long', short = len === 'short'
  const offer = (i: number) => b.offers[i % b.offers.length]
  const title = (s: string, longTail: string) => fit(long ? `${s} ${longTail}` : s, long ? 80 : 40)
  const itemTitle = (i: number) => (short ? fit(offer(i).split(' ')[0], 60) : long ? fit(`${offer(i)} with documentation and follow-up`, 60) : offer(i))
  const itemText = (i: number) => short ? 'Done with care.' : long
    ? fit(`${offer(i)} is arranged after a first conversation, so you know what is involved, what to bring along, how it is scheduled and who you will be dealing with at every stage of the work.`, 220)
    : `${offer(i)}, arranged after a short conversation so you know what to expect.`
  const sections: SiteCopy['sections'] = {}
  for (const s of spec.sections) {
    const n = long ? s.count.max : short ? s.count.min : Math.min(s.count.max, s.count.min + 1)
    const count = s.kind === 'services' && s.variant === 'cards' ? (n > 3 ? 6 : 3) : n
    const head = {
      eyebrow: short ? undefined : fit(long ? `Information for ${b.what.toLowerCase()} enquiries` : s.id === 'faq' ? 'Good to know' : 'In plain words', 60),
      title: title(({ faq: 'Questions we are asked', visit: 'Where to find us', contact: 'Send us a message', about: 'How we work', steps: 'How it works', how: 'How it works' } as Record<string, string>)[s.id] ?? 'What we do', 'for first-time and returning visitors alike'),
      description: short ? undefined : long ? fit(`Everything a first-time visitor usually wants to understand about ${b.what.toLowerCase()} in ${b.city}, written without jargon, so the first message you send can be a short and useful one.`, 240) : `A short guide to what happens and how to get in touch in ${b.city}.`,
    }
    if (s.kind === 'services' || s.kind === 'rows' || s.kind === 'steps') {
      sections[s.id] = { ...head, items: Array.from({ length: count }, (_, i) => ({
        title: s.kind === 'steps' ? (short ? ['Ask', 'Visit', 'Plan', 'Return'][i % 4] : long ? fit(['Tell us what you are looking for', 'Meet us for a first conversation', 'Receive a written plan of work', 'Come back whenever you need to'][i % 4] + ' today', 60) : ['Tell us what you need', 'Meet and discuss', 'Get a clear plan', 'Come back any time'][i % 4]) : itemTitle(i),
        text: itemText(i),
        ...(s.kind === 'rows' && !short ? { meta: long ? 'By prior appointment' : ['On request', 'Weekdays', 'By enquiry'][i % 3] } : {}),
      })) }
    } else if (s.kind === 'faq') {
      sections[s.id] = { ...head, faq: Array.from({ length: count }, (_, i) => ({
        question: long ? fit(`What should I keep ready before asking about ${offer(i).toLowerCase()} for the very first time?`, 110) : `How do I ask about ${fit(offer(i).toLowerCase(), 60)}?`,
        answer: long ? fit(`Send a short message with what you need and when you are free. We reply with what to keep ready, how long a first conversation usually takes and what happens after it. Nothing is decided before you have had the chance to ask questions, and you can bring someone along if that makes the conversation easier for you.`, 420) : 'Send a message using the form on this page and say what you need. We reply to arrange a time.',
      })) }
    } else if (s.kind === 'about') {
      sections[s.id] = { ...head, paragraphs: long
        ? [fit(`We explain each step before it begins and we say plainly when something can wait. People who visit ${b.what.toLowerCase()} for the first time are often unsure what to ask, so we start by listening, then describe the choices in everyday words, and only then agree on what happens next and in which order.`, 420), fit('If a matter needs a specialist we do not have, we tell you at the start instead of part way through, and we write down what was agreed so that nobody has to rely on memory later on.', 420)]
        : ['We explain each step before it begins, in plain words, and we say when something can wait.', ...(short ? [] : ['You can ask questions at any point, and nothing starts without your go-ahead.'])],
        imageAlt: ALT, imageBrief: SCENE }
    } else if (s.kind === 'contact' || s.kind === 'cta') {
      sections[s.id] = { ...head, button: short ? 'Send' : long ? 'Send my detailed enquiry' : 'Send enquiry' }
    } else {
      sections[s.id] = head
    }
  }
  const headline = HEADLINE[len](b)
  const words = headline.split(' ')
  const desc = fit(`${b.what} in ${b.city}. Read what is offered, how it works and how to get in touch, then send a short message with your question today.`, spec.seo.descMax)
  return {
    brand: long ? fit(`Shree Venkateshwara ${b.what} and Associates`, 58) : short ? 'Aavya' : b.what,
    seo: { title: fit(`${b.what} in ${b.city} | Details`, spec.seo.titleMax), description: desc },
    hero: {
      eyebrow: short ? undefined : long ? `${b.what} serving ${b.city} and nearby towns` : b.city,
      headline,
      accent: words.length > 2 ? words.slice(0, 2).join(' ') : undefined,
      sub: short ? `Plain answers and a simple way to get in touch in ${b.city}.` : long ? fit(`Read what is offered, how a first visit works and what to keep ready, then send a message. We answer questions in everyday words and agree each step with you before anything begins in ${b.city}.`, 220) : `Read what we offer in ${b.city}, then send a message. We agree each step with you first.`,
      cta: short ? 'Book' : long ? 'Request a callback today' : 'Get in touch',
      secondary: short ? 'See more' : long ? 'Read how the visit works' : 'See what we do',
      imageAlt: ALT, imageBrief: SCENE,
    },
    sections,
  }
}
