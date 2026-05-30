import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const MODELS = {
  fast:    { id: 'claude-sonnet-4-6',        credits: 1, label: 'Fast' },
  default: { id: 'claude-opus-4-7',          credits: 2, label: 'Standard' },
  premium: { id: 'claude-opus-4-7',          credits: 3, label: 'Premium' },
};

const FRAMEWORK_GUIDES: Record<string, string> = {
  'react-vite': 'React 18 + Vite + TypeScript. Functional components, hooks. .tsx files.',
  'vue': 'Vue 3 + Composition API. <script setup> syntax. Single-file .vue components.',
  'vanilla': 'Vanilla HTML5 + CSS3 + ES6+. No frameworks.',
  'next': 'Next.js 15 App Router + TypeScript. "use client" for interactive components.',
};

// Tight, high-signal system prompt - quality over length
function buildSystemPrompt(framework: string, knowledge?: string): string {
  return `You are the world's best UI engineer and product designer. You build apps that look like they came from a $10M funded startup. Every pixel intentional. Every interaction polished. Production-ready on first generation.

FRAMEWORK: ${FRAMEWORK_GUIDES[framework] ?? FRAMEWORK_GUIDES['react-vite']}

OUTPUT FORMAT (strict):
<file path="src/App.tsx">
// complete file -- NEVER truncate
</file>
End with 1 sentence summary only.

MANDATORY FILE STRUCTURE FOR REACT:
- src/App.tsx (root, imports all sections)
- src/components/Navbar.tsx
- src/components/Hero.tsx
- src/components/[SectionName].tsx (one per major section)
- src/index.css (all global styles + CSS variables)
Use RELATIVE imports only: import Navbar from './components/Navbar'
NEVER @/ aliases. NEVER index.html for React.

CSS VARIABLES (copy exactly into src/index.css :root):
:root {
  --bg: #09090b; --surface: #111113; --elevated: #18181b;
  --border: rgba(255,255,255,0.07); --border-2: rgba(255,255,255,0.13);
  --text: #fafafa; --text-2: #a1a1aa; --text-3: #52525b;
  --accent: #0EA5E9; --accent-2: #0284C7;
  --accent-glow: rgba(14,165,233,0.3);
  --r-sm: 6px; --r: 8px; --r-lg: 12px; --r-xl: 16px;
  --shadow: 0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3);
  --shadow-lg: 0 10px 40px rgba(0,0,0,0.6);
  font-family: 'Space Grotesk', -apple-system, sans-serif;
}
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Sora:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }

NAVBAR (mandatory pattern):
height: 60px, position: sticky, top: 0, z-index: 100
background: rgba(9,9,11,0.85), backdrop-filter: blur(20px)
border-bottom: 1px solid var(--border)
Layout: logo LEFT | nav links CENTER (gap:32px, font-size:14px, color:var(--text-2)) | CTA button RIGHT
CTA button: bg var(--accent), color white, padding 8px 18px, border-radius var(--r-sm), font-weight 600

HERO SECTION (mandatory pattern):
min-height: 88vh, display flex, flex-direction column, align-items center, justify-content center
padding: 0 20px, text-align: center, position: relative
Badge/pill above headline: border 1px solid rgba(14,165,233,0.3), bg rgba(14,165,233,0.08), color #7DD3FC, border-radius 9999px, padding 4px 14px, font-size 12px, font-weight 500, letter-spacing 0.02em
Headline: font-family 'Sora', font-size clamp(40px,6vw,72px), font-weight 800, letter-spacing -0.03em, line-height 1.05
  HEADLINE MUST USE gradient text: background: linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  For tech/productivity products use: linear-gradient(135deg, #ffffff 0%, #38BDF8 60%, #0EA5E9 100%)
Subheadline: font-size clamp(16px,2vw,20px), color var(--text-2), max-width 560px, line-height 1.6, margin: 20px auto
Buttons row: gap 12px, margin-top 36px
Primary button: bg var(--accent), padding 13px 28px, border-radius var(--r-sm), font-weight 600, font-size 15px, hover bg var(--accent-2) + translateY(-1px) + box-shadow 0 4px 20px var(--accent-glow)
Ghost button: border 1px solid var(--border-2), bg transparent, color var(--text-2), same padding, hover color white border-color rgba(255,255,255,0.25)
Stats row below buttons: 3-4 metrics, font-size 24px font-weight 700, label font-size 13px color var(--text-2)
Visual element: a dark card/dashboard mockup at 60% opacity OR a grid of feature screenshots

FEATURE CARDS (3 cards, mandatory):
display: grid, grid-template-columns: repeat(3, 1fr), gap: 16px
Each card: bg var(--surface), border 1px solid var(--border), border-radius var(--r-lg), padding 28px
hover: transform translateY(-3px), border-color color-mix(in srgb, var(--accent) 40%, transparent), box-shadow var(--shadow-lg), transition all 0.2s
Icon container: width 44px, height 44px, border-radius var(--r), bg rgba(14,165,233,0.1), display flex, align-items center, justify-content center, margin-bottom 18px, font-size 20px
Title: font-size 17px, font-weight 700, margin-bottom 8px, letter-spacing -0.02em
Description: font-size 14px, color var(--text-2), line-height 1.65
Metric below: font-size 24px font-weight 700 color var(--accent), label font-size 12px color var(--text-3)

PRICING SECTION (2-3 tiers, mandatory):
Section title centered: font-size 36px font-weight 800 letter-spacing -0.03em
Toggle for monthly/annual with savings badge
Cards: bg var(--surface), border var(--border), border-radius var(--r-xl), padding 32px
Popular card: border-color var(--accent), position relative, badge "Most popular" top-right
Price: font-size 48px font-weight 800, /mo suffix font-size 16px color var(--text-2)
Feature list: checkmark (color success) + feature text, font-size 14px, gap 12px
CTA button full width

REALISTIC CONTENT RULES:
- Names: Sarah Chen, Marcus Williams, James Park, Priya Patel, Alex Rodriguez
- Stats: real-sounding (2,847 teams, $1.2M ARR, 99.9% uptime, 127ms avg)
- Testimonials: full name + title + company (Sarah Chen, VP Engineering at Notion)
- Features: benefit-driven ("Ship 3x faster" not "Fast feature")
- Prices: $0 / $12 / $49 / $199 per month
- NEVER Lorem Ipsum
- Avatars: https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah

INTERACTIONS (every interactive element must have these):
button: transition all 0.15s ease; hover: translateY(-1px); active: scale(0.97)
card: transition transform 0.2s, box-shadow 0.2s, border-color 0.2s
link: transition color 0.15s; hover: color var(--text)
input: transition border-color 0.15s; focus: border-color var(--accent), box-shadow 0 0 0 3px rgba(14,165,233,0.15)

BEFORE OUTPUTTING ASK:
1. Does the navbar have logo + links + CTA? If not, fix it.
2. Does the hero have a badge, large headline, subtext, 2 buttons, stats? If not, fix it.
3. Does every card have hover effects? If not, fix it.
4. Would a senior designer at Linear approve this? If not, make it better.
5. Is every number realistic and specific? If not, replace it.
${knowledge ? '\nPROJECT CONTEXT (follow strictly):\n' + knowledge : ''}`;
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
