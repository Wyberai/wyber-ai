import { SecurityOverviewClient } from '@/app/dashboard/security/SecurityOverviewClient';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Security — Dashboard' };

export default async function SecurityOverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: projects } = await supabase
    .from('projects')
    .select('id,name,project_type,updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const { data: connectors } = await supabase
    .from('project_connectors')
    .select('project_id')
    .eq('user_id', user.id)
    .eq('service', 'supabase');
  const connectedIds = new Set((connectors ?? []).map((c) => c.project_id));

  interface ScanRow { project_id: string; score: number; critical_count: number; reachable: boolean; method: string; source: string; created_at: string }
  const { data: scans } = await supabase
    .from('security_scans')
    .select('project_id,score,critical_count,reachable,method,source,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  const latestByProject: Record<string, ScanRow> = {};
  for (const s of (scans ?? []) as ScanRow[]) {
    if (!latestByProject[s.project_id]) latestByProject[s.project_id] = s;
  }

  const rows = (projects ?? [])
    .filter((p) => connectedIds.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name || 'Untitled',
      updatedAt: p.updated_at,
      scan: latestByProject[p.id] ?? null,
    }));

  return <SecurityOverviewClient rows={rows} />;
}
