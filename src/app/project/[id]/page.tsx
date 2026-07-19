import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { IDELayout } from '@/components/editor/IDELayout'
import { AgentCanvas } from '@/components/editor/AgentCanvas'
import { MobileLayout } from '@/components/editor/MobileLayout'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string }> }

// Hydration watchdog. Proven failure mode (Jul 3 2026): antivirus web filters
// (Kaspersky et al.) rewrite streamed documents and the re-inserted scripts
// never execute — the editor renders as inert SSR HTML with NO error anywhere,
// and users blame the app. This inline, non-module script survives because AV
// filters leave plain inline scripts in the initial HTML alone; the editor
// layouts set window.__wyber_hydrated on mount, and if that hasn't happened
// after 12s we show a plain-DOM banner naming the real culprit. Self-removes
// the moment hydration is detected late.
const HYDRATION_WATCHDOG = `(function(){setTimeout(function(){if(window.__wyber_hydrated)return;var b=document.createElement('div');b.id='wyber-hydration-warning';b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;background:#7c2d12;color:#fed7aa;font:13px/1.5 system-ui;padding:10px 44px 10px 16px;text-align:center';b.innerHTML='The editor could not start in this browser. This is usually caused by antivirus software (e.g. Kaspersky) filtering web traffic \\u2014 add wyberai.com to its exclusions or disable \\u201cscript injection\\u201d, then reload. It also works from another browser or your phone.';var x=document.createElement('button');x.textContent='\\u00d7';x.style.cssText='position:absolute;right:10px;top:6px;background:none;border:none;color:#fed7aa;font-size:18px;cursor:pointer';x.onclick=function(){b.remove()};b.appendChild(x);document.body.appendChild(b);var iv=setInterval(function(){if(window.__wyber_hydrated){b.remove();clearInterval(iv)}},2000)},12000)})()`

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

  let { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  // Support mode: allowlisted admins can open ANY project (RLS hides private
  // ones from the session client, so retry with the service client).
  const admin = isAdminEmail(user.email)
  if (!project && admin) {
    const adminDb = await createAdminClient()
    project = (await adminDb.from('projects').select('*').eq('id', id).single()).data
  }

  if (!project) redirect('/dashboard')
  const supportMode = admin && project.user_id !== user.id
  if (project.user_id !== user.id && !project.is_public && !supportMode) redirect('/dashboard')

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

  const watchdog = <script dangerouslySetInnerHTML={{ __html: HYDRATION_WATCHDOG }} />

  // Unmissable strip so an admin never mistakes a customer's project for their
  // own — every save/publish here lands on the customer's account.
  const supportBanner = supportMode ? (
    <div style={{ background: '#7c2d12', color: '#fed7aa', fontSize: 12, fontWeight: 600, textAlign: 'center', padding: '5px 12px', borderBottom: '1px solid rgba(254,215,170,0.3)' }}>
      🛠 SUPPORT MODE — you are editing a customer&apos;s project ({project.name || id}). Saves and publishes apply to their account.
    </div>
  ) : null

  if (canvasType === 'mobile') {
    return (
      <>
        {watchdog}
        {supportBanner}
        <MobileLayout
          initialProject={{ id, name: project.name || 'Untitled', files: project.files, project_type: project.project_type, user_id: user.id }}
          initialProfile={initialProfile}
        />
      </>
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
    <>
      {watchdog}
      {supportBanner}
      <IDELayout
        initialProject={project}
        initialProfile={initialProfile}
      />
    </>
  )
}
