import { DEMO_APPS } from '../app-spec/demo-models'
import type { BuildSpec, SiteCopy } from '../website-spec/types'
import type { SaasModel } from './types'

// DEMO ONLY: stand-ins for what the models write (the product model with its plans, and the site copy). Same rules the validators enforce:
// prices only where the brief states them, sample rows fake and labelled, no claims. Used by the tests and scripts/saas-spec-demo.mjs.

export interface DemoSaas { key: string; prompt: string; seed: string; currency: string; model: SaasModel; copy: DemoCopy }
export interface DemoCopy {
  brand: string
  seoTitle: string
  seoDescription: string
  eyebrow?: string
  headline: string
  accent: string
  sub: string
  cta: string
  secondary: string
  features: { title: string; text: string }[]
  featuresTitle: string
  featuresDescription: string
  steps: { title: string; text: string }[]
  stepsTitle: string
  faq: { question: string; answer: string }[]
  faqTitle: string
  ctaTitle: string
  ctaDescription: string
}

/** Fits the demo copy to the plan: grids need an exact number of items so no row is left short. */
export function demoSiteCopy(spec: BuildSpec, c: DemoCopy): SiteCopy {
  const sections: SiteCopy['sections'] = {}
  for (const s of spec.sections) {
    if (s.kind === 'services') {
      const n = s.variant === 'bento' || s.variant === 'grid' ? 4 : s.variant === 'cards' ? 6 : 5
      sections[s.id] = { title: c.featuresTitle, description: c.featuresDescription, items: c.features.slice(0, n) }
    } else if (s.kind === 'steps') {
      sections[s.id] = { title: c.stepsTitle, items: c.steps.slice(0, 3) }
    } else if (s.kind === 'faq') {
      sections[s.id] = { title: c.faqTitle, description: 'Short answers, written plainly.', faq: c.faq.slice(0, 5) }
    } else if (s.kind === 'cta') {
      sections[s.id] = { title: c.ctaTitle, description: c.ctaDescription, button: c.cta }
    }
  }
  return {
    brand: c.brand,
    seo: { title: c.seoTitle, description: c.seoDescription },
    hero: { eyebrow: c.eyebrow, headline: c.headline, accent: spec.motion.highlight ? c.accent : undefined, sub: c.sub, cta: c.cta, secondary: c.secondary, imageAlt: '' },
    sections,
  }
}

