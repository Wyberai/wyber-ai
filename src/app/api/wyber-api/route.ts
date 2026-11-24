import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHash, randomBytes } from 'crypto';
import { KEY_LIMIT, normalizeKeyOptions } from '@/lib/mcp/guard';

// API keys for AI agents (Claude Code, Cursor and any MCP client). A key is shown once; only its SHA-256 hash is kept.
// A key can be read-only and can expire (see src/lib/mcp/guard.ts). The access level and expiry columns come from
// 20261125010000_api_key_scope_expiry.sql; before it is applied the keys behave as before (full access, no expiry).

const BASE_COLUMNS = 'id, name, key_preview, active, created_at, last_used_at';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Newest first. Only active keys are listed: a revoked key is gone from the person's point of view.
  const list = (columns: string) => supabase.from('api_keys').select(columns).eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false });
  let res: { data: unknown[] | null; error: unknown } = await list(`${BASE_COLUMNS}, scope, expires_at`);
  if (res.error) res = await list(BASE_COLUMNS); // the access-level and expiry columns are not there yet
  return NextResponse.json({ keys: res.data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const opts = normalizeKeyOptions(await req.json().catch(() => ({})));
  if (!opts.ok) return NextResponse.json({ error: opts.error }, { status: 400 });

  // A sensible ceiling, so a script or a mistake cannot fill the list.
  const { count } = await supabase.from('api_keys').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('active', true);
  if ((count ?? 0) >= KEY_LIMIT) return NextResponse.json({ error: `You already have ${KEY_LIMIT} active keys. Revoke one you no longer use first.` }, { status: 400 });

  const key = `wyb_${randomBytes(32).toString('hex')}`;
  const keyHash = createHash('sha256').update(key).digest('hex');
  const row: Record<string, unknown> = { user_id: user.id, name: opts.name, key: keyHash, key_preview: `wyb_...${key.slice(-8)}`, active: true };
  if (opts.scope !== 'full') row.scope = opts.scope;
  if (opts.expiresAt) row.expires_at = opts.expiresAt;

  const { data, error } = await supabase.from('api_keys').insert(row).select('id, name, key_preview, active, created_at').single();
  // The key must never be shown unless it was really saved: a key that was never stored would look fine and never work.
  if (error || !data) {
    const needsUpdate = Boolean(error && /scope|expires_at/i.test(error.message)) && (opts.scope !== 'full' || opts.expiresAt);
    return NextResponse.json({ error: needsUpdate ? 'Read-only and expiring keys are not available yet. Create a full-access key, or try again later.' : 'Could not create the key. Please try again.' }, { status: needsUpdate ? 400 : 500 });
  }

  return NextResponse.json({
    key,
    keyData: { ...data, last_used_at: null, scope: opts.scope, expires_at: opts.expiresAt },
    warning: 'Save this key now. It will not be shown again.',
  });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: 'Which key?' }, { status: 400 });
  // Takes effect at once: every request looks the key up, so a revoked key stops working on its next call.
  await supabase.from('api_keys').update({ active: false }).eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ success: true });
}
