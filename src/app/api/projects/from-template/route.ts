import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// POST /api/projects/from-template
// Creates a new project pre-loaded with a prebuilt template's files,
// so the editor opens with the template as the starting point.
//
// Prebuilt apps are stored WITHOUT a src/ prefix and WITHOUT Vite scaffolding
// (no index.html / main.jsx / vite.config.js). The live preview builder expects
// a standard Vite layout, so we normalize paths into src/ and inject the scaffold
// here before saving the project — otherwise the preview can't build (blank preview).

type FileVal = { path: string; content: string; language?: string } | string;

const langFromExt = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    css: 'css', html: 'html', json: 'json', vue: 'vue',
  };
  return map[ext] ?? 'plaintext';
};

// Files that belong at the project ROOT, not under src/
const ROOT_FILES = new Set([
  'index.html', 'vite.config.js', 'vite.config.ts', 'package.json',
  'tsconfig.json', 'postcss.config.js', 'tailwind.config.js', '.gitignore',
]);

function normalizeContent(f: FileVal, fallbackPath: string): string {
  if (typeof f === 'string') return f;
  return f?.content ?? '';
}

// Map a stored template path to its correct location in a Vite project.
function normalizePath(rawPath: string): string {
  let p = rawPath.replace(/^\.?\//, ''); // strip leading ./ or /
  // already correctly placed
  if (p.startsWith('src/')) return p;
  if (ROOT_FILES.has(p)) return p;
  // bare root-level config/html that we missed → keep at root
  const base = p.split('/').pop() ?? p;
  if (ROOT_FILES.has(base) && !p.includes('/')) return p;
  // everything else is app source → live under src/
  return `src/${p}`;
}

// Detect the entry component (App.jsx / App.tsx) after normalization.
function findAppEntry(paths: string[]): string | null {
  return (
    paths.find((p) => p === 'src/App.tsx') ||
    paths.find((p) => p === 'src/App.jsx') ||
    paths.find((p) => /^src\/App\.(t|j)sx$/.test(p)) ||
    null
  );
}

function buildScaffold(appEntry: string, hasCss: boolean, templateName: string) {
  // appEntry like "src/App.jsx" → import "./App.jsx" (keep extension for clarity)
  const appImportPath = './' + appEntry.replace(/^src\//, '');
  const isTs = appEntry.endsWith('.tsx');
  const mainPath = isTs ? 'src/main.tsx' : 'src/main.jsx';
  const cssImport = hasCss ? `import './index.css'\n` : '';

  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${templateName || 'Wyber App'}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/${mainPath}"></script>
  </body>
</html>
`;

  const mainContent = `import React from 'react'
import { createRoot } from 'react-dom/client'
${cssImport}import App from '${appImportPath.replace(/\.(t|j)sx$/, '')}'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`;

  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`;

  const packageJson = JSON.stringify({
    name: (templateName || 'wyber-app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'wyber-app',
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
  }, null, 2);

  return { indexHtml, mainPath, mainContent, viteConfig, packageJson };
}

export async function POST(req: NextRequest) {
  try {
    const { templateId } = await req.json();
    if (!templateId) {
      return NextResponse.json({ error: 'Missing templateId' }, { status: 400 });
    }

    // The caller — never a client-supplied userId — owns the new project.
    // Previously this trusted `userId` off the request body, so anyone could
    // spawn projects inside any other account they named.
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();

    const { data: template, error: tErr } = await supabase
      .from('prebuilt_apps')
      .select('name, category, files')
      .eq('app_id', templateId)
      .single();

    if (tErr || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const rawFiles = template.files || {};
    if (!rawFiles || Object.keys(rawFiles).length < 2) {
      return NextResponse.json({ error: 'Template has no files' }, { status: 422 });
    }

    // 1. Normalize every file into the correct Vite location (src/ prefix etc.)
    const normalized: Record<string, { path: string; content: string; language: string }> = {};

    // Single-file format: { code: "<entire app>", generated: ... }
    if (typeof (rawFiles as any).code === 'string' && (rawFiles as any).code.trim().length > 0) {
      normalized['src/App.jsx'] = { path: 'src/App.jsx', content: (rawFiles as any).code, language: 'javascript' };
    } else {
      for (const [rawPath, val] of Object.entries(rawFiles as Record<string, FileVal>)) {
        if (rawPath === 'generated' || rawPath === 'code') continue; // metadata, not files
        const newPath = normalizePath(rawPath);
        normalized[newPath] = {
          path: newPath,
          content: normalizeContent(val, rawPath),
          language: langFromExt(newPath),
        };
      }
    }

    const paths = Object.keys(normalized);

    // 2. Inject Vite scaffold if missing, so the preview can actually build
    const appEntry = findAppEntry(paths);
    if (appEntry) {
      const hasCss = paths.some((p) => p === 'src/index.css');
      const hasMain = paths.some((p) => /^src\/main\.(t|j)sx$/.test(p));
      const hasHtml = paths.some((p) => p === 'index.html');
      const hasVite = paths.some((p) => p === 'vite.config.js' || p === 'vite.config.ts');
      const hasPkg = paths.some((p) => p === 'package.json');

      const scaffold = buildScaffold(appEntry, hasCss, template.name);

      if (!hasMain) {
        normalized[scaffold.mainPath] = { path: scaffold.mainPath, content: scaffold.mainContent, language: 'javascript' };
      }
      if (!hasHtml) {
        normalized['index.html'] = { path: 'index.html', content: scaffold.indexHtml, language: 'html' };
      }
      if (!hasVite) {
        normalized['vite.config.js'] = { path: 'vite.config.js', content: scaffold.viteConfig, language: 'javascript' };
      }
      if (!hasPkg) {
        normalized['package.json'] = { path: 'package.json', content: scaffold.packageJson, language: 'json' };
      }
    }

    const { data: project, error: pErr } = await supabase
      .from('projects')
      .insert({
        name: template.name || 'Untitled',
        framework: 'react-vite',
        user_id: user.id,
        project_type: 'app',
        files: normalized,
        initial_prompt: '',
      })
      .select('id')
      .single();

    if (pErr || !project) {
      return NextResponse.json({ error: pErr?.message || 'Could not create project' }, { status: 500 });
    }

    // Seed a friendly first assistant message so the chat guides the user
    try {
      await supabase.from('project_messages').insert({
        project_id: project.id,
        role: 'assistant',
        content: `You've chosen the **${template.name}** template. Take a look at the preview on the left and tell me how you'd like to design it — change colors, add features, rename sections, anything.`,
      });
    } catch {}

    return NextResponse.json({ projectId: project.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
