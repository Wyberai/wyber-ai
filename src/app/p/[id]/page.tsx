import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';

export default async function PublicProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from('projects')
    .select('id,name,is_public,user_id')
    .eq('id', id)
    .single();
  if (!project) notFound();
  if (project.is_public) redirect(`/project/${id}`);
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === project.user_id) redirect(`/project/${id}`);
  notFound();
}