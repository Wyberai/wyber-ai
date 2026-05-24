import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { projectId, userId } = await req.json();
  if (!projectId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const supabase = await createAdminClient();

  // Fetch original
  const { data: original, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error || !original) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  // Create fork
  const { data: fork, error: forkError } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: `${original.name} (copy)`,
      description: original.description,
      framework: original.framework,
      files: original.files,
      is_public: false,
    })
    .select('id, name')
    .single();

  if (forkError) return NextResponse.json({ error: forkError.message }, { status: 500 });

  return NextResponse.json({ project: fork });
}
