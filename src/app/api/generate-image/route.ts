import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt, size = '1024x1024', style = 'vivid' } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return NextResponse.json({ error: 'Image generation not configured — add OPENAI_API_KEY to .env.local' }, { status: 503 });

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, style, response_format: 'url' }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error?.message || 'Generation failed' }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ url: data.data?.[0]?.url, revisedPrompt: data.data?.[0]?.revised_prompt });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}