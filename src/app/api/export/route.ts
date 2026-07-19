import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sanitizeFiles } from '@/lib/sanitize-files';
import { scanForExposedSecrets } from '@/lib/security-scan';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Auth: only the project owner may export
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed } = rateLimit(`export:${user.id}`, 20, 600_000)
  if (!allowed) return NextResponse.json({ error: 'Too many exports in a short time. Please wait a few minutes.' }, { status: 429 })

  const { projectId, format } = await req.json();
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const supabase = createServiceClient();
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)   // ownership check — service client used only after this gate
    .single();

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  if (format === 'json') {
    // Return all project data as JSON
    const { data: generations } = await supabase
      .from('generations')
      .select('prompt, files_changed, created_at, credits_used')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        framework: project.framework,
        files: project.files,
        created_at: project.created_at,
        updated_at: project.updated_at,
        deployed_url: project.deployed_url,
        github_repo: project.github_repo,
      },
      generations: generations ?? [],
      exportedAt: new Date().toISOString(),
      note: 'This export contains all your project files and generation history. Your data belongs to you.',
    });
  }

  if (format === 'zip') {
    // Return files as a ZIP-compatible structure
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Sanitize before export: guarantees entry points, package.json toolchain,
    // and stubs missing imports so the exported project actually builds
    // (mirrors the same pass deploy/route.ts runs before pushing to Vercel).
    const rawFiles = project.files as Record<string, { content: string }>;
    const files = sanitizeFiles(rawFiles);

    const secretScan = scanForExposedSecrets(files);
    if (!secretScan.ok) {
      const summary = secretScan.findings.map(f => `${f.name} in ${f.file}`).join('; ');
      return NextResponse.json({ error: `Export blocked: exposed secret detected (${summary}). Move it to an env var before exporting.` }, { status: 400 });
    }
    for (const [path, file] of Object.entries(files)) {
      const content = typeof file === 'string' ? file : file.content ?? '';
      zip.file(path, content);
    }

    const hasSupabaseEnv = Object.keys(files).some(p => /supabase/i.test(p));
    // Mobile projects are stored with project_type='mobile' (framework is often
    // still 'react-vite'), so key off project_type — with a framework/App.tsx
    // fallback — to decide Expo vs web run instructions.
    const isMobile = project.project_type === 'mobile'
      || /react-native|expo/i.test(String(project.framework ?? ''))
      || Object.keys(files).some(p => /^(src\/)?screens\//i.test(p));

    // README — the run instructions differ by framework. A React Native / Expo
    // project uses the Expo CLI + EAS, not Vite, and reads EXPO_PUBLIC_* env
    // vars; a web project uses Vite + VITE_* vars. Shipping the wrong steps
    // (the old web-only README) sent mobile users down a dead end.
    const setupLine = hasSupabaseEnv
      ? (isMobile
          ? '- This project uses Supabase. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (check `lib/supabase*` for values to move into a `.env` / app config) before running.'
          : '- This project uses Supabase. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or check `src/lib/supabase.ts` for hardcoded values to move into env vars) before running.')
      : '- No external services required.';

    const running = isMobile
      ? `\`\`\`bash
npm install
npx expo start        # opens Expo Dev Tools — scan the QR with Expo Go, or press i / a for a simulator
\`\`\`

## Building a production app (App Store / Play Store)
\`\`\`bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios      # or --platform android
eas submit --platform ios     # upload the build to the store
\`\`\`
Requires a free Expo account. See https://docs.expo.dev/build/introduction/ .`
      : `\`\`\`bash
npm install
npm run build   # verifies the project builds cleanly
npm run dev
\`\`\``;

    zip.file('WYBER_EXPORT.md', `# ${project.name}

Exported from WyberAi on ${new Date().toLocaleDateString()}

## Framework
${isMobile ? 'Expo / React Native' : project.framework}

## Files
${Object.keys(files).join('\n')}

## Required setup
${setupLine}

## Running locally
${running}

Your code belongs to you. No WyberAi dependency required to run this app.
`);

    const buffer = Buffer.from(await zip.generateAsync({ type: 'arraybuffer' }));

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '-')}.zip"`,
      },
    });
  }

  return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
}
