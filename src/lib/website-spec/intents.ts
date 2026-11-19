import type { Blueprint, IntentBrief, IntentId, ModuleId, OwnerFacts } from './types'
import { SUPPORTED_MODULES } from './types'

const S = (id: string, kind: Blueprint['sections'][number]['kind'], purpose: string, nav?: string, needs?: (keyof OwnerFacts)[]) =>
  ({ id, kind, purpose, nav, needs })

const FAQ_SECTION = S('faq', 'faq', 'Questions people really ask before getting in touch, answered first-sentence-direct, generally, with no guarantees', 'Questions')
const CONTACT = S('contact', 'contact', 'A short enquiry form and the quickest way to reach the owner', 'Contact', ['email'])

export const BLUEPRINTS: Record<IntentId, Blueprint> = {
  'local-service': {
    id: 'local-service', label: 'Local service', goalAction: 'call, WhatsApp or book', schemaType: 'LocalBusiness',
    defaultModules: ['enquiry', 'whatsapp', 'map'],
    sections: [
      S('services', 'services', 'What the business does, one concrete line each', 'What we do'),
      S('how', 'steps', 'What happens from first contact to the first visit', 'How it works'),
      S('about', 'about', 'Why people choose this kind of business: approach and care, no invented facts'),
      FAQ_SECTION,
      S('visit', 'visit', 'Where to find the business and when', 'Visit'),
      CONTACT,
    ],
    faqSeeds: ['What should I bring?', 'How do I book?', 'Where are you?', 'How long does a visit take?'],
    proof: 'contact works, no invented claims',
  },
  food: {
    id: 'food', label: 'Food and hospitality', goalAction: 'order, reserve or visit', schemaType: 'Restaurant',
    defaultModules: ['enquiry', 'whatsapp', 'map', 'catalogue'],
    sections: [
      S('menu', 'rows', 'What is made here, one line each, no prices unless given', 'Menu'),
      S('how', 'steps', 'How ordering or reserving works', 'How it works'),
      S('about', 'about', 'The kitchen and the people, without invented history'),
      FAQ_SECTION,
      S('visit', 'visit', 'Where and when', 'Visit'),
      CONTACT,
    ],
    faqSeeds: ['Do you take custom orders?', 'How far ahead should I order?', 'Do you deliver?', 'Can you cater for allergies?'],
    proof: 'menu is only what the owner gave; map opens',
  },
  catalogue: {
    id: 'catalogue', label: 'Catalogue and enquiry', goalAction: 'request a quote', schemaType: 'Organization',
    defaultModules: ['enquiry', 'whatsapp', 'catalogue'],
    sections: [
      S('range', 'rows', 'The product range, one line each, with the specification a buyer asks first', 'Range'),
      S('buyers', 'services', 'Who the business supplies and how', 'Who we supply'),
      S('quote', 'steps', 'How a quote works, from enquiry to dispatch', 'Get a quote'),
      FAQ_SECTION,
      CONTACT,
    ],
    faqSeeds: ['What is the minimum order?', 'Do you ship?', 'Can I get samples?', 'How is quality checked?'],
    proof: 'every product has an enquiry path; no made-up specs',
  },
  store: {
    id: 'store', label: 'Online store', goalAction: 'buy', schemaType: 'Store',
    defaultModules: ['enquiry', 'catalogue', 'checkout'],
    sections: [
      S('shop', 'rows', 'What is on sale, one line each', 'Shop'),
      S('how', 'steps', 'How ordering and delivery work', 'How it works'),
      FAQ_SECTION,
      CONTACT,
    ],
    faqSeeds: ['How long does delivery take?', 'Can I return an item?', 'How do I pay?', 'Do you ship everywhere?'],
    proof: 'test payment passes; price lives in one file',
  },
  portfolio: {
    id: 'portfolio', label: 'Portfolio and personal brand', goalAction: 'hire me', schemaType: 'ProfessionalService',
    defaultModules: ['enquiry', 'whatsapp'],
    sections: [
      S('work', 'rows', 'Selected work, only what the owner described', 'Work'),
      S('services', 'services', 'What the owner does for clients', 'Services'),
      S('about', 'about', 'Who the owner is and how they work', 'About'),
      CONTACT,
    ],
    faqSeeds: [],
    proof: 'case studies only with real outcomes',
  },
  firm: {
    id: 'firm', label: 'Professional firm', goalAction: 'book a consultation', schemaType: 'ProfessionalService',
    defaultModules: ['enquiry', 'whatsapp', 'map'],
    sections: [
      S('areas', 'services', 'Practice areas, one plain line each', 'Practice areas'),
      S('how', 'steps', 'How an engagement works', 'How we work'),
      S('about', 'about', 'Approach and who clients deal with, no outcomes promised'),
      FAQ_SECTION,
      S('visit', 'visit', 'Where and when', 'Visit'),
      CONTACT,
    ],
    faqSeeds: ['How do I book a consultation?', 'What documents should I bring?', 'How are fees decided?'],
    proof: 'no guarantees or outcomes promised',
  },
  education: {
    id: 'education', label: 'Education and coaching', goalAction: 'enrol or book a demo', schemaType: 'EducationalOrganization',
    defaultModules: ['enquiry', 'whatsapp'],
    sections: [
      S('learn', 'services', 'What students learn, grouped plainly', 'What you learn'),
      S('batches', 'rows', 'Batches or formats, only if the owner gave them', 'Batches', ['hours']),
      S('start', 'steps', 'How to start: demo class, enrolment, first week', 'How to start'),
      FAQ_SECTION,
      CONTACT,
    ],
    faqSeeds: ['Is there a demo class?', 'Who are the classes for?', 'How are doubts handled?', 'How do I enrol?'],
    proof: 'result claims only if given',
  },
  event: {
    id: 'event', label: 'Event or campaign', goalAction: 'register', schemaType: 'Event',
    defaultModules: ['enquiry', 'map'],
    sections: [
      S('agenda', 'rows', 'What happens, in order, only what the owner gave', 'Agenda'),
      S('expect', 'steps', 'What to expect on the day, in order, only what the owner gave', 'What to expect'),
      S('about', 'about', 'Who it is for and why to come'),
      S('visit', 'visit', 'Venue and date', 'Venue'),
      FAQ_SECTION,
      CONTACT,
    ],
    faqSeeds: ['Who can attend?', 'Is entry free?', 'Where is the venue?'],
    proof: 'date and venue match everywhere; registration reaches owner',
  },
  community: {
    id: 'community', label: 'Community and non-profit', goalAction: 'join or donate', schemaType: 'Organization',
    defaultModules: ['enquiry', 'whatsapp'],
    sections: [
      S('about', 'about', 'The mission in plain words'),
      S('programmes', 'services', 'What the group does', 'What we do'),
      S('join', 'steps', 'How to take part', 'Join'),
      FAQ_SECTION,
      CONTACT,
    ],
    faqSeeds: ['How can I help?', 'Who runs this?', 'Is it open to everyone?'],
    proof: 'donate link is real or hidden',
  },
  listings: {
    id: 'listings', label: 'Listings', goalAction: 'enquire on an item', schemaType: 'LocalBusiness',
    defaultModules: ['enquiry', 'whatsapp', 'catalogue'],
    sections: [
      S('featured', 'rows', 'Featured listings, only those the owner described', 'Listings'),
      S('how', 'steps', 'How an enquiry becomes a viewing or booking', 'How it works'),
      FAQ_SECTION,
      CONTACT,
    ],
    faqSeeds: ['How do I arrange a viewing?', 'What documents are needed?', 'Are there fees?'],
    proof: 'filters change results; each item has its own URL',
  },
  product: {
    id: 'product', label: 'Product landing', goalAction: 'try or sign up', schemaType: 'SoftwareApplication',
    defaultModules: ['enquiry'],
    sections: [
      S('features', 'services', 'What the product does, one benefit each', 'Features'),
      S('how', 'steps', 'How it works in three or four steps', 'How it works'),
      FAQ_SECTION,
      S('cta', 'cta', 'One closing call to action'),
    ],
    faqSeeds: ['Who is it for?', 'How do I start?', 'Is my data private?'],
    proof: 'pricing from one plans file; no invented customers',
  },
  publication: {
    id: 'publication', label: 'Publication', goalAction: 'read or subscribe', schemaType: 'Blog',
    defaultModules: ['newsletter'],
    sections: [
      S('latest', 'rows', 'Latest pieces, only those the owner described', 'Latest'),
      S('about', 'about', 'What the publication is and who writes it', 'About'),
      CONTACT,
    ],
    faqSeeds: [],
    proof: 'each article has URL, date, author',
  },
}

