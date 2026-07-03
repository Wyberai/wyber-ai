import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Service-role reads/writes below bypass RLS, so this route must do its own
// ownership check — it previously had NONE, letting anyone with a projectId
// read or overwrite another user's project knowledge. Same owner/org/admin
// rule as the messages route (admin = remote support mode).
async function verifyProjectAccess(projectId: string): Promise<boolean> {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return false;
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

// GET /api/projects/knowledge?projectId=xxx
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    if (!(await verifyProjectAccess(projectId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('projects')
      .select('knowledge')
      .eq('id', projectId)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ knowledge: data?.knowledge || '' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/projects/knowledge — save knowledge
export async function POST(req: NextRequest) {
  try {
    const { projectId, knowledge } = await req.json();
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    if (!(await verifyProjectAccess(projectId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = adminClient();
    const { error } = await supabase
      .from('projects')
      .update({ knowledge: knowledge || '', updated_at: new Date().toISOString() })
      .eq('id', projectId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
