import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';

// Pure service-role client — no cookies, safe to call during hydration
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// This route uses the service-role client (bypasses RLS) for the actual reads/
// writes below, so it must do its own ownership check — without this, anyone
// who knows/guesses a projectId (a UUID) could read or write another user's
// entire chat history with no login at all.
async function verifyProjectAccess(projectId: string): Promise<boolean> {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return false;
  // Support mode: allowlisted admins can open any customer project — without
  // this the rescued project loads with an empty, unusable chat panel.
  const { isAdminEmail } = await import('@/lib/admin');
  if (isAdminEmail(user.email)) return true;
  const admin = adminClient();
  const { data: project } = await admin.from('projects').select('user_id, org_id').eq('id', projectId).maybeSingle();
  if (!project) return false;
  if (project.user_id === user.id) return true;
  if (project.org_id) {
    const { data: membership } = await admin
      .from('organization_members')
      .select('id')
      .eq('org_id', project.org_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (membership) return true;
  }
  return false;
}

// GET /api/projects/messages?projectId=xxx — load chat history
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    if (!(await verifyProjectAccess(projectId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('project_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const messages = (data || []).map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.created_at).getTime(),
      status: 'done',
      filesChanged: m.files_changed || [],
    }));
    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/projects/messages — save one message
export async function POST(req: NextRequest) {
  try {
    const { projectId, role, content, filesChanged, clientId } = await req.json();
    if (!projectId || !role || content === undefined) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }
    if (!(await verifyProjectAccess(projectId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = adminClient();
    const { error } = await supabase.from('project_messages').insert({
      project_id: projectId,
      role,
      content,
      files_changed: filesChanged || [],
      // The client's own ChatMessage.id — lets a later edit-and-regenerate find
      // this exact row without guessing by created_at timestamp (client Date.now()
      // and the DB's insert-time default drift against each other).
      client_id: clientId || null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/projects/messages — edit-and-regenerate: delete a message and
// everything after it (the tail being discarded/regenerated). The client then
// resends the edited content through the normal send path, which persists it
// as a fresh row — deleting here rather than updating-in-place avoids ending
// up with both an updated old row AND a freshly-inserted one for the same
// content. messageId may be either the DB row id (messages loaded from
// history via GET, which map DB id -> ChatMessage.id) or a client-generated id
// (messages created this session, stored in client_id at insert time above).
export async function PATCH(req: NextRequest) {
  try {
    const { projectId, messageId } = await req.json();
    if (!projectId || !messageId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }
    if (!(await verifyProjectAccess(projectId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = adminClient();

    const { data: target, error: findErr } = await supabase
      .from('project_messages')
      .select('id, created_at')
      .eq('project_id', projectId)
      .or(`id.eq.${messageId},client_id.eq.${messageId}`)
      .maybeSingle();
    if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
    if (!target) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    const { error: deleteErr } = await supabase
      .from('project_messages')
      .delete()
      .eq('project_id', projectId)
      .gte('created_at', target.created_at);
    if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
