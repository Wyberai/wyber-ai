'use client'
import { Suspense, useEffect, useState } from 'react'
import { IDELayout } from '@/components/editor/IDELayout'
import { MobileLayout } from '@/components/editor/MobileLayout'

const APP = `import { useState } from 'react'
export default function App() {
  const [n] = useState(3)
  return <main style={{ padding: 24, fontFamily: 'system-ui' }}><h1>Invoices</h1><p>{n} overdue</p></main>
}
`
const project = {
  id: 'sandbox', user_id: 'sandbox', name: 'Invoice tracker', description: null, framework: 'react-vite' as const,
  files: { 'src/App.tsx': { path: 'src/App.tsx', content: APP, language: 'typescript' }, 'src/main.tsx': { path: 'src/main.tsx', content: "import './App'", language: 'typescript' } },
  is_public: false, share_slug: null, subdomain: null, published_url: null, thumbnail_url: null, deployed_url: null,
  vercel_project_id: null, custom_domain: null, github_repo: null, github_branch: 'main', last_commit_sha: null,
  created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
}

/** Fake project. ?m=1 renders the phone layout instead of the desktop one. */
export function EditorSandbox() {
  const [phone, setPhone] = useState<boolean | null>(null)
  useEffect(() => { setPhone(new URLSearchParams(location.search).get('m') === '1') }, [])
  if (phone === null) return null
  return (
    <Suspense fallback={null}>
      {phone
        ? <MobileLayout initialProject={project} initialProfile={{ credits: 100, plan: 'free', email: 'sandbox@example.test', id: 'sandbox' }} />
        : <IDELayout initialProject={project} initialProfile={{ credits: 100, plan: 'free', email: 'sandbox@example.test', id: 'sandbox' }} />}
    </Suspense>
  )
}
