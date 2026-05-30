-- GitHub connections
CREATE TABLE IF NOT EXISTS public.github_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  github_user_id BIGINT,
  github_username TEXT,
  github_avatar TEXT,
  access_token TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.github_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own GitHub connection" ON public.github_connections
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Version history
CREATE TABLE IF NOT EXISTS public.project_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT,
  files JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own versions" ON public.project_versions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_project ON public.project_versions(project_id, created_at DESC);

-- Supabase provisioned projects
CREATE TABLE IF NOT EXISTS public.supabase_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wyber_project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  supabase_project_id TEXT,
  supabase_url TEXT,
  anon_key TEXT,
  service_key TEXT,
  db_password TEXT,
  status TEXT DEFAULT 'provisioning',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.supabase_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own supabase projects" ON public.supabase_projects
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.github_connections TO authenticated;
GRANT ALL ON public.project_versions TO authenticated;
GRANT ALL ON public.supabase_projects TO authenticated;
