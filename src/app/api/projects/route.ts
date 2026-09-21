import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
import { getOrgRole, canEditOrgProject } from '@/lib/org-access';

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId, files, expectedUpdatedAt } = await req.json();
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

  // Multi-tab conflict guard (optimistic concurrency): the client sends the
  // `updated_at` it last saw. If that no longer matches the row, someone else
  // (another tab, another session) saved in between — this write would
  // silently clobber their changes with no signal to anyone, a real
  // last-writer-wins data-loss bug for two tabs open on the same project.
  // Callers that omit expectedUpdatedAt (support mode, older clients) get the
  // old unconditional-overwrite behavior — this is additive, not a breaking
  // change to the endpoint's contract.
  const nowIso = new Date().toISOString()

  // Support mode: allowlisted admins save to any project (remote-fixing a
  // stuck customer). Everyone else stays strictly ownership-scoped.
  if (isAdminEmail(user.email)) {
    const admin = await createAdminClient();
    let query = admin.from('projects').update({ files, updated_at: nowIso }).eq('id', projectId)
    if (expectedUpdatedAt) query = query.eq('updated_at', expectedUpdatedAt)
    const { data, error } = await query.select('id, updated_at')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (expectedUpdatedAt && (!data || data.length === 0)) {
      const { data: current } = await admin.from('projects').select('updated_at').eq('id', projectId).maybeSingle()
      return NextResponse.json({ error: 'Conflict: this project was modified elsewhere', conflict: true, currentUpdatedAt: current?.updated_at }, { status: 409 })
    }
    return NextResponse.json({ ok: true, supportMode: true, updatedAt: nowIso });
  }

  // Access check, done BEFORE any write. RLS (042_org_scoped_rls.sql) already
  // lets an org member's session client read an org-scoped project, so a
  // stranger's project resolves to null here exactly as it always has.
  const { data: projectRow } = await supabase.from('projects').select('id, user_id, org_id').eq('id', projectId).maybeSingle()
  if (!projectRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let orgEditAllowed = false
  if (projectRow.org_id && projectRow.user_id !== user.id) {
    const admin = await createAdminClient()
    orgEditAllowed = canEditOrgProject(await getOrgRole(admin, projectRow.org_id, user.id))
  }
  if (projectRow.user_id !== user.id && !orgEditAllowed) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // For a personal (non-org) project this keeps the EXACT original filter —
  // must never change for the overwhelming majority of projects, which have
  // no org_id. An org project being saved by a verified non-owner member is
  // already gated by the check above, so the write only needs to match on id.
  let query = supabase.from('projects').update({ files, updated_at: nowIso }).eq('id', projectId)
  if (!projectRow.org_id) query = query.eq('user_id', user.id)
  if (expectedUpdatedAt) query = query.eq('updated_at', expectedUpdatedAt)
  const { data, error } = await query.select('id, updated_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (expectedUpdatedAt && (!data || data.length === 0)) {
    // Distinguish "conflict" (row exists, updated_at moved) from "not yours/
    // doesn't exist" (already covered by the access check above) so the
    // client gets a specific, actionable signal either way.
    let currentQuery = supabase.from('projects').select('updated_at').eq('id', projectId)
    if (!projectRow.org_id) currentQuery = currentQuery.eq('user_id', user.id)
    const { data: current } = await currentQuery.maybeSingle()
    if (current) {
      return NextResponse.json({ error: 'Conflict: this project was modified elsewhere', conflict: true, currentUpdatedAt: current.updated_at }, { status: 409 })
    }
  }
  return NextResponse.json({ ok: true, updatedAt: nowIso });
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await req.json();
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    // Deleting the project row cascades to cloud_databases (on delete
    // cascade), but that only removes our metadata — it does NOT tear down
    // the actual Cloud SQL instance running in GCP. Without this, every
    // deleted project leaves a real, billed, still-populated-with-customer-
    // data Postgres instance running forever. Tear it down first.
    const admin = await createAdminClient();
    const { data: cloudDb } = await admin
      .from('cloud_databases')
      .select('gcp_instance_name')
      .eq('wyber_project_id', projectId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (cloudDb?.gcp_instance_name) {
      try {
        const { deleteCloudSQLInstance } = await import('@/lib/google-cloud-sql');
        await deleteCloudSQLInstance(cloudDb.gcp_instance_name);
      } catch (gcpErr) {
        console.error('[projects/DELETE] Failed to delete Cloud SQL instance:', gcpErr);
        return NextResponse.json({
          error: 'Failed to delete the project\'s WyberCloud database — project was not deleted so this can be retried.',
          details: String(gcpErr),
        }, { status: 502 });
      }
    }

    const { error } = await supabase.from('projects').delete()
      .eq('id', projectId)
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }); }
}