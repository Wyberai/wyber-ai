import { NextRequest, NextResponse } from 'next/server';
import { Sandbox } from '@e2b/code-interpreter';

const VITE_CONFIG_REACT = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', allowedHosts: true, port: 5173 },
});`;

const VITE_CONFIG_VUE = `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  plugins: [vue()],
  server: { host: '0.0.0.0', allowedHosts: true, port: 5173 },
});`;

async function waitForPort(sandbox: Sandbox, port: number, maxMs = 120000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const result = await sandbox.commands.run(
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}`,
        { timeoutMs: 5000 }
      );
      const code = result.stdout.trim();
      if (code && code !== '000') return true;
    } catch {}
    await new Promise(r => setTimeout(r, 5000));
  }
  return false;
}

export async function POST(req: NextRequest) {
  const { files, framework } = await req.json();

  if (!process.env.E2B_API_KEY) {
    return NextResponse.json({ error: 'E2B_API_KEY not configured' }, { status: 503 });
  }

  try {
    const sandbox = await Sandbox.create({
      timeoutMs: 300_000,
      apiKey: process.env.E2B_API_KEY,
    });

    const base = '/home/user/app';

    // Write package.json first
    const pkgJson = (files['package.json'] as { content: string } | undefined)?.content;
    if (pkgJson) {
      await sandbox.files.write(`${base}/package.json`, pkgJson);
    }

    // Write only essential files — skip patterns that bloat the sandbox
    const SKIP_PATTERNS = ['.test.', '.spec.', 'README', '.gitignore', 'tsconfig'];
    const essentialFiles = Object.entries(files as Record<string, { content: string }>)
      .filter(([path]) => !SKIP_PATTERNS.some(p => path.includes(p)))
      .slice(0, 20);

    for (const [path, file] of essentialFiles) {
      const content = file.content.length > 50000
        ? file.content.slice(0, 50000)
        : file.content;
      await sandbox.files.write(`${base}/${path}`, content);
    }

    if (framework === 'vanilla') {
      sandbox.commands.run(
        `cd ${base} && npx --yes serve -l 5173 -s .`,
        { background: true }
      );

    } else if (framework === 'next') {
      await sandbox.commands.run(
        `cd ${base} && npm install 2>&1 | tail -3`,
        { timeoutMs: 90_000 }
      );
      sandbox.commands.run(
        `cd ${base} && npx next dev -p 5173`,
        { background: true }
      );

    } else {
      // React or Vue
      await sandbox.commands.run(
        `cd ${base} && npm install 2>&1 | tail -3`,
        { timeoutMs: 90_000 }
      );

      // Always overwrite vite config — never trust AI-generated one
      const isVue = framework === 'vue';
      await sandbox.files.write(
        `${base}/${isVue ? 'vite.config.js' : 'vite.config.ts'}`,
        isVue ? VITE_CONFIG_VUE : VITE_CONFIG_REACT
      );

      // Remove conflicting configs
      await sandbox.commands.run(
        `cd ${base} && rm -f vite.config.mjs vite.config.cjs`,
        { timeoutMs: 5000 }
      ).catch(() => {});

      sandbox.commands.run(
        `cd ${base} && npx vite --host 0.0.0.0 --port 5173 2>&1`,
        { background: true }
      );
    }

    // Poll until port responds
    const ready = await waitForPort(sandbox, 5173, 120000);
    console.log('Sandbox port ready:', ready);

    const host = await sandbox.getHost(5173);

    return NextResponse.json({
      previewUrl: `https://${host}`,
      sandboxId: sandbox.sandboxId,
    });

  } catch (err) {
    console.error('Sandbox error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}