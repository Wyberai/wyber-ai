import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category') ?? '';
  const sort = req.nextUrl.searchParams.get('sort') ?? 'upvotes';
  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '0');

  const supabase = await createAdminClient();
  let query = supabase
    .from('community_templates')
    .select('id,name,description,category,framework,tags,thumbnail_url,upvotes,use_count,created_at,user_id')
    .eq('is_approved', true)
    .range(page * 20, page * 20 + 19);

  if (category) query = query.eq('category', category);
  if (sort === 'upvotes') query = query.order('upvotes', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, category, framework, tags, prompt, files, projectId } = body;

  if (!name || !description || !category || !prompt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { data, error } = await admin.from('community_templates').insert({
    user_id: user.id,
    project_id: projectId ?? null,
    name, description, category, framework: framework ?? 'react-vite',
    tags: tags ?? [], prompt, files: files ?? {},
    is_approved: false, // pending moderation
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, status: 'pending_approval' });
}
