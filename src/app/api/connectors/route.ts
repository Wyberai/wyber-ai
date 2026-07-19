import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt, decrypt } from '@/lib/secrets-crypto';

function safeDecrypt(val: string): string | null {
  if (!val) return val
  // Values encrypted with AES-256-GCM have format "iv:authTag:ciphertext" (3 colons min)
  if (val.split(':').length === 3) {
    try {
      return decrypt(val)
    } catch (e) {
      // This DID match the encrypted-value shape, so a throw here means the
      // encryption key was rotated or the ciphertext is corrupt — not "this
      // was actually a legacy plaintext value" (that's the branch below,
      // which never reaches decrypt() at all). The old code silently fell
      // through and returned the raw ciphertext as if it were a valid API
      // key — a connector would look mysteriously "broken" (or worse, the
      // ciphertext would get used as a real credential and fail elsewhere)
      // with zero signal anywhere about why. Log it and return null instead.
      console.error('[connectors] failed to decrypt stored api_key — key rotation or corruption:', String(e))
      return null
    }
  }
  return val // plaintext legacy value
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  const { data } = await supabase
    .from('project_connectors')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id);

  const connectors = (data || []).map(c => ({
    ...c,
    api_key: safeDecrypt(c.api_key),
  }))

  return NextResponse.json({ connectors });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId, service, apiKey, config } = await req.json();

  const { data, error } = await supabase
    .from('project_connectors')
    .upsert({
      project_id: projectId,
      user_id: user.id,
      service,
      api_key: encrypt(apiKey),
      config,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'project_id,service' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connector: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId, service } = await req.json();
  await supabase.from('project_connectors').delete().eq('project_id', projectId).eq('service', service).eq('user_id', user.id);
  return NextResponse.json({ success: true });
}