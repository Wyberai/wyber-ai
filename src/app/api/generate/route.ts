import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const MODELS = {
  fast:    { id: 'claude-haiku-4-5',  credits: 1, label: 'Fast' },
  default: { id: 'claude-sonnet-4-5', credits: 1, label: 'Standard' },
  premium: { id: 'claude-sonnet-4-5', credits: 2, label: 'Premium' },
};

const FRAMEWORK_GUIDES: Record<string, string> = {
  'react-vite': 'React 18 + Vite + TypeScript. Functional components, hooks. .tsx files.',
  'vue': 'Vue 3 + Composition API. <script setup> syntax. Single-file .vue components.',
  'vanilla': 'Vanilla HTML5 + CSS3 + ES6+. No frameworks.',
  'next': 'Next.js 15 App Router + TypeScript. "use client" for interactive components.',
};

function buildSystemPrompt(framework: string, knowledge?: string): string {
  return `You are an elite UI engineer. Your output is indistinguishable from apps designed by senior designers at Linear, Vercel, or Stripe. You never produce tutorial-quality code.

FRAMEWORK: ${FRAMEWORK_GUIDES[framework] ?? FRAMEWORK_GUIDES['react-vite']}

OUTPUT -- strict format:
<file path="path/file.ext">
full file content -- never truncated
</file>
Then 1-2 sentence summary.

DESIGN RULES (non-negotiable):
- Import Inter or DM Sans from Google Fonts in every CSS file
- Dark theme default: bg #09090b, surface #111113, elevated #1a1a1f, border rgba(255,255,255,0.08), text #fafafa, muted #a1a1aa
- Accent: #8b5cf6 primary, #7c3aed hover. Success #22c55e. Error #ef4444. Warning #f59e0b
- 8pt spacing grid: 4/8/12/16/20/24/32/40/48/64px only
- Border radius: 6px buttons, 8px cards, 12px panels, 16px large cards
- Buttons: hover translateY(-1px) + brightness(1.1), active scale(0.97), 0.15s ease
- Cards: hover translateY(-2px) + shadow increase, border brightens
- Inputs: 36-40px height, focus ring rgba(139,92,246,0.5)
- Sidebar nav: 240px, 36px items, active = accent bg + 3px left border
- Shadows: subtle 0 1px 2px rgba(0,0,0,0.5), default 0 4px 6px -1px rgba(0,0,0,0.4)

DATA (always realistic, never Lorem Ipsum):
- Names: James Mitchell, Sarah Chen, Marcus Williams, Priya Patel, Alex Rodriguez
- Amounts: $1,247.50 / $89,400 / $2.3M ARR (realistic ranges)
- Dates: "2 hours ago" / "Yesterday" / "Mar 15" (relative)
- Avatars: https://api.dicebear.com/7.x/avataaars/svg?seed=NAME
- Images: https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT
- Status badges: Active=green bg, Pending=amber bg, Failed=red bg

ARCHITECTURE:
- ALWAYS use relative imports (./components/Header) never path aliases (@/components/Header)
- ALWAYS put components in src/ folder for React projects, never in app/ folder
- ALWAYS have a src/App.tsx as the main entry component
- Split into focused component files -- never dump everything in App.tsx
- Every vite.config.ts MUST include: server: { host: '0.0.0.0', allowedHosts: true, port: 5173 }
- CSS variables in :root, not inline per-component
- Loading states, error states, empty states on every data view
- Mobile responsive with CSS Grid auto-fit and clamp()

QUALITY BAR:
Does this look like it was built by a funded startup? If not, make it better.
Never: centered "hello world", rainbow colors, unstyled tables, forms without focus states.
Always: proper navigation, realistic data, polished micro-interactions, consistent spacing.
${knowledge ? `\nPROJECT CONTEXT (follow strictly):\n${knowledge}` : ''}`;
}

type ValidMimeType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
function isValidMime(m: string): m is ValidMimeType {
  return ['image/jpeg','image/png','image/gif','image/webp'].includes(m);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, framework, fileContext, history, knowledge, image, modelTier = 'default', userId, projectId } = body;

    const model = MODELS[modelTier as keyof typeof MODELS] ?? MODELS.default;

    // Auth + credit check
    if (userId) {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      const { data: profile } = await supabase
        .from('profiles')
        .select('credits, plan')
        .eq('id', userId)
        .single();

      if (!profile) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 401, headers: { 'Content-Type': 'application/json' },
        });
      }

      if (profile.credits < model.credits) {
        return new Response(JSON.stringify({ error: 'Insufficient credits' }), {
          status: 402, headers: { 'Content-Type': 'application/json' },
        });
      }

      // Deduct credits immediately before generation
      await supabase
        .from('profiles')
        .update({ credits: Math.max(0, profile.credits - model.credits) })
        .eq('id', userId);
    }

    const smartContext = fileContext ? fileContext.slice(0, 20000) : '';
    const textContent = smartContext
      ? `Current project files:\n\n${smartContext}\n\n---\n\nUser request: ${prompt}`
      : prompt;

    let lastUserContent: Anthropic.MessageParam['content'];

    if (image?.base64 && isValidMime(image.mimeType ?? '')) {
      lastUserContent = [
        { type: 'image', source: { type: 'base64', media_type: image.mimeType as ValidMimeType, data: image.base64 } },
        { type: 'text', text: textContent },
      ];
    } else {
      lastUserContent = textContent;
    }

    const trimmedHistory = ((history ?? []) as Array<{ role: string; content: string }>)
      .filter(m => !m.content.startsWith('[Image:'))
      .slice(-4)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content.length > 1500 ? m.content.slice(0, 1500) + '...' : m.content,
      }));

    const messages: Anthropic.MessageParam[] = [
      ...trimmedHistory,
      { role: 'user', content: lastUserContent },
    ];

    const stream = await client.messages.stream({
      model: model.id,
      max_tokens: 16000,
      system: buildSystemPrompt(framework ?? 'react-vite', knowledge),
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (err) {
          console.error('Stream error:', err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Credits-Used': String(model.credits),
        'X-Model-Used': model.label,
      },
    });

  } catch (err) {
    console.error('Generate error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}