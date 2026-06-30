import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateImageB64, persistImage, imageKey } from '@/lib/generate-image-persist';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt, size = '1024x1024' } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Image generation not configured — add OPENAI_API_KEY to .env.local' }, { status: 503 });
    }

    const b64 = await generateImageB64(prompt, size);
    if (!b64) return NextResponse.json({ error: 'Generation failed' }, { status: 500 });

    // Persist to durable storage → a PERMANENT url. (DALL·E's own url expires in
    // ~1h, which previously left images broken once inserted into an app.)
    const admin = createServiceClient();
    const url = await persistImage(admin, b64, imageKey(user.id, prompt, size));
    if (!url) return NextResponse.json({ error: 'Could not store the generated image' }, { status: 500 });

    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
