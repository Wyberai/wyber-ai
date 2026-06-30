import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prompt } = await req.json();

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are a UI/UX design advisor. Given a user's app idea, generate exactly 3 distinct design directions as JSON.
Each direction must have: id, name, description, primaryColor (hex), accentColor (hex), bgColor (hex), fontStyle ("serif"|"sans"|"mono"), mood (1 word), layoutStyle ("minimal"|"bold"|"playful"|"professional"|"dark").
Return ONLY valid JSON array, no markdown, no explanation.`,
      messages: [{ role: 'user', content: `App idea: ${prompt}` }],
    }),
  });

  const data = await res.json();
  try {
    const text = data.content?.[0]?.text || '[]';
    const directions = JSON.parse(text);
    return NextResponse.json({ directions });
  } catch {
    return NextResponse.json({ directions: [] });
  }
}