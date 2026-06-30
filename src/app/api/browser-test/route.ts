import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runSmokeTest } from '@/lib/smoke-test';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

  const analyzeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: 'You are a QA engineer. Generate browser test scenarios for a web app. Return ONLY a JSON array of test objects with: name (string), description (string), type ("navigation"|"click"|"form"|"responsive"|"visual"). Max 6 tests.',
      messages: [{ role: 'user', content: `App URL: ${url}\nGenerate browser tests for this app.` }],
    }),
  });

  const analyzeData = await analyzeRes.json();
  let testPlan: { name: string; description: string; type: string }[] = [];
  try {
    const text = analyzeData.content?.[0]?.text || '[]';
    testPlan = JSON.parse(text);
  } catch { testPlan = []; }

  // Run the test plan against the real page instead of faking pass/fail.
  let html = '';
  let pageOk = true;
  let pageError: string | undefined;
  try {
    const pageRes = await fetch(url);
    pageOk = pageRes.ok;
    html = await pageRes.text();
    if (pageOk) {
      const smoke = await runSmokeTest(html, url.replace(/\/$/, ''));
      pageOk = smoke.ok;
      pageError = smoke.error;
    } else {
      pageError = `Page returned HTTP ${pageRes.status}`;
    }
  } catch (err) {
    pageOk = false;
    pageError = `Could not reach URL: ${err instanceof Error ? err.message : String(err)}`;
  }

  const TYPE_CHECKS: Record<string, (h: string) => boolean> = {
    navigation: () => pageOk,
    visual: () => pageOk,
    responsive: h => /<meta[^>]+name=["']viewport["']/i.test(h),
    form: h => /<form[\s>]|type=["'](text|email|password)["']/i.test(h),
    click: h => /<button[\s>]|<a\s[^>]*href/i.test(h),
  };

  const results = testPlan.map(t => {
    if (!pageOk) return { name: t.name, passed: false, error: pageError };
    const check = TYPE_CHECKS[t.type] ?? (() => true);
    const passed = check(html);
    return { name: t.name, passed, error: passed ? undefined : `${t.type} check failed: expected markup not found` };
  });

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return NextResponse.json({ results, summary: { total: results.length, passed, failed }, url });
}