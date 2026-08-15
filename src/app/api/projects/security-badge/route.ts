import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// GET/POST /api/projects/security-badge — read/toggle whether a project's
// published app carries the "Scanned by WyberAi" badge (see sanitize-files.ts
// / api/publish/route.ts). Off by default (migration 20260716170000) — this
// is the settings surface that turns it from a silent default into a real,
// per-project choice. Ownership-scoped, same pattern as /api/projects/rename.

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await auth
    .from('projects')
    .select('show_security_badge, last_security_score, last_security_scanned_at')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({
    showSecurityBadge: data?.show_security_badge ?? false,
    lastScore: data?.last_security_score ?? null,
    lastScannedAt: data?.last_security_scanned_at ?? null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, enabled } = await req.json();
    if (!projectId || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Missing projectId or enabled' }, { status: 400 });
    }
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const { data: rows, error } = await supabase
      .from('projects')
      .update({ show_security_badge: enabled, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('user_id', user.id)
      .select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!rows || rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, showSecurityBadge: enabled });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
