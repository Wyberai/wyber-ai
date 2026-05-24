import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  const { projectDescription, files, framework } = await req.json();

  const fileContext = Object.entries(files as Record<string, { content: string }>)
    .slice(0, 15)
    .map(([path, f]) => `<file path="${path}">\n${f.content.slice(0, 2000)}\n</file>`)
    .join('\n\n');

  const prompt = `You are a Supabase backend expert. Analyze this ${framework} app and generate a complete Supabase backend.

App description: ${projectDescription}

Current frontend code:
${fileContext}

Generate ALL of the following:

1. SQL schema (tables, indexes, RLS policies, triggers)
2. TypeScript types matching the schema
3. Supabase client helper with typed queries
4. Auth flow components (SignIn, SignUp, AuthGuard)
5. Environment variables needed

Output each as a file:

<file path="supabase/schema.sql">
-- Complete SQL schema
</file>

<file path="src/lib/supabase/types.ts">
// TypeScript types
</file>

<file path="src/lib/supabase/client.ts">
// Typed Supabase client
</file>

<file path="src/lib/supabase/queries.ts">
// Typed query helpers for every table
</file>

<file path="src/components/auth/AuthProvider.tsx">
// Auth context and hooks
</file>

<file path="src/components/auth/SignIn.tsx">
// Sign in component
</file>

<file path="src/components/auth/SignUp.tsx">
// Sign up component  
</file>

<file path="src/components/auth/AuthGuard.tsx">
// Protect routes
</file>

<file path=".env.example">
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
</file>

Follow Supabase best practices:
- Row Level Security on every table
- Auth triggers to create user profiles
- Proper foreign keys and indexes
- Type-safe client with generated types
- Use @supabase/supabase-js v2`;

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  return NextResponse.json({ output: text });
}
