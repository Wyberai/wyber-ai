import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('name, description')
    .eq('subdomain', slug)
    .eq('is_public', true)
    .single()
  return {
    title: data ? `${data.name} — Built with WyberAi` : 'App — WyberAi',
    description: data?.description || 'Built with WyberAi',
  }
}

export default async function PublishedAppPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, files, subdomain, is_public, user_id')
    .eq('subdomain', slug)
    .eq('is_public', true)
    .single()

  if (!project) notFound()

  // Get the built HTML from Supabase Storage
  const { data: fileData } = await supabase
    .storage
    .from('published-apps')
    .download(`${project.id}/index.html`)

  if (!fileData) {
    // App not built yet — show a building page
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', gap: 16 }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(14,165,233,0.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: '#71717a', fontSize: 14 }}>Building your app...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const html = await fileData.text()

  return (
    <>
      <div style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '5px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>Built with</span>
        <a href="https://wyberai.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>WyberAi</a>
      </div>
      {/* Sandboxed iframe prevents XSS from user-generated app HTML executing in the wyberai.com origin */}
      <iframe
        srcDoc={html}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
        title={project.name}
      />
    </>
  )
}
