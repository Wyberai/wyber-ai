import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: projects } = await supabase.from('projects').select('id, name, framework, files, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(20);
  return NextResponse.json({ projects: projects || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sourceProjectId, targetProjectId, filePaths } = await req.json();

  const { data: source } = await supabase.from('projects').select('files').eq('id', sourceProjectId).eq('user_id', user.id).single();
  const { data: target } = await supabase.from('projects').select('files').eq('id', targetProjectId).eq('user_id', user.id).single();

  if (!source || !target) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const sourceFiles = source.files || {};
  const targetFiles = target.files || {};
  const copiedFiles: string[] = [];

  for (const path of filePaths) {
    if (sourceFiles[path]) { targetFiles[path] = sourceFiles[path]; copiedFiles.push(path); }
  }

  await supabase.from('projects').update({ files: targetFiles, updated_at: new Date().toISOString() }).eq('id', targetProjectId);
  return NextResponse.json({ copied: copiedFiles.length, files: copiedFiles });
}