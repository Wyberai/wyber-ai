import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AgentCanvas } from '@/components/editor/AgentCanvas'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: flow } = await supabase.from('flows').select('name').eq('id', id).single()
  return { title: flow?.name ? `${flow.name} — WyberAi` : 'Flow Builder — WyberAi' }
}

export default async function FlowPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: flow } = await supabase
    .from('flows')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!flow) redirect('/flows')

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, plan, email, id')
    .eq('id', user.id)
    .single()

  return (
    <AgentCanvas
      projectId={id}
      projectName={flow.name || 'Untitled Flow'}
      canvasType="workflow"
      initialProfile={{
        credits: profile?.credits ?? 0,
        plan: profile?.plan ?? 'free',
        email: profile?.email ?? user.email ?? '',
        id: user.id,
      }}
    />
  )
}
