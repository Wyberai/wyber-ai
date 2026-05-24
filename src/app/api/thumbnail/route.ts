import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { projectId, previewUrl } = await req.json();
  if (!projectId || !previewUrl) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  try {
    // Use puppeteer-core with @sparticuz/chromium for serverless
    const chromium = await import('@sparticuz/chromium');
    const puppeteer = await import('puppeteer-core');

    const browser = await puppeteer.default.launch({
      args: chromium.default.args,
      defaultViewport: { width: 1280, height: 800 },
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(previewUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000)); // let animations settle

    const screenshotBuffer = await page.screenshot({
      type: 'jpeg',
      quality: 80,
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    });
    await browser.close();

    // Upload to Supabase Storage
    const supabase = await createAdminClient();
    const filename = `thumbnails/${projectId}.jpg`;
    const { error } = await supabase.storage
      .from('wyber-assets')
      .upload(filename, screenshotBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('wyber-assets')
      .getPublicUrl(filename);

    await supabase.from('projects')
      .update({ thumbnail_url: publicUrl })
      .eq('id', projectId);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    // Graceful fallback - thumbnails are non-critical
    console.error('Thumbnail error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
