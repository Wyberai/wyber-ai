import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Account deletion — required by both stores (Apple 5.1.1(v), Google Play).
// Works for the mobile app (Authorization: Bearer via the server-client bridge)
// and the web page (session cookie). Deleting the profiles row cascades to all
// ~30 user-owned tables (projects, notifications, device_tokens, subscriptions,
// credit_transactions, …); then we remove the auth identity itself.
async function handler() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await createAdminClient();

  // 1. Delete the profile → ON DELETE CASCADE removes all associated user data.
  const { error: profileErr } = await admin.from('profiles').delete().eq('id', user.id);
  if (profileErr) {
    console.error('[account/delete] profile delete failed', profileErr);
    return NextResponse.json({ error: 'Failed to delete account data' }, { status: 500 });
  }

  // 2. Delete the auth identity so the login can never be used again.
  const { error: authErr } = await admin.auth.admin.deleteUser(user.id);
  if (authErr) {
    // Data is already gone; surface the auth failure but don't pretend success.
    console.error('[account/delete] auth user delete failed', authErr);
    return NextResponse.json({ error: 'Account data removed, but sign-in cleanup failed. Contact support.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// Accept POST (mobile) and DELETE (web/REST) — same behavior.
export const POST = handler;
export const DELETE = handler;
