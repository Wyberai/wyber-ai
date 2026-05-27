import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

async function ensureUniqueSlug(base: string, supabase: any): Promise<string> {
  let slug = base;
  let attempt = 0;
  while (true) {
    const { data } = await supabase.from('projects').select('id').eq('subdomain', slug).maybeSingle();
    if (!data) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    let subdomain = project.subdomain;
    if (!subdomain) {
      const base = slugify(project.name || `project-${projectId.slice(0, 8)}`);
      subdomain = await ensureUniqueSlug(base, supabase);
    }

    const publishedUrl = `https://${subdomain}.wyberai.app`;

    await supabase
      .from('projects')
      .update({ subdomain, published_url: publishedUrl, is_public: true, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    return NextResponse.json({ subdomain, publishedUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { projectId } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await supabase
      .from('projects')
      .update({ published_url: null, is_public: false, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}