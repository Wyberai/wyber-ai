import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const MODELS = {
  fast:    { id: 'claude-sonnet-4-6', credits: 1, label: 'Fast' },
  default: { id: 'claude-sonnet-4-6', credits: 1, label: 'Standard' },
  premium: { id: 'claude-sonnet-4-6', credits: 2, label: 'Premium' },
};

const FRAMEWORK_GUIDES: Record<string, string> = {
  'react-vite': 'React 18 + Vite + TypeScript + React Router v6. Multi-page apps with proper routing.',
  'vue': 'Vue 3 + Composition API + TypeScript + Vue Router. Single-file .vue components.',
  'vanilla': 'Pure HTML5 + CSS3 + ES6+. No framework.',
  'next': 'Next.js 15 App Router + TypeScript. File-based routing.',
};

function detectAppType(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('dashboard') || p.includes('admin') || p.includes('crm') || p.includes('analytics') || p.includes('project management') || p.includes('saas platform')) return 'dashboard';
  if (p.includes('landing') || p.includes('homepage') || p.includes('marketing site') || p.includes('saas page')) return 'landing';
  if (p.includes('auth') || p.includes('login') || p.includes('signup')) return 'auth';
  if (p.includes('ecommerce') || p.includes('store') || p.includes('shop')) return 'ecommerce';
  if (p.includes('blog') || p.includes('portfolio') || p.includes('personal site')) return 'content';
  return 'app';
}

