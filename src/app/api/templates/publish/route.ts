import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json();
    const { projectId, name, description, category, tags, files, framework } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const admin = await createAdminClient();

    // Build prompt from files for regeneration
    const fileList = Object.keys(files ?? {}).join(', ');
    const prompt = `Recreate this ${category} app called "${name}": ${description}. Files: ${fileList}`;

    const { data, error } = await admin.from('community_templates').insert({
      name: name.trim(),
      description: description?.trim() ?? '',
      category: category ?? 'Other',
      framework: framework ?? 'react-vite',
      tags: tags ?? [],
      prompt,
      files, // Store actual files for instant loading
      user_id: user.id,
      project_id: projectId,
      is_approved: true, // Auto-approve — curate after launch
      upvotes: 0,
      use_count: 0,
    }).select('id').single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ id: data.id, success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
