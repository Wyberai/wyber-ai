// Server-side orchestration that turns a stored project's files into a launch-
// readiness scan. Mirrors rls-scan-project.ts's split (pure logic in
// launch-readiness.ts, DB orchestration here) so the on-demand scan API and
// any future call site (e.g. a chat-triggered pre-publish check) judge
// "is this app ready to launch?" identically.

import type { SupabaseClient } from '@supabase/supabase-js'
import { scanLaunchReadiness, type ReadinessReport } from './launch-readiness'

export interface ProjectReadinessResult {
  found: boolean // the project exists and is owned by this user
  report?: ReadinessReport
}

export async function runProjectLaunchReadinessScan(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  source: 'manual' | 'publish-gate' = 'manual',
): Promise<ProjectReadinessResult> {
  const { data: project } = await supabase
    .from('projects')
    .select('files, last_security_score')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()
  if (!project) return { found: false }

  const report = scanLaunchReadiness(project.files || {}, {
    securityScore: project.last_security_score ?? undefined,
  })

  // Persist to scan history — best-effort, same posture as security_scans:
  // a missing table (migration not yet applied) must never break the scan.
  try {
    await supabase.from('launch_readiness_scans').insert({
      project_id: projectId,
      user_id: userId,
      score: report.score,
      critical_count: report.checks.filter((c) => c.severity === 'critical').length,
      checks: report.checks,
      source,
    })
  } catch { /* history is non-critical */ }

  return { found: true, report }
}
