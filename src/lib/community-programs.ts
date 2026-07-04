// Single source of truth for the community-program rewards — shared by the
// public submit route (/api/community-programs) and the admin review route
// (/api/admin/community/review) so credit amounts can't drift between them.

export type ProgramId =
  | 'build_in_public'
  | 'follow_linkedin'
  | 'follow_reddit'
  | 'review_producthunt'
  | 'blood_donor'
  | 'accessibility'
  | 'open_source'

export type ProgramConfig = {
  label: string
  credits: number               // flat credits granted on approval (0 for discounts)
  kind: 'credits' | 'discount'  // discounts are applied manually (Dodo coupon)
  note: string
}

export const COMMUNITY_PROGRAMS: Record<ProgramId, ProgramConfig> = {
  build_in_public:    { label: 'Build in Public',        credits: 50, kind: 'credits',  note: '50 bonus credits' },
  follow_linkedin:    { label: 'Follow on LinkedIn',     credits: 25, kind: 'credits',  note: '25 bonus credits' },
  follow_reddit:      { label: 'Follow on Reddit',       credits: 25, kind: 'credits',  note: '25 bonus credits' },
  review_producthunt: { label: 'Product Hunt review',    credits: 50, kind: 'credits',  note: '50 bonus credits' },
  blood_donor:        { label: 'Blood Donor',            credits: 0,  kind: 'discount', note: '50% extra on next top-up' },
  accessibility:      { label: 'Accessibility',          credits: 0,  kind: 'discount', note: '50% off any plan' },
  open_source:        { label: 'Open Source Builder',    credits: 0,  kind: 'discount', note: '30% off any plan' },
}

export const isProgramId = (v: string): v is ProgramId => v in COMMUNITY_PROGRAMS
