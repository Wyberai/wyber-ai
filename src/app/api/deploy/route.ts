import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Build scaffold files needed for Vercel to build the app
function getBuildScaffold(framework: string, projectName: string): Record<string, string> {
  const name = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  if (framework === 'vanilla') {
    return {}; // Vanilla HTML doesn't need a build step
  }

  if (framework === 'react-vite' || framework === 'react') {
    return {
      'package.json': JSON.stringify({
        name,
        private: true,
        version: '0.1.0',
        type: 'module',
        scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
        dependencies: {
          react: '^18.3.1',
          'react-dom': '^18.3.1',
          'react-router-dom': '^6.28.0',
          'lucide-react': '^0.383.0',
          recharts: '^2.12.0',
          clsx: '^2.1.1',
          'date-fns': '^3.6.0',
          'framer-motion': '^11.0.0',
          zustand: '^4.5.2',
        },
        devDependencies: {
          '@types/react': '^18.3.12',
          '@types/react-dom': '^18.3.1',
          '@vitejs/plugin-react': '^4.3.3',
          typescript: '^5.6.3',
          vite: '^5.4.10',
        },
      }, null, 2),

      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  base: './', build: { outDir: 'dist', sourcemap: false },
})`,

      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020', useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'], module: 'ESNext',
          skipLibCheck: true, moduleResolution: 'bundler',
          allowImportingTsExtensions: true, isolatedModules: true,
          moduleDetection: 'force', noEmit: true, jsx: 'react-jsx',
          strict: false,
        },
        include: ['src'],
      }, null, 2),

      'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    };
  }

  if (framework === 'vue') {
    return {
      'package.json': JSON.stringify({
        name, private: true, version: '0.1.0', type: 'module',
        scripts: { dev: 'vite', build: 'vue-tsc && vite build', preview: 'vite preview' },
        dependencies: { vue: '^3.5.13' },
        devDependencies: {
          '@vitejs/plugin-vue': '^5.2.0', '@vue/tsconfig': '^0.7.0',
          typescript: '^5.6.3', vite: '^5.4.10', 'vue-tsc': '^2.1.10',
        },
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite'\nimport vue from '@vitejs/plugin-vue'\nexport default defineConfig({ plugins: [vue()] })`,
      'tsconfig.json': JSON.stringify({ extends: '@vue/tsconfig/tsconfig.dom.json', include: ['src/**/*'] }, null, 2),
      'index.html': `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${projectName}</title></head><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>`,
    };
  }

  return {};
}

// Ensure entry points exist
function ensureEntryPoints(
  files: Record<string, string>,
  framework: string
): Record<string, string> {
  const result = { ...files };

  if (framework === 'react-vite' || framework === 'react') {
    // Ensure src/main.tsx exists
    if (!result['src/main.tsx'] && !result['src/main.jsx']) {
      const hasApp = result['src/App.tsx'] || result['src/App.jsx'];
      const hasCss = result['src/index.css'];
      result['src/main.tsx'] = [
        "import { StrictMode } from 'react';",
        "import { createRoot } from 'react-dom/client';",
        "import { BrowserRouter } from 'react-router-dom';",
        hasCss ? "import './index.css';" : '',
        hasApp ? "import App from './App';" : '',
        "createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>);",
      ].filter(Boolean).join('\n');
    }
  }

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, userId, files, projectName, framework = 'react-vite' } = await req.json();

    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    if (!VERCEL_TOKEN) {
      return NextResponse.json({
        error: 'VERCEL_TOKEN not configured. Go to vercel.com/account/tokens, create a token, and add it as VERCEL_TOKEN in Vercel environment variables.',
        setup_url: 'https://vercel.com/account/tokens',
      }, { status: 503 });
    }

    const cleanName = `wyber-${Math.random().toString(36).slice(2, 10)}`; // Short random name

    // Merge scaffold + user files
    const scaffold = getBuildScaffold(framework, projectName ?? 'My App');
    
    // Add vercel.json to allow iframe embedding from wyberai.com
    scaffold['vercel.json'] = JSON.stringify({
      headers: [
        {
          source: '/(.*)',
          headers: [
            { key: 'X-Frame-Options', value: 'ALLOWALL' },
            { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://wyberai.com https://*.wyberai.com *" },
            { key: 'Access-Control-Allow-Origin', value: '*' },
          ],
        },
      ],
    }, null, 2);

    const sourceFiles = files as Record<string, { content: string; path?: string }>;

    // Flatten files map
    const allFiles: Record<string, string> = { ...scaffold };
    for (const [path, f] of Object.entries(sourceFiles)) {
      const content = typeof f === 'string' ? f : (f.content ?? '');
      if (content.trim()) {
        allFiles[path.replace(/^\//, '')] = content;
      }
    }

    // Ensure entry points
    const finalFiles = ensureEntryPoints(allFiles, framework);

    // Format for Vercel API
    const vercelFiles = Object.entries(finalFiles).map(([path, content]) => ({
      file: path,
      data: Buffer.from(content).toString('base64'),
      encoding: 'base64' as const,
    }));

    // Determine framework config
    const frameworkConfig = framework === 'vanilla'
      ? { framework: null }
      : { framework: 'vite', buildCommand: 'npm run build', outputDirectory: 'dist', installCommand: 'npm install' };

    const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
    const deployUrl = VERCEL_TEAM_ID
      ? `https://api.vercel.com/v13/deployments?teamId=${VERCEL_TEAM_ID}`
      : 'https://api.vercel.com/v13/deployments';

    const deployRes = await fetch(deployUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: cleanName,
        files: vercelFiles,
        projectSettings: frameworkConfig,
        target: 'production',
        ssoProtectionBypass: true,
        ...(VERCEL_TEAM_ID ? { teamId: VERCEL_TEAM_ID } : {}),
      }),
    });

    if (!deployRes.ok) {
      const errText = await deployRes.text();
      console.error('Vercel deploy error:', errText);
      return NextResponse.json({ error: `Vercel error: ${errText}` }, { status: 500 });
    }

    const deploy = await deployRes.json();
    const deployedUrl = `https://${deploy.url}`;

    // Save to Supabase
    try {
      const supabase = await createAdminClient();
      await supabase.from('projects')
        .update({ deployed_url: deployedUrl })
        .eq('id', projectId);
      await supabase.from('deployments').insert({
        project_id: projectId,
        user_id: userId,
        vercel_deploy_id: deploy.id,
        url: deployedUrl,
        status: 'building',
        triggered_by: 'manual',
      });
    } catch (e) {
      console.error('Supabase save error:', e);
    }

    return NextResponse.json({
      url: deployedUrl,
      deployId: deploy.id,
      status: deploy.readyState,
    });

  } catch (err) {
    console.error('Deploy error:', err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