// Keyword evidence per intent. Order matters only for ties. Words are matched as whole words, case-insensitive.
const RULES: { id: IntentId; w: [RegExp, number][] }[] = [
  { id: 'food', w: [[/\b(bakery|cafe|café|restaurant|kitchen|menu|sourdough|cakes?|catering|dhaba|tiffin|sweets?|mithai|brunch|bistro|bar)\b/, 3], [/\b(food|chef|dessert|pizza|coffee)\b/, 2]] },
  { id: 'local-service', w: [[/\b(clinic|dentist|dental|salon|spa|physio|physiotherapist|doctor|repair|plumber|electrician|laundry|tutor|gym|studio|mechanic|vet|pharmacy)\b/, 3], [/\b(appointments?|booking|book)\b/, 1]] },
  { id: 'catalogue', w: [[/\b(wholesale|manufacturer|exporter|export|supplier|catalogue|catalog|steel|rice|textiles?|fabrics?|bulk|trader|distributor|industrial)\b/, 3], [/\b(quote|enquiry|inquiry|moq)\b/, 2]] },
  { id: 'store', w: [[/\b(online store|e-?commerce|webshop|shop online|checkout|cart|sells? online)\b/, 4]] },
  { id: 'portfolio', w: [[/\b(portfolio|freelance|freelancer|photographer|designer|developer|illustrator|my work|personal (site|brand|website))\b/, 3]] },
  { id: 'firm', w: [[/\b(law firm|lawyers?|advocates?|attorney|family law|chartered accountant|ca firm|architects?|consultancy|consultant|notary|accounting|tax)\b/, 4]] },
  { id: 'education', w: [[/\b(coaching|institute|classes|tuition|academy|course|jee|neet|school|training|batches|curriculum|students?)\b/, 3]] },
  { id: 'event', w: [[/\b(expo|conference|summit|festival|webinar|workshop|launch event|meetup|wedding|fest|hackathon)\b/, 3], [/\b(register|registration|agenda|venue|talks?|speakers?|sessions?|demos?|two-day|three-day|one-day)\b/, 2]] },
  { id: 'community', w: [[/\b(ngo|non-?profit|charity|temple|trust|foundation|community|society|club|donate|volunteer)\b/, 3]] },
  { id: 'listings', w: [[/\b(real estate|listings?|rentals?|flats?|homes? for|travel|tours?|jobs? board)\b/, 3], [/\b(property|properties|rooms?)\b/, 2]] },
  { id: 'product', w: [[/\b(saas|app landing|landing page|software|platform for|tool for|our app)\b/, 3], [/\b(startup)\b/, 1]] },
  { id: 'publication', w: [[/\b(blog|magazine|newsletter|news|publication|articles?|podcast)\b/, 3]] },
]

