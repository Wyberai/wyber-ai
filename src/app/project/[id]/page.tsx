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

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (!project) redirect('/dashboard');
  if (project.user_id !== user.id && !project.is_public) redirect('/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits,plan,email,id')
    .eq('id', user.id)
    .single();

  return <IDELayout initialProject={project} initialProfile={profile} />;
}