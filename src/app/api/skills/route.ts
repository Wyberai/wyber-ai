import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_SKILLS = [
  { id: 'launch-checklist', name: 'Launch checklist', description: 'Pre-launch check: SEO, security, performance, accessibility, error handling', icon: '🚀', content: 'Before launching check: 1) Meta tags and OG tags present 2) No console.log in production 3) Error boundaries added 4) Loading states on all async operations 5) Mobile responsive 6) Security headers set 7) Environment variables not exposed 8) API routes protected with auth' },
  { id: 'accessibility', name: 'Accessibility review', description: 'WCAG 2.1 compliance: contrast, keyboard nav, ARIA labels, screen reader support', icon: '♿', content: 'Review accessibility: 1) All images have alt text 2) Color contrast ratio >= 4.5:1 3) All interactive elements keyboard-accessible 4) Focus indicators visible 5) ARIA labels on icon buttons 6) Heading hierarchy correct h1>h2>h3 7) Form inputs have labels 8) Error messages associated with inputs' },
  { id: 'performance', name: 'Performance audit', description: 'Identifies render-blocking, large bundles, missing lazy loading', icon: '⚡', content: 'Performance review: 1) Images use lazy loading 2) Large lists virtualized 3) useCallback and useMemo on expensive computations 4) No unnecessary re-renders 5) Bundle size checked 6) API calls cached where appropriate 7) Loading skeletons instead of spinners' },
  { id: 'security', name: 'Security check', description: 'Scans for exposed secrets, SQL injection, XSS, insecure API routes', icon: '🛡', content: 'Security scan: 1) No API keys in client code 2) All API routes check auth 3) User input sanitized 4) RLS enabled on Supabase tables 5) No direct SQL string interpolation 6) CORS properly configured 7) Rate limiting on auth routes' },
  { id: 'code-quality', name: 'Code quality', description: 'TypeScript strictness, naming, DRY principles, component structure', icon: '✦', content: 'Code quality review: 1) TypeScript types not using any 2) Components under 200 lines 3) No duplicate logic extract to hooks or utils 4) Consistent naming conventions 5) No hardcoded strings use constants 6) Proper error handling in all async functions' },
];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ skills: DEFAULT_SKILLS });

  const { data: customSkills } = await supabase.from('workspace_skills').select('*').eq('user_id', user.id);
  return NextResponse.json({ skills: [...DEFAULT_SKILLS, ...(customSkills || [])] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description, icon, content } = await req.json();
  const { data } = await supabase
    .from('workspace_skills')
    .insert({ user_id: user.id, name, description, icon, content })
    .select()
    .single();

  return NextResponse.json({ skill: data });
}