import { describe, it, expect } from 'vitest'
import { pickDirection } from './direction-brief'
import { DIRECTION_IDS } from './design-directions'

// Regression set for the deal step: 49 real-world business prompts (many Indian small businesses, plus SaaS/webapp)
// and the directions a human reviewer would accept for each. Built from a batch run on 10 Nov 2026 that found
// plural-matching, weak-keyword and no-signal failures (see docs/web-design-direction-research.md). The acceptable
// sets are judgment calls: when a keyword edit breaks one, decide whether the edit or the expectation is wrong.
type Case = { p: string; ok: string[]; type?: string }
const W = 'website'
const CASES: Case[] = [
  { p: 'Website for my Italian restaurant in Mumbai with online reservations', ok: ['fb-warm-appetite', 'fb-oxblood-pop'] },
  { p: 'Landing page for a yoga studio and wellness retreat in Rishikesh', ok: ['hl-anti-clinical', 'hs-expedition', 'ed-brand-world'] },
  { p: 'Website for a dental clinic in Surat', ok: ['hl-anti-clinical'] },
  { p: 'Portfolio for a wedding photographer in Jaipur', ok: ['dk-studio', 'mn-signal', 'ty-poster', 'ed-brand-world', 're-luxe-video'] },
  { p: 'Site for a boutique hotel in Udaipur', ok: ['re-luxe-video', 'hs-expedition', 'tn-cultural', 'ed-brand-world'] },
  { p: 'Real estate developer, residential township in Pune', ok: ['re-line-drawing', 're-luxe-video'] },
  { p: 'Gym and fitness club in Bangalore, memberships and trainers', ok: ['br-signal-ground', 'br-saturated'] },
  { p: 'Website for an NGO that provides clean drinking water to villages', ok: ['ngo-human-donate'] },
  { p: 'School website with admissions, fees and teacher profiles', ok: ['il-joyful', 'ed-gradient-field', 'ed-brand-world', 'mn-signal'] },
  { p: 'Online store for handmade ceramic mugs and plates', ok: ['ed-brand-world', 'mn-signal', 'ty-poster'] },
  { p: 'Fashion label for sarees and kurtas', ok: ['fa-mono-lookbook', 'ed-brand-world', 're-luxe-video'] },
  { p: 'Steel trading company in Mumbai: TMT bars, sheets, wholesale enquiry', ok: ['co-spec-poster', 'br-signal-ground'] },
  { p: 'Construction company building villas and commercial complexes', ok: ['co-spec-poster', 're-line-drawing', 'br-signal-ground', 're-luxe-video'] },
  { p: 'Chartered accountant firm: GST filing, audit and tax planning', ok: ['lg-wordmark', 'lt-luxe-fintech'] },
  { p: 'Law firm', ok: ['lg-wordmark'] },
  { p: 'Tour operator for Himalayan treks and Ladakh bike trips', ok: ['hs-expedition'] },
  { p: 'Cloud kitchen delivering biryani and kebabs', ok: ['fb-oxblood-pop', 'fb-warm-appetite'] },
  { p: 'Bakery and cake shop', ok: ['fb-warm-appetite', 'fb-oxblood-pop'] },
  { p: 'Museum and heritage walk bookings in Ahmedabad', ok: ['tn-cultural'] },
  { p: 'Music festival website with lineup and tickets', ok: ['tn-cultural', 'ty-poster', 'br-saturated', 'dk-studio', 'br-signal-ground'] },
  { p: 'Developer tool: an API for sending WhatsApp messages', ok: ['dk-instrument', 'mono-dev'] },
  { p: 'SaaS landing page for invoicing software for small businesses', ok: ['lt-luxe-fintech', 'b2b-acid-mono', 'dk-instrument'] },
  { p: 'Landing page for a no-code form builder', ok: ['mn-signal', 'dk-instrument', 'b2b-acid-mono', 'lt-luxe-fintech', 'app-owned-tool', 'mono-dev'] },
  { p: 'Marketplace to rent cameras and gear from local owners', ok: ['mk-photo-grid'] },
  { p: 'Preschool and daycare in Hyderabad', ok: ['il-joyful'] },
  { p: 'Therapy practice for children with autism', ok: ['il-joyful', 'hl-anti-clinical'] },
  { p: "Women's health and fertility clinic", ok: ['hl-anti-clinical'] },
  { p: 'Rice and spices export business', ok: ['ag-earth'] },
  { p: 'Organic farm selling A2 milk, ghee and vegetables', ok: ['ag-earth', 'ed-brand-world'] },
  { p: 'Fertilizer and seed distributor for farmers', ok: ['ag-earth'] },
  { p: 'Management consulting firm for manufacturers', ok: ['lg-wordmark', 'lt-luxe-fintech', 'b2b-acid-mono'] },
  { p: 'Personal website for a freelance designer', ok: ['dk-studio', 'ty-poster', 'mn-signal'] },
  { p: 'Coffee roastery with monthly subscription', ok: ['ed-brand-world', 'fb-warm-appetite', 'ty-poster'] },
  { p: 'Cinema hall and theatre in Pune', ok: ['tn-cultural'] },
  { p: 'Charity fundraising for cancer patients', ok: ['ngo-human-donate', 'hl-anti-clinical'] },
  { p: 'Cricket academy for kids', ok: ['br-saturated', 'il-joyful', 'br-signal-ground'] },
  { p: 'Interior design studio', ok: ['re-line-drawing', 'ed-brand-world', 're-luxe-video', 'mn-signal', 'ty-poster', 'dk-studio'] },
  { p: 'Jewellery brand for bridal sets', ok: ['re-luxe-video', 'ed-brand-world', 'fa-mono-lookbook'] },
  { p: 'Wedding planner in Delhi', ok: ['ed-brand-world', 're-luxe-video', 'ty-poster', 'dk-studio', 'mn-signal', 'hs-expedition'] },
  // apps
  { p: 'Project management tool for engineering teams', ok: ['dk-instrument', 'mono-dev', 'b2b-acid-mono'], type: 'saas' },
  { p: 'Expense and spend management for finance teams', ok: ['b2b-acid-mono', 'lt-luxe-fintech'], type: 'saas' },
  { p: 'Habit tracker', ok: ['app-owned-tool', 'mn-signal', 'ed-brand-world'], type: 'webapp' },
  { p: 'Inventory management for a steel shop', ok: ['b2b-acid-mono', 'dk-instrument', 'mn-signal', 'lt-luxe-fintech'], type: 'webapp' },
  { p: 'Clinic appointment and patient records software', ok: ['mn-signal', 'ed-brand-world', 'b2b-acid-mono', 'lt-luxe-fintech'], type: 'saas' },
  { p: 'Note taking app', ok: ['app-owned-tool', 'mn-signal', 'ed-brand-world'], type: 'webapp' },
  { p: 'Farm produce marketplace for local farmers', ok: ['mk-photo-grid', 'ag-earth'], type: 'webapp' },
  { p: 'CRM for real estate agents', ok: ['b2b-acid-mono', 'lt-luxe-fintech', 'dk-instrument'], type: 'saas' },
  { p: 'Billing app for kirana shops with GST invoices', ok: ['b2b-acid-mono', 'lt-luxe-fintech', 'mn-signal'], type: 'webapp' },
  { p: 'School management ERP', ok: ['b2b-acid-mono', 'lt-luxe-fintech', 'mn-signal'], type: 'saas' },
]

const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

describe('deal fit on real prompts', () => {
  it('every acceptable id is a real direction', () => {
    for (const c of CASES) for (const id of c.ok) expect(DIRECTION_IDS, c.p).toContain(id)
  })

  it.each(CASES.map(c => [c.p, c] as const))('%s', (_p, c) => {
    const SEEDS = 25
    let ok = 0
    const seen: string[] = []
    for (let s = 1; s <= SEEDS; s++) {
      const d = pickDirection(c.p, { projectType: c.type ?? W, rnd: seeded(s) })
      if (c.ok.includes(d.id)) ok++
      else seen.push(d.id)
    }
    expect(ok / SEEDS, `picks outside the accepted set: ${[...new Set(seen)].join(', ')}`).toBeGreaterThanOrEqual(0.9)
  })
})
