import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const MODELS = {
  fast:    { id: 'claude-sonnet-4-6', credits: 1, label: 'Fast' },
  default: { id: 'claude-sonnet-4-6', credits: 1, label: 'Standard' },
  premium: { id: 'claude-sonnet-4-6', credits: 2, label: 'Premium' },
};

const FRAMEWORK_GUIDES: Record<string, string> = {
  'react-vite': 'React 18 + Vite + TypeScript. Entry: src/main.tsx renders src/App.tsx. Components in src/components/. Styles in src/index.css.',
  'vue': 'Vue 3 + Composition API + TypeScript. Entry: src/main.ts. Components in src/components/ as .vue files.',
  'vanilla': 'Pure HTML5 + CSS3 + ES6. Single index.html file with embedded or linked CSS/JS.',
  'next': 'Next.js 15 App Router + TypeScript. Use "use client" for interactive components. Entry: app/page.tsx.',
};

// Pre-built skeletons injected before AI customization — instant first render
const SKELETONS: Record<string, Record<string, string>> = {
  dashboard: {
    'src/App.tsx': `import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import './index.css'
export default function App() {
  const [activeNav, setActiveNav] = useState('dashboard')
  return (
    <div className="app-layout">
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
      <div className="main-area">
        <Header />
        <main className="page-content"><Dashboard /></main>
      </div>
    </div>
  )
}`,
  },
  landing: {
    'src/App.tsx': `import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Pricing from './components/Pricing'
import Footer from './components/Footer'
import './index.css'
export default function App() {
  return <div><Navbar /><Hero /><Features /><Pricing /><Footer /></div>
}`,
  },
};

// Detect app type from prompt for skeleton selection
function detectAppType(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('dashboard') || p.includes('admin') || p.includes('analytics') || p.includes('crm') || p.includes('project management')) return 'dashboard';
  if (p.includes('landing') || p.includes('homepage') || p.includes('marketing') || p.includes('saas page')) return 'landing';
  if (p.includes('auth') || p.includes('login') || p.includes('signup') || p.includes('register')) return 'auth';
  if (p.includes('ecommerce') || p.includes('store') || p.includes('shop') || p.includes('cart')) return 'ecommerce';
  return 'custom';
}

// System prompt with Anthropic prompt caching markers
function buildSystemPrompt(framework: string): string {
  return `You are an elite UI engineer building production-grade React apps. Your code is clean, complete, and ships on first generation.

FRAMEWORK: ${FRAMEWORK_GUIDES[framework] ?? FRAMEWORK_GUIDES['react-vite']}

═══════════════════════════════════════════
OUTPUT FORMAT — STRICT, NO EXCEPTIONS
═══════════════════════════════════════════
Output ONLY file blocks. No preamble. No explanation. No markdown.

<file path="src/index.css">
/* complete file */
</file>
<file path="src/App.tsx">
// complete file
</file>
<file path="src/components/ComponentName.tsx">
// complete file
</file>

After ALL files: write ONE sentence summary starting with "Built:"

═══════════════════════════════════════════
COMPLETENESS RULES — NEVER VIOLATE
═══════════════════════════════════════════
1. Count every import in App.tsx — each one MUST have a corresponding file block
2. If App.tsx imports Footer, you MUST output src/components/Footer.tsx
3. If App.tsx imports Sidebar, you MUST output src/components/Sidebar.tsx
4. NEVER write "// ... rest of component" or truncate any file
5. NEVER use @/ path aliases — use relative imports only: ./components/X
6. Every component must be complete and self-contained
7. If you cannot fit all files, use FEWER components — never truncate

═══════════════════════════════════════════
DESIGN SYSTEM
═══════════════════════════════════════════
CSS Variables (copy exactly into src/index.css :root):
:root {
  --bg: #09090b; --surface: #111113; --elevated: #18181b; --overlay: #1e1e23;
  --border: rgba(255,255,255,0.07); --border-2: rgba(255,255,255,0.13);
  --text: #fafafa; --text-2: #a1a1aa; --text-3: #52525b;
  --accent: #0EA5E9; --accent-2: #0284C7; --accent-glow: rgba(14,165,233,0.25);
  --success: #22c55e; --warning: #f59e0b; --error: #ef4444;
  --r-sm: 6px; --r: 8px; --r-lg: 12px; --r-xl: 16px;
  --shadow: 0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3);
  --shadow-lg: 0 10px 40px rgba(0,0,0,0.6);
  font-family: 'Space Grotesk', -apple-system, sans-serif;
}
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body { background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
button { font-family: inherit; cursor: pointer; }
a { text-decoration: none; color: inherit; }

LANDING PAGE RULES:
- Navbar: height 60px, sticky, backdrop-filter blur(20px), bg rgba(9,9,11,0.85), border-bottom 1px solid var(--border). Logo LEFT | links CENTER | CTA RIGHT.
- Hero: min-height 88vh, flex center, dot-grid background. Badge pill → Sora gradient headline (white-to-accent) → subtitle → 2 buttons → stats row.
- Feature cards: 3-column grid, hover translateY(-3px) + border accent glow
- Pricing: 2-3 tiers, popular card has accent border
- Footer: 4 columns + copyright bar

DASHBOARD RULES:
- Layout: flex row, height 100vh, overflow hidden
- Sidebar: width 256px, bg var(--surface), border-right var(--border), flex column. Logo → New button → nav items → projects → user avatar bottom
- Main: flex 1, flex column. Header 60px → scrollable content area
- Stats: 4 cards in a row, icon + big number + trend badge
- Tables: clean rows, alternating subtle bg, status pills, avatar + name

BUTTON PATTERNS:
- Primary: bg var(--accent), color white, padding 10px 20px, border-radius var(--r-sm), font-weight 600, hover: bg var(--accent-2) translateY(-1px) box-shadow 0 4px 20px var(--accent-glow), active: scale(0.97)
- Ghost: border 1px solid var(--border-2), bg transparent, color var(--text-2), hover: border-color rgba(255,255,255,0.25) color var(--text)
- All buttons: transition all 0.15s ease

REALISTIC DATA — ALWAYS:
- Names: Sarah Chen, Marcus Williams, James Park, Priya Patel, Alex Rodriguez
- Stats: 2,847 users | $1.2M ARR | 99.9% uptime | 127ms avg
- Avatars: https://api.dicebear.com/7.x/avataaars/svg?seed=[Name]
- Prices: $0 | $12 | $49 | $199 per month
- NEVER Lorem ipsum`;
}

