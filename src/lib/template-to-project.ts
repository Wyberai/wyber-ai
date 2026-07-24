// Shared by src/app/api/projects/from-template/route.ts (free instant-load
// from the gallery) and the marketplace purchase webhook (paid delivery) —
// both need to turn a raw template file map into a project-ready file set.
//
// Prebuilt apps / marketplace listings are stored WITHOUT a src/ prefix and
// WITHOUT Vite scaffolding (no index.html / main.jsx / vite.config.js). The
// live preview builder expects a standard Vite layout, so we normalize paths
// into src/ and inject the scaffold here before saving the project —
// otherwise the preview can't build (blank preview).

export type FileVal = { path: string; content: string; language?: string } | string;
export type ProjectFile = { path: string; content: string; language: string };

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

function normalizeContent(f: FileVal): string {
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

// Turns a raw template/listing file map (as stored in prebuilt_apps.files or
// marketplace_listings.files) into a project-ready `files` record: normalized
// paths under src/, with any missing Vite scaffold (index.html, main.jsx,
// vite.config.js, package.json) injected so the preview builds immediately.
export function templateFilesToProjectFiles(
  rawFiles: Record<string, FileVal> | { code?: string },
  templateName: string,
): Record<string, ProjectFile> {
  const normalized: Record<string, ProjectFile> = {};

  // Single-file format: { code: "<entire app>", generated: ... }
  if (typeof (rawFiles as { code?: unknown }).code === 'string' && (rawFiles as { code: string }).code.trim().length > 0) {
    normalized['src/App.jsx'] = { path: 'src/App.jsx', content: (rawFiles as { code: string }).code, language: 'javascript' };
  } else {
    for (const [rawPath, val] of Object.entries(rawFiles as Record<string, FileVal>)) {
      if (rawPath === 'generated' || rawPath === 'code') continue; // metadata, not files
      const newPath = normalizePath(rawPath);
      normalized[newPath] = {
        path: newPath,
        content: normalizeContent(val),
        language: langFromExt(newPath),
      };
    }
  }

  const paths = Object.keys(normalized);

  // Inject Vite scaffold if missing, so the preview can actually build
  const appEntry = findAppEntry(paths);
  if (appEntry) {
    const hasCss = paths.some((p) => p === 'src/index.css');
    const hasMain = paths.some((p) => /^src\/main\.(t|j)sx$/.test(p));
    const hasHtml = paths.some((p) => p === 'index.html');
    const hasVite = paths.some((p) => p === 'vite.config.js' || p === 'vite.config.ts');
    const hasPkg = paths.some((p) => p === 'package.json');

    const scaffold = buildScaffold(appEntry, hasCss, templateName);

    if (!hasMain) normalized[scaffold.mainPath] = { path: scaffold.mainPath, content: scaffold.mainContent, language: 'javascript' };
    if (!hasHtml) normalized['index.html'] = { path: 'index.html', content: scaffold.indexHtml, language: 'html' };
    if (!hasVite) normalized['vite.config.js'] = { path: 'vite.config.js', content: scaffold.viteConfig, language: 'javascript' };
    if (!hasPkg) normalized['package.json'] = { path: 'package.json', content: scaffold.packageJson, language: 'json' };
  }

  return normalized;
}
