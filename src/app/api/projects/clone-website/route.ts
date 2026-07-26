import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, name } = await req.json();
  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

  let targetUrl: URL;
  try {
    targetUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return NextResponse.json({ error: 'Invalid URL — please include https://' }, { status: 400 });
  }

  // Only allow http/https schemes (no file://, javascript:, etc.)
  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    return NextResponse.json({ error: 'Only http/https URLs are supported' }, { status: 400 });
  }

  // Fetch the page HTML server-side to avoid CORS
  let html = '';
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(targetUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WyberAI/1.0; +https://wyberai.com)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(id);
    if (res.ok) {
      const raw = await res.text();
      // Truncate at 60 KB — keeps the prompt manageable while covering most landing pages
      html = raw.length > 60_000 ? raw.slice(0, 60_000) + '\n<!-- [HTML truncated at 60KB] -->' : raw;
    }
  } catch {
    // Fetch failed (timeout, DNS, etc.) — proceed with URL-only context
  }

  const projectName = name?.trim() || `Clone of ${targetUrl.hostname}`;

  const initial_prompt = `Recreate the website at ${targetUrl.toString()} as a beautiful, pixel-perfect, fully responsive landing page.

Build it with React + Tailwind CSS. Match the layout, sections, typography, colors, and overall feel of the original — but make it cleaner and more modern where you can.

Required sections to include (based on what's on the page):
- Hero / above-the-fold section with headline, subheading, and CTA button
- Features / benefits section
- Social proof / testimonials (if present)
- Pricing section (if present)
- FAQ section (if present)
- Footer with navigation links

Technical requirements:
- Fully responsive (mobile-first, adapts to all screen sizes)
- Smooth scroll-reveal animations using CSS transitions
- Hover states on all interactive elements
- Clean, semantic HTML structure
- No external image dependencies — use gradient placeholders or SVG illustrations
${html ? `\nHere is the source HTML from the original page for reference:\n\`\`\`html\n${html}\n\`\`\`` : ''}`;

  const admin = await createAdminClient();
  const { data: project, error } = await admin
    .from('projects')
    .insert({
      user_id: user.id,
      name: projectName.slice(0, 80),
      framework: 'react-vite',
      project_type: 'website',
      initial_prompt,
      is_public: false,
    })
    .select('id, name')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ project, project_type: 'website', initialPrompt: initial_prompt });
}
