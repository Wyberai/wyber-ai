import type { QuoteStatus } from '@/lib/agency/quote'

export interface ProjectLite {
  id: string; name: string; thumbnail_url: string | null; org_id?: string | null; project_type?: string | null
  published_url?: string | null; deployed_url?: string | null; custom_domain?: string | null; custom_domain_verified?: boolean | null
}
export type Review = 'pending' | 'approved' | 'changes_requested'
export interface Deliverable {
  id: string; headline: string | null; description: string | null
  sort_order: number; is_visible: boolean; project_id: string
  review_status: Review | null; reviewed_at: string | null
  delivered_at: string | null; handover_note: string | null
  preview_token?: string | null; preview_enabled?: boolean | null; preview_built_at?: string | null
  projects: ProjectLite | null
}
export interface Feedback { id: string; deliverable_id: string | null; kind: 'approved' | 'changes_requested' | 'comment'; author_name: string | null; body: string | null; resolved: boolean; created_at: string }
export interface Update { id: string; body: string; created_at: string; emailed_at?: string | null }
export interface Pin { id: string; project_id: string; page_path: string; body: string; author_name: string | null; resolved: boolean; created_at: string }
export interface QuoteRow {
  id: string; number: string; title: string; currency: string
  items: Array<{ description: string; qty: number; unit: number }>; total: number
  note: string | null; terms: string | null; recurrence: 'one_time' | 'monthly' | 'yearly'; payment_instructions: string | null; payment_url: string | null
  status: QuoteStatus; sent_at: string | null; responded_at: string | null; responded_by: string | null
  decline_reason: string | null; paid_at: string | null; created_at: string
}
export type Role = 'owner' | 'admin' | 'member' | 'viewer'
export interface Workspace { id: string; name: string; slug: string; role: Role }
export interface ClientRow {
  id: string; name: string; slug: string; company_name: string | null
  contact_email: string | null; contact_name: string | null; logo_url: string | null
  brand_color: string; intro_text: string | null; status: 'lead' | 'active' | 'paused' | 'archived'
  notes: string | null; org_id: string | null; owner_id: string; created_at: string
  has_passcode: boolean; view_count: number | null; last_viewed_at: string | null
  brief_token: string | null; brief: Record<string, string> | null; brief_submitted_at: string | null
  credits_used: number
  client_deliverables: Deliverable[]; client_feedback: Feedback[]; client_updates: Update[]; client_quotes: QuoteRow[]
  _role: Role; _canEdit: boolean; _canDelete: boolean
}

/** What every tab is handed. */
export interface Ctx {
  client: ClientRow
  /** The business behind this client (the workspace's profile or the freelancer's own), for defaults. */
  profile: import('@/lib/agency/profile').AgencyProfile | null
  merge: (p: Partial<ClientRow>) => void
  update: (patch: Record<string, unknown>, okMsg?: string) => Promise<boolean>
  toast: (msg: string, ok?: boolean) => void
  projects: ProjectLite[]
  workspaces: Workspace[]
  pins: Pin[]
  setPins: (fn: (p: Pin[]) => Pin[]) => void
  feedbackModes: Record<string, boolean>
  setFeedbackModes: (fn: (m: Record<string, boolean>) => Record<string, boolean>) => void
  removeClient: () => void
}
