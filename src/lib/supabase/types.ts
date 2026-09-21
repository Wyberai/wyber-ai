export type Plan = 'free' | 'pro' | 'teams';
export type Framework = 'react-vite' | 'vue' | 'vanilla' | 'next';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  credits: number;
  credits_reset_at: string;
  stripe_customer_id: string | null;
  github_token: string | null;
  referred_by?: string | null;
  affiliate_pending_usd?: number;
  affiliate_paid_usd?: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  org_id?: string | null;
  client_id?: string | null;
  name: string;
  description: string | null;
  framework: Framework;
  files: Record<string, { path: string; content: string; language: string }>;
  is_public: boolean;
  share_slug: string | null;
  subdomain: string | null;
  published_url: string | null;
  thumbnail_url: string | null;
  deployed_url: string | null;
  vercel_project_id: string | null;
  custom_domain: string | null;
  github_repo: string | null;
  github_branch: string;
  last_commit_sha: string | null;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  project_id: string | null;
  user_id: string;
  org_id?: string | null;
  prompt: string;
  response_text: string | null;
  files_changed: string[] | null;
  prompt_tokens: number;
  completion_tokens: number;
  credits_used: number;
  sandbox_ms: number;
  status: 'success' | 'error';
  error_msg: string | null;
  created_at: string;
}

// ── Enterprise/org-scoping (additive — see migrations 038-042) ──────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: 'free' | 'pro' | 'enterprise';
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  custom_domain: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  org_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invited_via: 'manual' | 'sso' | 'scim';
  created_at: string;
}

export interface AuditLog {
  id: string;
  org_id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  before_state: unknown;
  after_state: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface OrgSsoConnection {
  id: string;
  org_id: string;
  workos_org_id: string;
  workos_connection_id: string | null;
  domain: string | null;
  status: 'pending' | 'active' | 'disabled';
  created_at: string;
  updated_at: string;
}

// ── Client delivery pages (additive — see migrations 20260921000000/010000) ─

export interface Client {
  id: string;
  owner_id: string;
  org_id?: string | null; // see 20260923000000_clients_org_scoping.sql
  name: string;
  slug: string;
  company_name: string | null;
  contact_email: string | null;
  contact_name: string | null;
  logo_url: string | null;
  brand_color: string;
  intro_text: string | null;
  status: 'lead' | 'active' | 'paused' | 'archived';
  consultation_meeting_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientDeliverable {
  id: string;
  client_id: string;
  project_id: string;
  headline: string | null;
  description: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
}

// ── Self-serve affiliates (additive — see migration 20260922000000) ────────

export interface Affiliate {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  payout_email: string | null;
  payout_method: string | null;
  applied_at: string;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  referred_user_id: string | null;
  dodo_event_type: string;
  dodo_payment_id: string | null;
  plan_key: string | null;
  charge_usd: number;
  commission_rate: number;
  commission_usd: number;
  status: 'pending' | 'paid' | 'reversed';
  created_at: string;
  updated_at: string;
}

export const PLAN_LIMITS: Record<Plan, { credits: number; privateProjects: boolean; customDomain: boolean; badge: boolean; collaborators: number }> = {
  free:  { credits: 50,   privateProjects: false, customDomain: false, badge: true,  collaborators: 1 },
  pro:   { credits: 1200, privateProjects: true,  customDomain: true,  badge: false, collaborators: 3 },
  teams: { credits: 3000, privateProjects: true,  customDomain: true,  badge: false, collaborators: 20 },
};