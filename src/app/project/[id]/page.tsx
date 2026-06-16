import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IDELayout } from '@/components/editor/IDELayout'
import { AgentCanvas } from '@/components/editor/AgentCanvas'
import { MobileLayout } from '@/components/editor/MobileLayout'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: project } = await supabase.from('projects').select('name').eq('id', id).single()
  return { title: project?.name ? `${project.name} — WyberAi` : 'Editor — WyberAi' }
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const { id } = await params
  const { type } = await searchParams
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

  const initialProfile = {
    credits: profile?.credits ?? 0,
    plan: profile?.plan ?? 'free',
    email: profile?.email ?? user.email ?? '',
    id: user.id,
  }

  // Determine canvas type from URL param or project type
  const canvasType = type || project.project_type || 'app'

  if (canvasType === 'mobile') {
    return (
      <MobileLayout
        initialProject={{ id, name: project.name || 'Untitled', files: project.files, project_type: project.project_type, user_id: user.id }}
        initialProfile={initialProfile}
      />
    )
  }

  if (canvasType === 'agent' || canvasType === 'workflow') {
    return (
      <AgentCanvas
        projectId={id}
        projectName={project.name || 'Untitled'}
        canvasType={canvasType as 'agent' | 'workflow'}
        initialProfile={initialProfile}
        saveTarget="project"
      />
    )
  }

  return (
    <IDELayout
      initialProject={project}
      initialProfile={initialProfile}
    />
  )
}
