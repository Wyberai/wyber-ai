import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { captureScreenshot, uploadScreenshot, isAllowedScreenshotUrl } from '@/lib/screenshot';

export async function POST(req: NextRequest) {
  const { projectId, previewUrl } = await req.json();
  if (!projectId || !previewUrl) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  // This runs a real server-side fetch of `previewUrl` inside a headless
  // browser and writes the result to `projectId` — without these two checks
  // it's an unauthenticated arbitrary-URL SSRF primitive with a write side
  // effect on any project row.
  if (!isAllowedScreenshotUrl(previewUrl)) {
    return NextResponse.json({ error: 'previewUrl is not on an allowed host' }, { status: 400 });
  }
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await createAdminClient();
  const { data: project } = await admin.from('projects').select('user_id').eq('id', projectId).single();
  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: 'Not your project' }, { status: 403 });
  }

  try {
    const screenshotBuffer = await captureScreenshot(previewUrl);
    const publicUrl = await uploadScreenshot(screenshotBuffer, `thumbnails/${projectId}.jpg`);

    await admin.from('projects')
      .update({ thumbnail_url: publicUrl })
      .eq('id', projectId);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    // Graceful fallback - thumbnails are non-critical
    console.error('Thumbnail error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