const INDUSTRY_WORDS = /\b(dental|dentist|clinic|bakery|sourdough|cafe|café|restaurant|salon|spa|physio\w*|gym|steel|rice|textiles?|coaching|tuition|law|lawyer|architect|photograph\w*|real estate|property|ngo|temple|jee|neet|repair|plumb\w*|travel|wedding|software|school)\b/

function detectModules(prompt: string, intent: IntentId): ModuleId[] {
  const p = prompt.toLowerCase()
  const set = new Set<ModuleId>(BLUEPRINTS[intent].defaultModules)
  if (/\bwhatsapp\b/.test(p)) set.add('whatsapp')
  if (/\b(hindi|gujarati|marathi|tamil|bilingual|two languages|multilingual)\b/.test(p)) set.add('language')
  if (/\b(book(ing)?|appointments?|reserve|reservation|schedule)\b/.test(p) && intent !== 'event') set.add('booking')
  if (/\b(checkout|cart|pay online|online payment|sell online|buy online)\b/.test(p)) set.add('checkout')
  if (/\b(newsletter|subscribe)\b/.test(p)) set.add('newsletter')
  if (/\b(no whatsapp|without whatsapp)\b/.test(p)) set.delete('whatsapp')
  return [...set]
}

export function classifyIntent(prompt: string, facts: OwnerFacts = {}): IntentBrief {
  const p = (prompt || '').toLowerCase()
  const scores = RULES.map(r => ({ id: r.id, s: r.w.reduce((n, [re, w]) => n + (re.test(p) ? w : 0), 0) }))
    .sort((a, b) => b.s - a.s)
  const top = scores[0]
  const second = scores[1]
  let intent: IntentId = top.s > 0 ? top.id : 'local-service'
  // confidence: how strong the top signal is and how clearly it beats the runner-up
  const strength = Math.min(1, top.s / 6)
  const margin = top.s === 0 ? 0 : Math.min(1, (top.s - (second?.s ?? 0)) / Math.max(top.s, 1))
  const confidence = top.s === 0 ? 0.2 : Math.round((0.5 * strength + 0.5 * margin) * 100) / 100
  let note: string | undefined
  if (confidence < 0.5) { intent = 'local-service'; note = 'Intent unclear, using the general local-business plan.' }
  let modules = detectModules(prompt, intent)
  const unsupported = modules.filter(m => !SUPPORTED_MODULES.includes(m))
  if (intent === 'store' && unsupported.includes('checkout')) {
    // checkout is not built yet: plan it as a catalogue with enquiry, and say so
    intent = 'catalogue'
    modules = detectModules(prompt, intent)
    note = 'Online checkout is not built yet, so this is planned as a catalogue with enquiries.'
  }
  const industry = p.match(INDUSTRY_WORDS)?.[1] ?? BLUEPRINTS[intent].label.toLowerCase()
  return {
    intent, confidence, industry, goalAction: BLUEPRINTS[intent].goalAction,
    modules: modules.filter(m => SUPPORTED_MODULES.includes(m)),
    unsupported: [...new Set(modules.filter(m => !SUPPORTED_MODULES.includes(m)))],
    facts, note,
  }
}
