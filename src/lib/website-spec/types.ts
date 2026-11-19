// Website build spec (19 Nov 2026). Layered plan -> one JSON spec -> code renders it with the Wyber UI kit.
// Everything in this folder is pure and deterministic EXCEPT the copy, which a model writes into slots (see copy.ts).

export type IntentId =
  | 'local-service' | 'food' | 'catalogue' | 'store' | 'portfolio' | 'firm'
  | 'education' | 'event' | 'community' | 'listings' | 'product' | 'publication' | 'stay'

/** Cross-cutting capabilities an intent switches on by default. The prompt can add or remove them. */
export type ModuleId = 'enquiry' | 'whatsapp' | 'language' | 'map' | 'catalogue' | 'checkout' | 'booking' | 'newsletter'
/** Modules the renderer can build today. A planned module outside this list is reported, never faked. */
export const SUPPORTED_MODULES: readonly ModuleId[] = ['enquiry', 'whatsapp', 'map', 'catalogue']

import type { LangId, OwnerFacts } from '../build-spec/types'
export type { LangId, OwnerFacts }

export interface IntentBrief {
  intent: IntentId
  /** 0..1. Below 0.5 the plan falls back to the local-service blueprint and says so. */
  confidence: number
  industry: string
  goalAction: string
  modules: ModuleId[]
  facts: OwnerFacts
  /** Modules the intent wanted that the renderer cannot build yet. Shown in the summary, never faked. */
  unsupported: ModuleId[]
  note?: string
}

export type SectionKind = 'services' | 'rows' | 'steps' | 'about' | 'faq' | 'visit' | 'contact' | 'cta'

export interface BlueprintSection {
  id: string
  kind: SectionKind
  /** Navigation label. Omit for sections that should not appear in the header. */
  nav?: string
  /** What the section is for. Goes to the copy writer, so it writes the right thing. */
  purpose: string
  /** Facts that must exist for the section to be included. */
  needs?: (keyof OwnerFacts)[]
}

export interface Blueprint {
  id: IntentId
  label: string
  goalAction: string
  sections: BlueprintSection[]
  defaultModules: ModuleId[]
  /** schema.org type unless the industry maps to a more specific one. */
  schemaType: string
  faqSeeds: string[]
  proof: string
}

export type HeroVariant = 'split' | 'editorial' | 'stacked'
export type HeaderVariant = 'navbar' | 'condensing'
export type ServicesVariant = 'cards' | 'list' | 'bento'

export interface ImageSlot {
  id: string
  /** Style only (from the design direction). The subject comes from the copy writer, see SiteCopy imageBrief. */
  brief: string
  ratio: string
  eager: boolean
  /** Where the alt text comes from in the copy: 'hero.imageAlt' or 'about.imageAlt'. */
  altFrom: 'hero' | 'about'
}

export interface PlannedSection extends BlueprintSection {
  variant?: ServicesVariant
  /** Exact number of items the copy must have, so grids never leave an orphan row. */
  count: { min: number; max: number }
}

export interface SeoPlan {
  schemaType: string
  slug: string
  titleMax: number
  descMin: number
  descMax: number
  faqSchema: boolean
}

/** Structure choices that make two sites with the same blueprint read differently. Seeded, biased by the direction. */
export interface LayoutPlan {
  heroFlip: boolean
  heroMediaFirst: boolean
  rhythm: 'bands' | 'rules' | 'plain'
  steps: 'columns' | 'timeline'
  faq: 'centered' | 'split'
  contactFlip: boolean
  aboutFlip: boolean
}
export const DEFAULT_LAYOUT: LayoutPlan = { heroFlip: false, heroMediaFirst: false, rhythm: 'bands', steps: 'columns', faq: 'centered', contactFlip: false, aboutFlip: false }

/** What moves, decided from the direction's own motion notes. Nothing here loops, and everything respects reduced motion. */
export interface MotionPlan {
  /** Sections ease in as they enter (Reveal). False for directions whose notes say nothing moves. */
  reveal: boolean
  /** Card grids and steps arrive one after another (Stagger). */
  stagger: boolean
  /** A thin reading-progress bar along the top of the page. */
  progress: boolean
  /** One headline phrase gets an underline-marker that draws in once. */
  highlight: boolean
  /** The first paragraph of the about section opens with a drop cap. */
  dropCap: boolean
  /** A call-to-action bar slides up after the first screen (only when there is a contact path). */
  stickyCta: boolean
  backToTop: boolean
}
export const DEFAULT_MOTION: MotionPlan = { reveal: true, stagger: true, progress: false, highlight: false, dropCap: false, stickyCta: false, backToTop: true }

/** Languages the site offers. English is always first; the rest are written by a translation step. */

export interface BuildSpec {
  version: 1
  /** Optional so specs saved before these fields existed still render. */
  layout?: LayoutPlan
  languages?: LangId[]
  brief: IntentBrief
  direction: { id: string; name: string; group: string; mode: 'light' | 'dark'; heroMedia: string }
  header: HeaderVariant
  hero: HeroVariant
  motion: MotionPlan
  sections: PlannedSection[]
  images: ImageSlot[]
  seo: SeoPlan
}

export interface CopyItem { title: string; text: string; meta?: string }
export interface FaqItem { question: string; answer: string }

export interface SectionCopy {
  eyebrow?: string
  title: string
  description?: string
  items?: CopyItem[]
  faq?: FaqItem[]
  paragraphs?: string[]
  button?: string
  imageAlt?: string
  imageBrief?: string
}

export interface SiteCopy {
  brand: string
  /** Navigation labels by section id. Filled for English from the blueprint; a translation carries its own. */
  nav?: Record<string, string>
  seo: { title: string; description: string }
  hero: { eyebrow?: string; headline: string; sub: string; cta: string; secondary: string; imageAlt: string; imageBrief?: string; accent?: string }
  sections: Record<string, SectionCopy>
}
