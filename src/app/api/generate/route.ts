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

// Tight, high-signal system prompt - quality over length
function buildSystemPrompt(framework: string, knowledge?: string): string {
  return `You are an elite UI engineer. Your output is indistinguishable from apps designed by senior designers at Linear, Vercel, or Stripe. You never produce tutorial-quality code.

FRAMEWORK: ${FRAMEWORK_GUIDES[framework] ?? FRAMEWORK_GUIDES['react-vite']}

OUTPUT — strict format:
<file path="path/file.ext">
full file content — never truncated
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
- Split into focused component files — never dump everything in App.tsx
- For React/Next/Vue: ALWAYS output .tsx or .vue files. NEVER output index.html for component frameworks.
- React file structure: src/App.tsx as root, src/components/ for sub-components, src/index.css for styles
- ALWAYS use relative imports like ./components/Header -- NEVER use @/ path aliases
- Every vite.config.ts MUST include: server: { host: '0.0.0.0', allowedHosts: true, port: 5173 }
- CSS variables in :root, not inline per-component
- Loading states, error states, empty states on every data view
- Mobile responsive with CSS Grid auto-fit and clamp()

QUALITY BAR — ask yourself before outputting:
Does this look like it was built by a funded startup? If not, make it better.
Never: centered "hello world" with a blue button, rainbow colors, Comic Sans energy, unstyled tables, forms without focus states.
Always: proper navigation context, realistic data, polished micro-interactions, consistent spacing.
${knowledge ? `\nPROJECT CONTEXT (follow strictly):\n${knowledge}` : ''}`;
}

type ValidMimeType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
function isValidMime(m: string): m is ValidMimeType {
  return ['image/jpeg','image/png','image/gif','image/webp'].includes(m);
}

// Smart file selection — only send files relevant to the request
function selectRelevantFiles(
  files: Record<string, { content: string }>,
  prompt: string
): string {
  const allFiles = Object.entries(files);
  if (allFiles.length === 0) return '';

  const promptLower = prompt.toLowerCase();

  // Always include these core files
  const CORE = ['app.tsx', 'app.vue', 'index.html', 'index.css', 'app.css', 'main.tsx', 'main.js'];

  // Score files by relevance to prompt
  const scored = allFiles.map(([path, file]) => {
    const pathLower = path.toLowerCase();
    let score = 0;

    // Core files always included
    if (CORE.some(c => pathLower.endsWith(c))) score += 100;

    // Prompt keywords match filename
    const words = promptLower.split(/\s+/).filter(w => w.length > 3);
    words.forEach(word => {
      if (pathLower.includes(word)) score += 20;
    });

    // Recently modified files (shorter = more likely starter)
    if (file.content.length < 500) score += 5;

    return { path, content: file.content, score };
  });

  // Sort by score, take top 10, limit content size
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ path, content }) =>
      `<file path="${path}">\n${content.slice(0, 2000)}\n</file>`
    )
    .join('\n\n');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, framework, fileContext, history, knowledge, image, modelTier = 'default' } = body;

    const model = MODELS[modelTier as keyof typeof MODELS] ?? MODELS.default;

    // Use smart file selection instead of raw fileContext if files object available
    const smartContext = fileContext
      ? fileContext.slice(0, 20000) // hard cap to prevent token bloat
      : '';

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

    // Lean history — last 4 exchanges, 1500 char cap
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
