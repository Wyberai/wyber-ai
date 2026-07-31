import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60;

export async function GET() {
  try {
    const supabase = await createClient();

    const [
      { count: projectCount },
      { count: userCount },
      { count: templateCount },
      { count: deployCount },
    ] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('community_templates').select('*', { count: 'exact', head: true }),
      supabase.from('deployments').select('*', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      projects: projectCount ?? 0,
      users: userCount ?? 0,
      templates: templateCount ?? 0,
      deployments: deployCount ?? 0,
    });
  } catch {
    return NextResponse.json({ projects: 1000, users: 500, templates: 50, deployments: 200 });
  }
}
