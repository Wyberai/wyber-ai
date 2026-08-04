import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, files } = await req.json();

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: `You are an SEO and AEO (AI Engine Optimization) expert. Analyze a web app and return a JSON audit with these exact fields:
{
  "score": number (0-100),
  "checks": [{ "id": string, "name": string, "status": "pass"|"fail"|"warn", "description": string, "fix": string }],
  "keywords": [string],
  "aiSearchOptimized": boolean,
  "recommendations": [string]
}
Check for: meta title, meta description, OG tags, Twitter cards, canonical, sitemap, robots.txt, structured data JSON-LD, semantic HTML, alt text, heading hierarchy, mobile viewport, page speed hints, AI crawler permissions (GPTBot, Claude-Web, PerplexityBot in robots.txt).
Return ONLY valid JSON.`,
      messages: [{ role: 'user', content: `URL: ${url || 'Not deployed yet'}\n\nApp code sample:\n${JSON.stringify(files || {}).slice(0, 3000)}` }],
    }),
  });

  const data = await res.json();
  try {
    const text = data.content?.[0]?.text || '{}';
    const audit = JSON.parse(text);
    return NextResponse.json({ audit });
  } catch {
    return NextResponse.json({ audit: { score: 0, checks: [], keywords: [], aiSearchOptimized: false, recommendations: [] } });
  }
}