function buildSystemPrompt(framework: string, appType: string): string {
  const isReact = framework === 'react-vite';
  const isNext = framework === 'next';

  return `You are the world's best product engineer. You build complete, multi-page web applications that look and feel like funded startups. Your output is always complete, never truncated, never placeholder.

FRAMEWORK: ${FRAMEWORK_GUIDES[framework] ?? FRAMEWORK_GUIDES['react-vite']}

════════════════════════════════════
OUTPUT FORMAT — ABSOLUTE RULES
════════════════════════════════════
Output ONLY <file> blocks. Zero preamble. Zero explanation.

<file path="src/index.css">complete file</file>
<file path="src/App.tsx">complete file</file>
<file path="src/components/Navbar.tsx">complete file</file>

After ALL files: one sentence starting with "Built:"

CRITICAL COMPLETENESS:
• Every import in App.tsx MUST have a matching <file> block
• NEVER write placeholder comments like "// ... rest of component"  
• NEVER truncate — if you'd run long, use fewer components instead
• Count imports vs file blocks before outputting — they must match exactly
• Use relative imports: ./components/X — NEVER @/ aliases

════════════════════════════════════
MULTI-PAGE ARCHITECTURE (for ${appType})
════════════════════════════════════
${isReact ? `Always use React Router v6 for multi-page apps:

import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'

src/App.tsx — Router setup with all routes
src/pages/PageName.tsx — one file per page/route
src/components/ — shared components
src/index.css — global styles

For dashboards: create 3+ pages (Overview, [Feature], Settings)
For landing pages: single page with scroll sections
For SaaS apps: Dashboard, Users/Data page, Settings page minimum` : ''}
${isNext ? `Use Next.js app router with multiple pages:
app/page.tsx — home/landing
app/dashboard/page.tsx — main app
app/settings/page.tsx — settings` : ''}

════════════════════════════════════  
DESIGN SYSTEM (copy exactly)
════════════════════════════════════
src/index.css MUST start with:

@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap');

:root {
  /* Backgrounds */
  --bg: #09090b;
  --surface: #111113;  
  --elevated: #18181b;
  --overlay: #222228;
  
  /* Borders */
  --border: rgba(255,255,255,0.07);
  --border-2: rgba(255,255,255,0.13);
  --border-active: rgba(14,165,233,0.4);
  
  /* Text */
  --text: #fafafa;
  --text-2: #a1a1aa;
  --text-3: #52525b;
  
  /* Accent — pick based on app type */
  ${appType === 'dashboard' ? '/* B2B/Productivity: sky blue */' : ''}
  ${appType === 'ecommerce' ? '/* Commerce: emerald green */' : ''}
  --accent: ${appType === 'ecommerce' ? '#10b981' : appType === 'content' ? '#f59e0b' : '#0EA5E9'};
  --accent-2: ${appType === 'ecommerce' ? '#059669' : appType === 'content' ? '#d97706' : '#0284C7'};
  --accent-glow: ${appType === 'ecommerce' ? 'rgba(16,185,129,0.2)' : appType === 'content' ? 'rgba(245,158,11,0.2)' : 'rgba(14,165,233,0.2)'};
  
  /* Status */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  
  /* Radius */
  --r-xs: 4px; --r-sm: 6px; --r: 8px; --r-lg: 12px; --r-xl: 16px;
  
  /* Shadows */
  --shadow: 0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3);
  --shadow-lg: 0 10px 40px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4);
  --shadow-accent: 0 4px 20px var(--accent-glow);
  
  /* Transitions */
  --t: all 0.15s ease;
  --t-slow: all 0.25s ease;
  
  font-family: 'Space Grotesk', -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; }
body { background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
button { font-family: inherit; cursor: pointer; }
a { text-decoration: none; color: inherit; }
input, textarea, select { font-family: inherit; }

/* Hero headline gradient */
.headline-gradient {
  font-family: 'Sora', sans-serif;
  background: linear-gradient(135deg, #ffffff 0%, #38BDF8 60%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Dot grid background */
.dot-grid {
  background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Card hover */
.card-hover {
  transition: var(--t-slow);
  border: 1px solid var(--border);
}
.card-hover:hover {
  border-color: var(--border-active);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Scrollbar */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

════════════════════════════════════
COMPONENT PATTERNS (use exactly)
════════════════════════════════════

NAVBAR (all pages):
position: sticky, top: 0, z-index: 100
height: 60px, display: flex, align-items: center
background: rgba(9,9,11,0.85), backdrop-filter: blur(20px)
border-bottom: 1px solid var(--border)
padding: 0 clamp(16px,4vw,48px)
Layout: Logo LEFT | Nav links CENTER | CTA RIGHT
Logo: Sora font, 17px, font-weight 700, color var(--text)
Nav links: Space Grotesk, 14px, color var(--text-2), hover color var(--text), gap 32px
CTA: bg var(--accent), color white, padding 8px 18px, border-radius var(--r-sm), font-weight 600, font-size 13px

HERO (landing pages):
min-height: 88vh, display: flex, flex-direction: column
align-items: center, justify-content: center, text-align: center
padding: 0 clamp(16px,4vw,48px), position: relative
background: var(--bg) + .dot-grid class on outer div

Badge: border 1px solid rgba(accent,0.3), bg rgba(accent,0.08), color lightest accent
  border-radius: 9999px, padding: 4px 14px, font-size: 12px, font-weight: 600
  display: inline-flex, align-items: center, gap: 6px, margin-bottom: 24px

Headline: class="headline-gradient"
  font-size: clamp(40px,6vw,72px), font-weight: 800, letter-spacing: -0.04em, line-height: 1.0
  margin-bottom: 20px, max-width: 800px

Subheadline: font-size: clamp(16px,2vw,20px), color: var(--text-2)
  max-width: 560px, line-height: 1.65, margin: 0 auto 36px

Button row: display: flex, gap: 12px, justify-content: center, flex-wrap: wrap

Stats row (below buttons): 3-4 metrics, padding-top: 48px
  Each: font-size 28px font-weight 800 Sora + 13px label below color var(--text-2)
  Divider: 1px solid var(--border) between

SIDEBAR (dashboard apps):
width: 240px, height: 100vh, flex-shrink: 0
background: var(--surface), border-right: 1px solid var(--border)
display: flex, flex-direction: column, overflow: hidden

Logo area: height 56px, padding 0 16px, border-bottom 1px solid var(--border)
  display flex, align-items center, gap 10px

New/Create button: margin 12px, width calc(100%-24px)
  background linear-gradient(135deg, var(--accent), var(--accent-2))
  color white, border none, padding 9px, border-radius var(--r), font-weight 600, font-size 13px
  box-shadow: 0 2px 8px var(--accent-glow)

Nav section label: font-size 10px, font-weight 700, color var(--text-3)
  text-transform uppercase, letter-spacing 0.08em, padding 12px 16px 4px

Nav item: display flex, align-items center, gap 10px, padding 8px 12px
  border-radius var(--r), margin 1px 8px, font-size 13.5px, font-weight 400
  color var(--text-2), cursor pointer, transition var(--t), border none, bg transparent
  Active: bg rgba(accent,0.1), color var(--accent), font-weight 600
  Hover: bg rgba(255,255,255,0.04), color var(--text)

STAT CARDS (4 per row):
display: grid, grid-template-columns: repeat(4, 1fr), gap: 12px
Each card: bg var(--surface), border 1px solid var(--border), border-radius var(--r-lg)
  padding: 20px, transition var(--t-slow)
  hover: border-color var(--border-active), box-shadow var(--shadow-lg)

Icon: 40px × 40px, border-radius var(--r), bg rgba(accent,0.1), border 1px solid rgba(accent,0.2)
  display flex, align-items center, justify-content center, margin-bottom 14px

Number: font-family Sora, font-size 28px, font-weight 700, letter-spacing -0.04em
Label: font-size 12px, color var(--text-2), margin-top 2px
Trend: font-size 11px, font-weight 600, color var(--success) or var(--error)
  bg rgba(success,0.1), padding 2px 7px, border-radius 9999px

DATA TABLES:
width 100%, border-collapse separate, border-spacing 0
Header row: font-size 11px, font-weight 600, color var(--text-3), text-transform uppercase
  letter-spacing 0.06em, padding 10px 14px, border-bottom 1px solid var(--border)
  background: var(--surface)
Data row: padding 12px 14px, border-bottom 1px solid var(--border), font-size 13px
  hover: background rgba(255,255,255,0.02)
Status pill: padding 2px 9px, border-radius 9999px, font-size 11px, font-weight 600
  success: bg rgba(34,197,94,0.1) color var(--success)
  pending: bg rgba(245,158,11,0.1) color var(--warning)
  error: bg rgba(239,68,68,0.1) color var(--error)

BUTTONS:
Primary: background var(--accent), color white, padding 10px 20px
  border-radius var(--r-sm), font-weight 600, font-size 13px, border none
  transition var(--t), hover: bg var(--accent-2) translateY(-1px) box-shadow var(--shadow-accent)
  active: scale(0.97)
Ghost: border 1px solid var(--border-2), bg transparent, color var(--text-2)
  same padding, hover: border-color rgba(255,255,255,0.25) color var(--text)
Danger: bg transparent, border 1px solid rgba(239,68,68,0.3), color var(--error)
  hover: bg rgba(239,68,68,0.1)

════════════════════════════════════
REALISTIC DATA (mandatory)
════════════════════════════════════
Names: Sarah Chen, Marcus Williams, James Park, Priya Patel, Alex Rodriguez, Emma Wilson, David Kim
Stats: 2,847 | $1.2M | 99.9% | 127ms | 94% | 18,432
Company names: Stripe, Notion, Vercel, Linear, Figma, Loom, Retool
Dates: "2 hours ago" | "Yesterday, 3:24 PM" | "Mar 15" | "Feb 28, 2024"
Avatars: https://api.dicebear.com/7.x/avataaars/svg?seed=[Name]
Status: Active | In Progress | Completed | Pending | Blocked
NEVER Lorem Ipsum.

════════════════════════════════════
QUALITY GATES (check before outputting)
════════════════════════════════════
□ Every file imported exists as a <file> block?
□ No @/ aliases anywhere?
□ No truncated files?
□ Navbar has logo + links + CTA?
${appType === 'dashboard' ? '□ Sidebar has logo + nav + bottom user section?\n□ Stats cards have icons, numbers, trends?\n□ Table has proper headers, data, status pills?' : ''}
${appType === 'landing' ? '□ Hero has badge + gradient headline + subtitle + buttons + stats?\n□ Features section has 3+ cards with hover effects?\n□ Pricing has 2+ tiers with feature lists?\n□ Footer has 4 columns?' : ''}
□ All hover states defined?
□ All numbers realistic and specific?
□ Space Grotesk + Sora imported in CSS?
□ CSS variables defined in :root?`;
}

