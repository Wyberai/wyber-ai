import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHash, randomBytes } from 'crypto';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: keys } = await supabase.from('api_keys').select('id, name, key_preview, active, created_at, last_used_at').eq('user_id', user.id).order('created_at', { ascending: false });
  return NextResponse.json({ keys: keys || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json();
  const key = `wyb_${randomBytes(32).toString('hex')}`;
  const keyHash = createHash('sha256').update(key).digest('hex');

  const { data } = await supabase.from('api_keys').insert({
    user_id: user.id,
    name: name || 'Default',
    key: keyHash,
    key_preview: `wyb_...${key.slice(-8)}`,
    active: true,
  }).select('id, name, key_preview, created_at').single();

  return NextResponse.json({ key, keyData: data, warning: 'Save this key now — it will not be shown again.' });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  await supabase.from('api_keys').update({ active: false }).eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ success: true });
}