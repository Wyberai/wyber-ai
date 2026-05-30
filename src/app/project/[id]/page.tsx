import { IDELayout } from '@/components/editor/IDELayout';
import { redirect } from 'next/navigation';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === 'test' || id === 'demo' || id === 'new') {
    redirect('/dashboard');
  }

  const { createClient } = await import('@/lib/supabase/server');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Try to get project - if it doesn't exist, create a stub so the IDE still loads
  let project = null;
  const { data: existingProject } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (existingProject) {
    // Check access
    if (existingProject.user_id !== user.id && !existingProject.is_public) {
      redirect('/dashboard');
    }
    project = existingProject;
  } else {
    // Project doesn't exist - could be a new project that failed to save
    // Get name from query params if available, otherwise use a default
    // Just redirect to dashboard - the dashboard handles project creation
    redirect('/dashboard');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits,plan,email,id')
    .eq('id', user.id)
    .single();

  return <IDELayout initialProject={project} initialProfile={profile} />;
}