type ValidMimeType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
function isValidMime(m: string): m is ValidMimeType {
  return ['image/jpeg','image/png','image/gif','image/webp'].includes(m);
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured in Vercel environment variables' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const client = new Anthropic({ apiKey });
    const body = await req.json();
    const { prompt, framework = 'react-vite', fileContext, history, knowledge, image, modelTier = 'default' } = body;

    const model = MODELS[modelTier as keyof typeof MODELS] ?? MODELS.default;

    // Detect app type for skeleton hint
    const appType = detectAppType(prompt ?? '');
    const skeleton = SKELETONS[appType];
    const skeletonHint = skeleton
      ? `\n\nSTARTER STRUCTURE (follow this file layout, fill in the actual implementation):\n${Object.entries(skeleton).map(([p, c]) => `<file path="${p}">\n${c}\n</file>`).join('\n')}`
      : '';

    // Build context from existing files
    const context = fileContext ? `\nEXISTING FILES (update these, keep what works):\n${fileContext.slice(0, 15000)}` : '';

    // Build conversation history
    const trimmedHistory = ((history ?? []) as Array<{ role: string; content: string }>)
      .filter(m => !m.content.startsWith('[Image:'))
      .slice(-6)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content.length > 2000 ? m.content.slice(0, 2000) + '...' : m.content,
      }));

    // Build user message
    let userMessage: string | Anthropic.MessageParam['content'];

    const textPrompt = `${prompt}${context}${skeletonHint}${knowledge ? `\n\nPROJECT CONTEXT:\n${knowledge}` : ''}`;

    if (image?.base64 && isValidMime(image.mimeType ?? '')) {
      userMessage = [
        { type: 'image', source: { type: 'base64', media_type: image.mimeType as ValidMimeType, data: image.base64 } },
        { type: 'text', text: textPrompt },
      ];
    } else {
      userMessage = textPrompt;
    }

    const messages: Anthropic.MessageParam[] = [
      ...trimmedHistory,
      { role: 'user', content: userMessage },
    ];

    // Use Anthropic's prompt caching for the system prompt (reduces latency by 80% on cache hit)
    const stream = await client.messages.stream({
      model: model.id,
      max_tokens: 24000,
      system: [
        {
          type: 'text',
          text: buildSystemPrompt(framework),
          // @ts-ignore - cache_control is supported but not yet in SDK types
          cache_control: { type: 'ephemeral' },
        }
      ],
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
        'X-App-Type': appType,
      },
    });

  } catch (err: unknown) {
    console.error('Generate error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
