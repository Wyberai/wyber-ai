import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

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

  let query = supabase.from('projects').update({ files, updated_at: nowIso }).eq('id', projectId).eq('user_id', user.id)
  if (expectedUpdatedAt) query = query.eq('updated_at', expectedUpdatedAt)
  const { data, error } = await query.select('id, updated_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (expectedUpdatedAt && (!data || data.length === 0)) {
    // Distinguish "conflict" (row exists, updated_at moved) from "not yours/
    // doesn't exist" (already covered by the id+user_id filters above) so the
    // client gets a specific, actionable signal either way.
    const { data: current } = await supabase.from('projects').select('updated_at').eq('id', projectId).eq('user_id', user.id).maybeSingle()
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