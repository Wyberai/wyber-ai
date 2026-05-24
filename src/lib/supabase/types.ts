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
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  framework: Framework;
  files: Record<string, { path: string; content: string; language: string }>;
  is_public: boolean;
  share_slug: string | null;
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

export const PLAN_LIMITS: Record<Plan, { credits: number; privateProjects: boolean; customDomain: boolean; badge: boolean; collaborators: number }> = {
  free:  { credits: 50,   privateProjects: false, customDomain: false, badge: true,  collaborators: 1 },
  pro:   { credits: 400,  privateProjects: true,  customDomain: true,  badge: false, collaborators: 3 },
  teams: { credits: 1500, privateProjects: true,  customDomain: true,  badge: false, collaborators: 20 },
};
