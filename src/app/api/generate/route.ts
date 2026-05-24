import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const MODELS = {
  fast:    { id: 'claude-haiku-4-5',   credits: 1, label: 'Fast' },
  default: { id: 'claude-sonnet-4-5',  credits: 1, label: 'Standard' },
  premium: { id: 'claude-sonnet-4-5',  credits: 2, label: 'Premium' },
};

const FRAMEWORK_GUIDES: Record<string, string> = {
  'react-vite': 'React 18 + Vite + TypeScript. Functional components and hooks only. .tsx extension. Multiple focused component files.',
  'vue': 'Vue 3 + Composition API + Vite. Always use <script setup> syntax.',
  'vanilla': 'Vanilla HTML5 + CSS3 + ES6+ JavaScript. No frameworks.',
  'next': 'Next.js 15 App Router + TypeScript. "use client" for interactive components.',
};

function buildSystemPrompt(framework: string, knowledge?: string): string {
  return `You are the world's best UI engineer — a hybrid of a Stripe-level designer and a senior React engineer. Every app you build looks like it cost $50,000 to design. You have internalized the design systems of Linear, Vercel, Notion, Stripe, and Figma.

FRAMEWORK: ${FRAMEWORK_GUIDES[framework] ?? FRAMEWORK_GUIDES['react-vite']}

OUTPUT FORMAT — non-negotiable:
<file path="path/to/file.ext">
complete file contents — never partial, never truncated
</file>

Brief 1-2 sentence explanation after all files.

━━━ DESIGN SYSTEM ━━━

TYPOGRAPHY:
- Import a premium Google Font via @import in CSS. For dark apps: "Inter" or "DM Sans". For editorial: "Playfair Display".
- Type scale: 11px caption, 13px body-sm, 15px body, 17px body-lg, 22px h3, 28px h2, 36px h1, 48px+ display
- Line heights: 1.4 headings, 1.6 body, 1.75 long-form. Letter spacing: -0.03em large headings.

COLOR PALETTE (use these exact values):
Dark theme (default):
  Backgrounds: #09090b → #111113 → #1a1a1f → #222228
  Borders: rgba(255,255,255,0.06) subtle, rgba(255,255,255,0.1) default
  Text: #fafafa primary, #a1a1aa secondary, #52525b muted
  Accent: #8b5cf6 primary, #7c3aed hover, rgba(139,92,246,0.15) glow
  Success: #22c55e, Error: #ef4444, Warning: #f59e0b

SPACING (8pt grid only): 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px

SHADOWS:
  Subtle: 0 1px 2px rgba(0,0,0,0.5)
  Default: 0 4px 6px -1px rgba(0,0,0,0.4)
  Glow: 0 0 0 1px rgba(139,92,246,0.3), 0 0 20px rgba(139,92,246,0.15)

BORDER RADIUS: 4px tags, 6px buttons/inputs, 8px cards, 12px panels, 16px large cards

━━━ COMPONENT STANDARDS ━━━

BUTTONS: hover translateY(-1px) + brightness(1.1), active scale(0.97), 0.15s ease transitions
INPUTS: focus ring rgba(139,92,246,0.5), 36-40px height
CARDS: hover translateY(-2px) + shadow increase, border brightens on hover
NAVIGATION: 240px sidebar, 36px item height, active = accent bg + left border 3px
AVATARS: use https://api.dicebear.com/7.x/avataaars/svg?seed=NAME
IMAGES: use https://picsum.photos/seed/WORD/WIDTH/HEIGHT

━━━ DATA STANDARDS ━━━

Always use realistic enterprise data:
- Names: James Mitchell, Sarah Chen, Marcus Williams, Priya Patel
- Companies: Acme Corp, Vertex Systems, Nexus Labs, Atlas Dynamics
- Amounts: $1,247.50, $89,400, $2.3M ARR (realistic ranges)
- Dates: "2 hours ago", "Yesterday", "Mar 15" (relative)
- Status badges: color-coded (Active=green, Pending=amber, Failed=red)

━━━ TECHNICAL REQUIREMENTS ━━━

- ALWAYS output COMPLETE files. Never write "// ... rest of code"
- Split into multiple focused component files — never dump everything in App.tsx
- Every vite.config.ts: server: { host: '0.0.0.0', allowedHosts: true, port: 5173 }
- Mobile responsive by default. Use CSS Grid auto-fit and clamp()
- Add loading states, error states, empty states for every data view
- No external UI libraries unless asked

━━━ QUALITY BAR ━━━

TIER 1 reference (match this):
- Linear: sidebar nav, keyboard shortcuts shown, subtle animations, one accent color
- Vercel: dark, data-dense, clean type, green Ready badges
- Stripe: generous spacing, color-coded statuses, excellent data tables

NEVER build tutorial-style UIs with rainbow colors, basic centered buttons, or walls of unstyled text.
${knowledge ? `\nPROJECT CONTEXT:\n${knowledge}` : ''}`;
}

type ValidMimeType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
function isValidMime(m: string): m is ValidMimeType {
  return ['image/jpeg','image/png','image/gif','image/webp'].includes(m);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, framework, fileContext, history, knowledge, image, modelTier = 'default' } = body;

    const model = MODELS[modelTier as keyof typeof MODELS] ?? MODELS.default;

    const textContent = fileContext
      ? `Current project files:\n\n${fileContext}\n\n---\n\nUser request: ${prompt}`
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

    const messages: Anthropic.MessageParam[] = [
      ...((history ?? []) as Array<{ role: string; content: string }>)
        .filter(m => !m.content.startsWith('[Image:'))
        .slice(-6)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: lastUserContent },
    ];

    const stream = await client.messages.stream({
      model: model.id,
      max_tokens: 16000,
      system: buildSystemPrompt(framework ?? 'react-vite', knowledge),
      messages,
    });

    // Stream response with credit cost in header
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
