import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendDeploySuccessEmail, sendSecurityAlertEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { projectId, userId, files, projectName } = await req.json();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com';

  // 1. Safety check before deploy
  let userEmail = '';
  try {
    const supabase = await createAdminClient();
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single();
    userEmail = profile?.email ?? '';
  } catch {}

  const safetyRes = await fetch(`${appUrl}/api/safety`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, files }),
  }).catch(() => null);

  if (safetyRes?.ok) {
    const safety = await safetyRes.json();
    if (safety.blocked) {
      // Send security alert email
      if (userEmail) {
        sendSecurityAlertEmail(userEmail, projectName ?? 'Your project', safety.flags ?? []).catch(() => {});
      }
      return NextResponse.json({
        error: `Deploy blocked: ${safety.reason ?? 'Content policy violation'}`,
        blocked: true,
        flags: safety.flags,
      }, { status: 403 });
    }
  }

  const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
  if (!VERCEL_TOKEN) {
    return NextResponse.json({ error: 'VERCEL_TOKEN not configured. Add it to .env.local' }, { status: 503 });
  }

  const cleanName = (projectName ?? 'wyber-app').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50);

  const vercelFiles = Object.entries(files as Record<string, { content: string }>).map(([path, f]) => ({
    file: path,
    data: Buffer.from(f.content).toString('base64'),
    encoding: 'base64',
  }));

  const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: cleanName,
      files: vercelFiles,
      projectSettings: { framework: 'vite', buildCommand: 'npm run build', outputDirectory: 'dist' },
      target: 'production',
    }),
  });

  if (!deployRes.ok) {
    return NextResponse.json({ error: await deployRes.text() }, { status: 500 });
  }

  const deploy = await deployRes.json();
  const deployedUrl = `https://${deploy.url}`;

  // Save to Supabase
  const supabase = await createAdminClient();
  await supabase.from('projects').update({ deployed_url: deployedUrl, vercel_project_id: deploy.projectId }).eq('id', projectId);
  await supabase.from('deployments').insert({
    project_id: projectId, user_id: userId,
    vercel_deploy_id: deploy.id, url: deployedUrl, status: 'ready',
  });

  // Fire-and-forget: email + thumbnail
  if (userEmail) {
    sendDeploySuccessEmail(userEmail, projectName ?? 'Your app', deployedUrl).catch(() => {});
  }
  fetch(`${appUrl}/api/thumbnail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, previewUrl: deployedUrl }),
  }).catch(() => {});

  return NextResponse.json({ url: deployedUrl, deployId: deploy.id });
}
