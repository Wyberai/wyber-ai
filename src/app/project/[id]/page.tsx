import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IDELayout } from '@/components/editor/IDELayout'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: project } = await supabase.from('projects').select('name').eq('id', id).single()
  return { title: project?.name ? `${project.name} — Wyber AI` : 'Editor — Wyber AI' }
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) redirect('/dashboard')
  if (project.user_id !== user.id && !project.is_public) redirect('/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, plan, email, id')
    .eq('id', user.id)
    .single()

  return (
    <IDELayout
      initialProject={project}
      initialProfile={{
        credits: profile?.credits ?? 0,
        plan: profile?.plan ?? 'free',
        email: profile?.email ?? user.email ?? '',
        id: user.id,
      }}
    />
  )
}