type ValidMimeType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
function isValidMime(m: string): m is ValidMimeType {
  return ['image/jpeg','image/png','image/gif','image/webp'].includes(m);
}

const SKELETONS: Record<string, string[]> = {
  dashboard: [
    'src/index.css', 'src/App.tsx',
    'src/pages/Overview.tsx', 'src/pages/Settings.tsx',
    'src/components/Sidebar.tsx', 'src/components/Navbar.tsx',
    'src/components/StatsGrid.tsx', 'src/components/DataTable.tsx',
  ],
  landing: [
    'src/index.css', 'src/App.tsx',
    'src/components/Navbar.tsx', 'src/components/Hero.tsx',
    'src/components/Features.tsx', 'src/components/Pricing.tsx',
    'src/components/Footer.tsx',
  ],
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in Vercel environment variables' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = new Anthropic({ apiKey });
    const body = await req.json();
    const {
      prompt, framework = 'react-vite', fileContext,
      history, knowledge, image, modelTier = 'default'
    } = body;

    const model = MODELS[modelTier as keyof typeof MODELS] ?? MODELS.default;
    const appType = detectAppType(prompt ?? '');
    const skeletonFiles = SKELETONS[appType];

    // Build skeleton hint to steer file structure
    const skeletonHint = skeletonFiles
      ? `\n\nEXPECTED FILE STRUCTURE (generate ALL of these):\n${skeletonFiles.map(f => `<file path="${f}">...</file>`).join('\n')}`
      : '';

    const context = fileContext
      ? `\n\nEXISTING FILES (update, preserve what works):\n${fileContext.slice(0, 12000)}`
      : '';

    const knowledgeHint = knowledge
      ? `\n\nPROJECT CONTEXT:\n${knowledge}`
      : '';

    const textPrompt = `${prompt}${context}${skeletonHint}${knowledgeHint}`;

    const trimmedHistory = ((history ?? []) as Array<{ role: string; content: string }>)
      .filter(m => !m.content.startsWith('[Image:'))
      .slice(-6)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content.length > 2000 ? m.content.slice(0, 2000) + '...' : m.content,
      }));

    let userContent: Anthropic.MessageParam['content'];
    if (image?.base64 && isValidMime(image.mimeType ?? '')) {
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: image.mimeType as ValidMimeType, data: image.base64 } },
        { type: 'text', text: textPrompt },
      ];
    } else {
      userContent = textPrompt;
    }

    const messages: Anthropic.MessageParam[] = [
      ...trimmedHistory,
      { role: 'user', content: userContent },
    ];

    const stream = await client.messages.stream({
      model: model.id,
      max_tokens: 16000,
      system: [
        {
          type: 'text' as const,
          text: buildSystemPrompt(framework, appType),
          // @ts-ignore
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
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