export const DEMO_SAAS: DemoSaas[] = [
  {
    key: 'studio',
    prompt: 'A SaaS for small yoga and pilates studios to run memberships and class bookings. Starter at ₹499 a month and Studio at ₹1,499 a month. Warm and calm feel.',
    seed: 'saas-1',
    currency: '₹',
    model: {
      app: {
        appName: 'Studio Desk',
        tagline: 'Memberships and class bookings for a small studio.',
        homeIntro: 'Keep your members, their renewals and the week of classes in one place, and nudge late renewals on WhatsApp.',
        entities: [
          {
            id: 'members', label: 'Members', singular: 'Member', title: 'name', blurb: 'Everyone who has joined your studio and when their membership renews.',
            status: 'status', finalStatuses: ['Ended'], due: 'renewal', amount: 'fee', contact: 'phone',
            fields: [
              { id: 'name', label: 'Name', type: 'text', required: true },
              { id: 'phone', label: 'Phone', type: 'phone' },
              { id: 'membership', label: 'Membership', type: 'select', options: ['Monthly', '10-class pass', 'Drop-in'] },
              { id: 'status', label: 'Status', type: 'select', options: ['Active', 'Paused', 'Ended'] },
              { id: 'renewal', label: 'Renews on', type: 'date' },
              { id: 'fee', label: 'Fee due', type: 'money' },
              { id: 'notes', label: 'Notes', type: 'longtext' },
            ],
            sample: [
              { name: 'Aarti Menon', phone: '90000 00001', membership: 'Monthly', status: 'Active', renewal: '+9d', fee: 2400 },
              { name: 'Rohan Iyer', phone: '90000 00002', membership: '10-class pass', status: 'Active', renewal: '-4d', fee: 3000 },
              { name: 'Neha Kulkarni', phone: '90000 00003', membership: 'Monthly', status: 'Paused', renewal: '+21d', fee: 0 },
              { name: 'Imran Sheikh', phone: '90000 00004', membership: 'Drop-in', status: 'Ended', renewal: '-30d', fee: 0 },
            ],
          },
          {
            id: 'bookings', label: 'Bookings', singular: 'Booking', title: 'classTitle', blurb: 'Who is booked into which class, and whether they came.',
            status: 'outcome', finalStatuses: ['Attended', 'Cancelled'], due: 'day',
            fields: [
              { id: 'classTitle', label: 'Class', type: 'text', required: true },
              { id: 'member', label: 'Member', type: 'ref', ref: 'members' },
              { id: 'day', label: 'Day', type: 'date' },
              { id: 'time', label: 'Time', type: 'text' },
              { id: 'outcome', label: 'Outcome', type: 'select', options: ['Booked', 'Attended', 'Cancelled'] },
            ],
            sample: [
              { classTitle: 'Morning flow', member: 'Aarti Menon', day: '+1d', time: '07:00', outcome: 'Booked' },
              { classTitle: 'Reformer basics', member: 'Rohan Iyer', day: '+2d', time: '18:30', outcome: 'Booked' },
              { classTitle: 'Morning flow', member: 'Aarti Menon', day: '-3d', time: '07:00', outcome: 'Attended' },
            ],
          },
        ],
        metrics: [
          { id: 'active', label: 'Active members', kind: 'countWhere', entity: 'members', where: { field: 'status', op: 'eq', value: 'Active' } },
          { id: 'late', label: 'Renewals overdue', kind: 'countWhere', entity: 'members', where: { field: 'renewal', op: 'overdue' } },
          { id: 'fees', label: 'Fees due', kind: 'sum', entity: 'members', field: 'fee', money: true },
          { id: 'upcoming', label: 'Classes booked', kind: 'countWhere', entity: 'bookings', where: { field: 'outcome', op: 'eq', value: 'Booked' } },
        ],
      },
      plans: {
        limitEntity: 'members',
        plans: [
          { id: 'starter', name: 'Starter', price: 499, period: 'month', blurb: 'For a studio that is just starting to keep a list.', features: ['Member list with renewal dates', 'Class bookings', 'CSV import and export'], limits: { records: 25, seats: 1 } },
          { id: 'studio', name: 'Studio', price: 1499, period: 'month', blurb: 'For a studio with a team at the desk.', features: ['Member list with renewal dates', 'Class bookings', 'CSV import and export', 'Reminders by WhatsApp link'], limits: { records: 300, seats: 5 } },
        ],
      },
    },
    copy: {
      brand: 'Studio Desk',
      seoTitle: 'Memberships and class bookings for studios | Studio Desk',
      seoDescription: 'Studio Desk keeps your members, their renewals and your class bookings in one place, with a WhatsApp reminder for anyone who is late.',
      eyebrow: 'For small studios',
      headline: 'Know who renews this week, and who is booked into tomorrow.',
      accent: 'renews this week',
      sub: 'Studio Desk keeps members, renewal dates and class bookings together, so the front desk never searches a spreadsheet.',
      cta: 'Try the demo',
      secondary: 'See what it does',
      features: [
        { title: 'Members with renewal dates', text: 'Every member, their membership type and the day it renews, with late ones marked.' },
        { title: 'Class bookings', text: 'Book a member into a class and mark whether they attended or cancelled.' },
        { title: 'WhatsApp reminders', text: 'A pre-filled message for a late renewal, sent by you from your own WhatsApp.' },
        { title: 'Numbers from the rows', text: 'Active members, overdue renewals and fees due are worked out from what you entered.' },
        { title: 'CSV in and out', text: 'Bring your existing list in with a preview first, and export it whenever you like.' },
        { title: 'Undo for deletes', text: 'Delete a row by mistake and restore it from the message that appears.' },
      ],
      featuresTitle: 'What Studio Desk does',
      featuresDescription: 'Six things a front desk does every day, in one tool.',
      steps: [
        { title: 'Add your members', text: 'Type them in or import a CSV from your current list.' },
        { title: 'Book the week', text: 'Put members into classes and mark attendance as they come.' },
        { title: 'Chase renewals', text: 'Open the overdue list and send each reminder from WhatsApp.' },
      ],
      stepsTitle: 'How it works',
      faq: [
        { question: 'Where is my data kept?', answer: 'In your browser on this device. Nothing is sent to a server in the demo, and you can export everything from Settings.' },
        { question: 'Can I try it before paying?', answer: 'Yes. The demo works without an account on a server, with sample data you can remove in one click.' },
        { question: 'How do reminders work?', answer: 'The app opens WhatsApp with a message already written. You press send yourself.' },
        { question: 'Can my staff use it too?', answer: 'You can invite teammates with a link and give each a role: admin, member or viewer.' },
        { question: 'Can I cancel?', answer: 'Yes. You can export your data and delete your account in Settings at any time.' },
      ],
      faqTitle: 'Questions people ask first',
      ctaTitle: 'Open the demo and look around',
      ctaDescription: 'Load the sample studio, add your own first member and see the numbers change.',
    },
  },
  {
    key: 'repairs',
    prompt: 'A SaaS for phone repair shops to track every repair from drop-off to pickup, with a customer update on WhatsApp. Dark, dense and practical.',
    seed: 'saas-2',
    currency: '₹',
    model: {
      app: {
        appName: 'Bench Log',
        tagline: 'Every repair from drop-off to pickup.',
        homeIntro: 'See what is on the bench, what is waiting for a part and what is ready to collect, and message the customer from WhatsApp.',
        entities: [
          {
            id: 'jobs', label: 'Repair jobs', singular: 'Repair job', title: 'customer', blurb: 'Every device in the shop, its stage and the day it was promised.',
            status: 'stage', finalStatuses: ['Collected'], due: 'promised', amount: 'quote', contact: 'phone',
            fields: [
              { id: 'customer', label: 'Customer', type: 'text', required: true },
              { id: 'phone', label: 'Phone', type: 'phone' },
              { id: 'device', label: 'Device', type: 'text' },
              { id: 'fault', label: 'Fault', type: 'text' },
              { id: 'stage', label: 'Stage', type: 'select', options: ['Received', 'Diagnosing', 'Waiting for part', 'Ready', 'Collected'] },
              { id: 'promised', label: 'Promised for', type: 'date' },
              { id: 'quote', label: 'Quote', type: 'money' },
            ],
            sample: [
              { customer: 'Vikram Rao', phone: '90000 00011', device: 'Phone, cracked screen', fault: 'Screen replacement', stage: 'Diagnosing', promised: '+1d', quote: 3200 },
              { customer: 'Sana Qureshi', phone: '90000 00012', device: 'Phone, will not charge', fault: 'Charging port', stage: 'Waiting for part', promised: '-2d', quote: 900 },
              { customer: 'Dev Malhotra', phone: '90000 00013', device: 'Tablet, battery drains', fault: 'Battery', stage: 'Ready', promised: 'today', quote: 1800 },
              { customer: 'Pooja Nair', phone: '90000 00014', device: 'Phone, no sound', fault: 'Speaker', stage: 'Collected', promised: '-6d', quote: 650 },
            ],
          },
          {
            id: 'parts', label: 'Parts', singular: 'Part', title: 'part', blurb: 'What you have ordered for which job, and whether it arrived.',
            status: 'state', finalStatuses: ['Arrived'],
            fields: [
              { id: 'part', label: 'Part', type: 'text', required: true },
              { id: 'job', label: 'For job', type: 'ref', ref: 'jobs' },
              { id: 'supplier', label: 'Supplier', type: 'text' },
              { id: 'state', label: 'State', type: 'select', options: ['Needed', 'Ordered', 'Arrived'] },
            ],
            sample: [
              { part: 'Charging port, type C', job: 'Sana Qureshi', supplier: 'Local supplier', state: 'Ordered' },
              { part: 'Screen assembly', job: 'Vikram Rao', supplier: 'Local supplier', state: 'Needed' },
              { part: 'Speaker module', job: 'Pooja Nair', supplier: 'Local supplier', state: 'Arrived' },
            ],
          },
        ],
        metrics: [
          { id: 'bench', label: 'On the bench', kind: 'countWhere', entity: 'jobs', where: { field: 'stage', op: 'neq', value: 'Collected' } },
          { id: 'late', label: 'Past the promised day', kind: 'countWhere', entity: 'jobs', where: { field: 'promised', op: 'overdue' } },
          { id: 'ready', label: 'Ready to collect', kind: 'countWhere', entity: 'jobs', where: { field: 'stage', op: 'eq', value: 'Ready' } },
          { id: 'quoted', label: 'Quoted value', kind: 'sum', entity: 'jobs', field: 'quote', money: true },
        ],
      },
      plans: {
        limitEntity: 'jobs',
        plans: [
          { id: 'starter', name: 'Starter', price: null, period: 'month', blurb: 'For one bench and one person at the counter.', features: ['Repair jobs with stages', 'Parts list per job', 'CSV import and export'], limits: { records: 30, seats: 1 } },
          { id: 'shop', name: 'Shop', price: null, period: 'month', blurb: 'For a shop with a few technicians.', features: ['Repair jobs with stages', 'Parts list per job', 'CSV import and export', 'Reminders by WhatsApp link'], limits: { records: 500, seats: 4 } },
          { id: 'chain', name: 'Chain', price: null, period: 'month', blurb: 'For several counters under one owner.', features: ['Everything in Shop', 'No limit on repair jobs', 'No limit on team members'], limits: { records: null, seats: null } },
        ],
      },
    },
    copy: {
      brand: 'Bench Log',
      seoTitle: 'Repair job tracking for phone repair shops | Bench Log',
      seoDescription: 'Bench Log tracks every phone repair from drop-off to pickup, shows what is waiting for a part and opens a WhatsApp update for the customer.',
      eyebrow: 'For repair shops',
      headline: 'Every device on your bench, from drop-off to pickup.',
      accent: 'drop-off to pickup',
      sub: 'Bench Log shows what is being fixed, what is waiting for a part and what is ready, so nobody at the counter has to ask the technician.',
      cta: 'Try the demo',
      secondary: 'See what it does',
      features: [
        { title: 'A stage for every job', text: 'Received, diagnosing, waiting for a part, ready and collected, changed with one button.' },
        { title: 'Parts per job', text: 'Note which part you ordered for which repair and whether it has arrived.' },
        { title: 'Promised days', text: 'Jobs past the day you promised are marked, so the late ones are never a surprise.' },
        { title: 'WhatsApp updates', text: 'A pre-filled message when a repair is ready, sent from your own WhatsApp.' },
        { title: 'Quotes added up', text: 'The quoted value of open jobs is worked out from the rows you entered.' },
        { title: 'CSV in and out', text: 'Import your existing list with a preview first and export it any time.' },
      ],
      featuresTitle: 'What Bench Log does',
      featuresDescription: 'The things a repair counter does all day, in one place.',
      steps: [
        { title: 'Log the device', text: 'Name, phone, device and fault when it comes in.' },
        { title: 'Move it along', text: 'Change the stage as the repair progresses and note the parts.' },
        { title: 'Tell the customer', text: 'Open the WhatsApp message for a ready job and send it.' },
      ],
      stepsTitle: 'How it works',
      faq: [
        { question: 'Where is my data kept?', answer: 'In your browser on this device. Nothing is sent to a server in the demo, and Settings has an export button.' },
        { question: 'Do customers get automatic messages?', answer: 'No. The app prepares the WhatsApp message and you press send.' },
        { question: 'Can several people use it?', answer: 'Yes. Invite teammates with a link and give each a role.' },
        { question: 'What does it cost?', answer: 'Prices are not set yet. The plans below show the limits each one will have.' },
        { question: 'Can I leave with my data?', answer: 'Yes. Export your data and delete your account in Settings.' },
      ],
      faqTitle: 'Questions people ask first',
      ctaTitle: 'Open the demo and log a repair',
      ctaDescription: 'Load the sample bench, add your own first job and see the numbers change.',
    },
  },
  {
    key: 'khata',
    prompt: 'A SaaS for kirana shop owners to write bills, see who owes how much and send a WhatsApp reminder to late payers. Simple and clean.',
    seed: 'saas-3',
    currency: '₹',
    model: {
      app: DEMO_APPS[0].model,
      plans: {
        limitEntity: 'bills',
        plans: [
          { id: 'free', name: 'Starter', price: null, period: 'month', blurb: 'For one shop and one person at the counter.', features: ['Bills with line items', 'Who owes what', 'CSV import and export'], limits: { records: 40, seats: 1 } },
          { id: 'shop', name: 'Shop', price: null, period: 'month', blurb: 'For a busy shop with family or staff helping.', features: ['Bills with line items', 'Who owes what', 'CSV import and export', 'Reminders by WhatsApp link'], limits: { records: 1000, seats: 5 } },
        ],
      },
    },
    copy: {
      brand: 'Kirana Khata',
      seoTitle: 'Bills and udhaar book for kirana shops | Kirana Khata',
      seoDescription: 'Kirana Khata lets a shop write bills, see who still owes money and open a WhatsApp reminder for late payers, all in one simple book.',
      eyebrow: 'For kirana shops',
      headline: 'Write the bill, see who owes you and send the reminder.',
      accent: 'who owes you',
      sub: 'Kirana Khata replaces the paper udhaar book with bills, balances and WhatsApp reminders that stay on your own phone.',
      cta: 'Try the demo',
      secondary: 'See what it does',
      features: [
        { title: 'Bills with items', text: 'Add each item to a bill and the total is worked out from the lines.' },
        { title: 'Who still owes', text: 'See every unpaid and part-paid bill, with late ones marked.' },
        { title: 'WhatsApp reminders', text: 'A pre-filled reminder for a late payer, sent from your own WhatsApp.' },
        { title: 'Numbers from the rows', text: 'Unpaid amount and late bills are worked out from what you entered.' },
        { title: 'CSV in and out', text: 'Move your existing list in with a preview first and export it any time.' },
        { title: 'Undo for deletes', text: 'Delete by mistake and restore from the message that appears.' },
      ],
      featuresTitle: 'What Kirana Khata does',
      featuresDescription: 'The things a counter does every day, in one book.',
      steps: [
        { title: 'Write a bill', text: 'Customer, items and the day it is due.' },
        { title: 'Mark payments', text: 'Change the status when money comes in.' },
        { title: 'Remind late payers', text: 'Open the WhatsApp message and press send.' },
      ],
      stepsTitle: 'How it works',
      faq: [
        { question: 'Where is my data kept?', answer: 'In your browser on this device. Nothing is sent to a server in the demo. Settings has an export button.' },
        { question: 'Does it message customers by itself?', answer: 'No. It prepares the message and you press send.' },
        { question: 'Can my family use it too?', answer: 'Yes. Invite them with a link and give each a role.' },
        { question: 'What does it cost?', answer: 'Prices are not set yet. The plans below show the limits each will have.' },
        { question: 'Can I take my data with me?', answer: 'Yes. Export it and delete your account in Settings.' },
      ],
      faqTitle: 'Questions people ask first',
      ctaTitle: 'Open the demo and write a bill',
      ctaDescription: 'Load the sample shop, add your own first bill and watch the totals change.',
    },
  },
]
