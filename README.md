# Forge IDE — Lovable Clone

A production-ready AI app builder with Monaco editor, multi-framework support, and streaming code generation.

## Stack
- **Frontend**: Next.js 15 App Router + TypeScript + Tailwind
- **Editor**: Monaco Editor (same as VS Code)
- **State**: Zustand + Immer
- **AI**: Claude claude-sonnet-4-20250514 (streaming)
- **Frameworks supported**: React+Vite, Vue 3, Vanilla JS, Next.js

## Quick Start

```bash
# 1. Install
npm install

# 2. Add your Claude API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local

# 3. Run
npm run dev
# → http://localhost:3000
```

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Root — renders IDELayout
│   ├── layout.tsx            # Font loading, metadata
│   ├── globals.css           # Dark IDE theme (CSS variables)
│   └── api/generate/route.ts # Streaming Claude API endpoint
│
├── components/editor/
│   ├── IDELayout.tsx         # 3-panel layout with resizable dividers
│   ├── TopBar.tsx            # Logo, framework selector, deploy button
│   ├── FileTree.tsx          # Recursive file tree with icons
│   ├── TabBar.tsx            # Open file tabs with dirty indicators
│   ├── CodeEditor.tsx        # Monaco editor with custom dark theme
│   ├── PreviewPanel.tsx      # iframe preview + console
│   ├── ChatPanel.tsx         # Chat UI + generation loop
│   └── ResizableDivider.tsx  # Drag-to-resize panel borders
│
├── store/editor.ts           # Zustand store — ALL app state
└── lib/
    ├── file-parser.ts        # Parses <file path="..."> from Claude output
    └── starter-templates.ts  # Blank starter files per framework
```

## How the generation loop works

1. User types prompt → `ChatPanel.handleSend()`
2. Full file tree serialized as `<file path="...">content</file>` blocks
3. Sent to `/api/generate` with conversation history
4. Claude streams back text + new `<file>` blocks
5. `StreamingFileParser` extracts files as they stream in
6. Files applied to Zustand store → Monaco editor updates instantly
7. (Optional: files pushed to E2B sandbox → iframe preview refreshes)

## What to add next

### E2B Sandbox (live preview)
```bash
npm install @e2b/code-interpreter
```
```typescript
// In api/generate/route.ts or a separate /api/sandbox route:
import { Sandbox } from '@e2b/code-interpreter';
const sbx = await Sandbox.create('node');
// Write files, run npm install + vite, get preview URL
```

### Supabase (auth + project persistence)
```bash
npm install @supabase/supabase-js @supabase/ssr
```
```sql
-- projects table
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  name text not null,
  framework text not null,
  files jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- credits table  
create table user_credits (
  user_id uuid primary key references auth.users,
  balance int not null default 50,
  updated_at timestamptz default now()
);
```

### Stripe (billing)
- Use `stripe.checkout.sessions.create()` for one-time credit packs
- Or subscriptions for monthly plans
- Webhook → update `user_credits.balance` in Supabase

### Git history (undo/redo)
```bash
npm install isomorphic-git
```
Every successful generation → `git.commit()` inside E2B sandbox
Undo → `git.checkout()` to previous commit SHA

## Pricing differentiation vs Lovable

| | Lovable | Forge |
|---|---|---|
| Price | $20/mo (500 msgs) | $9/mo (500 credits) |
| Credit transparency | Hidden | Show tokens used per gen |
| Frameworks | React only | React, Vue, Vanilla, Next |
| Undo history | Limited | Full git history |
| Custom system prompt | No | Coming soon |
