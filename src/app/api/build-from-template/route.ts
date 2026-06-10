import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// POST /api/build-from-template
// Creates a project pre-loaded with a prebuilt template's files — INSTANTLY.
// Templates are stored without src/ prefixes and without Vite scaffolding,
// so we normalize paths and inject the scaffold here; otherwise the preview
// cannot build. We deliberately do NOT return a "rebuild" prompt anymore:
// loading a template should be instant and cost 0 credits, not trigger a
// full AI regeneration of an app we already have.

type FileVal = { path: string; content: string; language?: string } | string

const LANG_MAP: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  css: 'css', html: 'html', json: 'json', vue: 'vue',
}
const langFromExt = (path: string): string =>
  LANG_MAP[path.split('.').pop()?.toLowerCase() ?? ''] ?? 'plaintext'

// Files that belong at the project ROOT, not under src/
const ROOT_FILES = new Set([
  'index.html', 'vite.config.js', 'vite.config.ts', 'package.json',
  'tsconfig.json', 'postcss.config.js', 'tailwind.config.js', '.gitignore',
])

function contentOf(v: FileVal): string {
  return typeof v === 'string' ? v : (v?.content ?? '')
}

function normalizePath(rawPath: string): string {
  const p = rawPath.replace(/^\.?\//, '')
  if (p.startsWith('src/')) return p
  if (ROOT_FILES.has(p)) return p
  return `src/${p}`
}

function findAppEntry(paths: string[]): string | null {
  return (
    paths.find((p) => p === 'src/App.tsx') ||
    paths.find((p) => p === 'src/App.jsx') ||
    null
  )
}

function buildScaffold(appEntry: string, hasCss: boolean, name: string) {
  const isTs = appEntry.endsWith('.tsx')
  const mainPath = isTs ? 'src/main.tsx' : 'src/main.jsx'
  const cssImport = hasCss ? `import './index.css'\n` : ''
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name || 'Wyber App'}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/${mainPath}"></script>
  </body>
</html>
`
  const mainContent = `import React from 'react'
import { createRoot } from 'react-dom/client'
${cssImport}import App from './App'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`
  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`
  const packageJson = JSON.stringify({
    name: (name || 'wyber-app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'wyber-app',
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
    dependencies: {
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      'lucide-react': '^0.383.0',
      recharts: '^2.12.7',
    },
    devDependencies: {
      '@vitejs/plugin-react': '^4.3.1',
      vite: '^5.3.1',
    },
  }, null, 2)
  return { mainPath, mainContent, indexHtml, viteConfig, packageJson }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { templateId } = await req.json()
    if (!templateId) return NextResponse.json({ error: 'templateId required' }, { status: 400 })

    const admin = await createAdminClient()

    // Accept either the row id or the WYBER-APP-xxx app_id
    let { data: template, error: tErr } = await admin
      .from('prebuilt_apps')
      .select('name, description, category, files')
      .eq('id', templateId)
      .single()
    if ((tErr || !template) && typeof templateId === 'string') {
      const fallback = await admin
        .from('prebuilt_apps')
        .select('name, description, category, files')
        .eq('app_id', templateId)
        .single()
      template = fallback.data
      tErr = fallback.error
    }

    if (tErr || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const rawFiles = (template.files || {}) as Record<string, FileVal>
    if (Object.keys(rawFiles).length < 2) {
      return NextResponse.json({ error: 'Template has no files' }, { status: 422 })
    }

    // 1. Normalize paths into a proper Vite layout
    const normalized: Record<string, { path: string; content: string; language: string }> = {}

    // Single-file format: { code: "<entire app>", generated: ... }
    if (typeof (rawFiles as any).code === 'string' && (rawFiles as any).code.trim().length > 0) {
      normalized['src/App.jsx'] = { path: 'src/App.jsx', content: (rawFiles as any).code, language: 'javascript' }
    } else {
      for (const [rawPath, val] of Object.entries(rawFiles)) {
        if (rawPath === 'generated' || rawPath === 'code') continue // metadata, not files
        const newPath = normalizePath(rawPath)
        normalized[newPath] = { path: newPath, content: contentOf(val), language: langFromExt(newPath) }
      }
    }

    // 2. Inject Vite scaffold if missing so the preview can build immediately
    const paths = Object.keys(normalized)
    const appEntry = findAppEntry(paths)
    if (appEntry) {
      const hasCss = paths.includes('src/index.css')
      const scaffold = buildScaffold(appEntry, hasCss, template.name)
      if (!paths.some((p) => /^src\/main\.(t|j)sx$/.test(p))) {
        normalized[scaffold.mainPath] = { path: scaffold.mainPath, content: scaffold.mainContent, language: 'javascript' }
      }
      if (!paths.includes('index.html')) {
        normalized['index.html'] = { path: 'index.html', content: scaffold.indexHtml, language: 'html' }
      }
      if (!paths.includes('vite.config.js') && !paths.includes('vite.config.ts')) {
        normalized['vite.config.js'] = { path: 'vite.config.js', content: scaffold.viteConfig, language: 'javascript' }
      }
      if (!paths.includes('package.json')) {
        normalized['package.json'] = { path: 'package.json', content: scaffold.packageJson, language: 'json' }
      }
    }

    const { data: project, error: pErr } = await admin
      .from('projects')
      .insert({
        user_id: user.id,
        name: template.name,
        framework: 'react-vite',
        files: normalized,
        first_prompt: '',
      })
      .select('id')
      .single()

    if (pErr || !project) {
      console.error('Project create error:', pErr)
      throw new Error(pErr?.message || 'Failed to create project')
    }

    // Seed a friendly first assistant message so the chat guides the user
    try {
      await admin.from('project_messages').insert({
        project_id: project.id,
        role: 'assistant',
        content: `You've chosen the **${template.name}** template. Take a look at the preview on the left and tell me how you'd like to design it — change colors, add features, rename sections, anything.`,
      })
    } catch {}

    // Increment use_count — fire and forget
    admin.rpc('increment_use_count', { template_id: templateId }).then(() => {}).catch(() => {})

    // NOTE: no `prompt` in the response — template loads are instant, not AI rebuilds.
    return NextResponse.json({ projectId: project.id })
  } catch (err: any) {
    console.error('build-from-template error:', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
