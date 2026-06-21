import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { figmaUrl, figmaToken } = await req.json();
  if (!figmaUrl) return NextResponse.json({ error: 'Figma URL required' }, { status: 400 });

  const match = figmaUrl.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  if (!match) return NextResponse.json({ error: 'Invalid Figma URL. Use a share link from Figma.' }, { status: 400 });

  const fileKey = match[1];
  const token = figmaToken || process.env.FIGMA_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: 'Figma access token required.' }, { status: 400 });

  try {
    const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { 'X-Figma-Token': token },
    });
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch Figma file. Check your token and URL.' }, { status: 400 });

    const figmaData = await res.json();
    const fileName = figmaData.name || 'Figma Import';
    const pages = figmaData.document?.children || [];

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: `You are an expert at converting Figma designs to React/Next.js code. Given a Figma file structure, generate a production-ready React component with inline styles. Extract colors, typography, spacing, layout, and component structure. Return ONLY the React component code, no explanation, no markdown. Export as default.`,
        messages: [{ role: 'user', content: `Convert this Figma design to React. File: "${fileName}"\n\nStructure:\n${JSON.stringify(pages[0] || {}, null, 2).slice(0, 8000)}` }],
      }),
    });

    const claudeData = await claudeRes.json();
    const code = claudeData.content?.[0]?.text || '';
    return NextResponse.json({ fileName, code, pages: pages.map((p: any) => ({ name: p.name, id: p.id })) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}