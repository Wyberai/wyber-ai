import { IDELayout } from '@/components/editor/IDELayout';
import { redirect } from 'next/navigation';

const IS_LOCAL = process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Block reserved URLs
  if (id === 'test' || id === 'demo' || id === 'new') {
    redirect('/dashboard');
  }

  // Local dev — open IDE directly without auth
  if (IS_LOCAL) {
    return <IDELayout />;
  }

  // Production — load project from Supabase
  const { createClient } = await import('@/lib/supabase/server');
  const { notFound } = await import('next/navigation');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: project } = await supabase
    .from('projects').select('*').eq('id', id).single();

  if (!project) notFound();
  if (project.user_id !== user.id && !project.is_public) notFound();

  const { data: profile } = await supabase
    .from('profiles').select('credits,plan,email,id').eq('id', user.id).single();

  return <IDELayout initialProject={project} initialProfile={profile} />;
}
