import { NextRequest, NextResponse } from 'next/server';

// Map of projectId -> sandboxId (in-memory; use Redis/Supabase for production)
const sandboxMap = new Map<string, string>();

export async function POST(req: NextRequest) {
  const { projectId, files, framework } = await req.json();

  try {
    // Dynamic import so build doesn't fail without E2B key
    const { Sandbox } = await import('@e2b/code-interpreter');

    let sandboxId = sandboxMap.get(projectId);
    let sandbox: InstanceType<typeof Sandbox>;

    if (sandboxId) {
      try {
        sandbox = await Sandbox.connect(sandboxId);
      } catch {
        sandbox = await Sandbox.create({ timeoutMs: 30_000 });
        sandboxMap.set(projectId, sandbox.sandboxId);
      }
    } else {
      sandbox = await Sandbox.create({ timeoutMs: 30_000 });
      sandboxMap.set(projectId, sandbox.sandboxId);

      // Install deps based on framework
      const pkg = files['package.json']?.content;
      if (pkg) {
        await sandbox.files.write('/app/package.json', pkg);
        await sandbox.commands.run('cd /app && npm install', { timeoutMs: 60_000 });
      }
    }

    // Write all files
    for (const [path, file] of Object.entries(files) as [string, { content: string }][]) {
      await sandbox.files.write(`/app/${path}`, file.content);
    }

    // Start dev server if not running
    const devCmd = framework === 'next' ? 'next dev' : 'vite --host';
    sandbox.commands.run(`cd /app && ${devCmd}`, { background: true });

    // Wait a moment for server to boot
    await new Promise(r => setTimeout(r, 2000));

    const port = framework === 'next' ? 3000 : 5173;
    const previewUrl = await sandbox.getHost(port);

    return NextResponse.json({ previewUrl: `https://${previewUrl}`, sandboxId: sandbox.sandboxId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sandbox error';
    // If E2B key not set, return helpful message
    if (msg.includes('E2B_API_KEY') || msg.includes('Cannot find module')) {
      return NextResponse.json({ error: 'E2B not configured. Add E2B_API_KEY to .env.local' }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
